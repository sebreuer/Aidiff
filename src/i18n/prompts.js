import { getCatalog } from "./catalog.js";

/** @param {2 | 3} slotCount @param {string} [locale] */
export function buildDiffSystem(slotCount, locale) {
  const p = getCatalog(locale).prompts;
  return slotCount === 2 ? p.diffSystem2 : p.diffSystem3;
}

/** @param {string} [locale] */
export function metaSystemPrompt(locale) {
  return getCatalog(locale).prompts.metaSystem;
}
