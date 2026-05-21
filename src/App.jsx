import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DIFF_ANALYSIS_MODEL, SETTINGS_PROVIDER_ORDER } from "./constants/appConfig.js";
import { AnimatedBrandLogo } from "./components/AnimatedBrandLogo.jsx";
import { CollapsedRun } from "./components/CollapsedRun.jsx";
import { CompareModeSwitch } from "./components/CompareModeSwitch.jsx";
import { Dots } from "./components/Dots.jsx";
import { ComposerModelSlots } from "./components/ComposerModelSlots.jsx";
import { ComposerPromptCompare } from "./components/ComposerPromptCompare.jsx";
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
import { buildDiffSystem } from "./i18n/prompts.js";
import { useI18n } from "./i18n/I18nContext.jsx";
import { defaultCompareSlotsTwo, defaultModelOptions, getActiveSlotIndices, getProvider, migrateCompareSlotsForApiKeys, resolveModelLabel } from "./lib/modelUtils.js";

const COLOR_SCHEME_STORAGE_KEY = "aidiff-color-scheme";

/** Meta-Analyse: UI vorerst aus, bis Feature fertig ist. */
const META_ANALYSIS_ENABLED = false;

function readStoredColorSchemeIsDark() {
  if (typeof window === "undefined") return false;
  try {
    const s = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY);
    if (s === "dark") return true;
    if (s === "light") return false;
  } catch {
    /* ignore */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Light/Dark: `role="switch"`, Sonne = Hell, Mond = Dunkel. */
function ThemeSchemeToggle({ isDark, onToggle, ariaLabel }) {
  return (
    <button
      type="button"
      className="aidiff-theme-scheme-switch"
      role="switch"
      aria-checked={isDark}
      aria-label={ariaLabel}
      onClick={onToggle}
    >
      <span className="aidiff-theme-scheme-switch__track">
        <span className="aidiff-theme-scheme-switch__thumb" aria-hidden />
        <span className="aidiff-theme-scheme-switch__icons" aria-hidden>
          <svg
            className="aidiff-theme-scheme-switch__icon aidiff-theme-scheme-switch__icon--sun"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
          <svg
            className="aidiff-theme-scheme-switch__icon aidiff-theme-scheme-switch__icon--moon"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </span>
      </span>
    </button>
  );
}

function draftHasAnyConfiguredApiKey(draft) {
  return ["claude", "gemini", "gpt"].some((k) => String(draft[k] ?? "").trim().length > 0);
}

/** Header control: gear icon + label (same glass control style as composer). */
function HeaderSettingsButton({ label, onClick, disabled }) {
  return (
    <button
      type="button"
      className="aidiff-glass-control"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      style={{
        padding: "6px 12px",
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "0.01em",
        color: "var(--t2)",
        maxWidth: "100%",
        opacity: disabled ? 0.45 : 1,
        cursor: disabled ? "not-allowed" : undefined,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
      <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</span>
    </button>
  );
}

export default function App() {
  const { t, locale } = useI18n();
  const [prompt, setPrompt] = useState("");
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState(null);
  const [isDark, setIsDark] = useState(() => readStoredColorSchemeIsDark());
  const [compareSlots, setCompareSlots] = useState(() => defaultCompareSlotsTwo());
  const [compareMode, setCompareMode] = useState(/** @type {"models" | "prompts"} */ ("models"));
  const [promptSlot, setPromptSlot] = useState(() => ({ ...defaultCompareSlotsTwo()[0] }));
  const [promptDrafts, setPromptDrafts] = useState(() => ["", ""]);
  const promptTextareaRefs = useRef([]);
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
  const [apiKeysCommitted, setApiKeysCommitted] = useState({ claude: "", gemini: "", gpt: "" });
  const [apiKeysBootstrap, setApiKeysBootstrap] = useState(/** @type {"loading" | "ready" | "error"} */ ("loading"));
  const [apiKeysConfigured, setApiKeysConfigured] = useState(false);
  const [settingsKeysLoading, setSettingsKeysLoading] = useState(false);
  const [settingsKeysError, setSettingsKeysError] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const bottomRef = useRef(null);
  const settingsMenuRef = useRef(null);
  const settingsModalRef = useRef(null);
  const scrollAreaRef = useRef(null);
  const composerDockRef = useRef(null);
  const [scrollAreaVBarPx, setScrollAreaVBarPx] = useState(0);

  const dockedInHeader = runs.length > 0;
  const apiKeysGateActive = apiKeysBootstrap === "ready" && !apiKeysConfigured;
  const settingsModalOpen = settingsOpen || apiKeysGateActive;

  useLayoutEffect(() => {
    if (runs.length === 0) {
      setScrollAreaVBarPx(0);
      return;
    }
    const measure = () => {
      const el = scrollAreaRef.current;
      if (!el) return;
      setScrollAreaVBarPx(el.offsetWidth - el.clientWidth);
    };
    measure();
    const el = scrollAreaRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    const t = window.setTimeout(measure, 0);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.clearTimeout(t);
    };
  }, [runs, expandedRuns, showMeta, running]);

  /** Scroll-Fläche: unteren Abstand = reale Höhe des fixierten Composer-Docks (Moduswechsel, 2/3 Prompts, Datei-Chip). */
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (runs.length === 0) {
      root.style.removeProperty("--aidiff-composer-clearance");
      return undefined;
    }
    const el = composerDockRef.current;
    if (!el) return undefined;
    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height);
      root.style.setProperty("--aidiff-composer-clearance", `${Math.max(h + 16, 140)}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
      root.style.removeProperty("--aidiff-composer-clearance");
    };
  }, [runs.length]);

  useEffect(() => {
    document.documentElement.setAttribute("data-color-scheme", isDark ? "dark" : "light");
    try {
      localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, isDark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [isDark]);

  useEffect(() => {
    let fontLink = document.getElementById("aidiff-unbounded-font");
    if (!fontLink) {
      fontLink = document.createElement("link");
      fontLink.id = "aidiff-unbounded-font";
      fontLink.rel = "stylesheet";
      fontLink.href = "https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700&display=swap";
      document.head.appendChild(fontLink);
    }
    const style = document.createElement("style");
    style.textContent = `
      :root{--bg:#fff;--bg2:#f7f7f5;--bg3:#efefed;--text:#1a1a1a;--t2:#6b7280;--t3:#9ca3af;--border:rgba(0,0,0,0.08);--border2:rgba(0,0,0,0.14);--danger:#dc2626;--modal-input-bg:#f3f4f6;--modal-input-border:rgba(0,0,0,0.12);--modal-input-border-hover:rgba(0,0,0,0.2);--modal-input-border-focus:#1a1a1a;--modal-input-ring:rgba(26,26,26,0.12);--modal-secondary-border:rgba(0,0,0,0.14);--modal-secondary-hover:rgba(0,0,0,0.06);--aidiff-composer-clearance:clamp(160px, 22vh, 280px);}
      :root[data-color-scheme="dark"]{--bg:#0f1115;--bg2:#181b22;--bg3:#222830;--text:#f4f4f5;--t2:#c4c9d4;--t3:#9aa3b2;--border:rgba(255,255,255,0.12);--border2:rgba(255,255,255,0.2);--danger:#fb7185;--modal-input-bg:#14181f;--modal-input-border:rgba(255,255,255,0.16);--modal-input-border-hover:rgba(255,255,255,0.28);--modal-input-border-focus:#f4f4f5;--modal-input-ring:rgba(244,244,245,0.22);--modal-secondary-border:rgba(255,255,255,0.2);--modal-secondary-hover:rgba(255,255,255,0.08);}
      *{box-sizing:border-box;margin:0;padding:0;}
      html,body,#root{height:100%;}
      #root{min-height:100%;background-color:var(--bg);background-image:var(--app-mesh-bg);background-attachment:fixed;}
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
      .scroll-area{flex:1;overflow-y:auto;scrollbar-gutter:stable;padding:20px 24px;padding-bottom:calc(12px + var(--aidiff-composer-clearance) + env(safe-area-inset-bottom, 0px));}
      .scroll-area::-webkit-scrollbar{width:6px;}
      .scroll-area::-webkit-scrollbar-track{background:transparent;}
      .scroll-area::-webkit-scrollbar-thumb{background:var(--border2);border-radius:var(--radius-micro);}
      .composer-wrap{position:fixed;left:0;right:0;bottom:0;z-index:28;padding:10px 24px calc(32px + env(safe-area-inset-bottom, 0px));background:transparent;pointer-events:none;overflow:visible;}
      .composer-wrap .composer-inner{pointer-events:auto;overflow:visible;display:flex;flex-direction:column;gap:12px;}
      .aidiff-meta-above-composer{flex-shrink:0;padding:0 24px;padding-bottom:calc(10px + var(--aidiff-composer-clearance) + env(safe-area-inset-bottom, 0px));}
    `;
    document.head.appendChild(style);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings/keys")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((parsed) => {
        if (cancelled) return;
        const draft = {
          claude: typeof parsed.claude === "string" ? parsed.claude : "",
          gemini: typeof parsed.google === "string" ? parsed.google : "",
          gpt: typeof parsed.openai === "string" ? parsed.openai : "",
        };
        setApiKeysDraft(draft);
        setApiKeysCommitted(draft);
        setApiKeysConfigured(draftHasAnyConfiguredApiKey(draft));
        setApiKeysBootstrap("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setApiKeysBootstrap("error");
        setApiKeysConfigured(true);
      });
    return () => {
      cancelled = true;
    };
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
        const draft = {
          claude: typeof parsed.claude === "string" ? parsed.claude : "",
          gemini: typeof parsed.google === "string" ? parsed.google : "",
          gpt: typeof parsed.openai === "string" ? parsed.openai : "",
        };
        setApiKeysDraft(draft);
        setApiKeysCommitted(draft);
        setApiKeysConfigured(draftHasAnyConfiguredApiKey(draft));
      })
      .catch(() => {
        if (cancelled) return;
        setSettingsKeysError(
          t("settings.keysLoadError")
        );
      })
      .finally(() => {
        if (!cancelled) setSettingsKeysLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [settingsOpen, t]);

  useEffect(() => {
    if (!settingsModalOpen) return;
    const onDown = (e) => {
      if (apiKeysGateActive) return;
      const el = settingsMenuRef.current;
      const modal = settingsModalRef.current;
      if (el && el.contains(e.target)) return;
      if (modal && modal.contains(e.target)) return;
      setSettingsOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !apiKeysGateActive) setSettingsOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [settingsModalOpen, apiKeysGateActive]);

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

  useEffect(() => {
    if (!modelListsLoaded) return;
    setCompareSlots((prev) => migrateCompareSlotsForApiKeys(prev, apiKeysCommitted, modelOptions));
  }, [modelListsLoaded, apiKeysCommitted, modelOptions]);

  useEffect(() => {
    if (!modelListsLoaded) return;
    setPromptSlot((prev) => {
      const opts = modelOptions[prev.providerKey];
      if (!opts?.length) return prev;
      if (opts.some((o) => o.value === prev.modelValue)) return prev;
      return { ...prev, modelValue: opts[0].value };
    });
  }, [modelListsLoaded, modelOptions]);

  useEffect(() => {
    if (!modelListsLoaded) return;
    setPromptSlot((prev) => migrateCompareSlotsForApiKeys([prev], apiKeysCommitted, modelOptions)[0]);
  }, [modelListsLoaded, apiKeysCommitted, modelOptions]);

  const handleCompareMode = useCallback(
    (next) => {
      if (next === compareMode || running) return;
      if (next === "prompts") {
        const first = compareSlots[0];
        if (first) setPromptSlot({ ...first });
      } else {
        setCompareSlots((prev) => {
          const rest = prev.slice(1);
          return [{ ...promptSlot }, ...rest].slice(0, Math.max(2, prev.length));
        });
      }
      setCompareMode(next);
    },
    [compareMode, running, compareSlots, promptSlot]
  );

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

  const trimmedPromptVariants = useMemo(() => promptDrafts.map((s) => String(s).trim()).filter(Boolean), [promptDrafts]);
  const canSend =
    !running &&
    (compareMode === "models" ? prompt.trim().length > 0 || !!file : trimmedPromptVariants.length >= 2);

  const doRun = useCallback(async () => {
    if (!canSend) return;
    const isModels = compareMode === "models";
    const fileAppend = fileContent ? `\n\n${t("composer.fileBlock", { name: file?.name || "" })}\n${fileContent}` : "";

    let p = "";
    /** @type {string[]} */
    let variants = [];
    let snapshot;

    if (isModels) {
      p = prompt.trim();
      snapshot = compareSlots.map((s) => ({ ...s }));
    } else {
      variants = promptDrafts.map((s) => s.trim()).filter(Boolean);
      if (variants.length < 2) return;
      const cell = { ...promptSlot };
      snapshot = variants.map(() => ({ ...cell }));
    }

    if (isModels) {
      setPrompt("");
    } else {
      setPromptDrafts(["", ""]);
    }
    setFile(null);
    setFileContent(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    promptTextareaRefs.current.forEach((ta) => {
      if (ta) ta.style.height = "auto";
    });
    setRunning(true);
    setShowMeta(false);

    const runId = Date.now();
    const n = snapshot.length;
    const activeIndices = Array.from({ length: n }, (_, i) => i);
    const usedThird = n === 3;
    const newRun = {
      id: runId,
      ...(isModels ? {} : { compareKind: "prompts", promptVariants: variants }),
      prompt: isModels ? p : variants[0] || "",
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
          return Promise.reject(new Error(t("errors.modelNotInList", { id: slot.modelValue })));
        }
        const pr = getProvider(slot.providerKey);
        const label = resolveModelLabel(slot.providerKey, slot.modelValue, modelOptions);
        const systemPrompt = pr.system(label);
        const userBody = (isModels ? p : variants[i]) + fileAppend;
        if (slot.providerKey === "gpt") return callOpenAIAPI(systemPrompt, userBody, slot.modelValue);
        if (slot.providerKey === "claude") return callAnthropicAPI(systemPrompt, userBody, slot.modelValue);
        return callGoogleAPI(systemPrompt, userBody, slot.modelValue);
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
        /* no markStaleCatalogRetried — retry possible on next run */
      } finally {
        setCatalogRefreshing(false);
      }
    }

    if (activeIndices.every((i) => nr[i])) {
      setRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, diffLoading: true } : r)));
      try {
        const slotCount = activeIndices.length;
        let header;
        let blocks;
        if (isModels) {
          header = t("diff.user.promptLine", { prompt: p });
          blocks = activeIndices.map((i, k) => {
            const label = resolveModelLabel(snapshot[i].providerKey, snapshot[i].modelValue, modelOptions);
            return `${t("diff.user.answerHeader", { label, n: k + 1 })}\n${nr[i]}`;
          });
        } else {
          const modelLabel = resolveModelLabel(snapshot[0].providerKey, snapshot[0].modelValue, modelOptions);
          header = `${t("diff.user.sameModelMultiplePrompts", { model: modelLabel })}\n\n${variants
            .map((text, k) => t("diff.user.promptVariantBlock", { n: k + 1, text }))
            .join("\n\n")}`;
          blocks = activeIndices.map((i, k) => {
            const raw = variants[k] || "";
            const shortP = raw.replace(/\s+/g, " ").trim();
            const clipped = shortP.length > 56 ? `${shortP.slice(0, 55)}…` : shortP;
            const label = `${t("composer.promptColumnLabel", { n: k + 1 })} — ${clipped}`;
            return `${t("diff.user.answerHeader", { label, n: k + 1 })}\n${nr[i]}`;
          });
        }
        const dp = `${header}\n\n${blocks.join("\n\n")}`;
        const { text } = await callGoogleAPI(buildDiffSystem(slotCount, locale), dp, DIFF_ANALYSIS_MODEL, { maxOutputTokens: 4096 });
        setRuns((prev) => prev.map((r) => (r.id === runId ? { ...r, diff: text, diffLoading: false } : r)));
      } catch (e) {
        const msg = e?.message ? String(e.message).slice(0, 500) : t("errors.unknown");
        setRuns((prev) =>
          prev.map((r) => (r.id === runId ? { ...r, diff: t("run.diffAnalysisFailed", { model: DIFF_ANALYSIS_MODEL, message: msg }), diffLoading: false } : r))
        );
      }
    }
  }, [
    canSend,
    compareMode,
    prompt,
    promptDrafts,
    promptSlot,
    file,
    fileContent,
    compareSlots,
    modelOptions,
    catalogUpdatedAt,
    locale,
    t,
    trimmedPromptVariants,
  ]);

  const completedRuns = runs.filter((r) => getActiveSlotIndices(r).every((i) => r.results[i] || r.errors[i]));
  const providerSettingRows = useMemo(() => SETTINGS_PROVIDER_ORDER.map((key) => getProvider(key)), []);
  const apiKeysForPicker = apiKeysBootstrap === "ready" ? apiKeysCommitted : undefined;

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
        if (!res.ok) throw new Error(t("settings.saveFailedHttp", { status: res.status }));
        setApiKeysCommitted(apiKeysDraft);
        setApiKeysConfigured(draftHasAnyConfiguredApiKey(apiKeysDraft));
        setSettingsOpen(false);
      })
      .catch((e) => {
        setSettingsKeysError(e?.message || t("settings.saveFailedGeneric"));
      });
  }, [apiKeysDraft, t]);

  const settingsModal = (
    <SettingsModal
      open={settingsModalOpen}
      gateMode={apiKeysGateActive}
      onClose={() => setSettingsOpen(false)}
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
      className="aidiff-liquid-glass aidiff-liquid-glass--composer-root"
      style={{ cursor: "text" }}
      onClick={(e) => {
        if (e.target.closest("textarea")) return;
        if (compareMode === "models") textareaRef.current?.focus();
        else promptTextareaRefs.current[0]?.focus();
      }}
    >
      <div className="aidiff-composer-slots-strip">
        {compareMode === "models" ? (
          <ComposerModelSlots
            compareSlots={compareSlots}
            setCompareSlots={setCompareSlots}
            modelOptions={modelOptions}
            listsLoading={!modelListsLoaded || catalogRefreshing}
            apiKeysCommitted={apiKeysForPicker}
          />
        ) : (
          <ComposerPromptCompare
            promptSlot={promptSlot}
            setPromptSlot={setPromptSlot}
            promptDrafts={promptDrafts}
            setPromptDrafts={setPromptDrafts}
            modelOptions={modelOptions}
            listsLoading={!modelListsLoaded || catalogRefreshing}
            apiKeysCommitted={apiKeysForPicker}
            textareaRefs={promptTextareaRefs}
            running={running}
            onPromptKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                doRun();
              }
            }}
          />
        )}
      </div>
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
      {compareMode === "models" ? (
        <textarea
          ref={textareaRef}
          value={prompt}
          placeholder={t("composer.placeholder")}
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
      ) : null}
      <div className="aidiff-composer-toolbar" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 8 }}>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <ComposerStyleIconButton ariaLabel={t("composer.attachFile")} onClick={() => fileInputRef.current?.click()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </ComposerStyleIconButton>
            <input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.json,.py,.js,.ts,.html,.css" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            {runs.length >= 2 && (
              <button
                type="button"
                className="aidiff-glass-pill"
                aria-disabled="true"
                title={t("composer.metaAnalysisWip")}
                onClick={(e) => {
                  e.stopPropagation();
                }}
                style={{ opacity: 0.52, cursor: "not-allowed" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {t("composer.metaAnalysisRuns", { count: runs.length })}
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              type="button"
              className="aidiff-glass-send"
              onClick={(e) => {
                e.stopPropagation();
                doRun();
              }}
              disabled={!canSend}
              aria-label={t("composer.send")}
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

  if (apiKeysBootstrap === "loading") {
    return (
      <div
        style={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "inherit",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ position: "absolute", top: 12, right: 24, zIndex: 10 }}>
          <ThemeSchemeToggle
            isDark={isDark}
            onToggle={() => setIsDark((d) => !d)}
            ariaLabel={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
          />
        </div>
        <AnimatedBrandLogo dockedInHeader={false} />
        <div style={{ marginTop: 28 }}>
          <Dots />
        </div>
        <p style={{ marginTop: 18, fontSize: 14, color: "var(--t2)", maxWidth: 360, lineHeight: 1.5 }}>{t("settings.keysBootstrapLoading")}</p>
      </div>
    );
  }

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
            padding: "12px 24px",
            background: "transparent",
          }}
        >
          <HeaderWordmark dockedInHeader={false} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <ThemeSchemeToggle
              isDark={isDark}
              onToggle={() => setIsDark((d) => !d)}
              ariaLabel={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
            />
            <div ref={settingsMenuRef} style={{ position: "relative" }}>
              <HeaderSettingsButton
                label={t("settings.headerButton")}
                disabled={apiKeysGateActive}
                onClick={() => setSettingsOpen((o) => !o)}
              />
            </div>
          </div>
        </header>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100%",
            }}
          >
            {/* Gleiches flex-Grow wie unten → Block vertikal zentriert; minHeight hält Inhalt unter dem Logo */}
            <div
              aria-hidden
              style={{
                flex: "1 1 0%",
                minHeight: "max(0px, calc(50vh - 112px - 56px + 12px))",
                minWidth: 0,
              }}
            />
            <div
              style={{
                flex: "0 0 auto",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "0 24px 32px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  width: "100%",
                  maxWidth: 672,
                  flexShrink: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "stretch",
                  gap: 16,
                  position: "relative",
                  zIndex: 5,
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(22px, 3.8vw, 30px)",
                    fontWeight: 700,
                    fontFamily: '"Unbounded", system-ui, sans-serif',
                    color: "var(--text)",
                    textAlign: "center",
                    letterSpacing: "0.005em",
                    lineHeight: 1.25,
                    flexShrink: 0,
                  }}
                >
                  {t("emptyState.title")}
                </div>
                <CompareModeSwitch mode={compareMode} onModeChange={handleCompareMode} disabled={running} />
                <div style={{ position: "relative", zIndex: 0, flexShrink: 0 }}>{composerBlock}</div>
              </div>
            </div>
            <div aria-hidden style={{ flex: "1 1 0%", minHeight: 0, minWidth: 0 }} />
          </div>
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
          padding: `12px calc(24px + ${scrollAreaVBarPx}px) 12px 24px`,
          background: "transparent",
        }}
      >
        <HeaderWordmark dockedInHeader={dockedInHeader} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <ThemeSchemeToggle
            isDark={isDark}
            onToggle={() => setIsDark((d) => !d)}
            ariaLabel={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
          />
          <div ref={settingsMenuRef} style={{ position: "relative" }}>
            <HeaderSettingsButton
              label={t("settings.headerButton")}
              disabled={apiKeysGateActive}
              onClick={() => setSettingsOpen((o) => !o)}
            />
          </div>
        </div>
      </header>
      <div className="scroll-area" ref={scrollAreaRef}>
        {runs.slice(0, -1).map((r) => (
          <div key={r.id} style={{ marginBottom: 12 }}>
            {expandedRuns.has(r.id) ? (
              <RunEntry
                key={r.id}
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
              <CollapsedRun run={r} modelOptions={modelOptions} onExpand={() => setExpandedRuns((prev) => new Set([...prev, r.id]))} />
            )}
          </div>
        ))}

        {runs.length > 0 && (
          <div style={{ marginBottom: 8, animation: "fadeIn 0.2s ease" }}>
            <RunEntry
              key={runs[runs.length - 1].id}
              run={runs[runs.length - 1]}
              isDark={isDark}
              modelOptions={modelOptions}
            />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {META_ANALYSIS_ENABLED && showMeta && completedRuns.length >= 2 && (
        <div className="aidiff-meta-above-composer">
          <MetaPanel runs={completedRuns} onClose={() => setShowMeta(false)} modelOptions={modelOptions} />
        </div>
      )}

      <div className="composer-wrap" ref={composerDockRef}>
        <div className="composer-inner" style={{ maxWidth: 672, margin: "0 auto" }}>
          <CompareModeSwitch mode={compareMode} onModeChange={handleCompareMode} disabled={running} />
          {composerBlock}
        </div>
      </div>
      {settingsModal}
    </div>
  );
}
