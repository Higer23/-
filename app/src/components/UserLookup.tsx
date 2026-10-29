import { useState, type FormEvent } from "react";

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
    <section aria-label={s.hint} style={{ margin: "16px 0", display: "flex", flexDirection: "column", gap: 8 }}>
      <form onSubmit={submit} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, flex: "1 1 220px" }}>
          <span style={{ fontSize: "0.85rem", opacity: 0.7 }}>{s.label}</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={s.placeholder}
            autoComplete="off"
            spellCheck={false}
            maxLength={40}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "inherit" }}
          />
        </label>
        <button type="submit" className="btn">{s.btn}</button>
      </form>
      {error ? <p role="alert" style={{ color: "#ff7b7b", margin: 0 }}>{error}</p> : null}
      {active !== defaultUser ? (
        <button type="button" onClick={() => onLookup(defaultUser)} style={{ alignSelf: "flex-start" }}>{s.reset}</button>
      ) : null}
    </section>
  );
}
