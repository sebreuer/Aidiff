import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AIDIFF_USE_MOCK, DIFF_ANALYSIS_MODEL, buildDiffSystem, SETTINGS_PROVIDER_ORDER } from "./constants/appConfig.js";
import { AnimatedBrandLogo } from "./components/AnimatedBrandLogo.jsx";
import { CollapsedRun } from "./components/CollapsedRun.jsx";
import { ComposerModelSlots } from "./components/ComposerModelSlots.jsx";
import { ComposerStyleIconButton } from "./components/ComposerStyleIconButton.jsx";
import { FileChip } from "./components/FileChip.jsx";
import { HeaderWordmark } from "./components/HeaderWordmark.jsx";
import { MetaPanel } from "./components/MetaPanel.jsx";
import { RunEntry } from "./components/RunEntry.jsx";
import { SettingsModal } from "./components/SettingsModal.jsx";
import { callAnthropicAPI, callGoogleAPI, callOpenAIAPI } from "./lib/api.js";
import {
  errorSuggestsStaleModelCatalog,
  fetchPersistModelCatalog,
  hasAlreadyStaleCatalogRetried,
  isCatalogFresh,
  markStaleCatalogRetried,
  readModelCatalogFromStorage,
} from "./lib/modelCatalog.js";
import { defaultCompareSlotsTwo, defaultModelOptions, getActiveSlotIndices, getProvider, resolveModelLabel } from "./lib/modelUtils.js";
import { SHADOWS } from "./theme/tokens.js";

