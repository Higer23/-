import { useEffect, useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from "react";
import { CONFIG } from "../config";
import { useI18n } from "../lib/i18n";
import { GATE_TEXT, fmt } from "../lib/gate-i18n";
import {
  fillTimeOk,
  interactionsOk,
  isCorrectAnswer,
  lockDurationMs,
  looksAutomated,
  makeChallenge,
  readStored,
  sliderDonePct,
  sliderOk,
  writeStored,
  type Challenge,
} from "../lib/gate-logic";
import LanguageSwitcher from "./LanguageSwitcher";
import HoneypotFields, { honeypotFilled } from "./HoneypotFields";
import "./entrance-gate.css";
import "./gate-form.css";

/*
 * Taraycı tarafı bot koruması (mobil uyumlu, 34 dil):
 *  1. Gizli honeypot alanları
 *  2. Minimum form süresi
 *  3. Kaydırıcı doğrulaması (süre ve tamamlanma)
 *  4. Etkileşim sayımı (fare, dokunma, tuş)
 *  5. Matematik sorusu
 *  6. Otomasyon işareti (navigator.webdriver)
 *  7. Başarısız denemelerde üssel kilit
 * Doğrulama her sayfa yüklemesinde yeniden istenir (oturum geçişi yok).
 * Sabitler src/config.ts, metinler src/lib/gate-i18n.ts içinde.
 */

const G = CONFIG.gate;

export default function EntranceGate({ children }: { children: ReactNode }) {
  const { lang } = useI18n();
  const T = GATE_TEXT[lang];

  const [verified, setVerified] = useState(false);
  const [challenge, setChallenge] = useState<Challenge>(() => makeChallenge());
  const [answer, setAnswer] = useState("");
  const [honey, setHoney] = useState<Record<string, string>>({});
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

  useEffect(() => {
    const bump = () => {
      interactions.current += 1;
    };
    const events = ["pointermove", "pointerdown", "keydown", "touchstart", "touchmove"] as const;
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, bump));
  }, []);

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
    const dur = lockDurationMs(fails);
    writeStored({ fails, lockUntil: dur > 0 ? Date.now() + dur : 0 });
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
    if (pct >= sliderDonePct()) {
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
      setError(fmt(T.lock, { s: lockLeft }));
      return;
    }
    if (looksAutomated() || honeypotFilled(honey)) {
      fail(T.errBot);
      return;
    }
    if (!fillTimeOk(Date.now() - startedAt.current)) {
      fail(T.errFast);
      return;
    }
    if (!sliderDone) {
      fail(T.errSlider);
      return;
    }
    if (!sliderOk(sliderDurationMs.current)) {
      fail(T.errSpeed);
      return;
    }
    if (!interactionsOk(interactions.current)) {
      fail(T.errInteraction);
      return;
    }
    if (!isCorrectAnswer(answer, challenge.answer)) {
      fail(T.errAnswer);
      return;
    }
    writeStored({ fails: 0, lockUntil: 0 });
    setVerified(true);
  };

  if (verified) return <>{children}</>;

  return (
    <main className="turnstile-gate gate-root">
      <div className="gate-lang">
        <LanguageSwitcher />
      </div>
      <div className="turnstile-gate__glow turnstile-gate__glow--orange" aria-hidden="true" />
      <div className="turnstile-gate__glow turnstile-gate__glow--cream" aria-hidden="true" />

      <section className="turnstile-gate__card gate-card" aria-labelledby="gate-title">
        <div className="turnstile-gate__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3.25 19 6v5.1c0 4.4-2.85 7.75-7 9.65-4.15-1.9-7-5.25-7-9.65V6l7-2.75Z" />
            <path d="m8.8 12.1 2.1 2.1 4.45-4.6" />
          </svg>
        </div>

        <p className="turnstile-gate__eyebrow">{T.eyebrow}</p>
        <h1 id="gate-title" className="turnstile-gate__title">{T.title}</h1>
        <p className="turnstile-gate__description">{T.desc}</p>

        <form onSubmit={submit} autoComplete="off">
          <div
            ref={trackRef}
            className="gate-slider"
            data-done={sliderDone ? "true" : "false"}
            style={{ ["--pct" as string]: sliderPct }}
            onPointerDown={onSliderDown}
            onPointerMove={onSliderMove}
            onPointerUp={onSliderUp}
            onPointerCancel={onSliderUp}
            role="presentation"
          >
            <div className="gate-slider__fill" />
            <div className="gate-slider__handle" aria-hidden="true" />
            <span className="gate-slider__label">{sliderDone ? T.sliderDone : T.slider}</span>
          </div>

          <label className="turnstile-gate__description" htmlFor="gate-answer" style={{ display: "block" }}>
            {fmt(T.question, { a: challenge.a, b: challenge.b })}
          </label>
          <input
            id="gate-answer"
            className="gate-answer"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            required
          />

          <HoneypotFields values={honey} onChange={(name, v) => setHoney((prev) => ({ ...prev, [name]: v }))} />

          {error && (
            <p className="turnstile-gate__error gate-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="turnstile-gate__button gate-submit" disabled={lockLeft > 0}>
            <span>{lockLeft > 0 ? fmt(T.wait, { s: lockLeft }) : T.submit}</span>
            {lockLeft === 0 && <span className="turnstile-gate__arrow" aria-hidden="true">↗</span>}
          </button>
        </form>

        <p className="turnstile-gate__footer">
          <span className="turnstile-gate__dot" />
          {T.footer} <span className="turnstile-gate__separator">/</span> HIGER23
        </p>
      </section>
    </main>
  );
}
