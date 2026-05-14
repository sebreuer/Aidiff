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

export const radius = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 14,
  modal: 16,
  card: 20,
};

export const zIndex = {
  logo: 30,
  modal: 60,
  dropdown: 400,
};

export function modalBackdrop() {
  return "var(--glass-overlay-bg)";
}

export { GLASS, v } from "./glassTokens.js";
