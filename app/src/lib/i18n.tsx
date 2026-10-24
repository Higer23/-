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
import he from "./locales/he";
import th from "./locales/th";
import ro from "./locales/ro";
import hu from "./locales/hu";
import da from "./locales/da";
import bn from "./locales/bn";
import ur from "./locales/ur";
import fa from "./locales/fa";
import ms from "./locales/ms";
import ta from "./locales/ta";
import te from "./locales/te";
import mr from "./locales/mr";
import sw from "./locales/sw";

// Dil listesi: her dil için görünen ad ve yazım yönü (rtl/ltr) burada tanımlanır.
export const LANGS = [
  { code: "tr", label: "Türkçe", dir: "ltr" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "de", label: "Deutsch", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "zh", label: "中文", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "it", label: "Italiano", dir: "ltr" },
  { code: "pt", label: "Português", dir: "ltr" },
  { code: "ru", label: "Русский", dir: "ltr" },
  { code: "ja", label: "日本語", dir: "ltr" },
  { code: "nl", label: "Nederlands", dir: "ltr" },
  { code: "pl", label: "Polski", dir: "ltr" },
  { code: "uk", label: "Українська", dir: "ltr" },
  { code: "ko", label: "한국어", dir: "ltr" },
  { code: "hi", label: "हिन्दी", dir: "ltr" },
  { code: "sv", label: "Svenska", dir: "ltr" },
  { code: "id", label: "Bahasa Indonesia", dir: "ltr" },
  { code: "vi", label: "Tiếng Việt", dir: "ltr" },
  { code: "el", label: "Ελληνικά", dir: "ltr" },
  { code: "cs", label: "Čeština", dir: "ltr" },
  { code: "he", label: "עברית", dir: "rtl" },
  { code: "th", label: "ไทย", dir: "ltr" },
  { code: "ro", label: "Română", dir: "ltr" },
  { code: "hu", label: "Magyar", dir: "ltr" },
  { code: "da", label: "Dansk", dir: "ltr" },
  { code: "bn", label: "বাংলা", dir: "ltr" },
  { code: "ur", label: "اردو", dir: "rtl" },
  { code: "fa", label: "فارسی", dir: "rtl" },
  { code: "ms", label: "Bahasa Melayu", dir: "ltr" },
  { code: "ta", label: "தமிழ்", dir: "ltr" },
  { code: "te", label: "తెలుగు", dir: "ltr" },
  { code: "mr", label: "मराठी", dir: "ltr" },
  { code: "sw", label: "Kiswahili", dir: "ltr" },
] as const;

export type Lang = (typeof LANGS)[number]["code"];
export type { Key };

const STORAGE_KEY = "higer23-lang";
const isLang = (v: string): v is Lang => LANGS.some((l) => l.code === v);

const dicts: Record<Lang, Dict> = {
  tr, en, de, ar, zh, fr, es, it, pt, ru, ja, nl, pl, uk, ko, hi, sv, id, vi, el, cs, he, th, ro, hu, da, bn, ur, fa, ms, ta, te, mr, sw,
};

// Sayı ve tarih biçimleri için yerel ayarlar
const LOCALE: Record<Lang, string> = {
  tr: "tr-TR",
  en: "en-US",
  de: "de-DE",
  ar: "ar",
  zh: "zh-CN",
  fr: "fr-FR",
  es: "es-ES",
  it: "it-IT",
  pt: "pt-BR",
  ru: "ru-RU",
  ja: "ja-JP",
  nl: "nl-NL",
  pl: "pl-PL",
  uk: "uk-UA",
  ko: "ko-KR",
  hi: "hi-IN",
  sv: "sv-SE",
  id: "id-ID",
  vi: "vi-VN",
  el: "el-GR",
  cs: "cs-CZ",
  he: "he-IL",
  th: "th-TH",
  ro: "ro-RO",
  hu: "hu-HU",
  da: "da-DK",
  bn: "bn-BD",
  ur: "ur-PK",
  fa: "fa-IR",
  ms: "ms-MY",
  ta: "ta-IN",
  te: "te-IN",
  mr: "mr-IN",
  sw: "sw-KE",
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
    const meta = LANGS.find((l) => l.code === lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = meta?.dir ?? "ltr";
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
