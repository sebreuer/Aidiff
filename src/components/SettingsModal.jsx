import { useCallback, useEffect, useId, useRef, useState } from "react";
import { modalBackdrop, shadow, zIndex } from "../theme/tokens.js";
import { SettingsApiKeyInputRow } from "./SettingsApiKeyInputRow.jsx";

export function SettingsModal({
  open,
  onClose,
  isDark,
  modalRef,
  settingsKeysError,
  settingsKeysLoading,
  providerSettingRows,
  apiKeysDraft,
  setApiKeysDraft,
  onSave,
}) {
  const titleId = useId();
  const [editingKey, setEditingKey] = useState(null);
  const editingKeyRef = useRef(null);
  const snapshotRef = useRef({});

  useEffect(() => {
    editingKeyRef.current = editingKey;
  }, [editingKey]);

  useEffect(() => {
    if (!open) setEditingKey(null);
  }, [open]);

  const handleStartEdit = useCallback(
    (key) => {
      if (settingsKeysLoading) return;
      setApiKeysDraft((prev) => {
        const prevEditing = editingKeyRef.current;
        let next = { ...prev };
        if (prevEditing && prevEditing !== key) {
          if ((next[prevEditing] ?? "") === "") {
            next[prevEditing] = snapshotRef.current[prevEditing] ?? "";
          }
        }
        snapshotRef.current = {
          ...snapshotRef.current,
          [key]: prev[key] ?? "",
        };
        return { ...next, [key]: "" };
      });
      setEditingKey(key);
    },
    [settingsKeysLoading, setApiKeysDraft]
  );

  const handleEndEdit = useCallback(
    (key) => {
      setApiKeysDraft((prev) => {
        const cur = prev[key] ?? "";
        if (cur === "") {
          const snap = snapshotRef.current[key];
          return { ...prev, [key]: snap ?? "" };
        }
        return prev;
      });
      setEditingKey((k) => (k === key ? null : k));
    },
    [setApiKeysDraft]
  );

  if (!open) return null;

  const dialogShadow = isDark ? shadow.settingsModalDark : shadow.settingsModalLight;

  return (
    <div
      className="aidiff-settings-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: zIndex.modal,
        background: modalBackdrop(isDark),
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        pointerEvents: "auto",
      }}
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="aidiff-settings-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 448,
          minWidth: 0,
          borderRadius: 16,
          border: "1px solid var(--border2)",
          background: "var(--bg)",
          boxShadow: dialogShadow,
          color: "var(--text)",
          textAlign: "left",
          outline: "none",
          pointerEvents: "auto",
        }}
      >
        <form
          className="aidiff-settings-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!settingsKeysLoading) onSave();
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            minHeight: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 16,
              marginBottom: 4,
            }}
          >
            <h2
              id={titleId}
              style={{
                margin: 0,
                padding: 0,
                fontSize: 18,
                fontWeight: 600,
                lineHeight: 1.35,
                letterSpacing: "-0.02em",
                color: "var(--text)",
                flex: 1,
                minWidth: 0,
                overflowWrap: "anywhere",
                fontFamily: "inherit",
              }}
            >
              Einstellungen
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              <button
                type="button"
                aria-label="Schließen"
                onClick={onClose}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  margin: -6,
                  border: "none",
                  borderRadius: 8,
                  cursor: "pointer",
                  background: "transparent",
                  color: "var(--t3)",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--bg2)";
                  e.currentTarget.style.color = "var(--text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--t3)";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 4 }}>
            {settingsKeysError ? (
              <div
                role="alert"
                style={{
                  fontSize: 13,
                  lineHeight: 1.45,
                  color: "var(--danger)",
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(220, 38, 38, 0.08)",
                  border: "1px solid rgba(220, 38, 38, 0.2)",
                }}
              >
                {settingsKeysError}
              </div>
            ) : null}
            {settingsKeysLoading ? (
              <div style={{ fontSize: 13, color: "var(--t3)", paddingTop: 2 }}>Lade Keys aus .env …</div>
            ) : null}

            {providerSettingRows.map((pv) => (
              <SettingsApiKeyInputRow
                key={pv.key}
                pv={pv}
                value={apiKeysDraft[pv.key]}
                disabled={settingsKeysLoading}
                isEditing={editingKey === pv.key}
                onStartEdit={handleStartEdit}
                onEndEdit={handleEndEdit}
                onChange={(key, v) => setApiKeysDraft((prev) => ({ ...prev, [key]: v }))}
              />
            ))}
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="aidiff-settings-btn-secondary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "5rem",
                height: 36,
                padding: "0 16px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
                color: "var(--text)",
                background: "transparent",
                border: "1px solid var(--modal-secondary-border)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--modal-secondary-hover)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={settingsKeysLoading}
              className="aidiff-settings-btn-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: "5rem",
                height: 36,
                padding: "0 16px",
                border: "none",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: settingsKeysLoading ? "not-allowed" : "pointer",
                color: "var(--bg)",
                background: "var(--text)",
                opacity: settingsKeysLoading ? 0.5 : 1,
                pointerEvents: settingsKeysLoading ? "none" : "auto",
              }}
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
