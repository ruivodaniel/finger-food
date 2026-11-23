// THE PLAYER: a live play in. For each step, in order, it has the screen previewer show the step's separator, or it does the step's acts on the page as a
// person does them: it unfolds each act into its gestures (acts.ts) and has the live screen do them, one after the other, each with its time. Every element
// is found by its test id. It touches no mock, no store and no router; it draws nothing: the screen previewer draws the separator and the pointer.
// A separator is an overlay: the play waits while it is up, and goes on from where it was when it leaves. Nothing is loaded again.
import type { Gestures, Point, Target } from "../live-screen/gestures";
import type { LiveScreen } from "../live-screen/live-screen";
import type { LivePlayStep, LivePlayUiEvent, UiLivePlay } from "../model";
import type { DataReader } from "../reader";
import { build, parse, splitPath } from "../url";
import { ACTS, AFTER_STEP, CURTAIN, HOLD, type Gesture } from "./acts";

export type Person = { id: string; name: string; image?: string };
/** a separator as the screen previewer shows it: what it says; a person when another person acts from here, and the person who acted before */
export type SeparatorShown = { text: string; person?: Person; from?: Person };
/** what the player asks of the screen previewer it plays in */
export interface PlayedPreviewer {
  /** the live screen it has mounted; nothing while it is not there yet */
  liveScreen(): Pick<LiveScreen, "mount" | "gestures" | "setUrlParam" | "refetch" | "settled"> | null;
  showSeparator(separator: SeparatorShown): void;
  hideSeparator(): void;
  /** the pointer it draws travels to a point of the screen in `ms` */
  movePointer(to: Point, ms: number): void;
  /** the pointer shows its button down, then up */
  pressPointer(): void;
  releasePointer(): void;
  /** the pointer travels off the screen in `ms` */
  pointerOff(ms: number): void;
  /** the live screen again at the URL it was first mounted at */
  restart(): Promise<void>;
}
/** a step as the player runs it: its events in order; what its separator shows */
export type PlayedStep = LivePlayStep & { events: LivePlayUiEvent[]; separator?: SeparatorShown };
export type PlayerState = {
  play: UiLivePlay | null; steps: PlayedStep[];
  /** the step that runs next; the number of steps when the play is over */
  at: number; playing: boolean;
  /** why the play stopped */
  problem: string | null;
};
export interface Player {
  state(): PlayerState;
  subscribe(heard: () => void): () => void;
  /** reads the live play and its steps */
  load(livePlayId: string): Promise<void>;
  /** runs every step that is left, in order */
  play(): Promise<void>;
  /** runs one step */
  next(): Promise<void>;
  pause(): void;
  /** back to the first step */
  reset(): Promise<void>;
  runStep(step: PlayedStep): Promise<void>;
  doAction(action: LivePlayUiEvent): Promise<void>;
}

const inOrder = <T extends { id: string }>(rows: T[], order: string[] | undefined): T[] => (order ?? []).map((id) => rows.find((r) => r.id === id)).filter((r): r is T => !!r);

