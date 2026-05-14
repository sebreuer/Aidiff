import { useI18n } from "../i18n/I18nContext.jsx";
import { IconCpu, IconMessageBubble } from "./tabIcons.jsx";

/** Segmented control: model comparison vs. prompt comparison. */
export function CompareModeSwitch({ mode, onModeChange, disabled }) {
  const { t } = useI18n();
  return (
    <div className="aidiff-compare-mode-switch" role="tablist" aria-label={t("compareMode.ariaLabel")}>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "models"}
        className="aidiff-compare-mode-switch__btn"
        data-active={mode === "models" ? "true" : undefined}
        disabled={disabled}
        onClick={() => onModeChange("models")}
      >
        <IconCpu className="aidiff-compare-mode-switch__icon" size={17} />
        <span className="aidiff-compare-mode-switch__label">{t("compareMode.models")}</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "prompts"}
        className="aidiff-compare-mode-switch__btn"
        data-active={mode === "prompts" ? "true" : undefined}
        disabled={disabled}
        onClick={() => onModeChange("prompts")}
      >
        <IconMessageBubble className="aidiff-compare-mode-switch__icon" size={17} />
        <span className="aidiff-compare-mode-switch__label">{t("compareMode.prompts")}</span>
      </button>
    </div>
  );
}
