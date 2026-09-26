"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeId = "default" | "light" | "dark" | "midnight" | "slate-pro";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  description: string;
  preview: { bg: string; surface: string; accent: string; text: string };
}

export const THEMES: ThemeMeta[] = [
  {
    id: "default",
    name: "Default",
    description: "The original SkillPulse government-grade theme.",
    preview: { bg: "#F8FAFC", surface: "#FFFFFF", accent: "#0284C7", text: "#0F172A" }
  },
  {
    id: "light",
    name: "Light",
    description: "A brighter, airy interface with warm accents.",
    preview: { bg: "#FFFFFF", surface: "#F9FAFB", accent: "#2563EB", text: "#111827" }
  },
  {
    id: "dark",
    name: "Dark",
    description: "A comfortable dark mode for extended viewing.",
    preview: { bg: "#0F172A", surface: "#1E293B", accent: "#38BDF8", text: "#F1F5F9" }
  },
  {
    id: "midnight",
    name: "Midnight Blue",
    description: "Deep navy with sky-blue accents.",
    preview: { bg: "#0A1628", surface: "#162032", accent: "#60A5FA", text: "#E2E8F0" }
  },
  {
    id: "slate-pro",
    name: "Slate Professional",
    description: "Neutral grey tones with teal highlights.",
    preview: { bg: "#F3F4F6", surface: "#FFFFFF", accent: "#0D9488", text: "#1F2937" }
  }
];

interface ThemeContextValue {
  theme: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: ThemeMeta[];
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "default",
  setTheme: () => {},
  themes: THEMES
});

export const useTheme = () => useContext(ThemeContext);

const STORAGE_KEY = "skillpulse-theme";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeId>("default");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (saved && THEMES.some((t) => t.id === saved)) {
      setThemeState(saved);
      document.documentElement.setAttribute("data-theme", saved);
    }
  }, []);

  const setTheme = (id: ThemeId) => {
    setThemeState(id);
    localStorage.setItem(STORAGE_KEY, id);
    document.documentElement.setAttribute("data-theme", id);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};
