// THE LIVE PLAY PREVIEWER'S MODES, LAYOUTS AND SWITCHES, as data. It shows a UI prototype.
//   mode play        the player plays one of the prototype's live plays in a screen previewer
//   mode prototype   a screen previewer opens the prototype; the person clicks
// A layout (mode play) is only a set of switches to start from; what is drawn follows the switches, whatever the layout:
//   player   the screen alone with the commands over it on hover, as a video player
//   panel    the screen on the left, the commands and the step list on the right; below `STACK_AT` they sit under the screen
//   full     the header, then the cast on its own line, then the panel
// The switches:
//   commandsOnHover   on: the commands sit over the screen and show only while the pointer is over it. off: they sit beside the screen
//   steps             the step list. Beside the screen; or, with commandsOnHover, behind one more command that opens it as a drawer over the screen, from the right, inside the frame
//   expand            one more command: shows the previewer big, over everything, and brings it back
// `size` is the width it takes: four steps, or `fit` (the parent decides).
export type PlayMode = "play" | "prototype";
export type PlayLayout = "player" | "panel" | "full";
export type PlaySize = "small" | "medium" | "large" | "extra-large" | "fit";
export type PlaySwitches = {
  size: PlaySize;
  /** the commands: back to the first step, play or pause, next step */
  commands: boolean;
  /** the commands sit over the screen and show only while the pointer is over it */
  commandsOnHover: boolean;
  /** "step 2 of 6" under the commands */
  stepCount: boolean;
  /** the step list; with commandsOnHover, a command opens it as a drawer over the screen */
  steps: boolean;
  /** a command that shows the previewer big, over everything */
  expand: boolean;
  /** the play's title and description */
  header: boolean;
  /** the people who act in the play */
  cast: boolean;
};
export const PLAY_DEFAULTS: Record<PlayLayout, PlaySwitches> = {
  player: { size: "medium", commands: true, commandsOnHover: true, stepCount: true, steps: false, expand: false, header: false, cast: false },
  panel: { size: "large", commands: true, commandsOnHover: false, stepCount: true, steps: true, expand: false, header: false, cast: false },
  full: { size: "extra-large", commands: true, commandsOnHover: false, stepCount: true, steps: true, expand: false, header: true, cast: true },
};
export const PLAY_WIDTH: Record<PlaySize, number | undefined> = { small: 480, medium: 720, large: 960, "extra-large": 1280, fit: undefined };
/** below this width the panel sits under the screen */
export const STACK_AT = 900;
/** the width of the panel beside the screen */
export const PANEL = 360;
/** the width of the step list's drawer over the screen */
export const DRAWER = 360;
