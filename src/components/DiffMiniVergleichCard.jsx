import { emptyMiniDisplayRows, miniCellDisplayText, stripMiniMarkdownCell } from "../lib/diffParsing.js";
import { getProvider, resolveModelLabel, shortenModelHeadline } from "../lib/modelUtils.js";
import { border } from "../theme/tokens.js";
import { useI18n } from "../i18n/I18nContext.jsx";

export function DiffMiniVergleichCard({ rows, slots, modelOptions, columnCount = 3, rowOrder }) {
  const { t } = useI18n();
  const innerLine = border.line;
  const colIdx = Array.from({ length: columnCount }, (_, i) => i);
  const cell = {
    padding: "10px 12px",
    verticalAlign: "middle",
    fontSize: 11,
    lineHeight: 1.45,
  };
  const labelCell = { ...cell, whiteSpace: "normal" };
  const displayRows = rows.length > 0 ? rows : emptyMiniDisplayRows(columnCount, rowOrder);
  const allPlaceholders = displayRows.every((r) => r.vals.every((v) => v === "—"));

  return (
    <div
      className="aidiff-liquid-glass aidiff-liquid-glass--r12 aidiff-liquid-glass--clip"
      style={{
        width: "100%",
        maxWidth: "100%",
        minWidth: 0,
        overflow: "auto",
      }}
    >
      <table
        style={{
          width: "max-content",
          maxWidth: "100%",
          borderCollapse: "collapse",
          tableLayout: "auto",
          fontFamily: "inherit",
        }}
      >
        <thead>
          <tr style={{ background: "var(--glass-inner-header-bg)" }}>
            <th scope="col" style={{ ...labelCell, fontWeight: 600, color: "var(--t3)", textAlign: "left", borderRight: innerLine, borderBottom: innerLine }} />
            {colIdx.map((i) => {
              const slot = slots[i] || { providerKey: "gpt", modelValue: "" };
              const pv = getProvider(slot.providerKey);
              const lab = resolveModelLabel(slot.providerKey, slot.modelValue, modelOptions);
              return (
                <th
                  key={i}
                  scope="col"
                  style={{
                    ...cell,
                    textAlign: "center",
                    fontWeight: 600,
                    color: "var(--text)",
                    borderBottom: innerLine,
                    borderRight: i < columnCount - 1 ? innerLine : "none",
                    verticalAlign: "top",
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: pv.dot, flexShrink: 0 }} />
                    <span
                      title={lab}
                      className={`aidiff-assessment-mark aidiff-assessment-mark--s${i + 1}`}
                      style={{
                        display: "inline-block",
                        maxWidth: "100%",
                        textAlign: "center",
                        fontWeight: 600,
                        color: "var(--text)",
                        lineHeight: 1.35,
                      }}
                    >
                      {shortenModelHeadline(lab, 42)}
                    </span>
                    <span style={{ fontSize: 9, color: "var(--t3)", fontWeight: 400, lineHeight: 1.2 }}>{pv.sub}</span>
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, rowIndex) => (
            <tr key={row.label}>
              <th
                scope="row"
                style={{
                  ...labelCell,
                  textAlign: "left",
                  fontWeight: 600,
                  color: "var(--t2)",
                  background: "var(--glass-inner-header-bg)",
                  borderRight: innerLine,
                  borderBottom: rowIndex < displayRows.length - 1 ? innerLine : "none",
                }}
              >
                {stripMiniMarkdownCell(row.label)}
              </th>
              {row.vals.map((v, vi) => (
                <td
                  key={vi}
                  title={stripMiniMarkdownCell(String(v ?? ""))}
                  style={{
                    ...cell,
                    textAlign: "center",
                    fontWeight: 500,
                    color: "var(--text)",
                    wordBreak: "break-word",
                    borderRight: vi < row.vals.length - 1 ? innerLine : "none",
                    borderBottom: rowIndex < displayRows.length - 1 ? innerLine : "none",
                  }}
                >
                  {miniCellDisplayText(v, 3)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {allPlaceholders && (
        <div style={{ padding: "8px 12px 10px", fontSize: 10, color: "var(--t3)", lineHeight: 1.4, borderTop: innerLine, background: "var(--glass-inner-header-bg)" }}>
          {t("diff.miniComparisonPlaceholder")}
        </div>
      )}
    </div>
  );
}
