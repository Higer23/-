import { useEffect, useRef, useState, type ReactNode } from "react";
import { CONFIG } from "../config";
import { useI18n, type Key } from "../lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import "./entrance-gate.css";

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      theme: "dark";
      appearance: "always";
      size: "normal";
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
    },
  ) => string;
  remove: (id: string) => void;
  reset: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export default function EntranceGate({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const mountRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const [verified, setVerified] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState<Key | "">("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!CONFIG.turnstileSiteKey || !CONFIG.turnstileVerifyUrl || !mountRef.current) {
      setError("gate.config");
      return;
    }

    let cancelled = false;
    let script: HTMLScriptElement | null = null;

    const mount = () => {
      if (cancelled || !mountRef.current || !window.turnstile || widgetIdRef.current) return;

      try {
        widgetIdRef.current = window.turnstile.render(mountRef.current, {
          sitekey: CONFIG.turnstileSiteKey,
          theme: "dark",
          appearance: "always",
          size: "normal",
          callback: (nextToken) => {
            setToken(nextToken);
            setError("");
          },
          "error-callback": () => {
            setToken("");
            setError("gate.loadFail");
          },
          "expired-callback": () => {
            setToken("");
            setError("gate.expired");
          },
        });
      } catch {
        setError("gate.initFail");
      }
    };

    const onScriptError = () => setError("gate.loadFailNet");

    if (window.turnstile) {
      mount();
    } else {
      script = document.querySelector<HTMLScriptElement>('script[data-turnstile-api="true"]');

      if (script) {
        script.addEventListener("load", mount, { once: true });
        script.addEventListener("error", onScriptError, { once: true });
      } else {
        script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.turnstileApi = "true";
        script.addEventListener("load", mount, { once: true });
        script.addEventListener("error", onScriptError, { once: true });
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
      if (script) {
        script.removeEventListener("load", mount);
        script.removeEventListener("error", onScriptError);
      }
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = undefined;
      }
    };
  }, []);

  const continueToSite = async () => {
    if (!token || busy) return;

    setBusy(true);
    setError("");

    try {
      const response = await fetch(CONFIG.turnstileVerifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ token }),
        signal: AbortSignal.timeout(CONFIG.requestTimeoutMs),
      });

      const data = (await response.json()) as { success?: boolean };
      if (!response.ok || data.success !== true) {
        throw new Error("Verification failed");
      }

      setVerified(true);
    } catch {
      setToken("");
      setError("gate.verifyFail");
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    } finally {
      setBusy(false);
    }
  };

  if (verified) return <>{children}</>;

  return (
    <main className="turnstile-gate">
      <div className="gate-lang">
        <LanguageSwitcher />
      </div>
      <div className="turnstile-gate__glow turnstile-gate__glow--orange" aria-hidden="true" />
      <div className="turnstile-gate__glow turnstile-gate__glow--cream" aria-hidden="true" />

      <section className="turnstile-gate__card" aria-labelledby="turnstile-title">
        <div className="turnstile-gate__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3.25 19 6v5.1c0 4.4-2.85 7.75-7 9.65-4.15-1.9-7-5.25-7-9.65V6l7-2.75Z" />
            <path d="m8.8 12.1 2.1 2.1 4.45-4.6" />
          </svg>
        </div>

        <p className="turnstile-gate__eyebrow">{t("gate.eyebrow")}</p>
        <h1 id="turnstile-title" className="turnstile-gate__title">
          {t("gate.title")}
        </h1>
        <p className="turnstile-gate__description">{t("gate.desc")}</p>

        <div className="turnstile-gate__widget" ref={mountRef} aria-label={t("gate.widget")} />

        <p className="turnstile-gate__hint" aria-live="polite">
          {busy ? t("gate.hintBusy") : token ? t("gate.hintDone") : t("gate.hintTodo")}
        </p>

        {error && (
          <p className="turnstile-gate__error" role="alert">
            {t(error)}
          </p>
        )}

        <button type="button" className="turnstile-gate__button" onClick={continueToSite} disabled={!token || busy}>
          <span>{busy ? t("gate.submitBusy") : t("gate.submit")}</span>
          {!busy && <span className="turnstile-gate__arrow" aria-hidden="true">↗</span>}
        </button>

        <p className="turnstile-gate__footer">
          <span className="turnstile-gate__dot" />
          {t("gate.footer")} <span className="turnstile-gate__separator">/</span> HIGER23
        </p>
      </section>
      <p className="turnstile-gate__bottom">{t("gate.bottom")}</p>
    </main>
  );
}
