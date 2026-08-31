import { ImageResponse } from "next/og";

export const alt = "Daniel CHABI BOUKO — Archiviste 2.0 · Data Analyst · Développeur web";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image OpenGraph générée au build — ivoire, encre, vermillon : « Le Registre ». */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "#f2ede0",
          color: "#201b12",
          fontFamily: "sans-serif",
        }}
      >
        {/* Lignes de réglure, façon registre */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "repeating-linear-gradient(to bottom, transparent 0 35px, rgba(44,78,110,0.10) 35px 36px)",
          }}
        />

        {/* En-tête — cote du fonds */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #201b12",
              background: "#faf7ec",
              fontSize: 28,
              fontWeight: 700,
              color: "#201b12",
            }}
          >
            D<span style={{ color: "#c0391b" }}>.</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontSize: 20,
                letterSpacing: 5,
                color: "#c0391b",
                fontWeight: 700,
              }}
            >
              FONDS PERSONNEL — DCB·2026
            </span>
            <span
              style={{
                fontSize: 16,
                letterSpacing: 3,
                color: "#877d63",
              }}
            >
              COTONOU — BÉNIN
            </span>
          </div>
        </div>

        {/* Nom + casquettes */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div
            style={{
              display: "flex",
              fontSize: 78,
              fontWeight: 700,
              letterSpacing: -2,
            }}
          >
            Daniel&nbsp;Chabi&nbsp;Bouko
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#524a38" }}>
            Archiviste 2.0 · Data Analyst · Développeur web
          </div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {[
              { label: "STRUCTURER", color: "#c0391b" },
              { label: "ANALYSER", color: "#2c4e6e" },
              { label: "DÉVELOPPER", color: "#2f5d48" },
            ].map(({ label, color }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 19,
                  letterSpacing: 3,
                  color: "#524a38",
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    display: "flex",
                    background: color,
                  }}
                />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Pied — double filet du registre */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              height: 6,
              borderTop: "3px solid #201b12",
              borderBottom: "1px solid #201b12",
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 20,
              color: "#877d63",
            }}
          >
            <span style={{ display: "flex" }}>danielchabi.vercel.app</span>
            <span style={{ display: "flex", color: "#c0391b", letterSpacing: 3 }}>
              L&apos;INFORMATION, DU RAYONNAGE À L&apos;ÉCRAN
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
