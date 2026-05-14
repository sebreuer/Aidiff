import { defaultCompareSlots, getActiveSlotIndices, getProvider, resolveModelLabel } from "../lib/modelUtils.js";
import { useI18n } from "../i18n/I18nContext.jsx";

export function CollapsedRun({ run, onExpand, modelOptions }) {
  const { t } = useI18n();
  const slots = run.slots || defaultCompareSlots();
  const isPrompt = run.compareKind === "prompts" && Array.isArray(run.promptVariants);
  const slot0 = slots[0];
  const pv0 = slot0 ? getProvider(slot0.providerKey) : null;
  const promptLeadOk = Boolean(isPrompt && run.promptVariants?.length && slot0 && pv0);
  const nPrompts = run.promptVariants?.length ?? 0;

  return (
    <div
      onClick={onExpand}
      className="aidiff-liquid-glass aidiff-liquid-glass--r16 aidiff-liquid-glass--clip aidiff-run-card-head"
      style={{ cursor: "pointer" }}
    >
      <div className="aidiff-run-card-head__lead">
        {promptLeadOk ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flex: 1,
              minWidth: 0,
              fontSize: 13,
              lineHeight: 1.25,
              color: "var(--t2)",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: pv0.dot, flexShrink: 0 }} aria-hidden />
            <span
              style={{
                fontWeight: 500,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {resolveModelLabel(slot0.providerKey, slot0.modelValue, modelOptions)}
            </span>
            <span style={{ fontSize: 11, color: "var(--t3)", flexShrink: 0 }}>{pv0.sub}</span>
          </div>
        ) : (
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
            {`"${run.prompt}"`}
          </span>
        )}
      </div>
      {isPrompt && nPrompts > 0 ? (
        <div className="aidiff-run-card-head__rail">
          <span style={{ fontSize: 11, fontWeight: 600, color: "var(--t3)", whiteSpace: "nowrap" }}>
            {nPrompts === 1 ? t("run.promptCompareRailOne") : t("run.promptCompareRailCount", { count: nPrompts })}
          </span>
        </div>
      ) : (
        <div className="aidiff-run-card-head__rail aidiff-run-card-head__rail--dots">
          {getActiveSlotIndices(run).map((i) => {
            const sl = slots[i] || { providerKey: "gpt" };
            const pv = getProvider(sl.providerKey);
            return <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: pv.dot }} />;
          })}
        </div>
      )}
      <div className="aidiff-run-card-head__chevronSlot" aria-hidden>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
    </div>
  );
}
