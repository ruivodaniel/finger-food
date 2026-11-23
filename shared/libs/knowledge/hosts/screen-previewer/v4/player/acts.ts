// THE ACTS OF A LIVE PLAY, as data. An act (what an event of a play names: click, fill, hover…) is a list of gestures in order, each with its default time.
// The player unfolds the act and runs the gestures; it knows no act by name. No act scrolls but scroll, and the pointer comes onto the screen with enter:
// a play writes both where it wants them. Changing a time here changes it in every play.
// An event gives its own times when it wants others: `waitMs` is the pause before the act; `durationMs` replaces the time of the act's `timed` gesture
// (the pointer's travel for enter, hover, click, select, check, upload; the scroll for scroll; the whole typing for fill; the travel off the screen for leave; the wait for wait).
import type { UiAct } from "../model";

export type Gesture =
  /** waits for the element; it has to be in view: nothing is scrolled */
  | { do: "reach"; on?: "option" }
  /** the region that holds the element scrolls, in `ms`, until the element is in view. The pointer has to be on the screen */
  | { do: "scroll"; ms: number; timed?: true }
  /** the pointer travels to the element in `ms`, then the page hears it over the element */
  | { do: "move"; ms: number; on?: "option"; timed?: true }
  | { do: "down"; on?: "option" } | { do: "up"; on?: "option" }
  /** what the field holds is selected and deleted */
  | { do: "clear" }
  /** the value, one key after the other: `ms` for all of it, never less than `least` for a key */
  | { do: "type"; ms: number; least: number; timed?: true }
  /** one named key: the event's value */
  | { do: "key" }
  | { do: "file" }
  /** the pointer travels off the screen in `ms` */
  | { do: "off"; ms: number; timed?: true }
  | { do: "wait"; ms: number; timed?: true }
  /** not a person's: open the event's URL · write a URL parameter · the page asks the API again */
  | { do: "open" } | { do: "urlParam" } | { do: "refetch" };

const hover: Gesture[] = [{ do: "reach" }, { do: "move", ms: 400, timed: true }];
/** the button stays down this long */
const PRESS = 90;
const click: Gesture[] = [...hover, { do: "down" }, { do: "wait", ms: PRESS }, { do: "up" }];

export const ACTS: Record<UiAct, { gestures: Gesture[]; /** done only when the element is in this state */ when?: "off" | "on" }> = {
  // the pointer comes onto the screen, to the element
  enter: { gestures: [{ do: "reach" }, { do: "move", ms: 600, timed: true }] },
  scroll: { gestures: [{ do: "scroll", ms: 600, timed: true }] },
  hover: { gestures: hover },
  click: { gestures: click },
  // a person clicks into the field, then types over what it holds
  fill: { gestures: [{ do: "reach" }, { do: "move", ms: 350 }, { do: "down" }, { do: "wait", ms: PRESS }, { do: "up" }, { do: "clear" }, { do: "type", ms: 600, least: 20, timed: true }] },
  press: { gestures: [{ do: "key" }] },
  // the select is opened, then its option is clicked
  select: { gestures: [...click, { do: "wait", ms: 250 }, { do: "reach", on: "option" }, { do: "move", ms: 300, on: "option" }, { do: "down", on: "option" }, { do: "wait", ms: PRESS }, { do: "up", on: "option" }] },
  check: { gestures: click, when: "off" },
  uncheck: { gestures: click, when: "on" },
  upload: { gestures: [...hover, { do: "file" }] },
  leave: { gestures: [{ do: "off", ms: 600, timed: true }] },
  wait: { gestures: [{ do: "wait", ms: 1000, timed: true }] },
  goto: { gestures: [{ do: "open" }] },
  set_url_param: { gestures: [{ do: "urlParam" }] },
  refetch: { gestures: [{ do: "refetch" }] },
};
/** how long a separator stays while the play runs, in ms: a person enters · the story moves to another person · a note */
export const HOLD = { enters: 3200, switches: 2800, note: 4200 };
/** the pause after the last act of a step, in ms */
export const AFTER_STEP = 100;
/** how long a separator takes to leave before the acts go on, in ms */
export const CURTAIN = 420;
