import { defaultModelOptions } from "./modelUtils.js";

export const MODEL_CATALOG_STORAGE_KEY = "aidiff_model_catalog_v1";
export const MODEL_CATALOG_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function readModelCatalogFromStorage() {
  try {
    const raw = localStorage.getItem(MODEL_CATALOG_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1 || typeof parsed.fetchedAt !== "number" || !parsed?.options) return null;
    const o = parsed.options;
    if (!Array.isArray(o.gpt) || !Array.isArray(o.claude) || !Array.isArray(o.gemini)) return null;
    return {
      fetchedAt: parsed.fetchedAt,
      options: {
        gpt: o.gpt.filter((x) => x && typeof x.value === "string"),
        claude: o.claude.filter((x) => x && typeof x.value === "string"),
        gemini: o.gemini.filter((x) => x && typeof x.value === "string"),
      },
      fromApi: parsed.fromApi && typeof parsed.fromApi === "object" ? parsed.fromApi : { gpt: false, claude: false, gemini: false },
    };
  } catch {
    return null;
  }
}

export function writeModelCatalogToStorage({ fetchedAt, options, fromApi }) {
  try {
    localStorage.setItem(
      MODEL_CATALOG_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        fetchedAt,
        options,
        fromApi,
      })
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function isCatalogFresh(fetchedAt) {
  return Date.now() - fetchedAt < MODEL_CATALOG_MAX_AGE_MS;
}

/** Pro gespeichertem Katalog-`fetchedAt` höchstens einmaliger Netzwerk-Refresh bei Modell-/Listen-Fehler (keine Loop). */
export const CATALOG_STALE_RETRY_STORAGE_KEY = "aidiff_catalog_stale_retry_once_v1";

export function catalogStaleRetryStorageKey(fetchedAt) {
  return fetchedAt == null ? "__none__" : String(fetchedAt);
}

export function readCatalogStaleRetryMap() {
  try {
    const raw = localStorage.getItem(CATALOG_STALE_RETRY_STORAGE_KEY);
    if (!raw) return {};
    const j = JSON.parse(raw);
    if (!j || j.version !== 1 || typeof j.retried !== "object" || j.retried === null) return {};
    return j.retried;
  } catch {
    return {};
  }
}

export function hasAlreadyStaleCatalogRetried(fetchedAt) {
  return readCatalogStaleRetryMap()[catalogStaleRetryStorageKey(fetchedAt)] === true;
}

export function markStaleCatalogRetried(fetchedAt) {
  const retried = { ...readCatalogStaleRetryMap(), [catalogStaleRetryStorageKey(fetchedAt)]: true };
  try {
    localStorage.setItem(CATALOG_STALE_RETRY_STORAGE_KEY, JSON.stringify({ version: 1, retried }));
  } catch {
    /* ignore */
  }
}

/** True, wenn ein frischer Modellkatalog das Problem plausibel beheben könnte (nicht Quota/Auth). */
export function errorSuggestsStaleModelCatalog(message) {
  if (!message || typeof message !== "string") return false;
  const m = message;
  if (/Modell nicht in der geladenen Liste/.test(m)) return true;
  if (/HTTP 429\b/i.test(m)) return false;
  if (/HTTP 401\b/i.test(m)) return false;
  if (/credit balance is too low/i.test(m)) return false;
  if (/exceeded your current quota|Quota exceeded|rate.?limit/i.test(m)) return false;
  if (/HTTP 404\b/.test(m)) return true;
  if (/invalid_model|model_not_found|does not exist or you do not have access/i.test(m)) return true;
  if (/is not found for API version|not supported for generateContent/i.test(m)) return true;
  return false;
}

export function isOpenAIChatLikeModelId(id) {
  if (typeof id !== "string") return false;
  if (
    id.includes("embedding") ||
    id.includes("tts") ||
    id.includes("whisper") ||
    id.includes("dall-e") ||
    id.includes("moderation") ||
    id.includes("realtime") ||
    id.includes("audio") ||
    id.includes("transcribe")
  )
    return false;
  return id.startsWith("gpt-") || /^o\d/.test(id) || id.startsWith("chatgpt-") || id.startsWith("ft:");
}

/** Einmal beim App-Start: Modelllisten von den APIs holen und als Dropdown-Optionen speichern. */
export async function fetchAvailableModelOptions() {
  const fallback = defaultModelOptions();

  const [openai, anthropic, google] = await Promise.allSettled([
    fetch("/api/openai/v1/models").then(async (r) => {
      if (!r.ok) throw new Error(`openai:${r.status}`);
      const d = await r.json();
      const ids = (d?.data || []).map((m) => m.id).filter(isOpenAIChatLikeModelId);
      const uniq = [...new Set(ids)].sort();
      return uniq.map((value) => ({ label: value, value }));
    }),
    fetch("/api/anthropic/v1/models", {
      headers: { "anthropic-version": "2023-06-01" },
    }).then(async (r) => {
      if (!r.ok) throw new Error(`anthropic:${r.status}`);
      const d = await r.json();
      const ids = (d?.data || []).map((m) => m.id).filter((id) => typeof id === "string" && id.includes("claude"));
      const uniq = [...new Set(ids)].sort();
      return uniq.map((value) => ({ label: value, value }));
    }),
    fetch("/api/google/v1beta/models").then(async (r) => {
      if (!r.ok) throw new Error(`google:${r.status}`);
      const d = await r.json();
      const rows = (d?.models || [])
        .filter((m) => {
          const methods = m.supportedGenerationMethods || [];
          return methods.includes("generateContent");
        })
        .map((m) => (m.name || "").replace(/^models\//, ""))
        .filter(Boolean);
      const uniq = [...new Set(rows)].sort();
      return uniq.map((value) => ({ label: value, value }));
    }),
  ]);

  const options = { ...fallback };
  if (openai.status === "fulfilled" && openai.value.length) options.gpt = openai.value;
  if (anthropic.status === "fulfilled" && anthropic.value.length) options.claude = anthropic.value;
  if (google.status === "fulfilled" && google.value.length) options.gemini = google.value;

  const fromApi = {
    gpt: openai.status === "fulfilled" && openai.value.length > 0,
    claude: anthropic.status === "fulfilled" && anthropic.value.length > 0,
    gemini: google.status === "fulfilled" && google.value.length > 0,
  };

  return { options, fromApi };
}

/** Netzwerk + Speichern in localStorage (immer neue `fetchedAt`). */
export async function fetchPersistModelCatalog() {
  const { options, fromApi } = await fetchAvailableModelOptions();
  const fetchedAt = Date.now();
  writeModelCatalogToStorage({ fetchedAt, options, fromApi });
  return { options, fromApi, fetchedAt };
}
