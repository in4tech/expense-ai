import { createContext, useContext, useMemo, type ReactNode } from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import {
  getAppThemeColors,
  type AppThemeColors,
} from "@/src/theme/app-colors";
import { getChatThemeColors, type ChatThemeColors } from "@/src/theme/chat-colors";

export type AppThemeContextValue = {
  colorScheme: "light" | "dark";
  isDark: boolean;
  colors: AppThemeColors;
  chat: ChatThemeColors;
};

const AppThemeContext = createContext<AppThemeContextValue | null>(null);

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const scheme = useColorScheme() ?? "light";
  const isDark = scheme === "dark";

  const value = useMemo<AppThemeContextValue>(
    () => ({
      colorScheme: isDark ? "dark" : "light",
      isDark,
      colors: getAppThemeColors(isDark),
      chat: getChatThemeColors(isDark),
    }),
    [isDark],
  );

  return <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>;
}

export function useAppTheme(): AppThemeContextValue {
  const ctx = useContext(AppThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return ctx;
}
