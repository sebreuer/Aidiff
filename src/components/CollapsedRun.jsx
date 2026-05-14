import { defaultCompareSlots, getActiveSlotIndices, getProvider } from "../lib/modelUtils.js";

export function CollapsedRun({ run, onExpand }) {
  const slots = run.slots || defaultCompareSlots();
  return (
    <div
      onClick={onExpand}
      className="aidiff-liquid-glass aidiff-liquid-glass--r16 aidiff-liquid-glass--clip aidiff-run-card-head"
      style={{ cursor: "pointer" }}
    >
      <div className="aidiff-run-card-head__lead">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--t3)", flexShrink: 0 }}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <span
          style={{
            fontSize: 13,
            color: "var(--t2)",
            fontStyle: "italic",
            lineHeight: 1.25,
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          "{run.prompt}"
        </span>
      </div>
      <div className="aidiff-run-card-head__rail aidiff-run-card-head__rail--dots">
        {getActiveSlotIndices(run).map((i) => {
          const sl = slots[i] || { providerKey: "gpt" };
          const pv = getProvider(sl.providerKey);
          return <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: pv.dot }} />;
        })}
      </div>
      <div className="aidiff-run-card-head__chevronSlot" aria-hidden>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
