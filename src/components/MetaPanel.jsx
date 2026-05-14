import { useEffect, useState } from "react";
import { metaSystemPrompt } from "../i18n/prompts.js";
import { callAnthropicAPI } from "../lib/api.js";
import { calcCost, defaultCompareSlots, getActiveSlotIndices, resolveModelLabel } from "../lib/modelUtils.js";
import { renderText } from "../lib/textMarkdown.jsx";
import { useI18n } from "../i18n/I18nContext.jsx";
import { Dots } from "./Dots.jsx";

export function MetaPanel({ runs, onClose, modelOptions }) {
  const { t, locale } = useI18n();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prompt = runs
      .map((r, i) => {
        const slots = r.slots || defaultCompareSlots();
        const idx = getActiveSlotIndices(r);
        const answers = idx
          .map((j) => {
            const sl = slots[j];
            const label = resolveModelLabel(sl.providerKey, sl.modelValue, modelOptions);
            return `${label}:\n${r.results[j] || t("meta.noAnswer")}`;
          })
          .join("\n\n");
        return `${t("meta.runHeader", { n: i + 1, prompt: r.prompt })}\n${answers}`;
      })
      .join("\n\n");
    const perfParts = [];
    for (let j = 0; j < 3; j++) {
      const relevant = runs.filter((r) => getActiveSlotIndices(r).includes(j));
      if (!relevant.length) continue;
      const avgLat = relevant.map((r) => r.metas[j]?.latencyMs || 0).reduce((a, b) => a + b, 0) / relevant.length;
      const avgCost =
        relevant
          .map((r) => {
            const meta = r.metas[j];
            const sl = (r.slots || defaultCompareSlots())[j];
            if (!meta || !sl) return 0;
            return calcCost(sl.modelValue, meta.inputTokens, meta.outputTokens) || 0;
          })
          .reduce((a, b) => a + b, 0) / relevant.length;
      perfParts.push(
        t("meta.perfColumn", {
          n: j + 1,
          latencySec: (avgLat / 1000).toFixed(2),
          avgCost: avgCost.toFixed(4),
        })
      );
    }
    const perfSummary = perfParts.join(" | ");
    const system = metaSystemPrompt(locale);
    const userBody = `${prompt}\n\n${t("meta.perfSection")}\n${perfSummary}`;
    callAnthropicAPI(system, userBody, "claude-sonnet-4")
      .then((r) => {
        setText(r.text);
        setLoading(false);
      })
      .catch(() => {
        setText(t("meta.error"));
        setLoading(false);
      });
  }, [runs, modelOptions, locale, t]);

  return (
    <div className="aidiff-liquid-glass aidiff-liquid-glass--clip" style={{ animation: "fadeIn 0.2s ease" }}>
      <div className="aidiff-glass-inner-header" style={{ padding: "11px 16px", display: "flex", alignItems: "center", gap: 8 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--t2)" }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--t2)", flex: 1 }}>{t("meta.title", { count: runs.length })}</span>
        <button
          type="button"
          onClick={onClose}
          className="aidiff-glass-control aidiff-glass-control--icon"
          aria-label={t("meta.close")}
          style={{ margin: -4 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div style={{ padding: "16px 18px", fontSize: 13, lineHeight: 1.85, color: "var(--text)" }}>{loading ? <Dots /> : renderText(text)}</div>
    </div>
  );
}
