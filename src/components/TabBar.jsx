import { TABS } from "../constants/appConfig.js";
import { shadow } from "../theme/tokens.js";

export function TabBar({ active, onChange, diffReady, perfReady }) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 2,
        padding: "3px",
        background: "var(--bg2)",
        borderRadius: 10,
        marginBottom: 12,
      }}
    >
      {TABS.map((t) => {
        const disabled = (t.key === "diff" && !diffReady) || (t.key === "perf" && !perfReady);
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => !disabled && onChange(t.key)}
            style={{
              fontFamily: "inherit",
              fontSize: 12,
              fontWeight: isActive ? 500 : 400,
              padding: "5px 12px",
              border: "none",
              borderRadius: 7,
              cursor: disabled ? "default" : "pointer",
              background: isActive ? "var(--bg)" : "transparent",
              color: disabled ? "var(--t3)" : isActive ? "var(--text)" : "var(--t2)",
              boxShadow: isActive ? shadow.tabActive : "none",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => {
              if (!disabled && !isActive) e.currentTarget.style.color = "var(--text)";
            }}
            onMouseLeave={(e) => {
              if (!disabled && !isActive) e.currentTarget.style.color = "var(--t2)";
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
