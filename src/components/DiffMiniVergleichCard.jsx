import { useState } from "react";
import { SLOT_INDICES } from "../constants/appConfig.js";
import { emptyMiniDisplayRows, stripMiniMarkdownCell } from "../lib/diffParsing.js";
import { getProvider, resolveModelLabel, shortenModelHeadline } from "../lib/modelUtils.js";
import { SHADOWS, border } from "../theme/tokens.js";

export function DiffMiniVergleichCard({ rows, slots, modelOptions, isDark }) {
  const [hovered, setHovered] = useState(false);
  const shadows = isDark ? SHADOWS.dark : SHADOWS.light;
  const innerLine = border.line;
  const cell = {
    padding: "10px 12px",
    verticalAlign: "middle",
    fontSize: 11,
    lineHeight: 1.45,
  };
  const labelCell = { ...cell, whiteSpace: "nowrap" };
  const displayRows = rows.length > 0 ? rows : emptyMiniDisplayRows();
  const allPlaceholders = displayRows.every((r) => r.vals.every((v) => v === "—"));

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "0 1 auto",
        alignSelf: "flex-start",
        width: "max-content",
        maxWidth: "100%",
        minWidth: 0,
        borderRadius: 12,
        border: border.transparent,
        background: "var(--bg)",
        overflow: "auto",
        boxShadow: hovered ? shadows.hover : shadows.default,
        transition: "box-shadow 0.15s ease",
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
          <tr style={{ background: "var(--bg2)" }}>
            <th scope="col" style={{ ...labelCell, fontWeight: 600, color: "var(--t3)", textAlign: "left", borderRight: innerLine, borderBottom: innerLine }} />
            {SLOT_INDICES.map((i) => {
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
                    borderRight: i < SLOT_INDICES.length - 1 ? innerLine : "none",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: pv.dot }} />
                  </div>
                  <div title={lab}>{shortenModelHeadline(lab, 42)}</div>
                  <div style={{ fontSize: 9, color: "var(--t3)", marginTop: 4, fontWeight: 400 }}>{pv.sub}</div>
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
                  background: "var(--bg2)",
                  borderRight: innerLine,
                  borderBottom: rowIndex < displayRows.length - 1 ? innerLine : "none",
                }}
              >
                {row.label}
              </th>
              {row.vals.map((v, vi) => (
                <td
                  key={vi}
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
                  {stripMiniMarkdownCell(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {allPlaceholders && (
        <div style={{ padding: "8px 12px 10px", fontSize: 10, color: "var(--t3)", lineHeight: 1.4, borderTop: innerLine, background: "var(--bg2)" }}>
          Noch keine Minivergleich-Zeilen vom Modell — Platzhalter. Nächster Lauf liefert echte Werte, sobald das Antwortformat passt.
        </div>
      )}
    </div>
  );
}
