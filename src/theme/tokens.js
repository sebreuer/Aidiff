/** Shared visual tokens (complement :root CSS variables from App). */

export const SHADOWS = {
  light: {
    default: "0 0.25rem 1.25rem rgba(0,0,0,0.035), 0 0 0 0.5px rgba(31,31,30,0.15)",
    hover: "0 0.25rem 1.25rem rgba(0,0,0,0.035), 0 0 0 0.5px rgba(31,31,30,0.30)",
    focus: "0 0.25rem 1.25rem rgba(0,0,0,0.075), 0 0 0 0.5px rgba(31,31,30,0.30)",
  },
  dark: {
    default: "0 0.25rem 1.25rem rgba(0,0,0,0.25),  0 0 0 0.5px rgba(255,255,255,0.10)",
    hover: "0 0.25rem 1.25rem rgba(0,0,0,0.25),  0 0 0 0.5px rgba(255,255,255,0.20)",
    focus: "0 0.25rem 1.25rem rgba(0,0,0,0.40),  0 0 0 0.5px rgba(255,255,255,0.20)",
  },
};

export const border = {
  line: "1px solid var(--border)",
  line2: "1px solid var(--border2)",
  transparent: "1px solid transparent",
};

/** px values — keep in sync with `glass.css` (--radius-*). */
export const radius = {
  micro: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 14,
  modal: 16,
  card: 20,
  pill: 999,
};

/** CSS custom property names for radius (use with `v()` from glassTokens). */
export const RADIUS = /** @type {const} */ ({
  micro: "--radius-micro",
  sm: "--radius-sm",
  md: "--radius-md",
  lg: "--radius-lg",
  xl: "--radius-xl",
  xxl: "--radius-xxl",
  modal: "--radius-modal",
  card: "--radius-card",
  pill: "--radius-pill",
  segmentTrack: "--radius-segment-track",
  segmentInner: "--radius-segment-inner",
  tabTrack: "--radius-tab-track",
  tabInner: "--radius-tab-inner",
  nestedControl: "--radius-nested-control",
  nestedInset: "--radius-nested-inset",
});

export const zIndex = {
  logo: 30,
  modal: 60,
  dropdown: 400,
};

export function modalBackdrop() {
  return "var(--glass-overlay-bg)";
}

export { GLASS, v } from "./glassTokens.js";
