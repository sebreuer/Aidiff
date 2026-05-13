import {
  PROVIDERS,
  SLOT_INDICES,
  MODEL_PRICING,
  AIDIFF_USE_MOCK,
} from "../constants/appConfig.js";

export function defaultModelOptions() {
  return Object.fromEntries(PROVIDERS.map((p) => [p.key, p.models.map((m) => ({ label: m.label, value: m.value }))]));
}

export function resolveModelLabel(providerKey, value, modelOptions) {
  const list = modelOptions[providerKey];
  if (!list) return value;
  return list.find((m) => m.value === value)?.label || value;
}

export function getProvider(providerKey) {
  return PROVIDERS.find((p) => p.key === providerKey) || PROVIDERS[0];
}

export function defaultCompareSlots() {
  if (AIDIFF_USE_MOCK) {
    return [
      { providerKey: "gemini", modelValue: "gemini-2.5-flash" },
      { providerKey: "gemini", modelValue: "gemini-2.5-flash-lite" },
      { providerKey: "gemini", modelValue: "gemini-3.1-flash-lite" },
    ];
  }
  return SLOT_INDICES.map((i) => ({
    providerKey: PROVIDERS[i].key,
    modelValue: PROVIDERS[i].models[0].value,
  }));
}

export function calcCost(mv, inp, out) {
  const p = MODEL_PRICING[mv];
  if (!p) return null;
  return (inp / 1e6) * p.input + (out / 1e6) * p.output;
}

export function buildUnifiedModelEntries(modelOptions) {
  const out = [];
  const order = { gpt: 0, claude: 1, gemini: 2 };
  for (const p of PROVIDERS) {
    const raw = modelOptions[p.key];
    const list = raw?.length ? raw : p.models.map((m) => ({ label: m.label, value: m.value }));
    for (const m of list) {
      out.push({
        providerKey: p.key,
        value: m.value,
        label: m.label,
        dot: p.dot,
        sub: p.sub,
      });
    }
  }
  out.sort((a, b) => order[a.providerKey] - order[b.providerKey] || a.label.localeCompare(b.label, undefined, { sensitivity: "base" }));
  return out;
}

export function compactAlphanumeric(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function matchesModelSearchQuery(query, label, value) {
  const raw = query.trim();
  if (!raw) return true;
  const ql = raw.toLowerCase();
  const l = label.toLowerCase();
  const v = value.toLowerCase();
  if (l.includes(ql) || v.includes(ql)) return true;
  const hay = compactAlphanumeric(`${label} ${value}`);
  const fullCompact = compactAlphanumeric(raw);
  if (fullCompact.length >= 2 && hay.includes(fullCompact)) return true;
  const tokens = raw
    .toLowerCase()
    .split(/\s+/)
    .map((t) => compactAlphanumeric(t))
    .filter((t) => t.length > 0);
  if (tokens.length > 1) return tokens.every((t) => hay.includes(t));
  if (tokens.length === 1) return hay.includes(tokens[0]);
  return false;
}

export function shortenModelHeadline(label, max = 28) {
  const s = String(label || "").trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}
