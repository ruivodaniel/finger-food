import { LivePlayPreviewer, PLAY_DEFAULTS } from "@libs/knowledge/hosts/screen-previewer";
import { reader } from "../screen-previewer/fixtures/reader";
import type { LivePlayPreviewerPatternProps } from "./schema";

/** Pattern: knowledge — the live play previewer (v2) on the UI prototype of the screen previewer pattern's fixtures, with its live play: a person, clicks through three pages,
 *  two explanations, and the world moved to a later moment. Play: the player plays it in a screen previewer. Prototype: the same screen, for a person to click.
 *  Its properties are in ./schema: a layout comes with its own switches and size, and what is given here goes over them. */
export const measure = "xl";

const PROTOTYPE = "b1c97273";

export default function LivePlayPreviewerPattern({ mode = "play", play = "play-browse", layout = "full", ...given }: LivePlayPreviewerPatternProps) {
  return <LivePlayPreviewer id={PROTOTYPE} livePlayId={play} mode={mode} layout={layout} {...PLAY_DEFAULTS[layout]} {...given} reader={reader} />;
}
