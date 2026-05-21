import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  apiKeyAllowsProvider,
  buildUnifiedModelEntries,
  getProvider,
  matchesModelSearchQuery,
  resolveModelLabel,
} from "../lib/modelUtils.js";
import { radius, zIndex } from "../theme/tokens.js";
import { useI18n } from "../i18n/I18nContext.jsx";

/** One compare column: portal dropdown (same backdrop-filter as composer); opens upward. */
export function SearchableSlotPicker({
  slotIndex,
  providerKey,
  modelValue,
  onSlotChange,
  modelOptions,
  listsLoading,
  apiKeysCommitted,
  position,
  emptyPlaceholder,
  defaultOpen,
  onOpenChange,
  onRemoveColumn,
  removeColumnAriaLabel,
  removeColumnTitle,
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);
  const [portalBox, setPortalBox] = useState(() => ({ left: 0, width: 0, bottom: 0, maxHeight: 400 }));
  const rootRef = useRef(null);
  const anchorRef = useRef(null);
  const portalPanelRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = `compare-slot-${slotIndex}-listbox`;
  const provider = getProvider(providerKey);

  const unified = useMemo(() => {
    const all = buildUnifiedModelEntries(modelOptions);
    if (!apiKeysCommitted) return all;
    return all.filter(
      (e) =>
        apiKeyAllowsProvider(apiKeysCommitted, e.providerKey) ||
        (e.providerKey === providerKey && e.value === modelValue && Boolean(modelValue))
    );
  }, [modelOptions, apiKeysCommitted, providerKey, modelValue]);

  const filtered = useMemo(() => {
    if (!query.trim()) return unified;
    return unified.filter((e) => matchesModelSearchQuery(query, e.label, e.value));
  }, [unified, query]);

  const updatePortalPosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight;
    /** Space above anchor (dropdown grows upward); margin to viewport top */
    const topPad = 12;
    const spaceAbove = rect.top - topPad;
    const maxH = Math.min(vh * 0.55, 420, Math.max(0, spaceAbove)) || 72;
    setPortalBox({
      left: rect.left,
      width: Math.max(rect.width, 160),
      bottom: vh - rect.top + 4,
      maxHeight: maxH,
    });
  }, []);

  useEffect(() => {
    setHighlight((h) => Math.min(h, Math.max(0, filtered.length - 1)));
  }, [filtered.length, query]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePortalPosition();
    const onScrollOrResize = () => updatePortalPosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [open, updatePortalPosition]);

  useEffect(() => {
    const h = (e) => {
      const target = e.target;
      if (rootRef.current?.contains(target)) return;
      if (portalPanelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useLayoutEffect(() => {
    if (defaultOpen) setOpen(true);
  }, [defaultOpen]);

  const prevOpenRef = useRef(open);
  useEffect(() => {
    if (prevOpenRef.current !== open) {
      onOpenChange?.(open);
    }
    prevOpenRef.current = open;
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const hasModel = Boolean(modelValue);
  const currentLabel = hasModel ? resolveModelLabel(providerKey, modelValue, modelOptions) : emptyPlaceholder || resolveModelLabel(providerKey, modelValue, modelOptions);
  const R = radius.card;
  const hoverRadius = position === "first" ? `${R}px 0 0 0` : position === "last" ? `0 ${R}px 0 0` : "0";

  const dropdownPanel = open && (
    <div
      ref={portalPanelRef}
      id={listboxId}
      role="listbox"
      aria-label={t("slotPicker.chooseModel")}
      aria-activedescendant={filtered[highlight] ? `slot-${slotIndex}-opt-${highlight}` : undefined}
      className="aidiff-liquid-glass aidiff-liquid-glass--r12 aidiff-liquid-glass--clip aidiff-glass-dropdown-shell"
      style={{
        position: "fixed",
        left: portalBox.left,
        width: portalBox.width,
        bottom: portalBox.bottom,
        maxHeight: portalBox.maxHeight,
        zIndex: zIndex.dropdown,
        boxSizing: "border-box",
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="aidiff-glass-dropdown__meta">
        {listsLoading ? t("slotPicker.loadingCatalog") : t("slotPicker.modelsHint", { count: unified.length })}
      </div>
      <div className="aidiff-glass-dropdown__scroll">
        {filtered.length === 0 ? (
          <div className="aidiff-glass-dropdown__empty">{t("slotPicker.noMatches")}</div>
        ) : (
          filtered.map((m, idx) => {
            const sel = m.providerKey === providerKey && m.value === modelValue;
            const hi = idx === highlight;
            return (
              <div
                key={`${m.providerKey}:${m.value}`}
                id={`slot-${slotIndex}-opt-${idx}`}
                role="option"
                aria-selected={sel}
                className="aidiff-glass-dropdown__row"
                data-active={hi ? "true" : undefined}
                onMouseEnter={() => setHighlight(idx)}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onSlotChange({ providerKey: m.providerKey, modelValue: m.value });
                  setOpen(false);
                }}
                style={{ fontWeight: sel ? 600 : 400 }}
              >
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{m.label}</span>
                <span style={{ fontSize: 9, color: "var(--t3)", flexShrink: 0 }}>{m.sub}</span>
                {sel && (
                  <svg style={{ flexShrink: 0 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="aidiff-glass-dropdown__search-wrap">
        <input
          ref={inputRef}
          type="search"
          value={query}
          placeholder={t("slotPicker.searchPlaceholder")}
          aria-label={t("slotPicker.searchAria")}
          className="aidiff-glass-dropdown__search"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlight(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setOpen(false);
              return;
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(h + 1, Math.max(0, filtered.length - 1)));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(h - 1, 0));
            } else if (e.key === "Enter" && filtered[highlight]) {
              e.preventDefault();
              const m = filtered[highlight];
              onSlotChange({ providerKey: m.providerKey, modelValue: m.value });
              setOpen(false);
            }
          }}
        />
      </div>
    </div>
  );

  return (
    <div ref={rootRef} style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <div
        ref={anchorRef}
        className={onRemoveColumn ? "aidiff-glass-slot-trigger-row aidiff-glass-slot-trigger-row--closable" : "aidiff-glass-slot-trigger-row"}
        style={{ borderRadius: hoverRadius }}
      >
        <button
          type="button"
          className="aidiff-glass-slot-trigger"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={listboxId}
          aria-label={!hasModel && emptyPlaceholder ? emptyPlaceholder : undefined}
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: hasModel ? provider.dot : "var(--t3)", flexShrink: 0, opacity: hasModel ? 1 : 0.55 }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: hasModel ? "var(--t2)" : "var(--t3)",
              flex: 1,
              textAlign: "left",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentLabel}
          </span>
          {hasModel ? <span style={{ fontSize: 10, color: "var(--t3)", flexShrink: 0 }}>{provider.sub}</span> : <span style={{ width: 1, flexShrink: 0 }} aria-hidden />}
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {onRemoveColumn ? (
          <button
            type="button"
            className="aidiff-glass-slot-remove"
            aria-label={removeColumnAriaLabel}
            title={removeColumnTitle}
            onMouseDown={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onRemoveColumn();
            }}
          >
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        ) : null}
      </div>
      {open && createPortal(dropdownPanel, document.body)}
    </div>
  );
}
