/** Localized mini-row labels → English canonical keys (rowOrder matching). */
const LEGACY_MINI_ROW_KEYS = {
  einstieg: "opening",
  öffnung: "opening",
  oeffnung: "opening",
  opening: "opening",
  ton: "tone",
  tone: "tone",
  länge: "length",
  laenge: "length",
  umfang: "length",
  length: "length",
  struktur: "structure",
  structure: "structure",
  sachlichkeit: "factuality",
  factuality: "factuality",
  abschluss: "closing",
  closing: "closing",
};

export function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {string} label
 * @param {string[]} rowOrder display labels (e.g. Opening, Tone, …)
 */
export function canonicalMiniRowKey(label, rowOrder) {
  const L = label.trim().toLowerCase();
  const mapped = LEGACY_MINI_ROW_KEYS[L];
  const want = (mapped || L).toLowerCase();
  const found = rowOrder.find((r) => r.toLowerCase() === want);
  return found ? found.toLowerCase() : L;
}

/**
 * Content under ##/### `title` until the next ##/### heading (order-independent).
 */
export function extractMarkdownSection(full, title) {
  const esc = escapeRegExp(title.trim());
  const re = new RegExp(
    `(?:^|\\r?\\n)(?:#{1,4})\\s*${esc}\\s*(?::\\s*)?(?:\\r?\\n)+([\\s\\S]*?)(?=\\r?\\n#{1,4}\\s[^\\n#]|$)`,
    "i"
  );
  const m = String(full).match(re);
  return m ? m[1].trim() : "";
}

export function normalizeMiniSeparators(s) {
  return String(s)
    .replace(/\u2022/g, "·")
    .replace(/\u2219/g, "·")
    .replace(/•/g, "·")
    .replace(/\s*\/\s*/g, " · ");
}

export function stripMiniMarkdownCell(s) {
  return String(s || "")
    .replace(/\*\*/g, "")
    .replace(/\*(?=\s|$)/g, "")
    .replace(/^\*+|\*+$/g, "")
    .trim();
}

/** Plain mini-table cell: strips markdown, caps at `maxWords` for a quick-scan overview. */
export function miniCellDisplayText(s, maxWords = 3) {
  const cleaned = stripMiniMarkdownCell(String(s ?? ""));
  const t = cleaned.trim();
  if (!t || t === "—") return t || "—";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length <= maxWords) return parts.join(" ");
  return `${parts.slice(0, maxWords).join(" ")}…`;
}

function isLikelyMiniTemplateRow(label, vals) {
  const L = `${label} ${vals.join(" ")}`.toLowerCase();
  if (/parametername|kurzwert\d|platzhalter|placeholder/i.test(L)) return true;
  if (label.length > 36) return true;
  return false;
}

