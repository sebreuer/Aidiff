/**
 * English UI + LLM prompts + diff parser titles (single locale file).
 * Add `de.js` (same shape) and register it in `src/i18n/catalog.js`, then set `VITE_AIDIFF_LOCALE=de` or `setLocale('de')`.
 */
export default {
  messages: {
    tabs: {
      results: "Results",
      diff: "Differences",
      perf: "Performance",
    },
    emptyState: {
      title: "What should we compare?",
    },
    composer: {
      placeholder: "Compare two or three models…",
      attachFile: "Attach file",
      send: "Send",
      metaAnalysisRuns: "Meta analysis ({count} runs)",
      fileBlock: "[File: {name}]",
    },
    settings: {
      title: "Settings",
      gateTitle: "Add your API keys",
      gateSubtitle:
        "Aidiff needs at least one provider key (Anthropic, Google Gemini, or OpenAI). Keys are saved to your local `.env` when you continue.",
      gateSave: "Save and continue",
      keysBootstrapLoading: "Loading configuration…",
      headerButton: "Manage API Keys",
      close: "Close",
      cancel: "Cancel",
      save: "Save",
      loadingKeys: "Loading keys from .env…",
      keysLoadError:
        "Could not load keys. Restart the dev server (npm run dev) — the /api/settings/keys endpoint only runs in Vite, not as a static export.",
      saveFailedHttp: "Save failed (HTTP {status}).",
      saveFailedGeneric: "Save failed.",
      apiKeyLabel: "{provider} API key",
      apiKeyPlaceholder: "Paste {provider} key",
      apiKeyEditAria: "Edit {provider} API key",
      editTitle: "Edit",
    },
    meta: {
      title: "Meta analysis — {count} runs",
      close: "Close",
      error: "Something went wrong.",
      noAnswer: "(no answer)",
      runHeader: '--- Run {n}: "{prompt}" ---',
      perfSection: "Performance:",
      perfColumn: "Column {n} (runs with this column only): avg {latencySec}s, avg ${avgCost}/request",
    },
    diff: {
      analysisTitle: "Difference analysis",
      summaryModelTitle: "Model used for this summary",
      noProseUnderAssessment: 'No prose under "### Assessment".',
      miniComparisonPlaceholder:
        "No mini-comparison rows from the model yet — placeholders. The next run will show real values once the response format matches.",
      user: {
        promptLine: 'Prompt: "{prompt}"',
        answerHeader: "{label} (Answer {n}):",
      },
    },
    run: {
      collapseRun: "Collapse run",
      diffAnalysisFailed: "Difference analysis failed ({model}): {message}",
      fastestLatencyTitle: "Fastest latency ({time})",
      latencyTitle: "Latency {time}",
      fastestLatencyAria: "Fastest latency: {time}",
      latencyAria: "Latency: {time}",
      cheapestCostTitle: "Lowest cost ({cost})",
      costTitle: "Cost {cost}",
      cheapestCostAria: "Lowest cost: {cost}",
      costPer1kAria: "Cost per 1K tokens: {cost}",
    },
    perf: {
      costPerRequest: "Cost / request",
      latency: "Latency",
      outputTokens: "Output tokens",
      tps: "Tokens / sec.",
      outputInputRatio: "Output / input",
    },
    slotPicker: {
      chooseModel: "Choose model",
      loadingCatalog: "Loading catalog…",
      modelsHint: "{count} models",
      noMatches: "No matches",
      searchPlaceholder: "Search models…",
      searchAria: "Search models",
    },
    composerModelSlots: {
      removeColumn: "Remove column",
      removeColumnTitle: "Remove column",
      addThirdAria: "Add third model",
      addThirdTitle: "Third model",
      thirdPlaceholder: "Choose third model…",
    },
    fileChip: {
      removeAttachment: "Remove attachment",
    },
    errors: {
      modelNotInList: "Model not in the loaded list: {id}",
      unknown: "Unknown error",
    },
  },

  prompts: {
    metaSystem:
      "You analyze multiple runs from an AI comparison tool. Each run includes the user prompt and two or three parallel model answers (column count may vary). Describe: 1) Which model consistently shows which strengths across runs? 2) Which model would you recommend for this kind of prompt and why? Answer in English, concisely, in 2–3 paragraphs without bullet lists.",

    diffSystem2: `You analyze two parallel LLM answers (column order = Answer 1, Answer 2).

Infer the language of the user's task from the user message (the line starting with Prompt:). Write your entire reply in that language: headings, per-answer labels in Keywords, every mini-comparison row label and cell, and the Assessment. If the prompt mixes languages, follow the dominant language of that prompt line.

Use Markdown with three sections; section order is flexible; each section must appear once.

### Keywords
Use this heading or a natural equivalent in the target language (e.g. German: ### Stichworte). For each answer use a label in the target language (e.g. **Antwort 1:** / **Antwort 2:**). Then three to five short comma-separated keywords (tone, form).

### Mini comparison
Use this heading or another listed in the app (e.g. ### Kurzvergleich, ### Minivergleich, ### Mini-Vergleich). Write EXACTLY six rows in fixed semantic order — Opening, Tone, Length, Structure, Factuality, Closing — with plain-text row labels in the target language (format: RowLabel: value · value with no asterisk/markdown on labels or in cells). Each value between · must be at most THREE words (quick labels only, no sentences). No bold or other Markdown in this mini-comparison section at all.

Example (two answers, words in your language): Ton: knapp sachlich · warm ausführlich

Six lines, same semantics; use English row words or clear equivalents (e.g. German Einstieg, Ton, Umfang, Struktur, Sachlichkeit, Abschluss). If ambiguous for parsing, keep English row words Opening, Tone, Length, Structure, Factuality, Closing but cells still in the prompt's language.

### Assessment
Use ### Assessment or a natural equivalent (e.g. ### Einordnung, ### Bewertung). Write 2–4 paragraphs in the target language on similarities, differences, and focus of each answer. No further ### headings inside this section.

Scannability: highlight the most important similarities and differences by wrapping short spans in **bold** — decisive contrasts, recurring themes, notable names or short phrases, not whole sentences or paragraphs. Several bold phrases per paragraph are encouraged. No bullet lists.

Answer anchoring (required): Whenever bold marks a trait, judgment, or contrast that applies to a specific column, **always bold the answer label in the same sentence or clause** (in the target language, e.g. **Antwort 1**, **Answer 2**), so it is obvious which model is meant. Good: "**Antwort 1** fokussiert …, während **Antwort 2** … bietet." Bad: "Antwort 1 fokussiert …, während **nur Merkmale** fett sind." If you bold a comparative fragment, include the relevant **Answer n** / **Antwort n** (all that apply) in bold nearby. Only skip bolding an answer label when the bold span is genuinely about all answers together (e.g. a shared theme with no per-column split in that phrase).`,

    diffSystem3: `You analyze three parallel LLM answers (column order = Answer 1, Answer 2, Answer 3).

Infer the language of the user's task from the user message (the line starting with Prompt:). Write your entire reply in that language: headings, per-answer labels in Keywords, every mini-comparison row label and cell, and the Assessment. If the prompt mixes languages, follow the dominant language of that prompt line.

Use Markdown with three sections; section order is flexible; each section must appear once.

### Keywords
Use this heading or a natural equivalent in the target language (e.g. German: ### Stichworte). For each answer use a label in the target language (e.g. **Antwort 1:** … **Antwort 3:**). Then three to five short comma-separated keywords (tone, form).

### Mini comparison
Use this heading or another listed in the app (e.g. ### Kurzvergleich, ### Minivergleich, ### Mini-Vergleich). Write EXACTLY six rows in fixed semantic order — Opening, Tone, Length, Structure, Factuality, Closing — with plain-text row labels in the target language (format: RowLabel: v1 · v2 · v3 with no asterisk/markdown on labels or in cells). Each value between · must be at most THREE words (quick labels only, no sentences). No bold or other Markdown in this mini-comparison section at all.

Example (three answers, words in your language): Ton: knapp locker sachlich · formal statisch knapp · bildreich kurz knapp

Six lines, same semantics; use English row words or clear equivalents (e.g. German Einstieg, Ton, Umfang, Struktur, Sachlichkeit, Abschluss). If ambiguous for parsing, keep English row words Opening, Tone, Length, Structure, Factuality, Closing but cells still in the prompt's language.

### Assessment
Use ### Assessment or a natural equivalent (e.g. ### Einordnung, ### Bewertung). Write 2–4 paragraphs in the target language on similarities, differences, and focus of each answer. No further ### headings inside this section.

Scannability: highlight the most important similarities and differences by wrapping short spans in **bold** — decisive contrasts, recurring themes, notable names or short phrases, not whole sentences or paragraphs. Several bold phrases per paragraph are encouraged. No bullet lists.

Answer anchoring (required): Whenever bold marks a trait, judgment, or contrast that applies to a specific column, **always bold the answer label in the same sentence or clause** (in the target language, e.g. **Antwort 1**, **Answer 2**), so it is obvious which model is meant. Good: "**Antwort 1** fokussiert …, während **Antwort 2** … bietet." Bad: "Antwort 1 fokussiert …, während **nur Merkmale** fett sind." If you bold a comparative fragment, include the relevant **Answer n** / **Antwort n** (all that apply) in bold nearby. Only skip bolding an answer label when the bold span is genuinely about all answers together (e.g. a shared theme with no per-column split in that phrase).`,
  },

  diffParsing: {
    /** First match wins when extracting the mini-comparison block. Include legacy German headings for older stored runs. */
    miniSectionTitles: [
      "Mini comparison",
      "Mini-comparison",
      "Mini Comparison",
      "Mini comparison (short)",
      "Short comparison",
      "Minivergleich",
      "Mini-Vergleich",
      "Mini Vergleich",
      "Minivergleich (Kurz)",
      "Kurzvergleich",
      "Kurz-Vergleich",
    ],
    assessmentSectionTitles: ["Assessment", "Takeaways", "Summary", "Einordnung", "Bewertung", "Einschätzung"],
    rowOrder: ["Opening", "Tone", "Length", "Structure", "Factuality", "Closing"],
  },
};
