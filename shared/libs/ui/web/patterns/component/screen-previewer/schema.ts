// The properties the screen previewer pattern is instantiated with. The UI cockpit draws its playground from this.
import { defineProps } from "../../../lib/define-props";
import type { Layout, Mode, Size } from "@libs/knowledge/hosts/screen-previewer";

export type ScreenPreviewerPatternProps = {
  layout?: Layout;
  mode?: Mode;
  device?: "auto" | "desktop" | "mobile";
  size?: Size;
  scroll?: boolean;
  bordered?: boolean;
  zoomOnClick?: boolean;
};
export const screenPreviewerPatternSchema = defineProps<ScreenPreviewerPatternProps>("ScreenPreviewerPattern", {
  layout: { kind: "enum", values: ["standard", "box", "hug-height"], default: "standard" },
  mode: { kind: "enum", values: ["live", "picture"], default: "live" },
  device: { kind: "enum", values: ["auto", "desktop", "mobile"], default: "auto" },
  size: { kind: "enum", values: ["extra-small", "small", "medium", "large", "extra-large", "fit", "custom"], default: "medium" },
  scroll: { kind: "boolean", default: false },
  bordered: { kind: "boolean", default: true },
  zoomOnClick: { kind: "boolean", default: false },
});
