import { useEffect, useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import "./entrance-gate.css";

/*
 * Çok katmanlı bot koruması (tarayıcı tarafı):
 *  1. Gizli honeypot alanları (insan görmez, bot doldurur)
 *  2. Minimum form süresi (çok hızlı cevap = bot)
 *  3. Kaydirma (slider) doğrulaması: süre ve hız kontrolü, ani/çok düzgün hareketler reddedilir
 *  4. Fare/klavye etkinliği sayımı (etkileşim yoksa reddedilir)
 *  5. Matematik sorusu (her denemede yeni)
 *  6. Tarayici otomasyon işaretleri (navigator.webdriver)
 *  7. Başarısız denemelerde üssel artışlı kilit (localStorage)
 * Geçen ziyaretçi oturum boyunca (sessionStorage, 2 saat) tekrar sormaz.
 *
 * NOT: Bu kontroller tamamen istemci tarafındadır; kodu okuyan kararlı bir saldırgan
 * bunları atlatabilir. Sunucu taraflı imzalı doğrulama için Worker gerekir.
 */

const MIN_FILL_MS = 3000;
const SLIDER_MIN_MS = 600;
const SLIDER_MAX_MS = 15000;
const MIN_INTERACTIONS = 15;
const MAX_FAILS_BEFORE_LOCK = 3;
const LOCK_BASE_MS = 60_000;
const LOCK_MAX_MS = 60 * 60_000;
const STORE_KEY = "gate-v2-state";
const PASS_KEY = "gate-v2-pass";
const PASS_TTL_MS = 2 * 60 * 60 * 1000;

type Stored = { fails: number; lockUntil: number };

function readStored(): Stored {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Stored;
      return { fails: Number(parsed.fails) || 0, lockUntil: Number(parsed.lockUntil) || 0 };
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

  // Etkileşim sayımı
  useEffect(() => {
    const bump = () => {
      interactions.current += 1;
    };
    window.addEventListener("pointermove", bump);
    window.addEventListener("keydown", bump);
    window.addEventListener("touchmove", bump);
    return () => {
      window.removeEventListener("pointermove", bump);
      window.removeEventListener("keydown", bump);
      window.removeEventListener("touchmove", bump);
    };
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
    const lockUntil =
      over >= 0 ? Date.now() + Math.min(LOCK_MAX_MS, LOCK_BASE_MS * 2 ** over) : 0;
    writeStored({ fails, lockUntil });
    setError(msg);
    resetAll();
  };

  // Kaydırma (slider)
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
    if (pct >= 95) {
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
    // Honeypot: bot doldurur, insan görmez.
    if (honeyWeb.trim() !== "" || honeyPhone.trim() !== "") {
      fail("Doğrulama başarısız.");
      return;
    }
    if (Date.now() - startedAt.current < MIN_FILL_MS) {
      fail("Çok hızlı. Biraz bekleyip tekrar dene.");
      return;
    }
    if (!sliderDone) {
      fail("Kaydırmayı sona kadar sürüklemen gerekiyor.");
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
    <main className="turnstile-gate">
      <div className="gate-lang">
        <LanguageSwitcher />
      </div>
      <div className="turnstile-gate__glow turnstile-gate__glow--orange" aria-hidden="true" />
      <div className="turnstile-gate__glow turnstile-gate__glow--cream" aria-hidden="true" />

      <section className="turnstile-gate__card" aria-labelledby="gate-title">
        <div className="turnstile-gate__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3.25 19 6v5.1c0 4.4-2.85 7.75-7 9.65-4.15-1.9-7-5.25-7-9.65V6l7-2.75Z" />
            <path d="m8.8 12.1 2.1 2.1 4.45-4.6" />
          </svg>
        </div>

        <p className="turnstile-gate__eyebrow">Giriş</p>
        <h1 id="gate-title" className="turnstile-gate__title">Devam etmek için</h1>
        <p className="turnstile-gate__description">Kaydırıcıyı sona sürükle ve soruyu cevapla.</p>

        <form onSubmit={submit} autoComplete="off">
          <div
            ref={trackRef}
            onPointerDown={onSliderDown}
            onPointerMove={onSliderMove}
            onPointerUp={onSliderUp}
            onPointerCancel={onSliderUp}
            style={{
              position: "relative",
              height: 44,
              borderRadius: 22,
              background: "rgba(255,255,255,0.08)",
              touchAction: "none",
              userSelect: "none",
              margin: "8px 0 16px",
              overflow: "hidden",
            }}
            role="presentation"
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                width: `${sliderPct}%`,
                background: "rgba(255,160,60,0.35)",
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 4,
                left: `calc(${sliderPct}% - ${sliderPct > 0 ? 20 : 0}px)`,
                width: 36,
                height: 36,
                borderRadius: 18,
                background: sliderDone ? "#7fd18b" : "#ffa03c",
              }}
            />
            <span
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                fontSize: 13,
                pointerEvents: "none",
              }}
            >
              {sliderDone ? "Doğrulandı" : "Sona sürükle →"}
            </span>
          </div>

          <label className="turnstile-gate__description" htmlFor="gate-answer">
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
            style={{ display: "block", width: "100%", padding: "10px", margin: "8px 0 16px" }}
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

          <button type="submit" className="turnstile-gate__button" disabled={lockLeft > 0}>
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
