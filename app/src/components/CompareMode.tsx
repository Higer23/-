import { useState, type FormEvent } from "react";
import { useGithub } from "../lib/useGithub";

type Props = { locale: string; currentLogin: string; currentScore?: number; currentStars?: number; currentFollowers?: number; currentRepos?: number };
const copy: Record<string, { title: string; hint: string; compare: string; loading: string; score: string; stars: string; followers: string; repos: string; same: string }> = {
  tr: { title: "Profil karşılaştırması", hint: "Karşılaştırmak için bir GitHub kullanıcı adı girin.", compare: "Karşılaştır", loading: "Profil yükleniyor…", score: "Puan", stars: "Yıldız", followers: "Takipçi", repos: "Depo", same: "İki profil aynı kullanıcı." },
  en: { title: "Profile comparison", hint: "Enter a GitHub username to compare.", compare: "Compare", loading: "Loading profile…", score: "Score", stars: "Stars", followers: "Followers", repos: "Repositories", same: "Both profiles are the same user." },
  de: { title: "Profilvergleich", hint: "GitHub-Benutzernamen zum Vergleichen eingeben.", compare: "Vergleichen", loading: "Profil wird geladen…", score: "Punktzahl", stars: "Sterne", followers: "Follower", repos: "Repositories", same: "Beide Profile gehören demselben Benutzer." },
};
export default function CompareMode({ locale, currentLogin, currentScore, currentStars, currentFollowers, currentRepos }: Props) {
  const c = copy[locale] ?? copy.en;
  const [draft, setDraft] = useState("");
  const [user, setUser] = useState("");
  const { state } = useGithub(user, user.length > 0);
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const next = draft.trim().replace(/^@/, ""); if (/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/.test(next)) setUser(next); };
  const data = state.status === "ok" ? state : null;
  return <section className="panel" id="compare-mode" aria-labelledby="compare-title" style={{ marginTop: 18 }}>
    <p className="kicker">{c.title}</p><h2 id="compare-title">{c.title}</h2><p className="muted">{c.hint}</p>
    <form className="ctas" onSubmit={submit}><label htmlFor="compare-user" className="sr-only">GitHub username</label><input id="compare-user" className="sx-input" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={39} autoComplete="off" spellCheck={false} /><button className="btn" type="submit">{c.compare}</button></form>
    {user && state.status === "loading" && <p className="muted" role="status">{c.loading}</p>}
    {user && state.status === "error" && <p className="muted" role="alert">{state.error}</p>}
    {user && data && <><div className="grid" aria-live="polite">
      <div className="stat"><b>{currentLogin}</b><span>GitHub</span></div><div className="stat"><b>{data.data.profile.login}</b><span>GitHub</span></div>
      <div className="stat"><b>{currentScore ?? "–"}</b><span>{c.score} · {currentLogin}</span></div><div className="stat"><b>{data.result.score}</b><span>{c.score} · {data.data.profile.login}</span></div>
      <div className="stat"><b>{currentFollowers?.toLocaleString(locale) ?? "–"}</b><span>{c.followers} · {currentLogin}</span></div><div className="stat"><b>{data.data.profile.followers.toLocaleString(locale)}</b><span>{c.followers} · {data.data.profile.login}</span></div>
      <div className="stat"><b>{currentRepos?.toLocaleString(locale) ?? "–"}</b><span>{c.repos} · {currentLogin}</span></div><div className="stat"><b>{data.data.profile.public_repos.toLocaleString(locale)}</b><span>{c.repos} · {data.data.profile.login}</span></div>
      <div className="stat"><b>{currentStars?.toLocaleString(locale) ?? "–"}</b><span>{c.stars} · {currentLogin}</span></div><div className="stat"><b>{data.result.stats.stars.toLocaleString(locale)}</b><span>{c.stars} · {data.data.profile.login}</span></div>
    </div>{currentLogin.toLowerCase() === data.data.profile.login.toLowerCase() && <p className="muted">{c.same}</p>}</>}
  </section>;
}
