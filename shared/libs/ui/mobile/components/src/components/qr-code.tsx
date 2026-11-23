// A QR code — the web library's QrCode on the phone: the value, drawn at a size, in the theme's foreground on its background.
// Element: shape--svg (ui/types/elements.ts).
import { View, type StyleProp, type ViewStyle } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useColor } from "../theme";

export interface QrCodeProps {
  /** the value to encode */
  value: string;
  /** the side, in points (default: 200) */
  size?: number;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function QrCode({ value, size = 200, style, testID }: QrCodeProps) {
  const fg = useColor("foreground") ?? "#000";
  const bg = useColor("background") ?? "#fff";
  return (
    <View accessibilityRole="image" accessibilityLabel="QR code" testID={testID} style={[{ width: size, height: size }, style]}>
      <QRCode value={value || " "} size={size} color={fg} backgroundColor={bg} />
    </View>
  );
}
