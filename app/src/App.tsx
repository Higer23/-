import { useEffect, useMemo, useState } from "react";
import { CONFIG } from "./config";
import { useGithub } from "./lib/useGithub";
import { useReveal } from "./lib/useReveal";
import Background from "./components/Background";
import Progress from "./components/Progress";
import Panel from "./components/Panel";
import Loader from "./components/Loader";
import SearchBox from "./components/SearchBox";
import { DonateButton, LearnMore, StarButton } from "./components/Buttons";

const OC = "https://opencollective.com/higer023";
const SP = "https://github.com/sponsors/Higer023";
const FALLBACK_AVATAR = "assets/img/avatar-fallback.svg";

const PROJECTS = [
  { kicker: "SECURITY · BASH", title: "HigerZero", href: "https://github.com/Higer23/HigerZero", text: "Bash ile yazılmış kablosuz ağ güvenlik denetim çerçevesi. Yalnızca kendi ağlarında ve yazılı izin verilen ortamlarda kullanılmalıdır." },
  { kicker: "WEB APP · CLOUDFLARE", title: "Kontakt-Notizbuch", href: "https://github.com/Higer23/kontakt-notizbuch", text: "Kişisel kişi ve not uygulaması. Cloudflare Workers, D1 ve R2 üzerinde çalışıyor; admin girişi ve giriş kayıtları var." },
];

const norm = (s: string) => s.toLocaleLowerCase("tr");

