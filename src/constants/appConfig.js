export const MODEL_PRICING = {
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  o1: { input: 15.0, output: 60.0 },
  "o3-mini": { input: 1.1, output: 4.4 },
  "claude-3-5-sonnet": { input: 3.0, output: 15.0 },
  "claude-3-5-haiku": { input: 0.8, output: 4.0 },
  "claude-3-opus": { input: 15.0, output: 75.0 },
  "claude-sonnet-4": { input: 3.0, output: 15.0 },
  "gemini-1.5-pro": { input: 1.25, output: 5.0 },
  "gemini-1.5-flash": { input: 0.075, output: 0.3 },
  "gemini-2.0-flash": { input: 0.1, output: 0.4 },
  "gemini-2.0-flash-lite": { input: 0.075, output: 0.3 },
  "gemini-2.5-flash": { input: 0.15, output: 0.6 },
  "gemini-2.5-flash-lite": { input: 0.1, output: 0.4 },
  "gemini-3.1-flash-lite": { input: 0.1, output: 0.4 },
  "gemini-2.5-pro": { input: 1.25, output: 10.0 },
};

export const SLOT_INDICES = [0, 1, 2];

export const PROVIDERS = [
  {
    key: "gpt",
    dot: "#10a37f",
    sub: "OpenAI",
    models: [
      { label: "GPT-4o", value: "gpt-4o" },
      { label: "GPT-4o mini", value: "gpt-4o-mini" },
      { label: "o1", value: "o1" },
      { label: "o3 mini", value: "o3-mini" },
    ],
    system: (m) =>
      `You are ${m} by OpenAI. Simulate this model's response style: structured, clear, often using bullet points, direct. Reply in the same language as the user. Never mention you are a simulation.`,
  },
  {
    key: "claude",
    dot: "#D97057",
    sub: "Anthropic",
    models: [
      { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet" },
      { label: "Claude 3.5 Haiku", value: "claude-3-5-haiku" },
      { label: "Claude 3 Opus", value: "claude-3-opus" },
      { label: "Claude Sonnet 4", value: "claude-sonnet-4" },
    ],
    system: (m) =>
      `You are ${m} by Anthropic. Reply in your typical style: nuanced, reflective, explain connections, acknowledge uncertainty. Reply in the same language as the user.`,
  },
  {
    key: "gemini",
    dot: "#4285F4",
    sub: "Google",
    models: [
      { label: "Gemini 2.5 Flash", value: "gemini-2.5-flash" },
      { label: "Gemini 2.5 Flash Lite", value: "gemini-2.5-flash-lite" },
      { label: "Gemini 3.1 Flash Lite", value: "gemini-3.1-flash-lite" },
      { label: "Gemini 2.5 Pro", value: "gemini-2.5-pro" },
      { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
      { label: "Gemini 1.5 Pro (Legacy-ID)", value: "gemini-1.5-pro" },
      { label: "Gemini 1.5 Flash (Legacy-ID)", value: "gemini-1.5-flash" },
    ],
    system: (m) =>
      `You are ${m} by Google. Simulate this model's style: fact-oriented, structured, broad knowledge. Reply in the same language as the user. Never mention you are a simulation.`,
  },
];

export const DIFF_ANALYSIS_MODEL = "gemini-2.5-flash";

/** Tab keys only — labels from i18n `tabs.{key}`. */
export const TAB_KEYS = [
  { key: "results" },
  { key: "diff" },
  { key: "perf" },
];

export const SETTINGS_PROVIDER_ORDER = ["claude", "gemini", "gpt"];

export const BRAND_LOGO_SRC = "/logoaidiff.png";
