// Contract: overlay--sheet · overlay--dialog (ui/types/elements.ts) · mirror @libs/web-components Sheet and Dialog, 0.1.0
// An overlay is drawn above its screen, behind a scrim, and is the last child of that screen:
// it covers the screen, not the device. A press on the scrim asks to close.
import { Pressable, Text as RNText, View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import type { ScaleOf, StatusOf } from "../../../../types/elements";
import { useColor, useElement, useTheme, useType } from "../theme";

export const OVERLAY_FILL: ViewStyle = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 };

/** what dims the screen under an overlay; its colour and strength are the overlay family's (theme: families.elevatedOverlay.overlay) */
export function Scrim({ onPress }: { onPress?: () => void }) {
  const el = useElement("sheet");
  const color = useColor(el.extras.scrimColor ?? "foreground");
  return <Pressable accessibilityLabel="Close" onPress={onPress} style={[OVERLAY_FILL, { backgroundColor: color, opacity: el.extras.scrimOpacity ?? 0.45 }]} />;
}

export interface SheetProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  /** how tall: a size of the theme (layouts.sheet); the content's own height when absent */
  scale?: Extract<ScaleOf<"sheet">, "sm" | "md" | "lg">;
  status?: StatusOf<"sheet">;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/** A panel from the bottom edge: a choice, a short form, a detail that does not leave the screen. */
export function Sheet({ open, onClose, title, scale, status, style, children }: SheetProps) {
  const el = useElement("sheet", { status });
  const { theme } = useTheme();
  const heading = useType("heading3");
  if (!open) return null;
  const height = scale ? theme.sheet?.[scale]?.size : undefined;
  return (
    <View style={OVERLAY_FILL}>
      <Scrim onPress={onClose} />
      <View accessibilityViewIsModal style={[{ position: "absolute", left: 0, right: 0, bottom: 0, maxHeight: "92%" }, height != null ? { height: height as DimensionValue } : null, el.view, style]}>
        {title ? <RNText accessibilityRole="header" style={[el.text, heading]}>{title}</RNText> : null}
        {children}
      </View>
    </View>
  );
}

export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  title?: string;
  description?: string;
  /** the answers: buttons, in a row at the end */
  actions?: ReactNode;
  status?: StatusOf<"dialog">;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/** A panel in the middle of the screen: a question that must be answered before going on. */
export function Dialog({ open, onClose, title, description, actions, status, style, children }: DialogProps) {
  const el = useElement("dialog", { status });
  const heading = useType("heading3");
  const body = useType("body");
  if (!open) return null;
  return (
    <View style={[OVERLAY_FILL, { alignItems: "center", justifyContent: "center", padding: 24 }]}>
      <Scrim onPress={onClose} />
      <View accessibilityRole="alert" accessibilityViewIsModal style={[{ alignSelf: "stretch" }, el.view, style]}>
        {title ? <RNText accessibilityRole="header" style={[el.text, heading]}>{title}</RNText> : null}
        {description ? <RNText style={[el.text, body]}>{description}</RNText> : null}
        {children}
        {actions ? <View style={{ flexDirection: "row", justifyContent: "flex-end", columnGap: 8 }}>{actions}</View> : null}
      </View>
    </View>
  );
}
