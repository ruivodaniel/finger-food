/**
 * Theme Context — Local provider for the theme cockpit.
 *
 * Injects compiled CSS from themeToCSS() into a <style> tag and manages
 * the active color mode via the data-mode attribute on <html>.
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Theme } from "../../../../../../../../../shared/libs/ui/types";
import { themeToCSS, themeToFontsCSS } from "../../../../../../../../../shared/libs/ui/web/theme-engine/theme-process";
// the versioned library — <theme>/v<n>/theme.ts, the same sources the engine compiles
import { wireframesTheme as wireframesV2 } from "../../../../../../../../../shared/libs/ui/themes/wireframes/v2/theme";
import { wireframesTheme as defaultV1 } from "../../../../../../../../../shared/libs/ui/themes/default/v1/theme";

export const THEMES: Theme[] = [wireframesV2, defaultV1];

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  colorMode: string;
  setColorMode: (mode: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useThemeCockpit() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeCockpit must be used inside ThemeCockpitProvider");
  return ctx;
}

export function ThemeCockpitProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(THEMES[0]);
  const [colorMode, setColorMode] = useState(() => Object.keys(THEMES[0].modes.colorScheme)[0]);

  const applyTheme = useCallback((t: Theme, mode: string) => {
    // Inject theme CSS
    let styleEl = document.getElementById("theme-cockpit-css") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "theme-cockpit-css";
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = themeToCSS(t);

    // Inject font CSS
    let fontEl = document.getElementById("theme-cockpit-fonts") as HTMLStyleElement | null;
    if (!fontEl) {
      fontEl = document.createElement("style");
      fontEl.id = "theme-cockpit-fonts";
      document.head.appendChild(fontEl);
    }
    fontEl.textContent = themeToFontsCSS(t);

    // Set color mode
    document.documentElement.setAttribute("data-mode", mode);
  }, []);

  useEffect(() => {
    applyTheme(theme, colorMode);
  }, [theme, colorMode, applyTheme]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.getElementById("theme-cockpit-css")?.remove();
      document.getElementById("theme-cockpit-fonts")?.remove();
      document.documentElement.removeAttribute("data-mode");
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colorMode, setColorMode }}>
      {children}
    </ThemeContext.Provider>
  );
}
