import { useMemo, useState } from "react";
import { DIFF_ANALYSIS_MODEL } from "../constants/appConfig.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { parseDiffSections } from "../lib/diffParsing.js";
import { calcCost, defaultCompareSlots, getActiveSlotIndices, getProvider, resolveModelLabel, runActiveSlotCount } from "../lib/modelUtils.js";
import { renderText } from "../lib/textMarkdown.jsx";
import { DiffUnterschiedeAssessment, DiffUnterschiedeMiniTable } from "./DiffUnterschiedeBody.jsx";
import { Dots } from "./Dots.jsx";
import { PerfMetric } from "./PerfMetric.jsx";
import { IconSquareDashedText } from "./tabIcons.jsx";
import { TabBar } from "./TabBar.jsx";

export function RunEntry({ run, isDark, modelOptions, onCollapse }) {
  const { t, catalog } = useI18n();
  const [activeTab, setActiveTab] = useState("results");
  const diffReady = !!run.diff || run.diffLoading;
  const slots = run.slots || defaultCompareSlots();
  const activeIndices = getActiveSlotIndices(run);
  const perfReady = activeIndices.every((i) => run.metas[i]);

  const diffColumnCount = runActiveSlotCount(run);
  const diffParsed = useMemo(() => {
    if (!run.diff) return null;
    const { assessment, miniRows } = parseDiffSections(run.diff, diffColumnCount, catalog.diffParsing);
    return {
      assessment,
      miniRows,
      rowOrder: catalog.diffParsing.rowOrder,
    };
  }, [run.diff, diffColumnCount, catalog.diffParsing]);

  const perfData = activeIndices.map((i) => {
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
  const canShowResultBadges = valid.length === activeIndices.length && valid.length > 0;

  const shellClass =
    typeof onCollapse === "function"
      ? "aidiff-liquid-glass aidiff-liquid-glass--r16 aidiff-liquid-glass--clip"
      : "aidiff-liquid-glass aidiff-liquid-glass--clip";

  return (
    <div className={shellClass} style={{ padding: 0, width: "100%" }}>
      <div className="aidiff-run-card-head">
        <div className="aidiff-run-card-head__lead">
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
              lineHeight: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              minWidth: 0,
            }}
          >
            "{run.prompt}"
          </span>
        </div>
        <TabBar variant="inline" active={activeTab} onChange={setActiveTab} diffReady={diffReady} perfReady={perfReady} />
        {typeof onCollapse === "function" ? (
          <button
            type="button"
            className="aidiff-run-card-head__chevronBtn"
            aria-label={t("run.collapseRun")}
            onClick={(e) => {
              e.stopPropagation();
              onCollapse();
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="6 15 12 9 18 15" />
            </svg>
          </button>
        ) : (
          <div className="aidiff-run-card-head__chevronSlot" aria-hidden />
        )}
      </div>

      <div style={{ padding: "12px 16px 16px", width: "100%", minWidth: 0 }}>
      {activeTab === "results" && (
        <div style={{ display: "flex", gap: 10 }}>
          {activeIndices.map((i, j) => {
            const slot = slots[i] || { providerKey: "gpt", modelValue: "" };
            const pv = getProvider(slot.providerKey);
            const d = perfData[j];
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
              background: "var(--glass-control-bg)",
              border: "1px solid var(--glass-control-border)",
              backdropFilter: "var(--glass-control-blur)",
              WebkitBackdropFilter: "var(--glass-control-blur)",
              boxShadow: "var(--glass-control-shadow)",
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
                className="aidiff-liquid-glass aidiff-liquid-glass--r14 aidiff-liquid-glass--clip"
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div
                  className="aidiff-liquid-glass-head aidiff-run-entry-col-head"
                  style={{
                    padding: "9px 14px",
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    flexShrink: 0,
                    minWidth: 0,
                  }}
                >
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: pv.dot, flexShrink: 0 }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, minWidth: 0, overflow: "hidden" }}>
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
                      <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0, flexWrap: "nowrap" }}>
                        <span
                          style={{ ...badgeBase, ...speedBadgeHighlight }}
                          title={isFastest ? t("run.fastestLatencyTitle", { time: timeLabel }) : t("run.latencyTitle", { time: timeLabel })}
                          aria-label={isFastest ? t("run.fastestLatencyAria", { time: timeLabel }) : t("run.latencyAria", { time: timeLabel })}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                          </svg>
                          <span>{timeLabel}</span>
                        </span>
                        <span
                          style={{ ...badgeBase, ...costBadgeHighlight }}
                          title={isCheapest ? t("run.cheapestCostTitle", { cost: costPer1kLabel }) : t("run.costTitle", { cost: costPer1kLabel })}
                          aria-label={isCheapest ? t("run.cheapestCostAria", { cost: costPer1kLabel }) : t("run.costPer1kAria", { cost: costPer1kLabel })}
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              !run.diffLoading && run.diff && diffParsed ? "minmax(0, 3fr) minmax(0, 2fr)" : "minmax(0, 1fr)",
            alignItems: "start",
            gap: 10,
            width: "100%",
            minWidth: 0,
          }}
        >
          <div
            className="aidiff-liquid-glass aidiff-liquid-glass--r14 aidiff-liquid-glass--clip"
            style={{ minWidth: 0, maxWidth: "100%" }}
          >
            <div
              className="aidiff-liquid-glass-head aidiff-run-entry-col-head"
              style={{
                padding: "9px 14px",
                fontSize: 11,
                fontWeight: 500,
                color: "var(--t2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                <IconSquareDashedText style={{ flexShrink: 0, color: "currentColor" }} />
                <span>{t("diff.analysisTitle")}</span>
              </span>
              <span style={{ fontSize: 9, fontWeight: 400, color: "var(--t3)", flexShrink: 0, fontFamily: "ui-monospace, monospace" }} title={t("diff.summaryModelTitle")}>
                {DIFF_ANALYSIS_MODEL}
              </span>
            </div>
            <div style={{ padding: "14px", fontSize: 13, lineHeight: 1.8, color: "var(--text)" }}>
              {run.diffLoading ? <Dots /> : run.diff && diffParsed ? <DiffUnterschiedeAssessment assessment={diffParsed.assessment} /> : null}
            </div>
          </div>
          {!run.diffLoading && run.diff && diffParsed ? (
            <div style={{ minWidth: 0, maxWidth: "100%" }}>
              <DiffUnterschiedeMiniTable
                miniRows={diffParsed.miniRows}
                slots={slots}
                modelOptions={modelOptions}
                columnCount={diffColumnCount}
                rowOrder={diffParsed.rowOrder}
              />
            </div>
          ) : null}
        </div>
      )}

      {activeTab === "perf" && (
        <div style={{ display: "flex", gap: 10 }}>
          {activeIndices.map((i, j) => {
            const d = perfData[j];
            const slot = slots[i] || { providerKey: "gpt", modelValue: "" };
            const pv = getProvider(slot.providerKey);
            return (
              <div key={i} className="aidiff-liquid-glass aidiff-liquid-glass--r14 aidiff-liquid-glass--clip" style={{ flex: 1, minWidth: 0 }}>
                <div className="aidiff-liquid-glass-head aidiff-run-entry-col-head" style={{ padding: "9px 14px", display: "flex", alignItems: "center", gap: 7 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: pv.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontWeight: 500, color: "var(--t2)" }}>{resolveModelLabel(slot.providerKey, slot.modelValue, modelOptions)}</span>
                  <span style={{ fontSize: 10, color: "var(--t3)", marginLeft: "auto" }}>{pv.sub}</span>
                </div>
                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                  {d ? (
                    <>
                      <PerfMetric
                        label={t("perf.costPerRequest")}
                        value={d.cost !== null ? `$${d.cost.toFixed(4)}` : "—"}
                        isBest={d.cost !== null && bestCost !== null && Math.abs(d.cost - bestCost) < 0.000001}
                        subtext={d.cost !== null ? `$${(d.cost * 1000).toFixed(2)} / 1K` : "—"}
                      />
                      <PerfMetric label={t("perf.latency")} value={`${(d.latencyMs / 1000).toFixed(2)}s`} isBest={bestLatency !== null && d.latencyMs === bestLatency} />
                      <PerfMetric label={t("perf.outputTokens")} value={d.outputTokens} isBest={bestOutput !== null && d.outputTokens === bestOutput} />
                      <PerfMetric label={t("perf.tps")} value={Math.round(d.tps)} isBest={bestTps !== null && Math.abs(d.tps - bestTps) < 0.01} />
                      <PerfMetric label={t("perf.outputInputRatio")} value={d.ratio.toFixed(3)} />
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
    </div>
  );
}
