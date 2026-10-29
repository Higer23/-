import { useEffect, useRef } from "react";

type Props = {
  title: string;
  kicker: string;
  text: string;
  href: string;
  locale: string;
  onClose: () => void;
};

const DEMO: Record<string, string> = {
  Higum: "https://higum.vercel.app",
  Forum: "https://forum-tawny-tau.vercel.app",
  "Nachricht-Portal": "https://communication-portal-design.vercel.app",
  "Anonim-Mesaj": "https://anonim-mesaj-gold.vercel.app",
};

const L: Record<string, { preview: string; detail: string; close: string; open: string }> = {
  tr: { preview: "Önizleme", detail: "Detay → GitHub", close: "Kapat", open: "Canlı siteyi yeni sekmede aç" },
  en: { preview: "Preview", detail: "Details → GitHub", close: "Close", open: "Open live site in a new tab" },
  de: { preview: "Vorschau", detail: "Details → GitHub", close: "Schließen", open: "Live-Seite in neuem Tab öffnen" },
};

export default function ProjectModal({ title, kicker, text, href, locale, onClose }: Props) {
  const s = L[locale] ?? L.en;
  const demo = DEMO[title];
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), iframe, input:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((el) => el.offsetParent !== null);
      if (focusable.length === 0) {
        e.preventDefault();
        dialogRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previousFocus?.focus();
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(0,0,0,0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(960px, 100%)",
          maxHeight: "90vh",
          overflow: "auto",
          background: "var(--bg, #0b0b0f)",
          color: "var(--fg, #eee)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 14,
          padding: 20,
        }}
      >
        <p style={{ opacity: 0.6, fontSize: "0.8rem", margin: 0 }}>{kicker} · {s.preview}</p>
        <h3 style={{ margin: "6px 0 8px" }}>{title}</h3>
        <p style={{ opacity: 0.8, marginTop: 0 }}>{text}</p>

        {demo ? (
          <iframe
            title={`${title} preview`}
            src={demo}
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            style={{ width: "100%", height: 420, border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, background: "#fff" }}
          />
        ) : null}

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
          <a href={href} target="_blank" rel="noopener noreferrer">{s.detail}</a>
          {demo ? (
            <a href={demo} target="_blank" rel="noopener noreferrer">{s.open}</a>
          ) : null}
          <button type="button" onClick={onClose} style={{ marginLeft: "auto" }}>{s.close}</button>
        </div>
      </div>
    </div>
  );
}
