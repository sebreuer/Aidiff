/**
 * Names of CSS custom properties for liquid-glass surfaces.
 * Values and light/dark: `glass.css`
 *
 * Use in JS only when needed (e.g. `getComputedStyle`); prefer `var(--…)` in JSX/CSS.
 */
export const GLASS = /** @type {const} */ ({
  appMeshBg: "--app-mesh-bg",
  transition: "--glass-transition",

  fill: "--glass-fill",
  blur: "--glass-blur",
  blurSoft: "--glass-blur-soft",
  blurTab: "--glass-blur-tab",

  stroke: "--glass-stroke",
  strokeHover: "--glass-stroke-hover",
  strokeFocus: "--glass-stroke-focus",

  shadow: "--glass-shadow",
  shadowHover: "--glass-shadow-hover",
  shadowFocus: "--glass-shadow-focus",

  innerBg: "--glass-inner-bg",
  innerHeaderBg: "--glass-inner-header-bg",
  innerBorder: "--glass-inner-border",
  innerInset: "--glass-inner-inset",

  tabTrack: "--glass-tab-track",

  dropdownFill: "--glass-dropdown-fill",
  dropdownBlur: "--glass-dropdown-blur",
  dropdownStroke: "--glass-dropdown-stroke",
  dropdownShadow: "--glass-dropdown-shadow",
  dropdownHeaderBg: "--glass-dropdown-header-bg",
  dropdownHintBg: "--glass-dropdown-hint-bg",
  dropdownRowHover: "--glass-dropdown-row-hover",
  dropdownRowActive: "--glass-dropdown-row-active",
  dropdownTabsBg: "--glass-dropdown-tabs-bg",
  dropdownTabActiveBg: "--glass-dropdown-tab-active-bg",
  dropdownSearchBg: "--glass-dropdown-search-bg",
  dropdownSearchBorder: "--glass-dropdown-search-border",

  controlBg: "--glass-control-bg",
  controlBgHover: "--glass-control-bg-hover",
  controlBgActive: "--glass-control-bg-active",
  controlBorder: "--glass-control-border",
  controlBorderHover: "--glass-control-border-hover",
  selectedBorder: "--glass-selected-border",
  selectedShadow: "--glass-selected-shadow",
  controlBlur: "--glass-control-blur",
  controlShadow: "--glass-control-shadow",
  controlColor: "--glass-control-color",
  controlColorHover: "--glass-control-color-hover",
  controlRadius: "--glass-control-radius",

  slotTriggerHoverBg: "--glass-slot-trigger-hover-bg",

  overlayBg: "--glass-overlay-bg",
  overlayBlur: "--glass-overlay-blur",

  dialogFill: "--glass-dialog-fill",
  dialogBlur: "--glass-dialog-blur",
  dialogStroke: "--glass-dialog-stroke",
  dialogShadow: "--glass-dialog-shadow",

  chipFill: "--glass-chip-fill",
  chipBlur: "--glass-chip-blur",
  chipStroke: "--glass-chip-stroke",
  chipShadow: "--glass-chip-shadow",

  pillBg: "--glass-pill-bg",
  pillBgHover: "--glass-pill-bg-hover",
  pillBgOn: "--glass-pill-bg-on",
  pillBlur: "--glass-pill-blur",
  pillStroke: "--glass-pill-stroke",
  pillStrokeOn: "--glass-pill-stroke-on",

  sendBg: "--glass-send-bg",
  sendColor: "--glass-send-color",
  sendBgDisabled: "--glass-send-bg-disabled",
  sendColorDisabled: "--glass-send-color-disabled",
  sendShadow: "--glass-send-shadow",

  metricBg: "--glass-metric-bg",
  metricBorder: "--glass-metric-border",
  metricBestBg: "--glass-metric-best-bg",
  metricBestBorder: "--glass-metric-best-border",
  metricBestAccent: "--glass-metric-best-accent",

  composerDivider: "--glass-composer-divider",
});

/** `var(--glass-…)` for inline styles */
export function v(name) {
  return `var(${name})`;
}
