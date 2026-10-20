import { createContext, useContext, type ReactNode } from "react";
import type { GradientDef } from "../../../../../../../../../../shared/libs/ui/types";

/**
 * Lookup tables that downstream components (notably TokenPicker) need from
 * the live theme but which would be tedious to thread through props.
 *
 * Provided once at the PropertyPanel level. Read-only — callers don't mutate
 * the theme through this; they go through the normal onChange path.
 */
export type ThemeRefs = {
  gradients?: Record<string, GradientDef>;
};

const Ctx = createContext<ThemeRefs>({});

export function ThemeRefsProvider({
  gradients,
  children,
}: ThemeRefs & { children: ReactNode }) {
  return <Ctx.Provider value={{ gradients }}>{children}</Ctx.Provider>;
}

export function useThemeRefs(): ThemeRefs {
  return useContext(Ctx);
}
