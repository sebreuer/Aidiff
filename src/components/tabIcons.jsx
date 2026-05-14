/** Lucide-aligned inline SVGs (no extra dependency). */

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function IconTabResults(props) {
  const { size = 13, ...rest } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...rest}>
      <line x1="6.5" y1="18" x2="6.5" y2="5" {...stroke} strokeWidth={2.75} />
      <line x1="12" y1="18" x2="12" y2="5" {...stroke} strokeWidth={2.75} />
      <line x1="17.5" y1="18" x2="17.5" y2="5" {...stroke} strokeWidth={2.75} />
    </svg>
  );
}

/** Same graphic as the former “Difference analysis” header icon (shuffle / corners). */
export function IconTabDifferences(props) {
  const { size = 13, ...rest } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...rest}>
      <polyline points="16 3 21 3 21 8" {...stroke} />
      <line x1="4" y1="20" x2="21" y2="3" {...stroke} />
      <polyline points="21 16 21 21 16 21" {...stroke} />
      <line x1="15" y1="15" x2="21" y2="21" {...stroke} />
    </svg>
  );
}

export function IconTabPerformance(props) {
  const { size = 13, ...rest } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...rest}>
      <path d="m12 14 4-4" {...stroke} />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" {...stroke} />
    </svg>
  );
}

/** Lucide `square-dashed-text` (official paths). */
export function IconSquareDashedText(props) {
  const { size = 13, ...rest } = props;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden {...rest}>
      <path d="M14 21h1" {...stroke} />
      <path d="M14 3h1" {...stroke} />
      <path d="M19 3a2 2 0 0 1 2 2" {...stroke} />
      <path d="M21 14v1" {...stroke} />
      <path d="M21 19a2 2 0 0 1-2 2" {...stroke} />
      <path d="M21 9v1" {...stroke} />
      <path d="M3 14v1" {...stroke} />
      <path d="M3 9v1" {...stroke} />
      <path d="M5 21a2 2 0 0 1-2-2" {...stroke} />
      <path d="M5 3a2 2 0 0 0-2 2" {...stroke} />
      <path d="M7 12h10" {...stroke} />
      <path d="M7 16h6" {...stroke} />
      <path d="M7 8h8" {...stroke} />
      <path d="M9 21h1" {...stroke} />
      <path d="M9 3h1" {...stroke} />
    </svg>
  );
}
