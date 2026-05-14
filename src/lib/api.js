import { ANTHROPIC_MODEL_MAP, GOOGLE_MODEL_MAP } from "./modelMaps.js";

export async function readApiErrorDetail(res) {
  try {
    const text = await res.clone().text();
    if (!text) return "";
    try {
      const j = JSON.parse(text);
      if (j.error?.message) return String(j.error.message);
      if (typeof j.error === "string") return j.error;
      if (j.message) return String(j.message);
      if (j.error?.status) return String(j.error.status);
    } catch {
      return text.slice(0, 280).replace(/\s+/g, " ");
    }
  } catch {
    return "";
  }
  return "";
}

export async function throwIfApiError(res) {
  if (res.ok) return;
  const detail = (await readApiErrorDetail(res)).trim();
  let hint = "";
  if (res.status === 401 && /anthropic-dangerous-direct-browser-access|CORS requests must set/i.test(detail)) {
    hint = " (Vite proxy strips browser headers — restart `npm run dev`.)";
  } else if (res.status === 401) {
    hint = " (Check API key: valid, no stray spaces, .env loaded — restart dev server.)";
  } else if (res.status === 403) {
    hint = " (Google: enable Generative Language API; check billing / key restrictions.)";
  } else if (res.status === 429) {
    hint = " (Quota or rate limit — check provider billing/plan or wait briefly.)";
  } else if (res.status === 400 && /credit balance is too low/i.test(detail)) {
    hint = " (Anthropic: credits depleted — buy credits at console.anthropic.com → Plans & billing.)";
  } else if (res.status === 404 && /models\//i.test(detail)) {
    hint =
      /no longer available|deprecated|retired|not supported/i.test(detail)
        ? " (Model retired or unavailable for new users — pick another Gemini; Lite IDs may map to Flash.)"
        : " (Invalid model ID — pick another Gemini or refresh the catalog.)";
  }
  throw new Error(detail ? `HTTP ${res.status}: ${detail}${hint}` : `HTTP ${res.status}${hint}`);
}

export async function callAnthropicAPI(system, userPrompt, model = "claude-sonnet-4") {
  const t0 = Date.now();
  const resolvedModel = ANTHROPIC_MODEL_MAP[model] || model || ANTHROPIC_MODEL_MAP["claude-sonnet-4"];
  const res = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "anthropic-version": "2023-06-01" },
    body: JSON.stringify({
      model: resolvedModel,
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });
  await throwIfApiError(res);
  const data = await res.json();
  const text = data.content.map((b) => b.text || "").join("");
  const usage = data.usage || {};
  return {
    text,
    latencyMs: Date.now() - t0,
    inputTokens: usage.input_tokens || 0,
    outputTokens: usage.output_tokens || 0,
  };
}

export async function callOpenAIAPI(system, userPrompt, model = "gpt-4o") {
  const t0 = Date.now();
  const res = await fetch("/api/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model,
      ...(/^o\d/.test(model) || model.startsWith("gpt-5") ? {} : { temperature: 0.7 }),
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  await throwIfApiError(res);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || "";
  const usage = data.usage || {};
  return {
    text,
    latencyMs: Date.now() - t0,
    inputTokens: usage.prompt_tokens || 0,
    outputTokens: usage.completion_tokens || 0,
  };
}

export async function callGoogleAPI(system, userPrompt, model = "gemini-2.5-pro", genOpts = {}) {
  const t0 = Date.now();
  const modelId = GOOGLE_MODEL_MAP[model] || model || "gemini-2.0-flash";
  const maxOut = typeof genOpts.maxOutputTokens === "number" ? genOpts.maxOutputTokens : 1000;
  const temperature = typeof genOpts.temperature === "number" ? genOpts.temperature : 0.7;
  const res = await fetch(`/api/google/v1beta/models/${modelId}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: userPrompt }] }],
      generationConfig: { maxOutputTokens: maxOut, temperature },
    }),
  });
  await throwIfApiError(res);
  const data = await res.json();
  const text =
    data?.candidates?.[0]?.content?.parts?.map((p) => p?.text || "").join("") || "";
  const usage = data?.usageMetadata || {};
  return {
    text,
    latencyMs: Date.now() - t0,
    inputTokens: usage.promptTokenCount || 0,
    outputTokens: usage.candidatesTokenCount || 0,
  };
}
