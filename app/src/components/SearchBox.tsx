import { useId } from "react";

// Arama alanı (Uiverse · Lakshay-art)
export default function SearchBox({ value, onChange, info }: { value: string; onChange: (v: string) => void; info: string }) {
  const id = useId().replace(/:/g, "");
  const g1 = `sxg1${id}`;
  const g2 = `sxg2${id}`;
  return (
    <section className="search-wrap" aria-label="Sayfada ara">
      <div id="sx">
        <div className="sx-glow" />
        <div className="sx-dark" />
        <div className="sx-dark" />
        <div className="sx-dark" />
        <div className="sx-white" />
        <div className="sx-border" />
        <div className="sx-main">
          <input
            className="sx-input"
            type="search"
            name="q"
            placeholder="Proje, dil ara…"
            autoComplete="off"
            aria-label="Sayfada ara"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && onChange("")}
          />
          <div className="sx-mask" />
          <div className="sx-pink" />
          <div className="sx-fborder" />
          <button type="button" className="sx-clear" aria-label="Aramayı temizle" onClick={() => onChange("")}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#d6d6e6" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div className="sx-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" fill="none" aria-hidden="true">
              <circle stroke={`url(#${g1})`} r="8" cy="11" cx="11" />
              <line stroke={`url(#${g2})`} y2="16.65" y1="22" x2="16.65" x1="22" />
              <defs>
                <linearGradient gradientTransform="rotate(50)" id={g1}>
                  <stop stopColor="#f8e7f8" offset="0%" />
                  <stop stopColor="#b6a9b7" offset="50%" />
                </linearGradient>
                <linearGradient id={g2}>
                  <stop stopColor="#b6a9b7" offset="0%" />
                  <stop stopColor="#837484" offset="50%" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
      <p className="search-info" role="status">
        {info}
      </p>
    </section>
  );
}
