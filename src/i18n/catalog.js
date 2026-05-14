import en from "../locales/en.js";
import { DEFAULT_LOCALE } from "./config.js";

/** Register new locales here (same shape as `en.js`). */
export const catalogs = {
  en,
};

/**
 * Safe locale for lookups: non-strings, unknown codes, or empty env fall back to `en`.
 * @param {unknown} locale
 */
export function normalizeLocale(locale) {
  const s = typeof locale === "string" ? locale.trim() : "";
  if (s && catalogs[s]) return s;
  return DEFAULT_LOCALE;
}

/**
 * @param {unknown} locale
 * @returns {typeof en}
 */
export function getCatalog(locale) {
  return catalogs[normalizeLocale(locale)] || catalogs[DEFAULT_LOCALE];
}
