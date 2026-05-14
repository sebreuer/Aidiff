export function PerfMetric({ label, value, isBest, subtext }) {
  const accent = "var(--glass-metric-best-accent)";
  return (
    <div className={`aidiff-glass-metric${isBest ? " aidiff-glass-metric--best" : ""}`}>
      <span
        style={{
          fontSize: 10,
          color: isBest ? accent : "var(--t3)",
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
          color: isBest ? accent : "var(--text)",
          lineHeight: 1,
        }}
      >
        {value}
      </span>
      {subtext && <span style={{ fontSize: 10, color: "var(--t3)" }}>{subtext}</span>}
    </div>
  );
}
