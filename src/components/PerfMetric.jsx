import { BEST_BG, BEST_COLOR } from "../theme/tokens.js";

export function PerfMetric({ label, value, isBest, subtext }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        background: isBest ? BEST_BG : "transparent",
        borderRadius: 8,
        border: isBest ? "1px solid rgba(0,112,243,0.15)" : "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        gap: 3,
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: isBest ? BEST_COLOR : "var(--t3)",
          textTransform: "uppercase",
          letterSpacing: "0.07em",
          fontWeight: 500,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: isBest ? BEST_COLOR : "var(--text)",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {subtext && <span style={{ fontSize: 10, color: "var(--t3)" }}>{subtext}</span>}
    </div>
  );
}
