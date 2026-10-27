import { useEffect, useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import "./entrance-gate.css";

/*
 * Tarayıcı tarafı bot koruması (mobil uyumlu, düşük sürtünmeli):
 *  1. Gizli honeypot alanları (insan görmez, bot doldurur)
 *  2. Minimum form süresi (1,5 sn)
 *  3. Kaydırma (slider) doğrulaması: fare ve dokunmatik ile çalışır; çok hızlı veya çok yavaş değil
 *  4. Etkileşim sayımı: fare, dokunma, tuş ve kaydırma hareketleri
 *  5. Matematik sorusu (her denemede yeni)
 *  6. Otomasyon işareti (navigator.webdriver)
 *  7. Başarısız denemelerde üssel artışlı kilit
 * Geçen ziyaretçi 2 saat boyunca (sessionStorage) tekrar sorulmaz.
 *
 * NOT: Hepsi istemci tarafında; kararlı bir saldırgan atlatabilir. Sunucu doğrulaması için Worker gerekir.
 */

const MIN_FILL_MS = 1500;
const SLIDER_MIN_MS = 250;
const SLIDER_MAX_MS = 20000;
const SLIDER_DONE_PCT = 90;
const MIN_INTERACTIONS = 8;
const MAX_FAILS_BEFORE_LOCK = 3;
const LOCK_BASE_MS = 30_000;
const LOCK_MAX_MS = 30 * 60_000;
const STORE_KEY = "gate-v2-state";
const PASS_KEY = "gate-v2-pass";
const PASS_TTL_MS = 2 * 60 * 60 * 1000;
const HANDLE = 44;

type Stored = { fails: number; lockUntil: number };

function readStored(): Stored {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Stored;
      return { fails: Number(p.fails) || 0, lockUntil: Number(p.lockUntil) || 0 };
    }
  } catch {
    /* depolama kapalıysa sıfır kabul et */
  }
  return { fails: 0, lockUntil: 0 };
}

function writeStored(s: Stored) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(s));
  } catch {
    /* yoksay */
  }
}

function hasValidPass(): boolean {
  try {
    return Number(sessionStorage.getItem(PASS_KEY)) > Date.now();
  } catch {
    return false;
  }
}

function grantPass() {
  try {
    sessionStorage.setItem(PASS_KEY, String(Date.now() + PASS_TTL_MS));
  } catch {
    /* yoksay */
  }
}

function makeChallenge() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

function looksAutomated(): boolean {
  return typeof navigator !== "undefined" && (navigator as Navigator & { webdriver?: boolean }).webdriver === true;
}

