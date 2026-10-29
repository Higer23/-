import { useEffect, useMemo, useState } from "react";
import { CONFIG } from "./config";
import { useGithub } from "./lib/useGithub";
import { useReveal } from "./lib/useReveal";
import { useI18n } from "./lib/i18n";
import type { Key } from "./lib/locales/types";
import Background from "./components/Background";
import ProjectModal from "./components/ProjectModal";
import UserLookup from "./components/UserLookup";
import Progress from "./components/Progress";
import Panel from "./components/Panel";
import Loader from "./components/Loader";
import SearchBox from "./components/SearchBox";
import LanguageSwitcher from "./components/LanguageSwitcher";
import { DonateButton, LearnMore, StarButton } from "./components/Buttons";

const OC = "https://opencollective.com/higer023";
const SP = "https://github.com/sponsors/Higer023";
const FALLBACK_AVATAR = "assets/img/avatar-fallback.svg";

const norm = (s: string) => s.toLocaleLowerCase();

const PROJ_TEXT: Record<string, Record<string, string>> = {
  "higum": {en: "Live web app deployed on Vercel.", tr: "Vercel üzerinde canlı çalışan bir web uygulaması.", de: "Web-App, live auf Vercel."},
  "forum": {en: "Discussion forum with a live demo.", tr: "Canlı demosu olan bir tartışma forumu.", de: "Diskussionsforum mit Live-Demo."},
  "nachricht-portal": {en: "Messaging portal with a live demo.", tr: "Canlı demosu olan bir mesajlaşma portalı.", de: "Nachrichtenportal mit Live-Demo."},
  "anonim-mesaj": {en: "Anonymous messaging app with a live demo.", tr: "Canlı demosu olan anonim mesajlaşma uygulaması.", de: "Anonyme Nachrichten-App mit Live-Demo."},
  "gta6-discord-rpc": {en: "Modular Discord Rich Presence client for Python (MIT).", tr: "Python için modüler Discord Rich Presence istemcisi (MIT).", de: "Modularer Discord-Rich-Presence-Client für Python (MIT)."},
  "kontakt": { en: "Personal contact directory and notepad (Cloudflare Workers + D1 + R2).", tr: "Cloudflare Workers + D1 + R2 ile kişisel rehber ve not defteri.", de: "Persönliches Kontaktverzeichnis und Notizblock (Cloudflare Workers + D1 + R2)." },
};

const INSPECT: Record<string, string> = { tr: "İncele", en: "Inspect", de: "Ansehen" };

