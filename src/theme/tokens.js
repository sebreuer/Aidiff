/** Gemeinsame visuelle Tokens (ergänzen :root-CSS-Variablen aus App). */

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

export const BEST_COLOR = "#0070f3";
export const BEST_BG = "rgba(0,112,243,0.07)";

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

export const shadow = {
  tabActive: "0 0 0 0.5px rgba(31,31,30,0.12), 0 1px 3px rgba(0,0,0,0.06)",
  dropdownUp: "0 -8px 24px rgba(0,0,0,0.1)",
  /** Entspricht grob Tailwind shadow-xl (Dialog). */
  settingsModalLight: "0 25px 50px -12px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.06)",
  settingsModalDark: "0 25px 50px -12px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08)",
};

export function modalBackdrop(isDark) {
  return isDark ? "rgba(0,0,0,0.45)" : "rgba(20,20,20,0.2)";
}
