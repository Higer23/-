import { useEffect, useRef, useState, type ReactNode } from "react";
import { CONFIG } from "../config";

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
      setError("Güvenlik kontrolü yapılandırılmamış. Site yöneticisinin ayarları düzeltmesi gerekiyor.");
      return;
    }

    let cancelled = false;

    const mount = () => {
      if (cancelled || !mountRef.current || !window.turnstile) return;

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
          setError("Cloudflare kontrolü yüklenemedi. Sayfayı yenileyip tekrar deneyin.");
        },
        "expired-callback": () => {
          setToken("");
          setError("Doğrulama süresi doldu. Lütfen robot kontrolünü yeniden tamamlayın.");
        },
      });
    };

    if (window.turnstile) {
      mount();
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[data-turnstile-api="true"]',
      );

      if (existing) {
        existing.addEventListener("load", mount, { once: true });
        existing.addEventListener(
          "error",
          () => setError("Cloudflare kontrolü yüklenemedi. İnternet bağlantınızı kontrol edin."),
          { once: true },
        );
      } else {
        const script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.dataset.turnstileApi = "true";
        script.addEventListener("load", mount, { once: true });
        script.addEventListener(
          "error",
          () => setError("Cloudflare kontrolü yüklenemedi. İnternet bağlantınızı kontrol edin."),
          { once: true },
        );
        document.head.appendChild(script);
      }
    }

    return () => {
      cancelled = true;
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
        body: JSON.stringify({ token }),
      });
      const data = (await response.json()) as { success?: boolean };

      if (!response.ok || data.success !== true) {
        throw new Error("Verification failed");
      }

      setVerified(true);
    } catch {
      setToken("");
      setError("Robot kontrolü doğrulanamadı. İnternet bağlantısını kontrol edip yeniden deneyin.");
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    } finally {
      setBusy(false);
    }
  };

  if (verified) return <>{children}</>;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#030407",
        color: "#f2eee5",
        fontFamily: "Inter, system-ui, sans-serif",
        padding: 24,
      }}
    >
      <section
        style={{
          width: "min(100%, 420px)",
          textAlign: "center",
          padding: 28,
          border: "1px solid #282a2e",
          borderRadius: 20,
          background: "#090a0d",
        }}
      >
        <p
          style={{
            color: "#e7a15c",
            letterSpacing: ".18em",
            fontSize: 11,
            textTransform: "uppercase",
          }}
        >
          HIGER23 · GÜVENLİK KONTROLÜ
        </p>
        <h1 style={{ fontSize: 26, margin: "12px 0" }}>Robot olmadığını doğrula</h1>
        <p style={{ color: "#a9a5bd", lineHeight: 1.6 }}>
          Siteye devam etmeden önce Cloudflare güvenlik kontrolünü tamamla.
        </p>

        <div
          ref={mountRef}
          style={{ display: "flex", justifyContent: "center", margin: "24px 0" }}
        />

        {busy && <p role="status">Doğrulama sunucusu kontrol ediliyor…</p>}
        {error && (
          <p role="alert" style={{ color: "#ffb3a7", lineHeight: 1.5 }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={continueToSite}
          disabled={!token || busy}
          style={{
            width: "100%",
            minHeight: 46,
            borderRadius: 12,
            border: "1px solid #e7a15c",
            background: token && !busy ? "#e7a15c" : "#29251f",
            color: token && !busy ? "#08090b" : "#a9a5bd",
            fontWeight: 700,
            cursor: token && !busy ? "pointer" : "not-allowed",
            marginTop: 8,
          }}
        >
          {busy ? "Kontrol ediliyor…" : "Doğrula ve siteye devam et"}
        </button>
      </section>
    </main>
  );
}