export default function App() {
  const { t, locale } = useI18n();
  const [lookup, setLookup] = useState<string>(CONFIG.user);
  const { state, retry } = useGithub(lookup);
  const [query, setQuery] = useState("");
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [openProj, setOpenProj] = useState<{ title: string; kicker: string; text: string; href: string } | null>(null);
  const aboutRef = useReveal<HTMLElement>();

  const ok = state.status === "ok" ? state : null;
  const profile = ok?.data.profile;
  const result = ok?.result;

  const PROJECTS = useMemo(
    () => [
      { kicker: "WEB APP · CLOUDFLARE", title: "Kontakt-Notizbuch", href: "https://github.com/Higer023/kontakt-notizbuch", text: PROJ_TEXT["kontakt"][locale as string] ?? PROJ_TEXT["kontakt"].en },
      { kicker: "WEB APP · VERCEL", title: "Higum", href: "https://github.com/Higer23/higum", text: PROJ_TEXT["higum"][locale as string] ?? PROJ_TEXT["higum"].en },
      { kicker: "WEB APP", title: "Forum", href: "https://github.com/Higer23/forum", text: PROJ_TEXT["forum"][locale as string] ?? PROJ_TEXT["forum"].en },
      { kicker: "WEB APP · TYPESCRIPT", title: "Nachricht-Portal", href: "https://github.com/Higer23/nachricht-portal", text: PROJ_TEXT["nachricht-portal"][locale as string] ?? PROJ_TEXT["nachricht-portal"].en },
      { kicker: "WEB APP · VERCEL", title: "Anonim-Mesaj", href: "https://github.com/Higer23/anonim-mesaj", text: PROJ_TEXT["anonim-mesaj"][locale as string] ?? PROJ_TEXT["anonim-mesaj"].en },
      { kicker: "PYTHON · DISCORD", title: "GTA6 Discord RPC", href: "https://github.com/Higer23/gta6-discord-rpc", text: PROJ_TEXT["gta6-discord-rpc"][locale as string] ?? PROJ_TEXT["gta6-discord-rpc"].en },
    ],
    [t, locale],
  );

  useEffect(() => {
    if (result) document.title = t("doc.title", { score: result.score });
  }, [result, t]);

  const stars = useMemo(() => {
    if (!ok) return 0;
    return ok.data.repos.reduce(
      (total: number, repo: { stargazers_count?: number }) => total + (repo.stargazers_count ?? 0),
      0,
    );
  }, [ok]);

  const q = norm(query.trim());
  const hit = (s: string) => !q || norm(s).includes(q);

  const stats: [string, string | number][] = result && profile
    ? [
        [t("stat.followers"), profile.followers],
        [t("stat.repos"), profile.public_repos],
        [t("stat.stars"), result.stats.stars],
        [t("stat.contrib"), result.stats.hasContrib ? result.stats.total : "–"],
        [t("stat.streak"), t("stat.days", { n: result.stats.current })],
        [t("stat.longest"), t("stat.days", { n: result.stats.longest })],
        [t("stat.active"), result.stats.active30],
      ]
    : [];
  const shownStats = stats.filter(([l, v]) => hit(`${l} ${v}`));
  const shownParts = (result?.parts ?? [])
    .map((p: { key: string; label: string; txt: string; val: number; cap: number }) => ({ ...p, label: t(p.key as Key) }))
    .filter((p: { label: string; txt: string }) => hit(`${p.label} ${p.txt}`));
  const langs: [string, number][] = (result?.langs ?? []).slice(0, 8);
  const shownLangs = langs.filter(([n]) => hit(n));
  const noteTexts: string[] = (result?.noteCodes ?? []).map(
    (c) => t(c.code as Key, c.vars as unknown as Record<string, string | number> | undefined),
  );
  const shownNotes = noteTexts.filter((n) => hit(n));
  const shownProjects = PROJECTS.filter((p) => hit(`${p.title} ${p.kicker} ${p.text}`));

  const found = shownStats.length + shownParts.length + shownLangs.length + shownNotes.length + shownProjects.length;
  const info = q ? (found ? t("search.count", { n: found }) : t("search.none")) : "";

  const avatarSrc = !avatarFailed && profile?.avatar_url
    ? `${profile.avatar_url}${profile.avatar_url.includes("?") ? "&" : "?"}s=224`
    : FALLBACK_AVATAR;

  return (
    <>
      <Background />
      <a className="skip" href="#main">{t("ui.skip")}</a>
      <aside className="donate-bar" aria-label={t("ui.donateAria")}>
        <p className="donate-label">{t("ui.donateLabel")}</p>
        <div className="donate-links">
          <DonateButton href={OC}>{t("ui.donateSupport")}</DonateButton>
          <DonateButton href={SP} dark>GitHub Sponsors</DonateButton>
        </div>
      </aside>
      <Progress />
      <header className="top">
        <a className="brand" href="#top">Higer23 <span style={{ color: "var(--muted)", fontWeight: 400 }}>/ digital lab</span></a>
        <nav aria-label={t("ui.navAria")}>
          <a href="#hakkimda">{t("nav.story")}</a><a href="#projeler">{t("nav.projects")}</a><a href="#puan">{t("nav.score")}</a><a href="#elestiri">{t("nav.growth")}</a><a href="#destek">{t("nav.support")}</a>
        </nav>
        <LanguageSwitcher />
      </header>

      <main id="main">
        <section className="hero" id="top" aria-labelledby="name">
          <img className="avatar" src={avatarSrc} width={112} height={112} alt={t("hero.avatar")} fetchPriority="high" onError={() => setAvatarFailed(true)} />
          <p className="kicker">{t("hero.kicker")}</p>
          <h1 id="name">{profile ? profile.name || profile.login : state.status === "error" ? lookup : t("hero.loading")}</h1>
          <p className="handle">
            <a href={`https://github.com/${profile?.login ?? lookup}`} rel="noopener noreferrer">@{profile?.login ?? lookup}</a> <span aria-hidden="true">·</span>{" "}
            <span style={{ color: "var(--muted)" }}>{t("hero.tagline")}</span>
          </p>
          <p className="lead">{profile?.bio ?? ""}</p>
          <div className="ctas">
            <LearnMore href="#projeler">{t("hero.explore")}</LearnMore>
            <StarButton href={`https://github.com/${profile?.login ?? lookup}?tab=repositories`} count={stars}>{t("hero.allStars")}</StarButton>
          </div>
          <p className="muted" style={{ fontSize: ".78rem", marginTop: 22 }}>{t("hero.note")}</p>
        </section>

        <p className={`status${state.status === "error" ? " err" : ""}`} role="status">
          {state.status === "loading" && t("status.loading")}
          {state.status === "error" && t("status.error", { msg: state.error })}
          {state.status === "ok" && t("status.ok")}
        </p>
        {state.status === "error" && (
          <button className="btn" type="button" id="retry" onClick={retry}>{t("status.retry")}</button>
        )}

        <UserLookup locale={locale as string} active={lookup} defaultUser={CONFIG.user} onLookup={setLookup} />

        <SearchBox value={query} onChange={setQuery} info={info} />

        <Panel id="puan" kicker={t("score.kicker")} title={t("score.title")}>
          <div className="score-row">
            <div className="grade" role="img" aria-label={t("score.grade")}>{result ? result.grade : "–"}</div>
            <p className="muted">{t("score.desc", { score: result ? result.score : "–" })}</p>
          </div>
          <div>
            {state.status === "loading" && <Loader />}
            {shownParts.map((p: { label: string; txt: string; val: number; cap: number }) => (
              <div key={p.label}>
                <div className="row"><span>{p.label}</span><span className="muted">{`${p.txt} (${p.val.toFixed(1)}/${p.cap})`}</span></div>
                <div className="bar"><i style={{ width: `${Math.min(100, (p.val / p.cap) * 100)}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="grid">
            {shownStats.map(([label, value]) => (
              <div className="stat" key={label}><b>{typeof value === "number" ? value.toLocaleString(locale) : String(value)}</b><span>{label}</span></div>
            ))}
          </div>
        </Panel>

        <section ref={aboutRef} className="panel reveal" id="hakkimda" aria-labelledby="hakkimda-h">
          <p className="kicker">{t("story.kicker")}</p>
          <h2 id="hakkimda-h">{t("story.title")}</h2>
          <div className="story">
            <p className="lead2">{t("story.p1")}</p>
            <p>{t("story.p2")}</p>
            <p>{t("story.p3")}</p>
            <p>{t("story.p4")}</p>
          </div>
        </section>

        <Panel id="projeler" kicker={t("proj.kicker")} title={t("proj.title")}>
          {shownProjects.map((p) => (
            <article className="proj" key={p.title}>
              <p className="kicker">{p.kicker}</p>
              <h3>{p.title}</h3>
              <p className="muted">{p.text}</p>
              <button type="button" className="btn" onClick={() => setOpenProj(p)}>{INSPECT[locale as string] ?? INSPECT.en}</button>
            </article>
          ))}
        </Panel>

        <Panel id="diller" kicker={t("langs.kicker")} title={t("langs.title")}>
          <div>
            {state.status === "loading" && <Loader />}
            {ok && langs.length === 0 && <p className="muted">{t("langs.none")}</p>}
            {shownLangs.map(([name, n]) => {
              const pct = (n / (result?.langSum ?? 1)) * 100;
              return (
                <div key={name}>
                  <div className="row"><span>{name}</span><span className="muted">{Math.round(pct)}%</span></div>
                  <div className="bar"><i style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel id="elestiri" kicker={t("growth.kicker")} title={t("growth.title")}>
          <p className="muted">{t("growth.desc")}</p>
          {state.status === "loading" && <Loader />}
          <ul className="crit">
            {shownNotes.map((n: string) => <li key={n}>{n}</li>)}
          </ul>
        </Panel>

        <Panel id="destek" kicker={t("support.kicker")} title={t("support.title")}>
          <p className="muted">{t("support.desc")}</p>
          <div className="ctas">
            <DonateButton href={OC}>Open Collective</DonateButton>
            <DonateButton href={SP} dark>GitHub Sponsors</DonateButton>
          </div>
        </Panel>

      </main>
      {ok?.data.fetchedAt && (
        <p className="muted" style={{ fontSize: ".78rem" }}>
          {t("snapshot.updated", { time: new Date(ok.data.fetchedAt).toLocaleString(locale) })}
        </p>
      )}
      {openProj && (
        <ProjectModal title={openProj.title} kicker={openProj.kicker} text={openProj.text} href={openProj.href} locale={locale as string} onClose={() => setOpenProj(null)} />
      )}
      <footer>
        {t("footer.text")} <span style={{ color: "var(--accent)" }}>Higer23</span> · {t("footer.design")}
        <a href="https://instagram.com/higer.23" target="_blank" rel="noopener noreferrer">Instagram</a>
      </footer>
    </>
  );
}
