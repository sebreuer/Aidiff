import { TAB_KEYS } from "../constants/appConfig.js";
import { useI18n } from "../i18n/I18nContext.jsx";
import { IconTabDifferences, IconTabPerformance, IconTabResults } from "./tabIcons.jsx";

function TabLeadingIcon({ tabKey }) {
  if (tabKey === "results") return <IconTabResults style={{ flexShrink: 0, opacity: 0.92 }} />;
  if (tabKey === "diff") return <IconTabDifferences style={{ flexShrink: 0, opacity: 0.92 }} />;
  if (tabKey === "perf") return <IconTabPerformance style={{ flexShrink: 0, opacity: 0.92 }} />;
  return null;
}

export function TabBar({ active, onChange, diffReady, perfReady, variant = "default" }) {
  const { t } = useI18n();
  const railClass =
    variant === "inline" ? "aidiff-glass-tab-rail aidiff-glass-tab-rail--inline aidiff-run-card-head__rail" : "aidiff-glass-tab-rail";

  return (
    <div className={railClass}>
      {TAB_KEYS.map((tab) => {
        const disabled = (tab.key === "diff" && !diffReady) || (tab.key === "perf" && !perfReady);
        const isActive = active === tab.key;
        const btnClass = variant === "inline" ? "aidiff-glass-control aidiff-run-card-head__tabCtrl" : "aidiff-glass-tab";
        return (
          <button
            key={tab.key}
            type="button"
            className={btnClass}
            data-on={isActive ? "true" : undefined}
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) onChange(tab.key);
            }}
          >
            <TabLeadingIcon tabKey={tab.key} />
            {t(`tabs.${tab.key}`)}
          </button>
        );
      })}
    </div>
  );
}
