import { useI18n } from "../i18n/I18nContext.jsx";

export function FileChip({ file, onRemove }) {
  const { t } = useI18n();
  return (
    <div className="aidiff-glass-chip">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text)", maxWidth: 120 }}>{file.name}</span>
      <span style={{ color: "var(--t3)", flexShrink: 0 }}>{(file.size / 1024).toFixed(0)}KB</span>
      <button type="button" className="aidiff-glass-chip__remove" onClick={onRemove} aria-label={t("fileChip.removeAttachment")}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
