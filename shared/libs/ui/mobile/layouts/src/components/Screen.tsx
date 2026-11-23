// Mobile's layout regions: the twin of @libs/web-layouts' page tree, in a phone's own vocabulary.
// Each region reads its surface and its dimensions from the theme (layouts.<region>): it holds
// structure only, never a colour or a size of its own.
//
//   Screen                 the whole screen: a column
//   ├── AppBar             the bar at the top: a title, with what stands before and after it
//   ├── Body               the content, the one region that scrolls
//   ├── ActionBar          a bar fixed under the body, for the screen's main action
//   ├── TabBar             the navigation at the bottom
//   └── Drawer · Sheet · Dialog   overlays: the last children of the Screen, drawn above it
import { ScrollView, Text as RNText, View, type DimensionValue, type ScrollViewProps, type StyleProp, type ViewProps, type ViewStyle } from "react-native";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState, type ReactNode } from "react";
import { useRegion } from "@libs/mobile-components";

type RegionProps = Omit<ViewProps, "style"> & { style?: StyleProp<ViewStyle>; children?: ReactNode };

// What covers a screen is drawn by the Screen itself, after its regions, whatever depth it was declared at:
// a page inside the Body declares <ScreenOverlay>, the Screen draws it above everything.
type OverlayHost = { set: (id: string, node: ReactNode) => void; drop: (id: string) => void };
const OverlayContext = createContext<OverlayHost | null>(null);

/** The whole screen. Overlays (Drawer, Sheet, Dialog) are its last children: they cover it, not the device.
 *  A descendant declares one with ScreenOverlay. */
export function Screen({ style, children, ...rest }: RegionProps) {
  const region = useRegion("screen");
  const [overlays, setOverlays] = useState<Record<string, ReactNode>>({});
  const set = useCallback((id: string, node: ReactNode) => setOverlays((o) => (o[id] === node ? o : { ...o, [id]: node })), []);
  const drop = useCallback((id: string) => setOverlays((o) => { if (!(id in o)) return o; const { [id]: _gone, ...keep } = o; return keep; }), []);
  const host = useMemo(() => ({ set, drop }), [set, drop]);
  return (
    <OverlayContext.Provider value={host}>
      <View style={[{ flex: 1, overflow: "hidden" }, region.view, style]} {...rest}>
        {children}
        {Object.entries(overlays).map(([id, node]) => <View key={id} pointerEvents="box-none" style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}>{node}</View>)}
      </View>
    </OverlayContext.Provider>
  );
}

/** Declares what covers the screen (a Drawer, a Sheet, a Dialog) from anywhere inside it. Outside a Screen it draws in place. */
export function ScreenOverlay({ children }: { children?: ReactNode }) {
  const host = useContext(OverlayContext);
  const id = useId();
  useEffect(() => { host?.set(id, children); });
  useEffect(() => () => host?.drop(id), [host, id]);
  return host ? null : <>{children}</>;
}

export interface AppBarProps extends RegionProps {
  /** the screen's title: a string is set in the bar's own type */
  title?: ReactNode;
  /** before the title: a menu button on a root screen, a back button on a pushed one, Cancel on a modal one */
  start?: ReactNode;
  /** after the title: the screen's actions */
  end?: ReactNode;
  /** where the title stands: at the start (a root screen) or in the middle (a pushed or modal screen) */
  align?: "start" | "center";
}

export function AppBar({ title, start, end, align = "start", style, children, ...rest }: AppBarProps) {
  const region = useRegion("appBar");
  const centered = align === "center";
  return (
    <View accessibilityRole="header" style={[{ flexDirection: "row", alignItems: "center", flexShrink: 0, height: region.height as DimensionValue }, region.view, style]} {...rest}>
      <View style={centered ? { flex: 1, flexDirection: "row", alignItems: "center" } : { flexDirection: "row", alignItems: "center" }}>{start}</View>
      <View style={centered ? { flexShrink: 1, alignItems: "center" } : { flex: 1, minWidth: 0 }}>
        {typeof title === "string" ? <RNText numberOfLines={1} style={region.text}>{title}</RNText> : title}
        {children}
      </View>
      <View style={centered ? { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end" } : { flexDirection: "row", alignItems: "center" }}>{end}</View>
    </View>
  );
}

export interface BodyProps extends Omit<ScrollViewProps, "style" | "contentContainerStyle"> {
  /** false: the content does not scroll (it fills the body and lays itself out) */
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/** The content. The one region that scrolls; its padding and the gap between its children are the theme's. */
export function Body({ scroll = true, style, children, ...rest }: BodyProps) {
  const region = useRegion("body");
  const { backgroundColor, ...content } = region.view as ViewStyle;
  if (!scroll) return <View style={[{ flex: 1, minHeight: 0 }, region.view, style]}>{children}</View>;
  return (
    <ScrollView style={{ flex: 1, backgroundColor }} contentContainerStyle={[content, style]} keyboardShouldPersistTaps="handled" {...rest}>
      {children}
    </ScrollView>
  );
}

/** A bar fixed under the body, above the tab bar: the screen's main action. */
export function ActionBar({ style, children, ...rest }: RegionProps) {
  const region = useRegion("actionBar");
  return <View style={[{ flexShrink: 0, justifyContent: "center", minHeight: region.height as DimensionValue }, region.view, style]} {...rest}>{children}</View>;
}
