import { useEffect, useState } from "react";
import { META_SYSTEM } from "../constants/appConfig.js";
import { callAnthropicAPI } from "../lib/api.js";
import { calcCost, defaultCompareSlots, getActiveSlotIndices, resolveModelLabel } from "../lib/modelUtils.js";
import { renderText } from "../lib/textMarkdown.jsx";
import { SHADOWS } from "../theme/tokens.js";
import { Dots } from "./Dots.jsx";

export function MetaPanel({ runs, isDark, onClose, modelOptions }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const shadows = isDark ? SHADOWS.dark : SHADOWS.light;

  useEffect(() => {
    const prompt = runs
      .map((r, i) => {
        const slots = r.slots || defaultCompareSlots();
        const idx = getActiveSlotIndices(r);
        const answers = idx
          .map((j) => {
            const sl = slots[j];
            const label = resolveModelLabel(sl.providerKey, sl.modelValue, modelOptions);
            return `${label}:\n${r.results[j] || "(keine Antwort)"}`;
          })
          .join("\n\n");
        return `--- Run ${i + 1}: "${r.prompt}" ---\n${answers}`;
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
      perfParts.push(`Spalte ${j + 1} (nur Runs mit dieser Spalte): Ø ${(avgLat / 1000).toFixed(2)}s, Ø $${avgCost.toFixed(4)}/Anfrage`);
    }
    const perfSummary = perfParts.join(" | ");
    callAnthropicAPI(META_SYSTEM, `${prompt}\n\nPerformance:\n${perfSummary}`, "claude-sonnet-4")
      .then((r) => {
        setText(r.text);
        setLoading(false);
      })
      .catch(() => {
        setText("Fehler.");
        setLoading(false);
      });
  }, [runs, modelOptions]);

  return (
    <div style={{ background: "var(--bg)", borderRadius: 20, boxShadow: shadows.focus, border: "1px solid transparent", overflow: "hidden", animation: "fadeIn 0.2s ease" }}>
      <div style={{ padding: "11px 16px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8, background: "var(--bg2)" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--t2)" }}>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--t2)", flex: 1 }}>Meta-Analyse — {runs.length} Runs</span>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--t3)", display: "flex", alignItems: "center", padding: 4 }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t3)")}
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