export default function EntranceGate({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState<boolean>(() => hasValidPass());
  const [challenge, setChallenge] = useState(makeChallenge);
  const [answer, setAnswer] = useState("");
  const [honeyWeb, setHoneyWeb] = useState("");
  const [honeyPhone, setHoneyPhone] = useState("");
  const [sliderPct, setSliderPct] = useState(0);
  const [sliderDone, setSliderDone] = useState(false);
  const [error, setError] = useState("");
  const [lockLeft, setLockLeft] = useState(0);

  const startedAt = useRef(Date.now());
  const interactions = useRef(0);
  const sliderStartAt = useRef<number | null>(null);
  const sliderDurationMs = useRef(0);
  const dragging = useRef(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Etkileşim sayımı (fare, dokunma, tuş)
  useEffect(() => {
    const bump = () => {
      interactions.current += 1;
    };
    const events = ["pointermove", "pointerdown", "keydown", "touchstart", "touchmove"] as const;
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, bump));
  }, []);

  // Kilit geri sayımı
  useEffect(() => {
    const tick = () => {
      const s = readStored();
      setLockLeft(Math.max(0, Math.ceil((s.lockUntil - Date.now()) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const resetAll = () => {
    setChallenge(makeChallenge());
    setAnswer("");
    setSliderPct(0);
    setSliderDone(false);
    sliderStartAt.current = null;
    sliderDurationMs.current = 0;
    startedAt.current = Date.now();
    interactions.current = 0;
    dragging.current = false;
  };

  const fail = (msg: string) => {
    const s = readStored();
    const fails = s.fails + 1;
    const over = fails - MAX_FAILS_BEFORE_LOCK;
    const lockUntil = over >= 0 ? Date.now() + Math.min(LOCK_MAX_MS, LOCK_BASE_MS * 2 ** over) : 0;
    writeStored({ fails, lockUntil });
    setError(msg);
    resetAll();
  };

  const pctFromEvent = (e: PointerEvent<HTMLDivElement>) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return 0;
    return Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
  };

  const onSliderDown = (e: PointerEvent<HTMLDivElement>) => {
    if (sliderDone) return;
    dragging.current = true;
    sliderStartAt.current = Date.now();
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onSliderMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || sliderDone) return;
    const pct = pctFromEvent(e);
    setSliderPct(pct);
    if (pct >= SLIDER_DONE_PCT) {
      dragging.current = false;
      sliderDurationMs.current = Date.now() - (sliderStartAt.current ?? Date.now());
      setSliderPct(100);
      setSliderDone(true);
    }
  };

  const onSliderUp = () => {
    if (sliderDone) return;
    dragging.current = false;
    sliderStartAt.current = null;
    setSliderPct(0);
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (lockLeft > 0) {
      setError(`Çok fazla deneme. ${lockLeft} saniye sonra tekrar dene.`);
      return;
    }
    if (looksAutomated()) {
      fail("Doğrulama başarısız.");
      return;
    }
    if (honeyWeb.trim() !== "" || honeyPhone.trim() !== "") {
      fail("Doğrulama başarısız.");
      return;
    }
    if (Date.now() - startedAt.current < MIN_FILL_MS) {
      fail("Çok hızlı. Bir an bekleyip tekrar dene.");
      return;
    }
    if (!sliderDone) {
      fail("Kaydırıcıyı sona kadar sürükle.");
      return;
    }
    const d = sliderDurationMs.current;
    if (d < SLIDER_MIN_MS || d > SLIDER_MAX_MS) {
      fail("Kaydırma çok hızlı ya da çok yavaş yapıldı.");
      return;
    }
    if (interactions.current < MIN_INTERACTIONS) {
      fail("Etkileşim algılanamadı.");
      return;
    }
    if (Number(answer.trim()) !== challenge.answer) {
      fail("Cevap yanlış, yeni bir soru geldi.");
      return;
    }
    writeStored({ fails: 0, lockUntil: 0 });
    grantPass();
    setVerified(true);
  };

  if (verified) return <>{children}</>;

  return (
    <main className="turnstile-gate" style={{ boxSizing: "border-box", padding: "16px", minHeight: "100dvh" }}>
      <div className="gate-lang">
        <LanguageSwitcher />
      </div>
      <div className="turnstile-gate__glow turnstile-gate__glow--orange" aria-hidden="true" />
      <div className="turnstile-gate__glow turnstile-gate__glow--cream" aria-hidden="true" />

      <section
        className="turnstile-gate__card"
        aria-labelledby="gate-title"
        style={{ width: "100%", maxWidth: 420, boxSizing: "border-box", padding: "20px" }}
      >
        <div className="turnstile-gate__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3.25 19 6v5.1c0 4.4-2.85 7.75-7 9.65-4.15-1.9-7-5.25-7-9.65V6l7-2.75Z" />
            <path d="m8.8 12.1 2.1 2.1 4.45-4.6" />
          </svg>
        </div>

        <p className="turnstile-gate__eyebrow">Giriş</p>
        <h1 id="gate-title" className="turnstile-gate__title">Devam etmek için</h1>
        <p className="turnstile-gate__description">Kaydırıcıyı sürükle ve soruyu cevapla.</p>

        <form onSubmit={submit} autoComplete="off">
          <div
            ref={trackRef}
            onPointerDown={onSliderDown}
            onPointerMove={onSliderMove}
            onPointerUp={onSliderUp}
            onPointerCancel={onSliderUp}
            style={{
              position: "relative",
              height: 52,
              borderRadius: 26,
              background: "rgba(255,255,255,0.08)",
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
              margin: "8px 0 18px",
              overflow: "hidden",
              cursor: sliderDone ? "default" : "grab",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: 0,
                width: `${sliderPct}%`,
                background: "rgba(255,160,60,0.35)",
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 4,
                left: `calc((100% - ${HANDLE + 8}px) * ${sliderPct / 100} + 4px)`,
                width: HANDLE,
                height: HANDLE,
                borderRadius: HANDLE / 2,
                background: sliderDone ? "#7fd18b" : "#ffa03c",
                pointerEvents: "none",
              }}
            />
            <span
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                fontSize: 14,
                pointerEvents: "none",
              }}
            >
              {sliderDone ? "Doğrulandı ✓" : "Sona sürükle →"}
            </span>
          </div>

          <label className="turnstile-gate__description" htmlFor="gate-answer" style={{ display: "block" }}>
            {challenge.a} + {challenge.b} = ?
          </label>
          <input
            id="gate-answer"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
            style={{
              display: "block",
              width: "100%",
              boxSizing: "border-box",
              minHeight: 48,
              padding: "12px",
              margin: "8px 0 18px",
              fontSize: 16, // iOS'ta otomatik yakınlaştırmayı engeller
              borderRadius: 10,
            }}
          />

          {/* Gizli honeypot alanları: insan görmez ve doldurmaz. */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
            <label htmlFor="gate-web">Web sitesi</label>
            <input id="gate-web" type="text" name="website" tabIndex={-1} autoComplete="off" value={honeyWeb} onChange={(e) => setHoneyWeb(e.target.value)} />
            <label htmlFor="gate-phone">Telefon</label>
            <input id="gate-phone" type="text" name="phone" tabIndex={-1} autoComplete="off" value={honeyPhone} onChange={(e) => setHoneyPhone(e.target.value)} />
          </div>

          {error && (
            <p className="turnstile-gate__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="turnstile-gate__button"
            disabled={lockLeft > 0}
            style={{ width: "100%", minHeight: 48, boxSizing: "border-box" }}
          >
            <span>{lockLeft > 0 ? `Bekle (${lockLeft}s)` : "Devam et"}</span>
            {lockLeft === 0 && <span className="turnstile-gate__arrow" aria-hidden="true">↗</span>}
          </button>
        </form>

        <p className="turnstile-gate__footer">
          <span className="turnstile-gate__dot" />
          Güvenlik kontrolü <span className="turnstile-gate__separator">/</span> HIGER23
        </p>
      </section>
    </main>
  );
}