/** @param {string} line @param {2 | 3} columnCount */
export function parseOneMinivergleichLine(line, columnCount = 3) {
  let t = line.trim();
  if (!t || /^#{1,4}\s/.test(t)) return null;
  t = t.replace(/^[-*]\s+/, "");
  let m = t.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
  if (!m) m = t.match(/^([^:#\n]{2,48}):\s*(.+)$/);
  if (!m) return null;
  const label = m[1].trim().replace(/\*+/g, "");
  if (/^(Antwort|Answer|Response|Spalte|Column)\s*[123]\b/i.test(label)) return null;
  if (/^(genau|jede|nur|schreibe|trenner|exactly|write|only|separator)/i.test(label)) return null;
  let rest = normalizeMiniSeparators(m[2].trim()).replace(/\s*#.*$/, "");
  let parts = rest
    .split(/\s*·\s*/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
  let vals = parts.slice(0, columnCount);
  if (vals.length < columnCount && rest.includes("|")) {
    vals = rest
      .split(/\s*\|\s*/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, columnCount);
  }
  if (vals.length < columnCount && /\s[-–—]\s/.test(rest)) {
    vals = rest
      .split(/\s+[-–—]\s+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, columnCount);
  }
  if (vals.length < columnCount && rest.includes(",")) {
    const c = rest.split(",").map((x) => x.trim()).filter(Boolean);
    if (c.length >= columnCount) vals = c.slice(0, columnCount);
  }
  if (vals.length < 2) return null;
  while (vals.length < columnCount) vals.push("—");
  if (vals.length > columnCount) vals = vals.slice(0, columnCount);
  if (isLikelyMiniTemplateRow(label, vals.map(stripMiniMarkdownCell))) return null;
  return { label: stripMiniMarkdownCell(label), vals };
}

/** @param {string} block @param {2 | 3} columnCount */
export function parseMinivergleichLines(block, columnCount = 3) {
  const rows = [];
  for (const line of String(block || "").split(/\n/)) {
    const row = parseOneMinivergleichLine(line, columnCount);
    if (row) rows.push(row);
  }
  return rows.slice(0, 14);
}

function dedupeMiniRows(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const k = `${r.label}|${r.vals.join("·")}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}

/**
 * Exactly six rows in fixed order; missing model values → "—".
 * @param {Array<{ label: string, vals: string[] }>} rows
 * @param {2 | 3} columnCount
 * @param {string[]} rowOrder
 */
export function normalizeMiniComparisonRows(rows, columnCount = 3, rowOrder) {
  const order = rowOrder?.length ? rowOrder : ["Opening", "Tone", "Length", "Structure", "Factuality", "Closing"];
  const dash = () => Array.from({ length: columnCount }, () => "—");
  const filtered = rows.filter(
    (r) => r?.label && !/spielerauswahl|player\s*pick|draft\s*picks/i.test(r.label.trim())
  );
  const byKey = new Map();
  for (const r of filtered) {
    const k = canonicalMiniRowKey(r.label, order);
    byKey.set(k, r);
  }
  return order.map((name) => {
    const hit = byKey.get(name.toLowerCase());
    if (!hit || !Array.isArray(hit.vals)) return { label: name, vals: dash() };
    const vals = hit.vals.map((v) => String(v ?? "").trim());
    while (vals.length < columnCount) vals.push("—");
    const displayLabel = hit.label?.trim() ? hit.label.trim() : name;
    return { label: displayLabel, vals: vals.slice(0, columnCount) };
  });
}

/** @param {2 | 3} columnCount @param {string[]} rowOrder */
export function emptyMiniDisplayRows(columnCount = 3, rowOrder) {
  const order = rowOrder?.length ? rowOrder : ["Opening", "Tone", "Length", "Structure", "Factuality", "Closing"];
  const dash = Array.from({ length: columnCount }, () => "—");
  return order.map((name) => ({ label: name, vals: [...dash] }));
}

/**
 * @param {string} raw
 * @param {2 | 3} columnCount
 * @param {{ miniSectionTitles?: string[], assessmentSectionTitles?: string[], rowOrder?: string[] }} diffParsing from locale catalog
 */
export function parseDiffSections(raw, columnCount = 3, diffParsing = {}) {
  const miniSectionTitles = diffParsing.miniSectionTitles || [];
  const assessmentSectionTitles = diffParsing.assessmentSectionTitles || [];
  const rowOrder = diffParsing.rowOrder?.length
    ? diffParsing.rowOrder
    : ["Opening", "Tone", "Length", "Structure", "Factuality", "Closing"];

  const full = String(raw || "").trim();
  if (!full) return { assessment: "", miniRows: [] };

  let miniBlock = "";
  for (const title of miniSectionTitles) {
    const b = extractMarkdownSection(full, title);
    if (b) {
      miniBlock = b;
      break;
    }
  }

  let assessment = "";
  for (const title of assessmentSectionTitles) {
    const b = extractMarkdownSection(full, title);
    if (b) {
      assessment = b;
      break;
    }
  }
  if (!assessment) {
    for (const title of assessmentSectionTitles) {
      const einSplit = full.split(new RegExp(`\\r?\\n###\\s*${escapeRegExp(title)}\\s*\\r?\\n`, "i"));
      if (einSplit.length >= 2) {
        assessment = einSplit.slice(1).join("\n").trim();
        break;
      }
    }
  }
  if (!assessment) assessment = full;

  let miniRows = parseMinivergleichLines(miniBlock, columnCount);
  if (miniRows.length === 0) {
    for (const line of full.split(/\n/)) {
      const lt = line.trim();
      if (!/^\*\*/.test(lt)) continue;
      const row = parseOneMinivergleichLine(line, columnCount);
      if (row) miniRows.push(row);
    }
    miniRows = normalizeMiniComparisonRows(dedupeMiniRows(miniRows), columnCount, rowOrder);
  } else {
    miniRows = normalizeMiniComparisonRows(dedupeMiniRows(miniRows), columnCount, rowOrder);
  }

  return { assessment, miniRows };
}
