// The drawer: the region `drawer`, a panel that slides in from the start edge, above its Screen.
// It is the last child of that Screen. A press on the scrim asks to close.
import { View, type DimensionValue, type StyleProp, type ViewStyle } from "react-native";
import type { ReactNode } from "react";
import { OVERLAY_FILL, Scrim, useRegion } from "@libs/mobile-components";

export interface DrawerProps {
  open: boolean;
  onClose?: () => void;
  /** the top of the panel: who is signed in */
  header?: ReactNode;
  /** the bottom of the panel: what is always there (settings, sign out) */
  footer?: ReactNode;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}

/** The one place a screen's wider navigation lives: the organizations, the settings, the way out. */
export function Drawer({ open, onClose, header, footer, style, children }: DrawerProps) {
  const region = useRegion("drawer");
  if (!open) return null;
  return (
    <View style={OVERLAY_FILL}>
      <Scrim onPress={onClose} />
      <View accessibilityViewIsModal style={[{ position: "absolute", top: 0, bottom: 0, left: 0, width: region.width as DimensionValue, maxWidth: "86%" }, region.view, style]}>
        {header}
        <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
        {footer}
      </View>
    </View>
  );
}
