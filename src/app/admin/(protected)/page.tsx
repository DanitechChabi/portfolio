import Link from "next/link";
import { getAllPosts, getExperiences, getMessages, getSkills } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { AdminHeading, Card } from "@/components/admin/form-ui";
import {
  ExternalLinkIcon,
  FileTextIcon,
  InboxIcon,
  ParcoursIcon,
  PlusIcon,
  SkillsIcon,
  UserIcon,
} from "@/components/ui/icons";

export default async function AdminDashboardPage() {
  const [posts, messages, skills, experiences] = await Promise.all([
    getAllPosts(),
    getMessages(),
    getSkills(),
    getExperiences(),
  ]);

  const publishedPosts = posts.filter((p) => p.published).length;
  const unread = messages.filter((m) => !m.read).length;
  const recentMessages = messages.slice(0, 3);

  const stats = [
    {
      label: "Articles",
      value: `${publishedPosts} / ${posts.length}`,
      icon: FileTextIcon,
      href: "/admin/posts",
    },
    {
      label: "Messages non lus",
      value: unread,
      icon: InboxIcon,
      href: "/admin/messages",
    },
    {
      label: "Compétences",
      value: skills.length,
      icon: SkillsIcon,
      href: "/admin/competences",
    },
    {
      label: "Parcours",
      value: experiences.length,
      icon: ParcoursIcon,
      href: "/admin/parcours",
    },
  ];

  return (
    <div>
      <AdminHeading
        title="Tableau de bord"
        description="Vue d'ensemble du contenu du portfolio."
      />

      {/* Statistiques */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="p-6 transition-colors duration-300 hover:border-accent/40">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-ink-faint">
                  {label}
                </p>
                <Icon className="h-4.5 w-4.5 text-accent/70" />
              </div>
              <p className="mt-3 font-serif text-3xl text-ink">{value}</p>
            </Card>
          </Link>
        ))}
      </div>

      {/* Note fonds GitHub */}
      <Card className="mt-8 border-dashed p-5">
        <p className="text-sm leading-relaxed text-ink-dim">
          <span className="font-medium text-ink">Les projets vivent ailleurs :</span>{" "}
          ils sont désormais lus automatiquement depuis GitHub (dépôts publics),
          avec mise en cache horaire. Pour en ajouter ou en retirer, poussez un
          dépôt avec sa description — ou ajustez{" "}
          <code className="font-mono text-xs text-accent-deep">
            src/content/projects.config.ts
          </code>
          .
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            href="https://github.com/DanitechChabi?tab=repositories"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-accent/80 transition-colors hover:text-accent-soft"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
            Gérer les dépôts sur GitHub
          </a>
          <Link
            href="/#projets"
            className="inline-flex items-center gap-1.5 text-xs text-accent/80 transition-colors hover:text-accent-soft"
          >
            <ExternalLinkIcon className="h-3.5 w-3.5" />
            Voir le registre des projets
          </Link>
        </div>
      </Card>

      {/* Actions rapides */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/admin/posts/nouveau"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-bg-deep transition-colors hover:bg-accent-soft"
        >
          <PlusIcon className="h-4 w-4" />
          Nouvel article
        </Link>
        <Link
          href="/admin/competences"
          className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:border-accent/60 hover:text-accent-soft"
        >
          <SkillsIcon className="h-4 w-4" />
          Gérer les compétences
        </Link>
        <Link
          href="/admin/parcours"
          className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:border-accent/60 hover:text-accent-soft"
        >
          <ParcoursIcon className="h-4 w-4" />
          Gérer le parcours
        </Link>
        <Link
          href="/admin/profile"
          className="inline-flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm text-ink transition-colors hover:border-accent/60 hover:text-accent-soft"
        >
          <UserIcon className="h-4 w-4" />
          Modifier le profil
        </Link>
      </div>

      {/* Derniers messages */}
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-lg text-ink">Derniers messages</h2>
          <Link
            href="/admin/messages"
            className="text-xs text-accent/80 transition-colors hover:text-accent-soft"
          >
            Tout voir →
          </Link>
        </div>

        {recentMessages.length === 0 ? (
          <Card className="p-8 text-center text-sm text-ink-dim">
            Aucun message reçu pour le moment.
          </Card>
        ) : (
          <ul className="space-y-3">
            {recentMessages.map((message) => (
              <li key={message.id}>
                <Link href="/admin/messages">
                  <Card
                    className={`p-5 transition-colors duration-300 hover:border-accent/40 ${
                      message.read ? "opacity-60" : "border-accent/30"
                    }`}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm text-ink">
                        {message.name}
                        <span className="ml-2 text-xs text-ink-faint">
                          {message.email}
                        </span>
                      </p>
                      <p className="text-xs text-ink-faint">
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-dim">
                      {message.message}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
