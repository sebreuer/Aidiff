import { parseDiffSections } from "../lib/diffParsing.js";
import { runActiveSlotCount } from "../lib/modelUtils.js";
import { renderText } from "../lib/textMarkdown.jsx";
import { DiffMiniVergleichCard } from "./DiffMiniVergleichCard.jsx";

export function DiffUnterschiedeBody({ run, slots, modelOptions, isDark }) {
  const columnCount = runActiveSlotCount(run);
  const { einordnung, miniRows } = parseDiffSections(run.diff, columnCount);
  const proseTrim = String(einordnung || "").trim();

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start", width: "100%", justifyContent: "flex-start" }}>
      <div style={{ flex: "1 1 220px", minWidth: "min(100%, 200px)", maxWidth: "100%" }}>
        {proseTrim ? (
          <div style={{ fontSize: 13, lineHeight: 1.85, color: "var(--text)" }}>{renderText(proseTrim)}</div>
        ) : (
          <span style={{ fontSize: 12, color: "var(--t3)" }}>Kein Fließtext unter „Einordnung“.</span>
        )}
      </div>
      <DiffMiniVergleichCard rows={miniRows} slots={slots} modelOptions={modelOptions} isDark={isDark} columnCount={columnCount} />
    </div>
  );
}
