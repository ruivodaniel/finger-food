// The properties the live play previewer pattern is instantiated with. The UI cockpit draws its playground from this.
// The switches a layout does not get from the playground come from the layout's own defaults (PLAY_DEFAULTS); the defaults written here are those of the layout "full".
import { defineProps } from "../../../lib/define-props";
import { PLAY_DEFAULTS, type PlayLayout, type PlayMode, type PlaySize } from "@libs/knowledge/hosts/screen-previewer";

export type LivePlayPreviewerPatternProps = {
  mode?: PlayMode;
  /** the live play of the prototype, in the fixtures */
  play?: "play-browse" | "play-info";
  layout?: PlayLayout;
  size?: PlaySize;
  commands?: boolean;
  commandsOnHover?: boolean;
  stepCount?: boolean;
  steps?: boolean;
  expand?: boolean;
  header?: boolean;
  cast?: boolean;
};
const d = PLAY_DEFAULTS.full;
export const livePlayPreviewerPatternSchema = defineProps<LivePlayPreviewerPatternProps>("LivePlayPreviewerPattern", {
  mode: { kind: "enum", values: ["play", "prototype"], default: "play" },
  play: { kind: "enum", values: ["play-browse", "play-info"], default: "play-browse" },
  layout: { kind: "enum", values: ["player", "panel", "full"], default: "full" },
  size: { kind: "enum", values: ["small", "medium", "large", "extra-large", "fit"], default: d.size },
  commands: { kind: "boolean", default: d.commands },
  commandsOnHover: { kind: "boolean", default: d.commandsOnHover },
  stepCount: { kind: "boolean", default: d.stepCount },
  steps: { kind: "boolean", default: d.steps },
  expand: { kind: "boolean", default: d.expand },
  header: { kind: "boolean", default: d.header },
  cast: { kind: "boolean", default: d.cast },
});
