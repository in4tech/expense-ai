/** Shared semantic colors for list/detail/form screens (light & dark). */
export type AppThemeColors = {
  screen: string;
  card: string;
  cardMuted: string;
  title: string;
  text: string;
  hint: string;
  primary: string;
  link: string;
  border: string;
  divider: string;
  success: string;
  successBg: string;
  successText: string;
  danger: string;
  chipOn: string;
  chipOff: string;
  chipTextOn: string;
  chipTextOff: string;
  chipBg: string;
  inputBg: string;
  inputBorder: string;
  socialBg: string;
  socialBorder: string;
};

export type AppThemeSectionColors = Pick<
  AppThemeColors,
  "card" | "border" | "primary" | "title"
>;

export const lightAppColors: AppThemeColors = {
  screen: "#F5F7FB",
  card: "#FFFFFF",
  cardMuted: "#F8FAFC",
  title: "#0F172A",
  text: "#475569",
  hint: "#64748B",
  primary: "#4F46E5",
  link: "#7B6CF6",
  border: "#E2E8F0",
  divider: "#E5E5EA",
  success: "#16A34A",
  successBg: "#DCFCE7",
  successText: "#166534",
  danger: "#DC2626",
  chipOn: "#DCFCE7",
  chipOff: "#F1F5F9",
  chipTextOn: "#166534",
  chipTextOff: "#64748B",
  chipBg: "#EEF2FF",
  inputBg: "#F2F2F2",
  inputBorder: "#E8E8EA",
  socialBg: "#FFFFFF",
  socialBorder: "#E5E5EA",
};

export const darkAppColors: AppThemeColors = {
  screen: "#0B0B0F",
  card: "#17181D",
  cardMuted: "#1C1E24",
  title: "#F3F4F6",
  text: "#CBD5E1",
  hint: "#94A3B8",
  primary: "#4F46E5",
  link: "#7B6CF6",
  border: "#2B2D33",
  divider: "#38383A",
  success: "#86EFAC",
  successBg: "#123520",
  successText: "#86EFAC",
  danger: "#FCA5A5",
  chipOn: "rgba(34,197,94,0.2)",
  chipOff: "rgba(148,163,184,0.12)",
  chipTextOn: "#86EFAC",
  chipTextOff: "#94A3B8",
  chipBg: "#23252C",
  inputBg: "#1E1E1E",
  inputBorder: "#38383A",
  socialBg: "#2C2C2E",
  socialBorder: "#48484A",
};

export const getAppThemeColors = (isDark: boolean): AppThemeColors =>
  isDark ? darkAppColors : lightAppColors;
