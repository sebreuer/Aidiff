import { useEffect, useRef } from "react";
import { formatApiKeyPeek } from "../lib/formatApiKeyPeek.js";
import { useI18n } from "../i18n/I18nContext.jsx";

export function SettingsApiKeyInputRow({ pv, value, disabled, isEditing, onStartEdit, onEndEdit, onChange }) {
  const { t } = useI18n();
  const raw = String(value ?? "");
  const hasSecret = raw.length > 0;
  const peekOnly = hasSecret && !isEditing;
  const labelText = pv.sub === "Anthropic" ? "Claude" : pv.sub;
  const inputId = `aidiff-api-key-${pv.key}`;
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isEditing || disabled) return;
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
      try {
        const el = inputRef.current;
        if (el && typeof el.setSelectionRange === "function") el.setSelectionRange(0, 0);
      } catch {
        /* ignore */
      }
    });
    return () => cancelAnimationFrame(id);
  }, [isEditing, disabled]);

  const displayValue = peekOnly ? formatApiKeyPeek(raw) : raw;

  return (
    <div className="aidiff-settings-field" style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <label
        htmlFor={inputId}
        style={{
          display: "block",
          marginBottom: 6,
          fontSize: 14,
          fontWeight: 400,
          lineHeight: 1.4,
          color: "var(--t2)",
        }}
      >
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: pv.dot, flexShrink: 0 }} aria-hidden />
          <span>{t("settings.apiKeyLabel", { provider: labelText })}</span>
        </span>
      </label>
      <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          autoComplete="off"
          spellCheck={false}
          disabled={disabled}
          readOnly={peekOnly}
          tabIndex={peekOnly ? -1 : 0}
          value={displayValue}
          onMouseDown={(e) => {
            if (peekOnly) e.preventDefault();
          }}
          onFocus={(e) => {
            if (peekOnly) e.target.blur();
          }}
          onBlur={() => {
            if (isEditing) onEndEdit(pv.key);
          }}
          onChange={(e) => onChange(pv.key, e.target.value)}
          placeholder={t("settings.apiKeyPlaceholder", { provider: labelText })}
          style={{
            flex: 1,
            minWidth: 0,
            boxSizing: "border-box",
            height: 36,
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid var(--modal-input-border)",
            background: "var(--modal-input-bg)",
            color: "var(--text)",
            fontSize: 14,
            lineHeight: 1.25,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            outline: "none",
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? "not-allowed" : peekOnly ? "default" : "text",
          }}
        />
        {hasSecret && !isEditing && !disabled ? (
          <button
            type="button"
            aria-label={t("settings.apiKeyEditAria", { provider: labelText })}
            title={t("settings.editTitle")}
            onClick={() => onStartEdit(pv.key)}
            className="aidiff-glass-control aidiff-glass-control--icon"
            style={{ flexShrink: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}
