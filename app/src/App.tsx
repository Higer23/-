import { useEffect, useMemo, useState } from "react";
import { CONFIG } from "./config";
import { useGithub } from "./lib/useGithub";
import { useReveal } from "./lib/useReveal";
import { useI18n } from "./lib/i18n";
import { formatFetchedAt } from "./lib/format-date.mjs";
import type { Key } from "./lib/locales/types";
import Background from "./components/Background";
import ProjectModal from "./components/ProjectModal";
import UserLookup from "./components/UserLookup";
import Progress from "./components/Progress";
import Panel from "./components/Panel";
import Loader from "./components/Loader";
import SearchBox from "./components/SearchBox";
import CompareMode from "./components/CompareMode";
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
  "gta6-discord-rpc": {en: "Modular Discord Rich Presence client for Python (MIT).", tr: "Python için modüler Discord Rich Presence istemcisi (MIT).", de: "Modularer Discord-Rich-Presence-Client (MIT)."},
  "kontakt": { en: "Personal contact directory and notepad (Cloudflare Workers + D1 + R2).", tr: "Cloudflare Workers + D1 + R2 ile kişisel rehber ve not defteri.", de: "Persönliches Kontaktverzeichnis und Notizbuch (Cloudflare Workers + D1 + R2)." },
};

const INSPECT: Record<string, string> = { tr: "İncele", en: "Inspect", de: "Ansehen" };