export function createPlayer({ reader, previewer, theme, pace = 1 }: {
  reader: DataReader;
  previewer: () => PlayedPreviewer | null;
  /** the theme the screen previewer shows the screen in: a URL the play opens keeps it */
  theme?: string;
  /** every time is multiplied by this: 0 in a test */
  pace?: number;
}): Player {
  let s: PlayerState = { play: null, steps: [], at: 0, playing: false, problem: null }, running = false, curtain = false;
  /** whether the pointer is on the screen: it comes on with a move, and goes off with leave */
  let onScreen = false;
  const heard = new Set<() => void>(), set = (p: Partial<PlayerState>) => { s = { ...s, ...p }; heard.forEach((f) => f()); };
  const wait = (ms: number) => (ms * pace > 0 ? new Promise<void>((r) => setTimeout(r, ms * pace)) : Promise.resolve());
  const there = () => { const p = previewer(); if (!p) throw new Error("there is no screen previewer"); return p; };
  const screen = async () => {
    // the screen previewer mounts the live screen in a document of its own: it is there a moment after the previewer is
    for (let i = 0; i < 100; i++) { const live = there().liveScreen(); if (live) return live; await new Promise((r) => setTimeout(r, 50)); }
    throw new Error("there is no live screen");
  };

  /** one gesture of an act, on the element the event names */
  async function gesture(g: Gesture, a: LivePlayUiEvent, on: Gestures, at: { point: Point | null }) {
    const p = there();
    const target = (): Target => {
      if ("on" in g && g.on === "option") return { option: a.value ?? "" };
      if (!a.target) throw new Error(`a ${a.act} names no element`);
      return a.target;
    };
    const ms = "ms" in g ? ("timed" in g && g.timed && a.durationMs !== undefined ? a.durationMs : g.ms) : 0;
    if (g.do === "reach") at.point = await on.reach(target());
    else if (g.do === "move") { if (at.point) p.movePointer(at.point, ms * pace); await wait(ms); on.pointerMove(target()); onScreen = true; }
    else if (g.do === "scroll") {
      if (!onScreen) throw new Error("the pointer is not on the screen: enter first");
      await on.scrollTo(target(), ms * pace);
    }
    else if (g.do === "down") { p.pressPointer(); on.pointerDown(target()); }
    else if (g.do === "up") { on.pointerUp(target()); p.releasePointer(); }
    else if (g.do === "clear") on.clear(target());
    else if (g.do === "type") { const text = a.value ?? "", each = Math.max(g.least, text.length ? ms / text.length : 0); for (const k of text) { on.key(k); await wait(each); } }
    else if (g.do === "key") on.key(a.value ?? "Enter");
    else if (g.do === "file") await on.giveFile(target(), a.value ?? "");
    else if (g.do === "off") { p.pointerOff(ms * pace); await wait(ms); on.pointerLeave(); onScreen = false; }
    else if (g.do === "wait") await wait(ms);
    else {
      const live = await screen();
      if (g.do === "open") {
        // a URL of a live screen as it is; a real path is opened in the play's UI prototype
        const to = splitPath(a.url ?? "/");
        await live.mount(parse(a.url ?? "") ? a.url! : build({ kind: "ui-prototype", id: s.play!.uiPrototypeId, path: to.path, query: to.query, ...(theme ? { theme } : {}) }));
      } else if (g.do === "urlParam") {
        if (a.target !== "_t" && a.target !== "_theme") throw new Error(`the live screen has no URL parameter ${a.target ?? "(none)"}`);
        live.setUrlParam(a.target, a.value ?? "");
      } else live.refetch();
    }
  }

  const self: Player = {
    state: () => s,
    subscribe: (f) => { heard.add(f); return () => { heard.delete(f); }; },
    async load(livePlayId) {
      const play = await reader.livePlay(livePlayId), prototype = await reader.uiPrototype(play.uiPrototypeId);
      let before: Person | undefined;
      const steps: PlayedStep[] = [];
      for (const step of inOrder(await reader.livePlaySteps(play.id), play.stepOrder)) {
        if (step.kind === "actions") { steps.push({ ...step, events: inOrder(await reader.livePlayUiEvents(step.id), step.uiEventOrder) }); continue; }
        if (step.separatorKind !== "persona" || !step.worldUserId) { steps.push({ ...step, events: [], separator: { text: step.text ?? "" } }); continue; }
        // another person acts from here: the name and the image are the profile's, in the prototype's world at its moment
        const profile = (await reader.rows(prototype.worldId, prototype.t, "user_profile", [step.worldUserId]))[0];
        const person: Person = { id: step.worldUserId, name: typeof profile?.name === "string" ? profile.name : step.worldUserId, ...(typeof profile?.image === "string" ? { image: profile.image } : {}) };
        steps.push({ ...step, events: [], separator: { text: person.name, person, ...(before && before.id !== person.id ? { from: before } : {}) } });
        before = person;
      }
      curtain = false; onScreen = false;
      set({ play, steps, at: 0, playing: false, problem: null });
    },
    async play() {
      if (s.playing) return;
      set({ playing: true, problem: null });
      while (s.playing && s.at < s.steps.length) await self.next();
      if (s.at >= s.steps.length && curtain) { previewer()?.hideSeparator(); curtain = false; }
      set({ playing: false });
    },
    async next() {
      if (running || s.at >= s.steps.length) return;
      running = true;
      try { await self.runStep(s.steps[s.at]); set({ at: s.at + 1, problem: null }); }
      catch (e) { set({ playing: false, problem: e instanceof Error ? e.message : String(e) }); }
      finally { running = false; }
    },
    pause: () => set({ playing: false }),
    async reset() {
      set({ at: 0, playing: false, problem: null });
      curtain = false; onScreen = false;
      const p = previewer();
      if (!p) return;
      p.hideSeparator();
      await p.restart();
    },
    async runStep(step) {
      if (step.kind === "separator") {
        const shown = step.separator ?? { text: "" };
        there().showSeparator(shown); curtain = true;
        if (s.playing) await wait(!shown.person ? HOLD.note : shown.from ? HOLD.switches : HOLD.enters);
        return;
      }
      // the separator leaves; the page under it was never touched, so the acts go on from where it stands
      if (curtain) { there().hideSeparator(); curtain = false; await wait(CURTAIN); }
      for (const event of step.events) await self.doAction(event);
      await wait(AFTER_STEP);
    },
    async doAction(a) {
      const live = await screen(), on = live.gestures, act = ACTS[a.act];
      if (!act) throw new Error(`there is no act ${a.act}`);
      await live.settled();
      await wait(a.waitMs ?? 0);
      // a checkbox that is already as the act wants it is left alone
      if (act.when && a.target && (await on.reach(a.target), on.isOn(a.target)) !== (act.when === "on")) return;
      // a native select has no options on the page to click: it takes the value
      if (a.act === "select" && a.target && (await on.reach(a.target), on.isNativeSelect(a.target))) {
        const at = { point: null as Point | null };
        for (const g of ACTS.hover.gestures) await gesture(g, a, on, at);
        on.choose(a.target, a.value ?? "");
      } else {
        const at = { point: null as Point | null };
        for (const g of act.gestures) await gesture(g, a, on, at);
      }
      await live.settled();
    },
  };
  return self;
}
