import { useEffect, useMemo, useRef, useState } from "react";
import { PROVIDERS } from "../constants/appConfig.js";
import { buildUnifiedModelEntries, getProvider, matchesModelSearchQuery, resolveModelLabel } from "../lib/modelUtils.js";
import { shadow, zIndex } from "../theme/tokens.js";

/** Eine Vergleichsspalte: Dropdown öffnet nach oben; Liste mit Höhenlimit; Suche unten, Tabs darüber. */
export function SearchableSlotPicker({ slotIndex, providerKey, modelValue, onSlotChange, modelOptions, listsLoading, position }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all");
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listboxId = `compare-slot-${slotIndex}-listbox`;
  const provider = getProvider(providerKey);

  const unified = useMemo(() => buildUnifiedModelEntries(modelOptions), [modelOptions]);

  const filtered = useMemo(() => {
    let base = unified;
    if (filterTab !== "all") base = unified.filter((e) => e.providerKey === filterTab);
    if (!query.trim()) return base;
    return base.filter((e) => matchesModelSearchQuery(query, e.label, e.value));
  }, [unified, filterTab, query]);

  useEffect(() => {
    setHighlight((h) => Math.min(h, Math.max(0, filtered.length - 1)));
  }, [filtered.length, query, filterTab]);

  useEffect(() => {
    const h = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setFilterTab("all");
      setHighlight(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const currentLabel = resolveModelLabel(providerKey, modelValue, modelOptions);
  const R = 19;
  const hoverRadius = position === "first" ? `${R}px 0 0 0` : position === "last" ? `0 ${R}px 0 0` : "0";

  const FILTER_TABS = [{ key: "all", label: "Alle" }, ...PROVIDERS.map((p) => ({ key: p.key, label: p.sub }))];

  return (
    <div ref={rootRef} style={{ position: "relative", flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "11px 14px",
          border: "none",
          borderRadius: hoverRadius,
          background: "transparent",
          color: "var(--text)",
          cursor: "pointer",
          fontFamily: "inherit",
          transition: "background 0.1s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg2)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: provider.dot, flexShrink: 0 }} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: "var(--t2)",
            flex: 1,
            textAlign: "left",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {currentLabel}
        </span>
        <span style={{ fontSize: 10, color: "var(--t3)", flexShrink: 0 }}>{provider.sub}</span>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--t3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Modell wählen"
          aria-activedescendant={filtered[highlight] ? `slot-${slotIndex}-opt-${highlight}` : undefined}
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            marginBottom: 4,
            maxHeight: "min(52vh, 400px)",
            background: "var(--bg)",
            border: "1px solid var(--border2)",
            borderRadius: 12,
            zIndex: zIndex.dropdown,
            boxShadow: shadow.dropdownUp,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ flexShrink: 0, padding: "6px 10px", fontSize: 9, color: "var(--t3)", borderBottom: "1px solid var(--border)", background: "var(--bg2)" }}>
            {listsLoading ? "Katalog wird geladen…" : `${unified.length} Modelle · Tab filtert die Liste`}
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: "14px 12px", fontSize: 12, color: "var(--t3)" }}>Keine Treffer</div>
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
                    onMouseEnter={() => setHighlight(idx)}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSlotChange({ providerKey: m.providerKey, modelValue: m.value });
                      setOpen(false);
                    }}
                    style={{
                      padding: "8px 12px",
                      fontSize: 12,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: hi ? "var(--bg2)" : "transparent",
                      color: "var(--text)",
                      fontWeight: sel ? 600 : 400,
                    }}
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
          <div
            role="tablist"
            aria-label="Anbieter filtern"
            style={{
              flexShrink: 0,
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              padding: "8px 8px 6px",
              borderTop: "1px solid var(--border)",
              background: "var(--bg)",
            }}
          >
            {FILTER_TABS.map((t) => {
              const active = filterTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFilterTab(t.key);
                    setHighlight(0);
                  }}
                  style={{
                    fontFamily: "inherit",
                    fontSize: 11,
                    padding: "4px 8px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    background: active ? "var(--bg3)" : "transparent",
                    color: active ? "var(--text)" : "var(--t2)",
                    fontWeight: active ? 500 : 400,
                  }}
                >
                  {t.key !== "all" && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: PROVIDERS.find((p) => p.key === t.key)?.dot, marginRight: 6, verticalAlign: "middle" }} />}
                  {t.label}
                </button>
              );
            })}
          </div>
          <div style={{ flexShrink: 0, padding: "0 8px 8px", borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
            <input
              ref={inputRef}
              type="search"
              value={query}
              placeholder="Modell suchen…"
              aria-label="Modell suchen"
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
              style={{
                width: "100%",
                boxSizing: "border-box",
                marginTop: 6,
                padding: "8px 10px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                fontSize: 13,
                fontFamily: "inherit",
                outline: "none",
                background: "var(--bg2)",
                color: "var(--text)",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