export default function App() {
  const { t, locale } = useI18n();
  const [lookup, setLookup] = useState<string>(CONFIG.user);
  const { state, retry } = useGithub(lookup);
  const [query, setQuery] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [openProj, setOpenProj] = useState<{ title: string; kicker: string; text: string; href: string } | null>(null);
  const aboutRef = useReveal<HTMLElement>();

  const ok = state.status === "ok" ? state : null;
  const profile = ok?.data.profile;
  const result = ok?.result;
  const formattedFetchedAt = formatFetchedAt(ok?.data.fetchedAt, locale);

  const PROJECTS = useMemo(
    () => [
      { kicker: "WEB APP · CLOUDFLARE", title: "Kontakt-Notizbuch", href: "https://github.com/Higer023/kontakt-notizbuch", text: PROJ_TEXT["kontakt"][locale as string] ?? PROJ_TEXT["kontakt"].en },
      { kicker: "WEB APP · VERCEL", title: "Higum", href: "https://github.com/Higer23/higum", text: PROJ_TEXT["higum"][locale as string] ?? PROJ_TEXT["higum"].en },
      { kicker: "WEB APP", title: "Forum", href: "https://github.com/Higer23/forum", text: PROJ_TEXT["forum"][locale as string] ?? PROJ_TEXT["forum"].en },
      { kicker: "WEB APP · TYPESCRIPT", title: "Nachricht-Portal", href: "https://github.com/Higer23/nachricht-portal", text: PROJ_TEXT["nachricht-portal"][locale as string] ?? PROJ_TEXT["nachricht-portal"].en },
      { kicker: "WEB APP · VERCEL", title: "Anonim-Mesaj", href: "https://github.com/Higer23/anonim-mesaj", text: PROJ_TEXT["anonim-mesaj"][locale as string] ?? PROJ_TEXT["anonim-mesaj"].en },
      { kicker: "PYTHON · DISCORD", title: "GTA6 Discord RPC", href: "https://github.com/Higer23/gta6-discord-rpc", text: PROJ_TEXT["gta6-discord-rpc"][locale as string] ?? PROJ_TEXT["gta6-discord-rpc"].en },
    ],
    [locale],
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
  const shownRepos = (ok?.data.repos ?? [])
    .filter((repo: { name?: string; full_name?: string; description?: string; language?: string }) =>
      hit(`${repo.name ?? ""} ${repo.full_name ?? ""} ${repo.description ?? ""} ${repo.language ?? ""}`),
    )
    .sort((a: { stargazers_count?: number }, b: { stargazers_count?: number }) => (b.stargazers_count ?? 0) - (a.stargazers_count ?? 0));

  const activityTrend = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (11 - index), 1);
      return { key: `${date.getFullYear()}-${date.getMonth()}`, label: date.toLocaleDateString(locale, { month: "short" }), count: 0 };
    });
    const byMonth = new Map(months.map((month) => [month.key, month]));
    for (const repo of ok?.data.repos ?? []) {
      const pushedAt = (repo as { pushed_at?: string }).pushed_at;
      if (!pushedAt) continue;
      const date = new Date(pushedAt);
      if (Number.isNaN(date.getTime())) continue;
      const month = byMonth.get(`${date.getFullYear()}-${date.getMonth()}`);
      if (month) month.count += 1;
    }
    return months;
  }, [ok, locale]);
  const activityMax = Math.max(1, ...activityTrend.map((month) => month.count));

  const scoreInsights = useMemo(() => {
    if (!result) return [] as Array<{ text: string; kind: "warning" | "good" }>;

    const notes = result.noteCodes ?? [];
    const strengths = notes.filter((note) => note.code === "note.strength");
    const warnings = notes
      .filter((note) => note.code !== "note.strength")
      .map((note) => ({
        text: t(note.code as Key, note.vars as Record<string, string | number> | undefined),
        kind: "warning" as const,
      }));
    const strengthInsights = strengths.length > 0
      ? strengths.map((note) => ({
          text: t(note.code as Key, note.vars as Record<string, string | number> | undefined),
          kind: "good" as const,
        }))
      : warnings.length === 0
        ? [{ text: t("score.insights.strong", { score: result.score }), kind: "good" as const }]
        : [];

    // Keep the panel concise: show up to three actionable warnings and one strength.
    return [...warnings.slice(0, 3), ...strengthInsights.slice(0, 1)];
  }, [result, t]);

  const found = shownStats.length + shownParts.length + shownLangs.length + shownNotes.length + shownProjects.length + shownRepos.length;
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

        <p className={`status${state.status === "error" || (state.status === "ok" && state.refreshError) ? " err" : ""}`} role="status" aria-live="polite">
          {state.status === "loading" && t("status.loading")}
          {state.status === "error" && t("status.error", { msg: state.error })}
          {state.status === "ok" && state.refreshing && (locale === "tr" ? "Güncel veriler alınıyor; mevcut veriler gösteriliyor…" : locale === "de" ? "Aktuelle Daten werden geladen; bisherige Daten bleiben sichtbar…" : "Refreshing data; showing the last available results…")}
          {state.status === "ok" && !state.refreshing && !state.refreshError && t("status.ok")}
          {state.status === "ok" && state.refreshError && (locale === "tr" ? `Yenileme başarısız: ${state.refreshError}. Önceki veriler gösteriliyor.` : locale === "de" ? `Aktualisierung fehlgeschlagen: ${state.refreshError}. Bisherige Daten werden angezeigt.` : `Refresh failed: ${state.refreshError}. Showing the previous data.`)}
        </p>
        {state.status !== "loading" && (
          <button className="btn" type="button" id="retry" onClick={retry} disabled={state.status === "ok" && state.refreshing}>
            {state.status === "ok" && state.refreshing ? (locale === "tr" ? "Yenileniyor…" : locale === "de" ? "Wird aktualisiert…" : "Refreshing…") : t("status.retry")}
          </button>
        )}

        <UserLookup locale={locale as string} active={lookup} defaultUser={CONFIG.user} onLookup={setLookup} />

        <SearchBox value={query} onChange={setQuery} info={info} />

        <div className="ctas" style={{ justifyContent: "center", marginTop: 16 }}>
          <button className="btn" type="button" aria-expanded={compareMode} aria-controls="compare-mode" onClick={() => setCompareMode((value) => !value)}>{compareMode ? (locale === "tr" ? "Karşılaştırmayı kapat" : locale === "de" ? "Vergleich schließen" : "Close comparison") : (locale === "tr" ? "Profili karşılaştır" : locale === "de" ? "Profile vergleichen" : "Compare profiles")}</button>
        </div>
        {compareMode && <CompareMode locale={locale as string} currentLogin={profile?.login ?? lookup} currentScore={result?.score} currentStars={result?.stats.stars} currentFollowers={profile?.followers} currentRepos={profile?.public_repos} /> }

        <Panel id="puan" kicker={t("score.kicker")} title={t("score.title")}>
          <div className="score-row">
            <div className="grade" role="img" aria-label={t("score.grade")}>{result ? result.grade : "–"}</div>
            <p className="muted">{t("score.desc", { score: result ? result.score : "–" })}</p>
          </div>

          {scoreInsights.length > 0 && (
            <div className="score-insights" aria-live="polite">
              <div className="score-insights-label">{t("score.insights.title")}</div>
              <ul className="score-insights-list">
                {scoreInsights.map((item, index) => (
                  <li key={`${index}-${item.text}`} className={item.kind === "good" ? "good" : "warn"}>
                    {item.text}
                  </li>
                ))}
              </ul>
            </div>
          )}

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

        <Panel id="repositories" kicker={t("stat.repos")} title={t("stat.repos")}>
          {!ok && state.status === "loading" && <Loader />}
          {ok && shownRepos.length === 0 && <p className="muted">{q ? t("search.none") : t("langs.none")}</p>}
          {shownRepos.slice(0, 30).map((repo: { id?: number; name?: string; full_name?: string; description?: string; language?: string; stargazers_count?: number; html_url?: string }) => (
            <article className="proj" key={repo.id ?? repo.full_name ?? repo.name}>
              <p className="kicker">{repo.language ?? "GitHub repository"} · ★ {repo.stargazers_count ?? 0}</p>
              <h3>{repo.name ?? repo.full_name}</h3>
              {repo.description && <p className="muted">{repo.description}</p>}
              {repo.html_url && <a className="btn" href={repo.html_url} target="_blank" rel="noreferrer">{INSPECT[locale as string] ?? INSPECT.en}</a>}
            </article>
          ))}
          {shownRepos.length > 30 && <p className="muted">+{shownRepos.length - 30}</p>}
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

        <Panel id="activity" kicker={locale === "tr" ? "SON 12 AY" : locale === "de" ? "LETZTE 12 MONATE" : "LAST 12 MONTHS"} title={locale === "tr" ? "Depo güncelleme eğilimi" : locale === "de" ? "Repository-Aktivität" : "Repository activity trend"}>
          <p className="muted">{locale === "tr" ? "GitHub depolarının son gönderim tarihine göre aylık dağılım. Bu grafik commit veya katkı sayısı değildir." : locale === "de" ? "Monatliche Verteilung anhand des letzten Push-Datums der Repositories, keine Commit- oder Beitragszählung." : "Monthly distribution by each repository’s latest push date; this is not a commit or contribution count."}</p>
          <div className="activity-trend" role="list" aria-label={locale === "tr" ? "Aylık depo güncellemeleri" : locale === "de" ? "Monatliche Repository-Aktivität" : "Monthly repository updates"}>
            {activityTrend.map((month) => <div className="activity-month" role="listitem" key={month.key}>
              <div className="bar" title={`${month.label}: ${month.count}`}><i style={{ height: `${Math.max(month.count ? 8 : 0, (month.count / activityMax) * 100)}%` }} /></div>
              <span className="muted">{month.label}</span>
              <b>{month.count}</b>
            </div>)}
          </div>
        </Panel>

        <Panel id="elestiri" kicker={t("growth.kicker")} title={t("growth.title")}>
          <p className="muted">{t("growth.desc")}</p>
          {state.status === "loading" && <Loader />}
          <ul className="crit">
            {shownNotes.map((n: string) => <li key={n}>{n}</li>)}
          </ul>
          <div className="ctas" style={{ marginTop: 18 }}>
            <a className="btn" href="https://github.com/Higer23/-/discussions" target="_blank" rel="noopener noreferrer">
              {locale === "tr" ? "Görüşünü paylaş" : locale === "de" ? "Feedback teilen" : "Share feedback"}
            </a>
            <p className="muted" style={{ fontSize: ".78rem", alignSelf: "center", margin: 0 }}>
              {locale === "tr" ? "GitHub tartışmalarında herkese açık olarak paylaşılır." : locale === "de" ? "Wird öffentlich in GitHub Discussions geteilt." : "Shared publicly in GitHub Discussions."}
            </p>
          </div>
        </Panel>

        <Panel id="destek" kicker={t("support.kicker")} title={t("support.title")}>
          <p className="muted">{t("support.desc")}</p>
          <div className="ctas">
            <DonateButton href={OC}>Open Collective</DonateButton>
            <DonateButton href={SP} dark>GitHub Sponsors</DonateButton>
          </div>
        </Panel>

      </main>
      {formattedFetchedAt && (
        <p className="muted" style={{ fontSize: ".78rem" }}>
          {t("snapshot.updated", { time: formattedFetchedAt })}
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