export default function App() {
  const { state, retry } = useGithub(CONFIG.user);
  const [query, setQuery] = useState("");
  const [avatarFailed, setAvatarFailed] = useState(false);
  const aboutRef = useReveal<HTMLElement>();

  const ok = state.status === "ok" ? state : null;
  const profile = ok?.data.profile;
  const result = ok?.result;

  useEffect(() => {
    if (result) document.title = `Higer23 · GitHub Puanı ${result.score}/100`;
  }, [result]);

  const stars = useMemo(() => {
    if (!ok) return 0;
    return ok.data.repos.reduce(
      (total: number, repo: { stargazers_count?: number }) =>
        total + (repo.stargazers_count ?? 0),
      0,
    );
  }, [ok]);

  const q = norm(query.trim());
  const hit = (s: string) => !q || norm(s).includes(q);

  const stats: [string, string | number][] = result && profile
    ? [
        ["Takipçi", profile.followers],
        ["Public depo", profile.public_repos],
        ["Toplam yıldız", result.stats.stars],
        ["Katkı (1 yıl)", result.stats.hasContrib ? result.stats.total : "–"],
        ["Güncel seri", `${result.stats.current} gün`],
        ["En uzun seri", `${result.stats.longest} gün`],
        ["Son 30 gün aktif depo", result.stats.active30],
      ]
    : [];
  const shownStats = stats.filter(([l, v]) => hit(`${l} ${v}`));
  const shownParts = (result?.parts ?? []).filter((p: { label: string; txt: string }) => hit(`${p.label} ${p.txt}`));
  const langs: [string, number][] = (result?.langs ?? []).slice(0, 8);
  const shownLangs = langs.filter(([n]) => hit(n));
  const shownNotes = (result?.notes ?? []).filter((n: string) => hit(n));
  const shownProjects = PROJECTS.filter((p) => hit(`${p.title} ${p.kicker} ${p.text}`));

  const found = shownStats.length + shownParts.length + shownLangs.length + shownNotes.length + shownProjects.length;
  const info = q ? (found ? `${found} sonuç` : "Sonuç bulunamadı") : "";

  const avatarSrc = !avatarFailed && profile?.avatar_url
    ? `${profile.avatar_url}${profile.avatar_url.includes("?") ? "&" : "?"}s=224`
    : FALLBACK_AVATAR;

  return (
    <>
      <Background />
      <a className="skip" href="#main">İçeriğe geç</a>
      <aside className="donate-bar" aria-label="Bağış seçenekleri">
        <p className="donate-label">Bağımsız geliştirici · açık kaynak yolculuğu</p>
        <div className="donate-links">
          <DonateButton href={OC}>Projeyi destekle</DonateButton>
          <DonateButton href={SP} dark>GitHub Sponsors</DonateButton>
        </div>
      </aside>
      <Progress />
      <header className="top">
        <a className="brand" href="#top">Higer23 <span style={{ color: "var(--muted)", fontWeight: 400 }}>/ digital lab</span></a>
        <nav aria-label="Ana gezinme">
          <a href="#hakkimda">Hikâyem</a><a href="#projeler">Projeler</a><a href="#puan">Puan</a><a href="#elestiri">Gelişim</a><a href="#destek">Destek</a>
        </nav>
      </header>

      <main id="main">
        <section className="hero" id="top" aria-labelledby="name">
          <img className="avatar" src={avatarSrc} width={112} height={112} alt="Higer23 profil fotoğrafı" fetchPriority="high" onError={() => setAvatarFailed(true)} />
          <p className="kicker">GitHub profili · canlı veriler · 2026</p>
          <h1 id="name">{profile ? profile.name || profile.login : "Yükleniyor…"}</h1>
          <p className="handle">
            <a href="https://github.com/Higer23" rel="noopener noreferrer">@Higer23</a> <span aria-hidden="true">·</span>{" "}
            <span style={{ color: "var(--muted)" }}>öğren, üret, yinele.</span>
          </p>
          <p className="lead">{profile?.bio ?? ""}</p>
          <div className="ctas">
            <LearnMore href="#projeler">Çalışmalarımı keşfet</LearnMore>
            <StarButton href="https://github.com/Higer23?tab=repositories" count={stars}>GitHub'daki tüm yıldızlar</StarButton>
          </div>
          <p className="muted" style={{ fontSize: ".78rem", marginTop: 22 }}>01 / Kişisel geliştirici arşivi</p>
        </section>

        <p className={`status${state.status === "error" ? " err" : ""}`} role="status">
          {state.status === "loading" && "GitHub verileri yükleniyor…"}
          {state.status === "error" && `Veri çekilemedi: ${state.error}`}
          {state.status === "ok" && "Veriler GitHub’dan az önce çekildi."}
        </p>
        {state.status === "error" && (
          <button className="btn" type="button" id="retry" onClick={retry}>Tekrar dene</button>
        )}

        <SearchBox value={query} onChange={setQuery} info={info} />

        <Panel id="puan" kicker="01 / Açık veriler" title={<>Rakamların<br />arkasındaki emek.</>}>
          <div className="score-row">
            <div className="grade" role="img" aria-label="GitHub puan notu">{result ? result.grade : "–"}</div>
            <p className="muted">100 üzerinden puan, yalnızca GitHub'daki açık verilerden hesaplanır. Toplam: <span>{result ? result.score : "–"}</span>/100</p>
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
              <div className="stat" key={label}><b>{String(value)}</b><span>{label}</span></div>
            ))}
          </div>
        </Panel>

        <section ref={aboutRef} className="panel reveal" id="hakkimda" aria-labelledby="hakkimda-h">
          <p className="kicker">02 / Yolculuk</p>
          <h2 id="hakkimda-h">Henüz yolun başında.<br />Ve bu güzel bir şey.</h2>
          <div className="story">
            <p className="lead2">Ben 16 yaşındayım ve kod yazmayı öğreniyorum. Python ile başladım; şimdi Bash, web ve güvenlik araçlarına doğru ilerliyorum.</p>
            <p>Kendimi bir script kiddie olarak görüyorum: hazır araçları ve scriptleri inceleyip değiştirerek öğreniyorum. Hedefim, bu alışkanlığı kendi kodumu yazmaya ve temelleri sağlamlaştırmaya çevirmek.</p>
            <p>Elimdeki cihazlar bu iş için pek yeterli değil. Yavaş bir telefon ve sınırlı bir bilgisayarla büyük projeleri derlemek ve bazı araçları denemek zorlaşıyor. Yine de elimden geldiğince öğrenmeye devam ediyorum.</p>
            <p>Bu sayfa GitHub izimin canlı bir özeti. Puanım burada hesaplanıyor, eleştirilerim yazılıyor, hikâyem zamanla genişleyecek.</p>
          </div>
        </section>

        <Panel id="projeler" kicker="03 / Seçilmiş işler" title="Fikirden çalışan koda.">
          {shownProjects.map((p) => (
            <article className="proj" key={p.title}>
              <p className="kicker">{p.kicker}</p>
              <h3>{p.title}</h3>
              <p className="muted">{p.text}</p>
              <a href={p.href} rel="noopener noreferrer">Depoyu incele ↗</a>
            </article>
          ))}
        </Panel>

        <Panel id="diller" kicker="04 / Araç kutusu" title="Depolardaki diller.">
          <div>
            {state.status === "loading" && <Loader />}
            {ok && langs.length === 0 && <p className="muted">Dil verisi yok.</p>}
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

        <Panel id="elestiri" kicker="05 / Bir sonraki adım" title="İyileştirme, bitmeyen bir süreç.">
          <p className="muted">Her madde GitHub'daki gerçek bir sinyale bağlı. Bunlar bir sonraki adımlar için.</p>
          {state.status === "loading" && <Loader />}
          <ul className="crit">
            {shownNotes.map((n: string) => <li key={n}>{n}</li>)}
          </ul>
        </Panel>

        <Panel id="destek" kicker="06 / Destek" title={<>Bir sonraki deneyi<br />birlikte mümkün kılalım.</>}>
          <p className="muted">Projelerin ayakta kalmasına destek olabilirsin. Bağış tamamen gönüllüdür; sayfanın hiçbir özelliği bağışa bağlı değildir. Teşekkür ederim.</p>
          <div className="ctas">
            <DonateButton href={OC}>Open Collective</DonateButton>
            <DonateButton href={SP} dark>GitHub Sponsors</DonateButton>
          </div>
        </Panel>

      </main>
      <footer>Veriler GitHub REST API üzerinden canlı çekilir. Sayfa GitHub Pages üzerinde statik olarak çalışır. <span style={{ color: "var(--accent)" }}>Higer23</span> · tasarım / 2026</footer>
    </>
  );
}
