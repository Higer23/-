import type { ReactNode } from "react";

const Arrow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// Bağışa yönlendiren buton (Uiverse · alexmaracinaru)
export function DonateButton({ href, children, dark = false }: { href: string; children: ReactNode; dark?: boolean }) {
  return (
    <a className={`btn-donate${dark ? " dark" : ""}`} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <Arrow />
    </a>
  );
}

// Keşfet butonu (Uiverse · cssbuttons-io)
export function LearnMore({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="learn-more" href={href}>
      <span className="circle" aria-hidden="true">
        <span className="icon arrow" />
      </span>
      <span className="button-text">{children}</span>
    </a>
  );
}

// Ekstra buton (Uiverse · elijahgummer)
export function StarButton({ href, count, children }: { href: string; count: number | string; children: ReactNode }) {
  return (
    <a className="btn-star" href={href} target="_blank" rel="noopener noreferrer">
      <span className="shine" aria-hidden="true" />
      <span className="lbl">
        <svg className="gh" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.69 1.25 3.35.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5Z" />
        </svg>
        <span>{children}</span>
      </span>
      <span className="cnt">
        <svg className="st" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" clipRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" />
        </svg>
        <b>{count}</b>
      </span>
    </a>
  );
}
