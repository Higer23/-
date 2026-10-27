import { useRef, useState, type FormEvent, type ReactNode } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import "./entrance-gate.css";

// Botlar genelde formu çok hızlı doldurur; bu süreden kısa sürede gönderilen cevaplar reddedilir.
const MIN_FILL_MS = 2500;

function makeChallenge() {
  const a = Math.floor(Math.random() * 9) + 1;
  const b = Math.floor(Math.random() * 9) + 1;
  return { a, b, answer: a + b };
}

export default function EntranceGate({ children }: { children: ReactNode }) {
  const [verified, setVerified] = useState(false);
  const [challenge, setChallenge] = useState(makeChallenge);
  const [answer, setAnswer] = useState("");
  const [honey, setHoney] = useState("");
  const [error, setError] = useState("");
  const startedAt = useRef(Date.now());

  const resetChallenge = () => {
    setChallenge(makeChallenge());
    setAnswer("");
    startedAt.current = Date.now();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Gizli alan doldurulduysa bot kabul edilir; sessizce reddedilir.
    if (honey.trim() !== "") {
      resetChallenge();
      return;
    }

    if (Date.now() - startedAt.current < MIN_FILL_MS) {
      setError("Çok hızlı gönderdin, lütfen biraz bekle ve tekrar dene.");
      resetChallenge();
      return;
    }

    if (Number(answer.trim()) !== challenge.answer) {
      setError("Cevap yanlış, yeni bir soru geldi.");
      resetChallenge();
      return;
    }

    setError("");
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
        <p className="turnstile-gate__description">Aşağıdaki basit soruyu cevapla.</p>

        <form onSubmit={submit}>
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

          {/* Gizli alan: insanlar görmez, botlar doldurur. */}
          <div aria-hidden="true" style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}>
            <label htmlFor="gate-website">Web sitesi</label>
            <input
              id="gate-website"
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honey}
              onChange={(e) => setHoney(e.target.value)}
            />
          </div>

          {error && (
            <p className="turnstile-gate__error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="turnstile-gate__button">
            <span>Devam et</span>
            <span className="turnstile-gate__arrow" aria-hidden="true">↗</span>
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
