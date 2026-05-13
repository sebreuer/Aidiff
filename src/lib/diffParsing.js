import { MINI_VERGLEICH_ROW_ORDER } from "../constants/appConfig.js";

export function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Inhalt unter ##/### `title` bis zur nächsten ##/###-Überschrift (reihenfolge-unabhängig).
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

function isLikelyMiniTemplateRow(label, vals) {
  const L = `${label} ${vals.join(" ")}`.toLowerCase();
  if (/parametername|kurzwert\d|platzhalter/i.test(L)) return true;
  if (label.length > 36) return true;
  return false;
}

export function parseOneMinivergleichLine(line) {
  let t = line.trim();
  if (!t || /^#{1,4}\s/.test(t)) return null;
  t = t.replace(/^[-*]\s+/, "");
  let m = t.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
  if (!m) m = t.match(/^([^:#\n]{2,48}):\s*(.+)$/);
  if (!m) return null;
  const label = m[1].trim().replace(/\*+/g, "");
  if (/^(Antwort|Spalte)\s*[123]$/i.test(label)) return null;
  if (/^(genau|jede|nur|schreibe|trenner)/i.test(label)) return null;
  let rest = normalizeMiniSeparators(m[2].trim()).replace(/\s*#.*$/, "");
  let parts = rest
    .split(/\s*·\s*/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
  let vals = parts.length >= 3 ? parts.slice(0, 3) : parts;
  if (vals.length < 3 && rest.includes("|")) {
    vals = rest
      .split(/\s*\|\s*/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 3);
  }
  if (vals.length < 3 && /\s[-–—]\s/.test(rest)) {
    vals = rest
      .split(/\s+[-–—]\s+/)
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 3);
  }
  if (vals.length < 2 && rest.includes(",")) {
    const c = rest.split(",").map((x) => x.trim()).filter(Boolean);
    if (c.length >= 3) vals = c.slice(0, 3);
  }
  if (vals.length < 2) return null;
  while (vals.length < 3) vals.push("—");
  if (vals.length > 3) vals = vals.slice(0, 3);
  vals = vals.map(stripMiniMarkdownCell);
  if (isLikelyMiniTemplateRow(label, vals)) return null;
  return { label: stripMiniMarkdownCell(label), vals };
}

export function parseMinivergleichLines(block) {
  const rows = [];
  for (const line of String(block || "").split(/\n/)) {
    const row = parseOneMinivergleichLine(line);
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

/** Keine „Spielerauswahl“. Immer exakt 6 Zeilen in fester Reihenfolge; fehlende Modellwerte → „—“. */
export function normalizeMiniComparisonRows(rows) {
  const filtered = rows.filter((r) => r?.label && !/spielerauswahl/i.test(r.label.trim()));
  const byKey = new Map();
  for (const r of filtered) {
    byKey.set(r.label.trim().toLowerCase(), r);
  }
  return MINI_VERGLEICH_ROW_ORDER.map((name) => {
    const hit = byKey.get(name.toLowerCase());
    if (!hit || !Array.isArray(hit.vals)) return { label: name, vals: ["—", "—", "—"] };
    const vals = hit.vals.map(stripMiniMarkdownCell);
    while (vals.length < 3) vals.push("—");
    return { label: name, vals: vals.slice(0, 3) };
  });
}

export function emptyMiniDisplayRows() {
  return MINI_VERGLEICH_ROW_ORDER.map((name) => ({ label: name, vals: ["—", "—", "—"] }));
}

/** Minivergleich auch nach Einordnung oder mit ##-Überschrift; Fallback: passende Zeilen im ganzen Text. */
export function parseDiffSections(raw) {
  const full = String(raw || "").trim();
  if (!full) return { einordnung: "", miniRows: [] };

  const miniTitles = ["Minivergleich", "Mini-Vergleich", "Mini Vergleich", "Minivergleich (Kurz)", "Kurzvergleich"];
  let miniBlock = "";
  for (const title of miniTitles) {
    const b = extractMarkdownSection(full, title);
    if (b) {
      miniBlock = b;
      break;
    }
  }

  let einordnung = extractMarkdownSection(full, "Einordnung");
  if (!einordnung) {
    const einSplit = full.split(/\r?\n###\s*Einordnung\s*\r?\n/i);
    einordnung = einSplit.length >= 2 ? einSplit.slice(1).join("\n").trim() : "";
  }
  if (!einordnung) einordnung = full;

  let miniRows = parseMinivergleichLines(miniBlock);
  if (miniRows.length === 0) {
    for (const line of full.split(/\n/)) {
      const lt = line.trim();
      if (!/^\*\*/.test(lt)) continue;
      const row = parseOneMinivergleichLine(line);
      if (row) miniRows.push(row);
    }
    miniRows = normalizeMiniComparisonRows(dedupeMiniRows(miniRows));
  } else {
    miniRows = normalizeMiniComparisonRows(dedupeMiniRows(miniRows));
  }

  return { einordnung, miniRows };
}
