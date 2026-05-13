import { useState } from "react";
import { DIFF_ANALYSIS_MODEL, SLOT_INDICES } from "../constants/appConfig.js";
import { calcCost, defaultCompareSlots, getProvider, resolveModelLabel } from "../lib/modelUtils.js";
import { renderText } from "../lib/textMarkdown.jsx";
import { SHADOWS } from "../theme/tokens.js";
import { ComposerStyleIconButton } from "./ComposerStyleIconButton.jsx";
import { DiffUnterschiedeBody } from "./DiffUnterschiedeBody.jsx";
import { Dots } from "./Dots.jsx";
import { PerfMetric } from "./PerfMetric.jsx";
import { TabBar } from "./TabBar.jsx";

export function RunEntry({ run, isDark, modelOptions, onCollapse }) {
  const [activeTab, setActiveTab] = useState("results");
  const shadows = isDark ? SHADOWS.dark : SHADOWS.light;
  const diffReady = !!run.diff || run.diffLoading;
  const slots = run.slots || defaultCompareSlots();
  const perfReady = SLOT_INDICES.every((i) => run.metas[i]);

  const perfData = SLOT_INDICES.map((i) => {
    const slot = slots[i] || { providerKey: "gpt", modelValue: "" };
    const meta = run.metas[i];
    if (!meta) return null;
    const pv = getProvider(slot.providerKey);
    const cost = calcCost(slot.modelValue, meta.inputTokens, meta.outputTokens);
    const tps = meta.latencyMs > 0 ? meta.outputTokens / (meta.latencyMs / 1000) : 0;
    return {
      idx: i,
      dot: pv.dot,
      sub: pv.sub,
      latencyMs: meta.latencyMs,
      outputTokens: meta.outputTokens,
      cost,
      tps,
      ratio: meta.inputTokens > 0 ? meta.outputTokens / meta.inputTokens : 0,
      title: resolveModelLabel(slot.providerKey, slot.modelValue, modelOptions),
    };
  });
  const valid = perfData.filter(Boolean);
  const bestLatency = valid.length ? Math.min(...valid.map((d) => d.latencyMs)) : null;
  const bestCost = valid.length ? Math.min(...valid.filter((d) => d.cost !== null).map((d) => d.cost)) : null;
  const bestTps = valid.length ? Math.max(...valid.map((d) => d.tps)) : null;
  const bestOutput = valid.length ? Math.max(...valid.map((d) => d.outputTokens)) : null;
  const canShowResultBadges = valid.length === 3;

  return (
    <div style={{ background: "var(--bg)", borderRadius: 20, boxShadow: shadows.default, border: "1px solid transparent", overflow: "hidden", padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, minWidth: 0 }}>
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--t3)", flexShrink: 0 }}
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span
          style={{
            fontSize: 13,
            fontStyle: "italic",
            color: "var(--t2)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
            minWidth: 0,
          }}
        >
          "{run.prompt}"
        </span>
        {typeof onCollapse === "function" ? (
          <ComposerStyleIconButton ariaLabel="Run einklappen" onClick={onCollapse}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 15 12 9 18 15" />
            </svg>
          </ComposerStyleIconButton>
        ) : null}
      </div>

      <TabBar active={activeTab} onChange={setActiveTab} diffReady={diffReady} perfReady={perfReady} />

      {activeTab === "results" && (
        <div style={{ display: "flex", gap: 10 }}>
          {SLOT_INDICES.map((i) => {
            const slot = slots[i] || { providerKey: "gpt", modelValue: "" };
            const pv = getProvider(slot.providerKey);
            const d = perfData[i];
            const timeLabel = d ? `${(d.latencyMs / 1000).toFixed(2)}s` : "—";
            const costPer1kLabel = d?.cost != null ? `$${(d.cost * 1000).toFixed(2)}/1K` : "—";
            const showBadges = canShowResultBadges && d && !run.loading[i] && !run.errors[i];
            const isFastest = showBadges && bestLatency !== null && d.latencyMs === bestLatency;
            const isCheapest =
              showBadges && bestCost !== null && d.cost !== null && Math.abs(d.cost - bestCost) < 0.000001;
            const badgeBase = {
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 8px",
              borderRadius: 999,
              background: "var(--bg3)",
              border: "1px solid var(--border)",
              color: "var(--t2)",
              flexShrink: 0,
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap",
              lineHeight: 1.2,
            };
            const greenBadge =
              isDark
                ? {
                    color: "#86efac",
                    background: "rgba(22, 163, 74, 0.2)",
                    border: "1px solid rgba(74, 222, 128, 0.4)",
                  }
                : {
                    color: "#15803d",
                    background: "rgba(22, 163, 74, 0.12)",
                    border: "1px solid rgba(22, 163, 74, 0.38)",
                  };
            const speedBadgeHighlight = isFastest ? greenBadge : {};
            const costBadgeHighlight = isCheapest ? greenBadge : {};
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: 14,
                  background: "var(--bg2)",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  style={{
                    padding: "9px 14px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    flexShrink: 0,
                    background: "var(--bg)",
                    minWidth: 0,
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: pv.dot, flexShrink: 0 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: "var(--t2)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        minWidth: 0,
                      }}
                    >
                      {resolveModelLabel(slot.providerKey, slot.modelValue, modelOptions)}
                    </span>
                    {showBadges && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, flexWrap: "wrap" }}>
                        <span
                          style={{ ...badgeBase, ...speedBadgeHighlight }}
                          title={isFastest ? `Schnellste Antwortzeit (${timeLabel})` : `Antwortzeit ${timeLabel}`}
                          aria-label={isFastest ? `Schnellste Antwortzeit: ${timeLabel}` : `Antwortzeit: ${timeLabel}`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                          <span>{timeLabel}</span>
                        </span>
                        <span
                          style={{ ...badgeBase, ...costBadgeHighlight }}
                          title={isCheapest ? `Geringste Kosten (${costPer1kLabel})` : `Kosten ${costPer1kLabel}`}
                          aria-label={isCheapest ? `Geringste Kosten: ${costPer1kLabel}` : `Kosten pro 1K Tokens: ${costPer1kLabel}`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <ellipse cx="12" cy="6.5" rx="6" ry="2.2" />
                            <ellipse cx="12" cy="11" rx="6" ry="2.2" />
                            <ellipse cx="12" cy="15.5" rx="6" ry="2.2" />
                          </svg>
                          <span>{costPer1kLabel}</span>
                        </span>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 10, color: "var(--t3)", flexShrink: 0 }}>{pv.sub}</span>
                </div>
                <div style={{ padding: "12px 14px", fontSize: 13, lineHeight: 1.75, color: "var(--text)" }}>
                  {run.loading[i] ? (
                    <Dots />
                  ) : run.errors[i] ? (
                    <span style={{ color: "var(--danger)", fontSize: 11, fontFamily: "monospace" }}>{run.errors[i]}</span>
                  ) : run.results[i] ? (
                    renderText(run.results[i])
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "diff" && (
        <div style={{ borderRadius: 14, background: "var(--bg)", border: "1px solid var(--border)", overflow: "hidden" }}>
          <div
            style={{
              padding: "9px 14px",
              borderBottom: "1px solid var(--border)",
              fontSize: 11,
              fontWeight: 500,
              color: "var(--t2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              background: "var(--bg)",
            }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
              </svg>
              <span>Analyse der Unterschiede</span>
            </span>
            <span style={{ fontSize: 9, fontWeight: 400, color: "var(--t3)", flexShrink: 0, fontFamily: "ui-monospace, monospace" }} title="Modell für diese Zusammenfassung">
              {DIFF_ANALYSIS_MODEL}
            </span>
          </div>
          <div style={{ padding: "14px", fontSize: 13, lineHeight: 1.8, color: "var(--text)" }}>
            {run.diffLoading ? <Dots /> : run.diff ? <DiffUnterschiedeBody run={run} slots={slots} modelOptions={modelOptions} isDark={isDark} /> : null}
          </div>
        </div>
      )}

      {activeTab === "perf" && (
        <div style={{ display: "flex", gap: 10 }}>
          {SLOT_INDICES.map((i) => {
            const d = perfData[i];
            const slot = slots[i] || { providerKey: "gpt", modelValue: "" };
            const pv = getProvider(slot.providerKey);
            return (
              <div key={i} style={{ flex: 1, minWidth: 0, borderRadius: 14, background: "var(--bg)", border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ padding: "9px 14px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 7, background: "var(--bg)" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: pv.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: "var(--t2)" }}>{resolveModelLabel(slot.providerKey, slot.modelValue, modelOptions)}</span>
                  <span style={{ fontSize: 10, color: "var(--t3)", marginLeft: "auto" }}>{pv.sub}</span>
                </div>
                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  {d ? (
                    <>
                      <PerfMetric
                        label="Kosten / Anfrage"
                        value={d.cost !== null ? `$${d.cost.toFixed(4)}` : "—"}
                        isBest={d.cost !== null && bestCost !== null && Math.abs(d.cost - bestCost) < 0.000001}
                        subtext={d.cost !== null ? `$${(d.cost * 1000).toFixed(2)} / 1K` : "—"}
                      />
                      <PerfMetric label="Antwortzeit" value={`${(d.latencyMs / 1000).toFixed(2)}s`} isBest={bestLatency !== null && d.latencyMs === bestLatency} />
                      <PerfMetric label="Output-Tokens" value={d.outputTokens} isBest={bestOutput !== null && d.outputTokens === bestOutput} />
                      <PerfMetric label="Tokens / Sek." value={Math.round(d.tps)} isBest={bestTps !== null && Math.abs(d.tps - bestTps) < 0.01} />
                      <PerfMetric label="Output / Input" value={d.ratio.toFixed(3)} />
                    </>
                  ) : (
                    <Dots />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
