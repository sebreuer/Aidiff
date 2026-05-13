import { defaultCompareSlots, getActiveSlotIndices, getProvider } from "../lib/modelUtils.js";
import { SHADOWS } from "../theme/tokens.js";

export function CollapsedRun({ run, isDark, onExpand }) {
  const shadows = isDark ? SHADOWS.dark : SHADOWS.light;
  const slots = run.slots || defaultCompareSlots();
  return (
    <div
      onClick={onExpand}
      style={{
        background: "var(--bg)",
        borderRadius: 16,
        boxShadow: shadows.default,
        border: "1px solid transparent",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = shadows.hover)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = shadows.default)}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--t3)", flexShrink: 0 }}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
      <span style={{ fontSize: 13, color: "var(--t2)", fontStyle: "italic", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>"{run.prompt}"</span>
      <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
        {getActiveSlotIndices(run).map((i) => {
          const sl = slots[i] || { providerKey: "gpt" };
          const pv = getProvider(sl.providerKey);
          return <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: pv.dot }} />;
        })}
      </div>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
