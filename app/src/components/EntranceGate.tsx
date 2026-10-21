import { useEffect, useRef, useState, type ReactNode } from "react";
import { CONFIG } from "../config";
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
  const mountRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const [verified, setVerified] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!CONFIG.turnstileSiteKey || !CONFIG.turnstileVerifyUrl || !mountRef.current) {
      setError("Güvenlik kontrolü yapılandırılmamış. Lütfen site yöneticisine haber ver.");
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
            setError("Cloudflare kontrolü yüklenemedi. Bağlantını kontrol edip tekrar dene.");
          },
          "expired-callback": () => {
            setToken("");
            setError("Doğrulamanın süresi doldu. Lütfen robot kontrolünü yeniden tamamla.");
          },
        });
      } catch {
        setError("Güvenlik kontrolü başlatılamadı. Sayfayı yenileyip tekrar dene.");
      }
    };

    const onScriptError = () => {
      setError("Cloudflare kontrolü yüklenemedi. İnternet bağlantını kontrol edip tekrar dene.");
    };

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
      setError("Doğrulama tamamlanamadı. Bağlantını kontrol edip tekrar dene.");
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
      <div className="turnstile-gate__glow turnstile-gate__glow--orange" aria-hidden="true" />
      <div className="turnstile-gate__glow turnstile-gate__glow--cream" aria-hidden="true" />

      <section className="turnstile-gate__card" aria-labelledby="turnstile-title">
        <div className="turnstile-gate__mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 3.25 19 6v5.1c0 4.4-2.85 7.75-7 9.65-4.15-1.9-7-5.25-7-9.65V6l7-2.75Z" />
            <path d="m8.8 12.1 2.1 2.1 4.45-4.6" />
          </svg>
        </div>

        <p className="turnstile-gate__eyebrow">HIGER23 <span>·</span> GÜVENLİ ERİŞİM</p>
        <h1 id="turnstile-title" className="turnstile-gate__title">
          Bir saniyelik kontrol.
        </h1>
        <p className="turnstile-gate__description">
          Devam etmeden önce robot olmadığını doğrula. Gizlilik kontrolü Cloudflare tarafından sağlanır.
        </p>

        <div className="turnstile-gate__widget" ref={mountRef} aria-label="Cloudflare robot doğrulaması" />

        <p className="turnstile-gate__hint" aria-live="polite">
          {busy ? "Güvenlik kontrolü doğrulanıyor…" : token ? "Kontrol tamamlandı. Devam etmek için aşağıya dokun." : "Kontrolü tamamladıktan sonra devam edebilirsin."}
        </p>

        {error && <p className="turnstile-gate__error" role="alert">{error}</p>}

        <button
          type="button"
          className="turnstile-gate__button"
          onClick={continueToSite}
          disabled={!token || busy}
        >
          <span>{busy ? "Kontrol ediliyor…" : "Doğrula ve siteye devam et"}</span>
          {!busy && <span className="turnstile-gate__arrow" aria-hidden="true">↗</span>}
        </button>

        <p className="turnstile-gate__footer">
          <span className="turnstile-gate__dot" />
          Bağlantı korumalı <span className="turnstile-gate__separator">/</span> HIGER23
        </p>
      </section>
      <p className="turnstile-gate__bottom">GÜVENLİ ERİŞİM <span>•</span> CLOUDFLARE TURNSTILE</p>
    </main>
  );
}
