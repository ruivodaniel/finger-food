import { enTranslations } from "@configs/i18n";
import { PREFERENCES } from "@configs/product";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: enTranslations,
  },
} as const;

/**
 * Supported locales and default come from `@configs/product` (the single
 * source of truth). Resources that ship today (only `en`) are what
 * i18next will actually render — unsupported locales fall back to
 * `PREFERENCES.locale.default` automatically.
 *
 * When `PREFERENCES.locale.supported === "all"`, `supportedLngs` is
 * omitted so i18next accepts every BCP 47 code. Otherwise the tuple
 * narrows acceptance to the product's approved list.
 */
// Widened so the comparison type-checks whichever form the config takes
// (as-const narrows it to the one literal it holds today).
const supportedLocales: readonly string[] | "all" = PREFERENCES.locale.supported;
const supportedLngs = supportedLocales === "all" ? undefined : [...supportedLocales];

i18n.use(initReactI18next).init({
  resources,
  lng: PREFERENCES.locale.default,
  fallbackLng: PREFERENCES.locale.default,
  supportedLngs,
  interpolation: {
    escapeValue: false,
  },
  saveMissing: true,
  saveMissingTo: "all",
  missingKeyHandler: () => {
    // UNCOMMENT THIS TO LOG MISSING TRANSLATIONS IN BROWSER CONSOLE
    // console.log(
    //   `Missing translation - Language: ${_lng}, Namespace: ${_ns}, Key: ${_key}`,
    // );
  },
});

export default i18n;
