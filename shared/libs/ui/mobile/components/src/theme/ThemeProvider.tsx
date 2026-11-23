import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { MobileElementKey } from "../../../../types/elements";
import type { TextStyle } from "react-native";
import type { ElementExtras, NativeMode, NativeTheme } from "./native";
import { colorOf, resolve, type Axes, type Resolved } from "./resolve";

type ThemeContextValue = { theme: NativeTheme; mode: NativeMode; modeName: string };
const ThemeContext = createContext<ThemeContextValue | null>(null);

export interface ThemeProviderProps {
  /** a native theme: the `<id>.native.json` the mobile theme engine wrote */
  theme: NativeTheme;
  /** the colour mode; the theme's first when absent */
  mode?: string;
  children: ReactNode;
}

/** Puts one native theme, in one colour mode, above the components. A component is themed only by reading it. */
export function ThemeProvider({ theme, mode, children }: ThemeProviderProps) {
  const value = useMemo<ThemeContextValue>(() => {
    const modeName = mode && theme.modes[mode] ? mode : Object.keys(theme.modes)[0];
    return { theme, mode: theme.modes[modeName], modeName };
  }, [theme, mode]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error("no <ThemeProvider> above this component");
  return value;
}

const key = (axes: Axes) =>
  `${axes.emphasis ?? ""}|${axes.status ?? ""}|${axes.scale ?? ""}|${(axes.states ?? []).join(",")}|${(axes.positions ?? []).join(",")}`;

/** An element's style for its axes: the element's fragments, matched and merged. */
export function useElement(element: MobileElementKey, axes: Axes = {}): Resolved & { extras: ElementExtras } {
  const { theme, mode } = useTheme();
  const k = key(axes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    const el = theme.elements[element];
    return { ...resolve(el?.fragments, axes, mode), extras: el?.extras ?? {} };
  }, [theme, mode, element, k]);
}

/** A surface inside an element (a list's row, a control's start icon): the same resolution, on the part's fragments. */
export function usePart(element: MobileElementKey, part: string, axes: Axes = {}): Resolved {
  const { theme, mode } = useTheme();
  const k = key(axes);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => resolve(theme.elements[element]?.parts?.[part], axes, mode), [theme, mode, element, part, k]);
}

/** A layout region of the screen (screen, appBar, body, actionBar, tabBar, drawer): its style and its dimensions. */
export function useRegion(region: string): Resolved & { height?: number | string; width?: number | string; safeArea?: readonly string[] } {
  const { theme, mode } = useTheme();
  return useMemo(() => {
    const r = theme.layouts[region];
    return { ...resolve(r?.fragments, {}, mode), height: r?.height, width: r?.width, safeArea: r?.safeArea };
  }, [theme, mode, region]);
}

/** A typography level of the theme: font, size, weight, line height. */
export function useType(type: string): TextStyle | undefined {
  // the engine writes exactly React Native's text keys; the weight is one of its strings
  return useTheme().theme.typography.types[type] as TextStyle | undefined;
}

/** One colour of the active mode, by its name. */
export function useColor(ref: string | undefined): string | undefined {
  const { mode } = useTheme();
  return colorOf(ref, mode);
}