export default function App() {
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [composerHovered, setComposerHovered] = useState(false);
  const [composerFocused, setComposerFocused] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [compareSlots, setCompareSlots] = useState(() => defaultCompareSlotsTwo());
  const [modelOptions, setModelOptions] = useState(() => defaultModelOptions());
  const [modelListsLoaded, setModelListsLoaded] = useState(false);
  const [catalogUpdatedAt, setCatalogUpdatedAt] = useState(null);
  const [catalogRefreshing, setCatalogRefreshing] = useState(false);
  const [runs, setRuns] = useState([]);
  const [expandedRuns, setExpandedRuns] = useState(new Set());
  const [running, setRunning] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKeysDraft, setApiKeysDraft] = useState({ claude: "", gemini: "", gpt: "" });
  const [settingsKeysLoading, setSettingsKeysLoading] = useState(false);
  const [settingsKeysError, setSettingsKeysError] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const settingsMenuRef = useRef(null);
  const settingsModalRef = useRef(null);

  const dockedInHeader = runs.length > 0;

  useEffect(() => {
    let fontLink = document.getElementById("aidiff-unbounded-font");
    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.id = "aidiff-unbounded-font";
      fontLink.rel = "stylesheet";
      fontLink.href = "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700&display=swap";
      document.head.appendChild(fontLink);
    }
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    mq.addEventListener("change", (e) => setIsDark(e.matches));
    const style = document.createElement("style");
    style.textContent = `
      :root{--bg:#fff;--bg2:#f7f7f5;--bg3:#efefed;--text:#1a1a1a;--t2:#6b7280;--t3:#9ca3af;--border:rgba(0,0,0,0.08);--border2:rgba(0,0,0,0.14);--danger:#dc2626;--modal-input-bg:#f3f4f6;--modal-input-border:rgba(0,0,0,0.12);--modal-input-border-hover:rgba(0,0,0,0.2);--modal-input-border-focus:#1a1a1a;--modal-input-ring:rgba(26,26,26,0.12);--modal-secondary-border:rgba(0,0,0,0.14);--modal-secondary-hover:rgba(0,0,0,0.06);}
      @media(prefers-color-scheme:dark){:root{--bg:#1e1e1e;--bg2:#2a2a2a;--bg3:#333;--text:#ececec;--t2:#9ca3af;--t3:#6b7280;--border:rgba(255,255,255,0.08);--border2:rgba(255,255,255,0.14);--modal-input-bg:#141414;--modal-input-border:rgba(255,255,255,0.12);--modal-input-border-hover:rgba(255,255,255,0.22);--modal-input-border-focus:#e5e5e5;--modal-input-ring:rgba(255,255,255,0.12);--modal-secondary-border:rgba(255,255,255,0.16);--modal-secondary-hover:rgba(255,255,255,0.06);}}
      *{box-sizing:border-box;margin:0;padding:0;}
      html,body,#root{height:100%;}
      body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:var(--text);background:transparent;overflow:hidden;}
      textarea::placeholder{color:var(--t3);}
      @keyframes kf{0%,80%,100%{opacity:.2}40%{opacity:1}}
      @keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
      @keyframes aidiffModalOverlayIn{from{opacity:0}to{opacity:1}}
      @keyframes aidiffModalDialogIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
      .aidiff-settings-overlay{animation:aidiffModalOverlayIn 200ms ease-out forwards}
      .aidiff-settings-dialog{animation:aidiffModalDialogIn 250ms cubic-bezier(0.165,0.85,0.45,1) forwards}
      .aidiff-settings-dialog:focus{outline:none}
      .aidiff-settings-form{display:flex;flex-direction:column;min-height:100%;padding:16px 20px 20px}
      @media (min-width:768px){.aidiff-settings-form{padding:24px 28px 28px}}
      .aidiff-settings-field input:not(:disabled){transition:border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease}
      .aidiff-settings-field input:not(:disabled):hover{border-color:var(--modal-input-border-hover)!important}
      .aidiff-settings-field input:not(:disabled):focus{border-color:var(--modal-input-border-focus)!important;box-shadow:0 0 0 3px var(--modal-input-ring)}
      .aidiff-settings-btn-primary:not(:disabled){transition:transform 0.15s cubic-bezier(0.165,0.85,0.45,1)}
      .aidiff-settings-btn-primary:not(:disabled):hover{transform:scale(1.02)}
      .aidiff-settings-btn-primary:not(:disabled):active{transform:scale(0.98)}
      .aidiff-settings-btn-secondary{transition:background 0.1s ease, border-color 0.1s ease, color 0.1s ease}
      .scroll-area{flex:1;overflow-y:auto;padding:20px 24px 12px;}
      .scroll-area::-webkit-scrollbar{width:6px;}
      .scroll-area::-webkit-scrollbar-track{background:transparent;}
      .scroll-area::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}
      .composer-wrap{flex-shrink:0;padding:10px 24px 20px;background:var(--bg);}
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    if (!settingsOpen) return;
    let cancelled = false;
    setSettingsKeysLoading(true);
    setSettingsKeysError("");
    fetch("/api/settings/keys")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((parsed) => {
        if (cancelled) return;
        setApiKeysDraft({
          claude: typeof parsed.claude === "string" ? parsed.claude : "",
          gemini: typeof parsed.google === "string" ? parsed.google : "",
          gpt: typeof parsed.openai === "string" ? parsed.openai : "",
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSettingsKeysError(
          "Keys konnten nicht geladen werden. Bitte Dev-Server neu starten (npm run dev) — der Endpunkt /api/settings/keys läuft nur in Vite, nicht als statische Datei."
        );
      })
      .finally(() => {
        if (!cancelled) setSettingsKeysLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [settingsOpen]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onDown = (e) => {
      const el = settingsMenuRef.current;
      const modal = settingsModalRef.current;
      if (el && el.contains(e.target)) return;
      if (modal && modal.contains(e.target)) return;
      setSettingsOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSettingsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsOpen]);

  useEffect(() => {
    let alive = true;
    const cached = readModelCatalogFromStorage();

    const applyCatalog = (options, fetchedAt) => {
      if (!alive) return;
      setModelOptions(options);
      setModelListsLoaded(true);
      setCatalogUpdatedAt(fetchedAt);
    };

    if (cached && isCatalogFresh(cached.fetchedAt)) {
      applyCatalog(cached.options, cached.fetchedAt);
      setCatalogRefreshing(false);
      return () => {
        alive = false;
      };
    }

    if (cached) {
      applyCatalog(cached.options, cached.fetchedAt);
    }

    setCatalogRefreshing(true);
    fetchPersistModelCatalog()
      .then(({ options, fetchedAt }) => {
        if (!alive) return;
        applyCatalog(options, fetchedAt);
      })
      .catch(() => {
        if (!alive) return;
        if (!cached) {
          applyCatalog(defaultModelOptions(), null);
        }
      })
      .finally(() => {
        if (alive) setCatalogRefreshing(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!modelListsLoaded) return;
    setCompareSlots((prev) =>
      prev.map((slot) => {
        const opts = modelOptions[slot.providerKey];
        if (!opts?.length) return slot;
        if (opts.some((o) => o.value === slot.modelValue)) return slot;
        return { ...slot, modelValue: opts[0].value };
      })
    );
  }, [modelListsLoaded, modelOptions]);

  const shadows = isDark ? SHADOWS.dark : SHADOWS.light;
  const composerShadow = composerFocused ? shadows.focus : composerHovered ? shadows.hover : shadows.default;

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, []);

  const handleFile = useCallback((f) => {
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => setFileContent(e.target.result);
    reader.readAsText(f);
  }, []);

  const canSend = (prompt.trim().length > 0 || !!file) && !running;

  const doRun = useCallback(async () => {
    if (!canSend) return;
    const p = prompt.trim();
    const fullPrompt = p + (fileContent ? `\n\n[Datei: ${file?.name}]\n${fileContent}` : "");
    setPrompt("");
    setFile(null);
    setFileContent(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setRunning(true);
    setShowMeta(false);

    const runId = Date.now();
    const snapshot = compareSlots.map((s) => ({ ...s }));
    const n = snapshot.length;
    const activeIndices = Array.from({ length: n }, (_, i) => i);
    const usedThird = n === 3;
    const newRun = {
      id: runId,
      prompt: p,
      slots: snapshot,
      usedThirdSlot: usedThird,
      results: {},
      metas: {},
      errors: {},
      loading: { 0: n > 0, 1: n > 1, 2: n > 2 },
      diff: "",
      diffLoading: false,
    };
    setRuns((prev) => [...prev, newRun]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);

    const settled = await Promise.allSettled(
      activeIndices.map((i) => {
        const slot = snapshot[i];
        const opts = modelOptions[slot.providerKey];
        if (opts?.length && !opts.some((o) => o.value === slot.modelValue)) {
          return Promise.reject(new Error(`Modell nicht in der geladenen Liste: ${slot.modelValue}`));
        }
        const pr = getProvider(slot.providerKey);
        const label = resolveModelLabel(slot.providerKey, slot.modelValue, modelOptions);
        const systemPrompt = pr.system(label);
        if (slot.providerKey === "gpt") return callOpenAIAPI(systemPrompt, fullPrompt, slot.modelValue);
        if (slot.providerKey === "claude") return callAnthropicAPI(systemPrompt, fullPrompt, slot.modelValue);
        return callGoogleAPI(systemPrompt, fullPrompt, slot.modelValue);
      })
    );

    const nr = {};
    const nm = {};
    const ne = {};
    const nl = { 0: false, 1: false, 2: false };
    activeIndices.forEach((slotIdx, j) => {
      if (settled[j].status === "fulfilled") {
        const { text, ...meta } = settled[j].value;
        nr[slotIdx] = text;
        nm[slotIdx] = { ...meta, text };
      } else ne[slotIdx] = settled[j].reason.message;
    });
    setRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, results: nr, metas: nm, errors: ne, loading: nl } : r)));
    setRunning(false);

    const catalogFetchedAtBeforeRetry = catalogUpdatedAt;
    const anyModelCatalogError = activeIndices.some((i) => ne[i] && errorSuggestsStaleModelCatalog(ne[i]));
    if (anyModelCatalogError && !hasAlreadyStaleCatalogRetried(catalogFetchedAtBeforeRetry)) {
      setCatalogRefreshing(true);
      try {
        const { options, fetchedAt } = await fetchPersistModelCatalog();
        setModelOptions(options);
        setCatalogUpdatedAt(fetchedAt);
        markStaleCatalogRetried(catalogFetchedAtBeforeRetry);
      } catch {
        /* kein markStaleCatalogRetried — erneuter Versuch beim nächsten Lauf möglich */
      } finally {
        setCatalogRefreshing(false);
      }
    }

    if (activeIndices.every((i) => nr[i])) {
      setRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, diffLoading: true } : r)));
      try {
        const slotCount = activeIndices.length;
        const dp = `Prompt: "${p}"\n\n${activeIndices
          .map((i, k) => `${resolveModelLabel(snapshot[i].providerKey, snapshot[i].modelValue, modelOptions)} (Antwort ${k + 1}):\n${nr[i]}`)
          .join("\n\n")}`;
        const { text } = await callGoogleAPI(buildDiffSystem(slotCount), dp, DIFF_ANALYSIS_MODEL, { maxOutputTokens: 4096 });
        setRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, diff: text, diffLoading: false } : r)));
      } catch (e) {
        const msg = e?.message ? String(e.message).slice(0, 500) : "Unbekannter Fehler";
        setRuns((prev) =>
          prev.map((r) => (r.id === runId ? { ...r, diff: `Unterschiede-Analyse fehlgeschlagen (${DIFF_ANALYSIS_MODEL}): ${msg}`, diffLoading: false } : r))
        );
      }
    }
  }, [canSend, prompt, file, fileContent, compareSlots, modelOptions, catalogUpdatedAt]);

  const completedRuns = runs.filter((r) => getActiveSlotIndices(r).every((i) => r.results[i] || r.errors[i]));
  const providerSettingRows = useMemo(() => SETTINGS_PROVIDER_ORDER.map((key) => getProvider(key)), []);

  const saveApiKeySettings = useCallback(() => {
    setSettingsKeysError("");
    fetch("/api/settings/keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        claude: apiKeysDraft.claude || "",
        google: apiKeysDraft.gemini || "",
        openai: apiKeysDraft.gpt || "",
      }),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`Speichern fehlgeschlagen (HTTP ${res.status}).`);
        setSettingsOpen(false);
      })
      .catch((e) => {
        setSettingsKeysError(e?.message || "Speichern fehlgeschlagen.");
      });
  }, [apiKeysDraft]);

  const settingsModal = (
    <SettingsModal
      open={settingsOpen}
      onClose={() => setSettingsOpen(false)}
      isDark={isDark}
      modalRef={settingsModalRef}
      settingsKeysError={settingsKeysError}
      settingsKeysLoading={settingsKeysLoading}
      providerSettingRows={providerSettingRows}
      apiKeysDraft={apiKeysDraft}
      setApiKeysDraft={setApiKeysDraft}
      onSave={saveApiKeySettings}
    />
  );

  const composerBlock = (
    <div
      onMouseEnter={() => setComposerHovered(true)}
      onMouseLeave={() => setComposerHovered(false)}
      style={{ borderRadius: 20, background: "var(--bg)", boxShadow: composerShadow, border: "1px solid transparent", transition: "box-shadow 0.15s ease", cursor: "text" }}
      onClick={() => textareaRef.current?.focus()}
    >
      <ComposerModelSlots
        compareSlots={compareSlots}
        setCompareSlots={setCompareSlots}
        modelOptions={modelOptions}
        listsLoading={!modelListsLoaded || catalogRefreshing}
      />
      {file && (
        <div style={{ padding: "10px 16px 0", display: "flex", flexWrap: "wrap", gap: 6 }}>
          <FileChip
            file={file}
            onRemove={() => {
              setFile(null);
              setFileContent(null);
            }}
          />
        </div>
      )}
      <textarea
        ref={textareaRef}
        value={prompt}
        placeholder="Zwei oder drei Modelle vergleichen…"
        onChange={(e) => {
          setPrompt(e.target.value);
          adjustHeight();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            doRun();
          }
        }}
        onFocus={() => setComposerFocused(true)}
        onBlur={() => setComposerFocused(false)}
        rows={1}
        style={{
          width: "100%",
          display: "block",
          minHeight: 52,
          maxHeight: 200,
          fontFamily: "inherit",
          fontSize: 15,
          lineHeight: "1.625",
          padding: "14px 16px 0",
          border: "none",
          outline: "none",
          resize: "none",
          background: "transparent",
          color: "var(--text)",
          overflowY: "auto",
          cursor: "text",
        }}
      />
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px 8px 6px" }}>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <ComposerStyleIconButton ariaLabel="Datei anhängen" onClick={() => fileInputRef.current?.click()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </ComposerStyleIconButton>
          <input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.json,.py,.js,.ts,.html,.css" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
          {runs.length >= 2 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMeta((v) => !v);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: showMeta ? "var(--bg3)" : "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: 8,
                color: showMeta ? "var(--text)" : "var(--t2)",
                fontSize: 12,
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--bg3)";
                e.currentTarget.style.color = "var(--text)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = showMeta ? "var(--bg3)" : "none";
                e.currentTarget.style.color = showMeta ? "var(--text)" : "var(--t2)";
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              Meta-Analyse ({runs.length} Runs)
            </button>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {AIDIFF_USE_MOCK && (
            <span
              role="status"
              title="Mock-Preset aktiv: Default-Slots starten mit drei Gemini-Flash-Modellen. API-Calls bleiben echt."
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: "0.02em",
                padding: "5px 11px",
                borderRadius: 999,
                fontFamily: "ui-serif, 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
                lineHeight: 1.2,
                userSelect: "none",
                ...(isDark
                  ? {
                      background: "rgba(217, 112, 87, 0.14)",
                      color: "#e8c8bf",
                      border: "1px solid rgba(232, 176, 158, 0.28)",
                      boxShadow: "0 1px 0 rgba(0,0,0,0.2) inset",
                    }
                  : {
                      background: "linear-gradient(180deg, #fdf9f7 0%, #f7f0ec 100%)",
                      color: "#5c3a32",
                      border: "1px solid rgba(217, 112, 87, 0.28)",
                      boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset, 0 0 0 1px rgba(255,255,255,0.4) inset",
                    }),
              }}
            >
              Mock
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              doRun();
            }}
            disabled={!canSend}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "none",
              cursor: canSend ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: canSend ? "var(--text)" : "var(--bg3)",
              color: canSend ? "var(--bg)" : "var(--t3)",
              transition: "background 0.15s, color 0.15s",
              flexShrink: 0,
            }}
          >
            {running ? (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="19" x2="12" y2="5" />
                <polyline points="5 12 12 5 19 12" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (runs.length === 0) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>
        <AnimatedBrandLogo dockedInHeader={false} />
        <header
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            boxSizing: "border-box",
            padding: "12px 24px 4px",
            background: "transparent",
          }}
        >
          <HeaderWordmark dockedInHeader={false} />
          <div ref={settingsMenuRef} style={{ position: "relative" }}>
            <ComposerStyleIconButton ariaLabel="Einstellungen" onClick={() => setSettingsOpen((o) => !o)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </ComposerStyleIconButton>
          </div>
        </header>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
          <div
            style={{
              fontSize: "clamp(22px, 3.8vw, 30px)",
              fontWeight: 700,
              fontFamily: '"Unbounded", system-ui, sans-serif',
              color: "var(--text)",
              marginBottom: 24,
              textAlign: "center",
              letterSpacing: "0.005em",
              lineHeight: 1.25,
            }}
          >
            Was wollen wir vergleichen?
          </div>
          <div style={{ width: "100%", maxWidth: 672 }}>{composerBlock}</div>
        </div>
        {settingsModal}
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", fontFamily: "inherit" }}>
      <AnimatedBrandLogo dockedInHeader={dockedInHeader} />
      <header
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          width: "100%",
          boxSizing: "border-box",
          padding: "12px 24px 4px",
          background: "transparent",
        }}
      >
        <HeaderWordmark dockedInHeader={dockedInHeader} />
        <div ref={settingsMenuRef} style={{ position: "relative" }}>
          <ComposerStyleIconButton ariaLabel="Einstellungen" onClick={() => setSettingsOpen((o) => !o)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </ComposerStyleIconButton>
        </div>
      </header>
      <div className="scroll-area">
        {runs.slice(0, -1).map((r) => (
          <div key={r.id} style={{ marginBottom: 12 }}>
            {expandedRuns.has(r.id) ? (
              <RunEntry
                run={r}
                isDark={isDark}
                modelOptions={modelOptions}
                onCollapse={() =>
                  setExpandedRuns((prev) => {
                    const s = new Set(prev);
                    s.delete(r.id);
                    return s;
                  })
                }
              />
            ) : (
              <CollapsedRun run={r} isDark={isDark} onExpand={() => setExpandedRuns((prev) => new Set([...prev, r.id]))} />
            )}
          </div>
        ))}

        {runs.length > 0 && (
          <div style={{ marginBottom: 8, animation: "fadeIn 0.2s ease" }}>
            <RunEntry run={runs[runs.length - 1]} isDark={isDark} modelOptions={modelOptions} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {showMeta && completedRuns.length >= 2 && (
        <div style={{ padding: "0 24px 10px", flexShrink: 0 }}>
          <MetaPanel runs={completedRuns} isDark={isDark} onClose={() => setShowMeta(false)} modelOptions={modelOptions} />
        </div>
      )}

      <div className="composer-wrap">
        <div style={{ maxWidth: 672, margin: "0 auto" }}>{composerBlock}</div>
      </div>
      {settingsModal}
    </div>
  );
}
