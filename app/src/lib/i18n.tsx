import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Dict, Key } from "./locales/types";
import tr from "./locales/tr";
import en from "./locales/en";
import de from "./locales/de";
import ar from "./locales/ar";
import zh from "./locales/zh";
import fr from "./locales/fr";
import es from "./locales/es";
import it from "./locales/it";
import pt from "./locales/pt";
import ru from "./locales/ru";
import ja from "./locales/ja";
import nl from "./locales/nl";
import pl from "./locales/pl";
import uk from "./locales/uk";
import ko from "./locales/ko";
import hi from "./locales/hi";
import sv from "./locales/sv";
import id from "./locales/id";
import vi from "./locales/vi";
import el from "./locales/el";
import cs from "./locales/cs";

export const LANGS = [
  { code: "tr", label: "Türkçe" },
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "ar", label: "العربية" },
  { code: "zh", label: "中文" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "it", label: "Italiano" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "ja", label: "日本語" },
  { code: "nl", label: "Nederlands" },
  { code: "pl", label: "Polski" },
  { code: "uk", label: "Українська" },
  { code: "ko", label: "한국어" },
  { code: "hi", label: "हिन्दी" },
  { code: "sv", label: "Svenska" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "el", label: "Ελληνικά" },
  { code: "cs", label: "Čeština" },
] as const;

export type Lang = (typeof LANGS)[number]["code"];
export type { Key };

const STORAGE_KEY = "higer23-lang";
const isLang = (v: string): v is Lang => LANGS.some((l) => l.code === v);

const dicts: Record<Lang, Dict> = {
  tr, en, de, ar, zh, fr, es, it, pt, ru, ja, nl, pl, uk, ko, hi, sv, id, vi, el, cs,
};

// Bölgeye özel yerel biçimler (sayılar ve tarihler için)
const LOCALE: Record<Lang, string> = {
  tr: "tr-TR", en: "en-US", de: "de-DE", ar: "ar", zh: "zh-CN", fr: "fr-FR",
  es: "es-ES", it: "it-IT", pt: "pt-BR", ru: "ru-RU", ja: "ja-JP",
  nl: "nl-NL", pl: "pl-PL", uk: "uk-UA", ko: "ko-KR", hi: "hi-IN",
  sv: "sv-SE", id: "id-ID", vi: "vi-VN", el: "el-GR", cs: "cs-CZ",
};

function detectLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (fromUrl && isLang(fromUrl)) return fromUrl;
  } catch {
    /* URL okunamazsa diğer kaynaklara geç */
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isLang(saved)) return saved;
  } catch {
    /* depolama engelliyse tarayıcı dilini kullan */
  }
  const prefs = navigator.languages?.length ? [...navigator.languages] : [navigator.language];
  for (const p of prefs) {
    const base = p.toLowerCase().split("-")[0];
    if (isLang(base)) return base;
  }
  return "en";
}

type Vars = Record<string, string | number>;
type Ctx = { lang: Lang; locale: string; setLang: (l: Lang) => void; t: (k: Key, vars?: Vars) => string };
const I18nContext = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }, [lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* kayıt yapılamazsa sadece oturum boyunca geçerli */
    }
  }, []);

  const t = useCallback(
    (k: Key, vars?: Vars) => {
      let s: string = dicts[lang][k];
      if (vars) for (const [name, v] of Object.entries(vars)) s = s.replace(`{${name}}`, String(v));
      return s;
    },
    [lang],
  );

  const value = useMemo(() => ({ lang, locale: LOCALE[lang], setLang, t }), [lang, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
