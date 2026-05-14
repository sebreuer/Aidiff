import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getCatalog, normalizeLocale } from "./catalog.js";
import { getByPath, interpolate } from "./format.js";

const I18nContext = createContext(null);

/**
 * @typedef {object} I18nValue
 * @property {string} locale
 * @property {(l: string) => void} setLocale
 * @property {(path: string, vars?: Record<string, string | number>) => string} t
 * @property {object} catalog
 */

/** @param {{ children: import('react').ReactNode, initialLocale?: string }} props */
export function I18nProvider({ children, initialLocale }) {
  const fromEnv = typeof import.meta !== "undefined" ? import.meta.env?.VITE_AIDIFF_LOCALE : undefined;
  const [locale, setLocaleRaw] = useState(() =>
    normalizeLocale(initialLocale !== undefined && initialLocale !== null ? initialLocale : fromEnv)
  );
  const setLocale = useCallback((next) => {
    setLocaleRaw(normalizeLocale(next));
  }, []);
  const catalog = useMemo(() => getCatalog(locale), [locale]);

  const value = useMemo(() => {
    /** @type {(path: string, vars?: Record<string, string | number>) => string} */
    const t = (path, vars) => {
      const raw = getByPath(catalog.messages, path);
      if (raw == null) return path;
      if (typeof raw === "string") return interpolate(raw, vars);
      return String(raw);
    };
    return { locale, setLocale, t, catalog };
  }, [locale, catalog, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/** @returns {I18nValue} */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
