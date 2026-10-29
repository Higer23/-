import { useState, type FormEvent } from "react";
import "./user-lookup.css";

const USER_RE = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

const L: Record<string, { label: string; btn: string; reset: string; invalid: string; hint: string; placeholder: string }> = {
  tr: { label: "GitHub kullanıcı adın", btn: "Puanımı gör", reset: "Ana profile dön", invalid: "Geçerli bir GitHub kullanıcı adı yaz", hint: "Kendi puanını canlı olarak gör", placeholder: "kullanıcı-adın" },
  en: { label: "Your GitHub username", btn: "See my score", reset: "Back to the main profile", invalid: "Enter a valid GitHub username", hint: "See your score live", placeholder: "your-username" },
  de: { label: "Dein GitHub-Benutzername", btn: "Meine Bewertung ansehen", reset: "Zurück zum Hauptprofil", invalid: "Gib einen gültigen GitHub-Benutzernamen ein", hint: "Sieh deine Bewertung live", placeholder: "dein-benutzername" },
};

type Props = {
  locale: string;
  active: string;
  defaultUser: string;
  onLookup: (user: string) => void;
};

export default function UserLookup({ locale, active, defaultUser, onLookup }: Props) {
  const s = L[locale] ?? L.en;
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const user = value.trim().replace(/^@/, "");
    if (!USER_RE.test(user)) {
      setError(s.invalid);
      return;
    }
    setError("");
    onLookup(user);
  };

  return (
    <section className="ul-wrap" aria-label={s.hint}>
      <form className="ul-form" onSubmit={submit}>
        <label className="ul-label" htmlFor="ul-user">{s.label}</label>
        <div className="sx-root">
          <div className="sx-glow" />
          <div className="sx-dark" />
          <div className="sx-dark" />
          <div className="sx-dark" />
          <div className="sx-white" />
          <div className="sx-border" />
          <div className="sx-main">
            <input
              id="ul-user"
              className="sx-input"
              type="text"
              name="username"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={s.placeholder}
              autoComplete="off"
              spellCheck={false}
              maxLength={40}
            />
            <div className="sx-mask" />
            <div className="sx-pink" />
            <div className="sx-fborder" />
            <button type="submit" className="sx-clear" aria-label={s.btn}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#d6d6e6" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
            <div className="sx-icon ul-at" aria-hidden="true">@</div>
          </div>
        </div>
      </form>
      {error ? <p role="alert" className="ul-error">{error}</p> : null}
      {active.toLowerCase() !== defaultUser.toLowerCase() ? (
        <button type="button" className="ul-reset" onClick={() => onLookup(defaultUser)}>{s.reset}</button>
      ) : null}
    </section>
  );
}
