const MAX_MID_DOTS = 5;

/** Kurze Schlüssel komplett maskieren; mittlere Länge 4+•+4; längere: 8 Zeichen + wenige • + 8 Zeichen (max. 5 Punkte in der Mitte). */
export function formatApiKeyPeek(secret) {
  const s = String(secret ?? "");
  const L = s.length;
  if (L === 0) return "";
  if (L <= 8) return "•".repeat(L);
  if (L > 16) {
    const head = s.slice(0, 8);
    const tail = s.slice(-8);
    const dotCount = Math.min(MAX_MID_DOTS, Math.max(1, L - 16));
    return `${head}${"•".repeat(dotCount)}${tail}`;
  }
  const head = s.slice(0, 4);
  const tail = s.slice(-4);
  const dotCount = Math.min(MAX_MID_DOTS, Math.max(1, L - 8));
  return `${head}${"•".repeat(dotCount)}${tail}`;
}
