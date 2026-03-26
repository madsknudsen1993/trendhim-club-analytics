// Trendhim brand colors and chart configuration

export const TRENDHIM_COLORS = {
  // Primary brand color
  primary: "#06402B",       // Moss Green
  primaryHover: "#085234",
  primaryLight: "#0A6B42",

  // Neutrals
  black: "#1C1B15",
  offWhite: "#FAF6F0",

  // Chart series
  chart1: "#06402B",        // Primary green
  chart2: "#486069",        // Dark Blue 300
  chart3: "#7CA68E",        // Mint 200
  chart4: "#9C9486",        // Summer Sand 300
  chart5: "#CA546C",        // Red
  chart6: "#8BA2AE",        // Baby Blue 200
  chart7: "#6E8C7C",        // Mint 300

  // Status colors
  positive: "#06402B",
  warning: "#9C9486",
  negative: "#CA546C",

  // Legacy support
  secondary: "#486069",
  accent: "#7CA68E",
  club: "#06402B",
  nonClub: "#486069",
  success: "#06402B",
  danger: "#CA546C",
  preLaunch: "#9C9486",
  postLaunch: "#06402B",
};

// Dashboard chart palette
export const DASHBOARD_CHART_COLORS = [
  "#06402B",  // Primary green
  "#486069",  // Dark Blue 300
  "#7CA68E",  // Mint 200
  "#9C9486",  // Summer Sand 300
  "#CA546C",  // Red
  "#8BA2AE",  // Baby Blue 200
  "#6E8C7C",  // Mint 300
];

export const SEGMENT_COLORS = {
  loyal: "#06402B",     // Green
  returning: "#486069", // Blue
  new: "#7CA68E",       // Mint
  inactive: "#9C9486",  // Sand
};

export const CHART_COLORS = DASHBOARD_CHART_COLORS;

export const CURRENCY_COLORS: Record<string, string> = {
  DKK: "#3b82f6",
  EUR: "#22c55e",
  GBP: "#8b5cf6",
  USD: "#f97316",
  SEK: "#ec4899",
  NOK: "#14b8a6",
};

export const DEFAULT_CHART_CONFIG = {
  margin: { top: 20, right: 30, left: 20, bottom: 20 },
  animationDuration: 300,
};

export function formatCurrency(value: number, currency: string = "DKK"): string {
  return new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("da-DK").format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("da-DK", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}
