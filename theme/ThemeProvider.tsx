// theme/ThemeProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Appearance, ColorSchemeName } from "react-native";

type ThemeMode = "system" | "light" | "dark";

export type ThemeColors = {
  bg: string;
  panel: string;
  panel2: string;
  border: string;
  border2: string;
  text: string;
  muted: string;
  accent: string;
  danger: string;
  success: string;

  // extra tokens (nice for Settings + UI polish)
  divider: string;
  softBg: string;
  inputBg: string;
  chipBg: string;
  chipBorder: string;
};

type ThemeContextValue = {
  mode: ThemeMode;
  scheme: "light" | "dark";
  colors: ThemeColors;
  setMode: (m: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DARK: ThemeColors = {
  bg: "#0B0B0F",
  panel: "#12121A",
  panel2: "#151522",
  border: "#1F1F2B",
  border2: "#2A2A3A",
  text: "#F3F4F6",
  muted: "#A1A1AA",
  accent: "#7C3AED",
  danger: "#EF4444",
  success: "#22C55E",

  divider: "rgba(255,255,255,0.06)",
  softBg: "rgba(255,255,255,0.05)",
  inputBg: "rgba(255,255,255,0.06)",
  chipBg: "rgba(255,255,255,0.06)",
  chipBorder: "rgba(255,255,255,0.10)",
};

const LIGHT: ThemeColors = {
  bg: "#F7F7FB",
  panel: "#FFFFFF",
  panel2: "#F2F3FA",
  border: "#E7E8F1",
  border2: "#D9DBE7",
  text: "#0F1222",
  muted: "#5B6073",
  accent: "#6D28D9",
  danger: "#DC2626",
  success: "#16A34A",

  divider: "rgba(15,18,34,0.08)",
  softBg: "rgba(15,18,34,0.04)",
  inputBg: "rgba(15,18,34,0.04)",
  chipBg: "rgba(15,18,34,0.04)",
  chipBorder: "rgba(15,18,34,0.10)",
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(Appearance.getColorScheme());

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => setSystemScheme(colorScheme));
    return () => sub.remove();
  }, []);

  const scheme: "light" | "dark" = useMemo(() => {
    if (mode === "light") return "light";
    if (mode === "dark") return "dark";
    return systemScheme === "light" ? "light" : "dark";
  }, [mode, systemScheme]);

  const colors = scheme === "light" ? LIGHT : DARK;

  const value = useMemo(
    () => ({ mode, scheme, colors, setMode }),
    [mode, scheme, colors]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
