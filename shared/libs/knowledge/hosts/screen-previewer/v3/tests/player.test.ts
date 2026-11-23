import { beforeEach, describe, expect, it } from "vitest";
import type { Gestures } from "../live-screen/gestures";
import { ACTS } from "../player/acts";
import { createPlayer, type PlayedPreviewer } from "../player/player";
import { reader } from "./world";

let did: string[], on: boolean;
const name = (t: unknown) => (typeof t === "string" ? t : `option ${(t as { option: string }).option}`);
const gestures: Gestures = {
  reach: async (t) => { if (t === "missing") throw new Error("nothing on the screen has the test id missing"); did.push(`reach ${name(t)}`); return { x: 10, y: 20 }; },
  scrollTo: async (t) => { did.push(`scroll to ${name(t)}`); },
  pointerMove: (t) => { did.push(`over ${name(t)}`); }, pointerDown: (t) => { did.push(`down ${name(t)}`); }, pointerUp: (t) => { did.push(`up ${name(t)}`); },
  pointerLeave: () => { did.push("leave"); }, clear: (t) => { did.push(`clear ${name(t)}`); }, key: (k) => { did.push(`key ${k}`); },
  isOn: () => on, isNativeSelect: () => false, choose: (t, v) => { did.push(`choose ${name(t)} ${v}`); }, giveFile: async (t, url) => { did.push(`file ${name(t)} ${url}`); },
};
const previewer: PlayedPreviewer = {
  liveScreen: () => ({ gestures, mount: async (url) => { did.push(`mount ${url}`); }, setUrlParam: (n, v) => { did.push(`set ${n} ${v}`); }, refetch: () => { did.push("refetch"); }, settled: async () => {} }),
  showSeparator: (x) => { did.push(`show ${x.text}`); }, hideSeparator: () => { did.push("hide"); },
  movePointer: (to) => { did.push(`pointer to ${to.x},${to.y}`); }, pressPointer: () => { did.push("pointer down"); }, releasePointer: () => { did.push("pointer up"); },
  pointerOff: () => { did.push("pointer off"); }, restart: async () => { did.push("restart"); },
};
const player = () => createPlayer({ reader, previewer: () => previewer, theme: "borro", pace: 0 });
const event = (act: string, more: object = {}) => ({ id: "x", version: 1, livePlayStepId: "s", act, ...more }) as Parameters<ReturnType<typeof player>["doAction"]>[0];
beforeEach(() => { did = []; on = false; });

describe("the player", () => {
  it("loads the live play: steps and events in their order, a person by the profile's name", async () => {
    const p = player(); await p.load("lp1");
    expect(p.state().steps.map((s) => s.id)).toEqual(["st-who", "st-acts", "st-note", "st-moment", "st-hover"]);
    expect(p.state().steps[1].events.map((e) => e.id)).toEqual(["e-click", "e-fill", "e-open"]);
    expect(p.state().steps[0].separator).toEqual({ text: "Ada Lovelace", person: { id: "u-1", name: "Ada Lovelace" } });
  });
  it("shows a separator in the screen previewer; the acts after it only take it away: nothing is loaded again", async () => {
    const p = player(); await p.load("lp1"); await p.next();
    expect(did).toEqual(["show Ada Lovelace"]);
    did = []; await p.next();
    expect(did[0]).toBe("hide");
    expect(did).not.toContain("restart");
    expect(did.filter((x) => x.startsWith("mount"))).toEqual(["mount /ui-prototype/p1/organizations/a/info?_theme=borro"]);
  });
  it("clicks as a person: the element is reached, the pointer travels to it, the page hears it over, the button goes down and up", async () => {
    await player().doAction(event("click", { target: "next-btn" }));
    expect(did).toEqual(["reach next-btn", "pointer to 10,20", "over next-btn", "pointer down", "down next-btn", "up next-btn", "pointer up"]);
  });
  it("fills as a person: a click into the field, what it holds deleted, one key after the other", async () => {
    await player().doAction(event("fill", { target: "name-input", value: "Ab" }));
    expect(did).toEqual(["reach name-input", "pointer to 10,20", "over name-input", "pointer down", "down name-input", "up name-input", "pointer up", "clear name-input", "key A", "key b"]);
  });
  it("hovers, leaves and presses a key", async () => {
    const p = player();
    await p.doAction(event("hover", { target: "next-btn" })); await p.doAction(event("leave")); await p.doAction(event("press", { value: "Enter" }));
    expect(did).toEqual(["reach next-btn", "pointer to 10,20", "over next-btn", "pointer off", "leave", "key Enter"]);
  });
  it("enters, then scrolls: the pointer comes onto the screen, then the region that holds the element scrolls", async () => {
    const p = player();
    await p.doAction(event("enter", { target: "list" })); await p.doAction(event("scroll", { target: "next-btn" }));
    expect(did).toEqual(["reach list", "pointer to 10,20", "over list", "scroll to next-btn"]);
  });
  it("does not scroll while the pointer is off the screen", async () => {
    await expect(player().doAction(event("scroll", { target: "next-btn" }))).rejects.toThrow("the pointer is not on the screen: enter first");
  });
  it("selects: the select is clicked open, then its option is clicked", async () => {
    await player().doAction(event("select", { target: "type-select", value: "Client" }));
    expect(did).toEqual([
      "reach type-select", "reach type-select", "pointer to 10,20", "over type-select", "pointer down", "down type-select", "up type-select", "pointer up",
      "reach option Client", "pointer to 10,20", "over option Client", "pointer down", "down option Client", "up option Client", "pointer up",
    ]);
  });
  it("checks only a checkbox that is off, and unchecks only one that is on", async () => {
    const p = player();
    on = true; await p.doAction(event("check", { target: "terms-check" }));
    expect(did).toEqual(["reach terms-check"]);
    did = []; await p.doAction(event("uncheck", { target: "terms-check" }));
    expect(did).toContain("up terms-check");
  });
  it("moves the moment with two acts that are not a person's: _t in the address, then the page asks again", async () => {
    const p = player(); await p.load("lp1"); for (let i = 0; i < 3; i++) await p.next(); did = []; await p.next();
    expect(did).toEqual(["hide", "set _t 1", "refetch"]);
  });
  it("stops with the reason when nothing on the screen has the test id", async () => {
    const p = player(); await p.load("lp1");
    p.state().steps[1].events[0].target = "missing";
    await p.play();
    expect(p.state()).toMatchObject({ at: 1, playing: false, problem: "nothing on the screen has the test id missing" });
  });
  it("resets: back to the first step, the separator away, the live screen at its first URL again", async () => {
    const p = player(); await p.load("lp1"); await p.next(); did = []; await p.reset();
    expect(did).toEqual(["hide", "restart"]);
    expect(p.state().at).toBe(0);
  });
  it("has an act for every act of the model", () => expect(Object.keys(ACTS).sort()).toEqual(["check", "click", "enter", "fill", "goto", "hover", "leave", "press", "refetch", "scroll", "select", "set_url_param", "uncheck", "upload", "wait"]));
});
