import { NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import { putMessage } from "@/lib/store";

export const runtime = "nodejs";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(120),
  email: z.email("Adresse email invalide").max(200),
  message: z.string().trim().min(10, "Message trop court").max(4000),
  // Honeypot anti-spam : champ caché que les robots remplissent. Il passe
  // la validation (max généreux) pour recevoir un faux succès plus bas —
  // le robot s'arrête là, sans savoir qu'il a été filtré.
  website: z.string().max(500).optional().or(z.literal("")),
});

/* Limite simple en mémoire : 5 messages / minute / IP. */
const hits = new Map<string, number[]>();
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= 5) return true;
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 1000) hits.clear(); // garde-fou mémoire
  return false;
}

function emailHtml(name: string, email: string, message: string) {
  const escape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `
  <div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:32px;background:#faf7f0;border-radius:12px">
    <p style="margin:0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8a6420">Portfolio — nouveau message</p>
    <h1 style="margin:12px 0 24px;font-size:22px;color:#1a1a1f">${escape(name)}</h1>
    <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:13px;color:#555">
      <strong>Répondre à :</strong> <a href="mailto:${escape(email)}" style="color:#8a6420">${escape(email)}</a>
    </p>
    <div style="margin-top:20px;padding:18px;background:#ffffff;border:1px solid #e8e2d5;border-radius:8px;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#333;white-space:pre-wrap">${escape(message)}</div>
    <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#999">Message envoyé depuis le formulaire de contact du portfolio.</p>
  </div>`;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnu";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Trop de messages envoyés. Réessayez dans une minute." },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error:
          parsed.error.issues[0]?.message ?? "Merci de vérifier les champs du formulaire.",
      },
      { status: 400 },
    );
  }

  const { name, email, message } = parsed.data;

  // Honeypot rempli : on fait semblant de réussir (le robot s'arrête là).
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  // 1) Archivage du message dans le store (boîte de réception /admin).
  //    Un fichier par message : deux envois simultanés ne s'écrasent pas.
  let stored = false;
  try {
    await putMessage({
      // UUID : le nom du fichier ne se devine pas (messages publics côté
      // Blob, mais non listables sans le token serveur).
      id: crypto.randomUUID(),
      name,
      email,
      message,
      read: false,
      created_at: new Date().toISOString(),
    });
    stored = true;
  } catch (e) {
    console.error("[contact] Archivage du message impossible :", e);
  }

  // 2) Envoi de l'email via Resend.
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_EMAIL;
  if (apiKey && to) {
    try {
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? "Portfolio <onboarding@resend.dev>",
        to,
        replyTo: email,
        subject: `Portfolio — message de ${name}`,
        html: emailHtml(name, email, message),
        text: `Nom : ${name}\nEmail : ${email}\n\n${message}`,
      });
    } catch (e) {
      console.error("[contact] Envoi Resend échoué :", e);
    }
  } else {
    console.info(
      "[contact] Resend non configuré — message non archivé en email :",
      { name, email, message: message.slice(0, 80) },
    );
  }

  return NextResponse.json({ ok: true, stored });
}
