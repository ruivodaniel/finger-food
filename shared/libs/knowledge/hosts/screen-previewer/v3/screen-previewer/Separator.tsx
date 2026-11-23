// THE SEPARATOR: what is shown over the live screen between two steps of a live play. The screen stands under it, under the library's scrim. It is drawn by the screen previewer, so it wears the theme of whoever places the previewer, never the screen's. Three looks, each with a
// small animation: a person enters the story; the story moves from one person to another; a note, typed. It is drawn at the screen's own size.
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../../ui/web/primitives/components/avatar/v1";
import { Stack } from "../../../../../ui/web/primitives/components/stack/v1";
import type { Person, SeparatorShown } from "../player/player";

const MONO = "'SF Mono', Menlo, monospace";
const eyebrow: React.CSSProperties = { font: `15px ${MONO}`, letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(255,255,255,.65)" };
const white: React.CSSProperties = { color: "#fff" };
const KEYFRAMES = `
@keyframes sep-rise { from { opacity: 0; transform: translateY(18px) scale(.96) } to { opacity: 1; transform: none } }
@keyframes sep-leave { from { opacity: 1; transform: none } to { opacity: .35; transform: translateX(-14px) scale(.92) } }
@keyframes sep-arrive { from { opacity: 0; transform: translateX(26px) } to { opacity: 1; transform: none } }
@keyframes sep-arrow { from { opacity: 0; letter-spacing: -.3em } to { opacity: 1; letter-spacing: .1em } }
@keyframes sep-caret { 50% { opacity: 0 } }
`;
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");

function PersonShown({ person, big }: { person: Person; big?: boolean }) {
  return (
    <Stack dir={big ? "col" : "row"} gap={big ? 18 : 12} align="center">
      <Avatar scale="lg" style={big ? { width: 144, height: 144, fontSize: 48 } : { width: 72, height: 72, fontSize: 24 }}>{person.image ? <AvatarImage src={person.image} alt="" /> : null}<AvatarFallback>{initials(person.name)}</AvatarFallback></Avatar>
      <span style={{ ...white, font: `600 ${big ? 40 : 24}px ${MONO}` }}>{person.name}</span>
    </Stack>
  );
}
/** a line typed one character at a time; the whole text is laid out invisibly underneath, so the line has its final width from the first character */
function Typed({ text, delay, speed = 28 }: { text: string; delay: number; speed?: number }) {
  const [n, setN] = React.useState(0);
  React.useEffect(() => {
    let i = 0, t: ReturnType<typeof setTimeout>;
    const tick = () => { i += 1; setN(i); if (i < text.length) t = setTimeout(tick, speed); };
    const start = setTimeout(tick, delay);
    return () => { clearTimeout(start); clearTimeout(t); };
  }, [text, delay, speed]);
  return (
    <span style={{ position: "relative", display: "inline" }}>
      <span style={{ visibility: "hidden" }}>{text}</span>
      <span style={{ position: "absolute", left: 0, top: 0 }}>{text.slice(0, n)}{n > 0 && n < text.length ? <span style={{ animation: "sep-caret 700ms steps(1) infinite", marginLeft: 1 }}>▍</span> : null}</span>
    </span>
  );
}
function Content({ s }: { s: SeparatorShown }) {
  if (s.person && s.from) return (
    <Stack dir="col" gap={20} align="center">
      <span style={{ ...eyebrow, animation: "sep-rise 500ms ease both" }}>the story moves to</span>
      <Stack dir="row" gap={32} align="center">
        <div style={{ animation: "sep-leave 700ms ease 500ms both" }}><PersonShown person={s.from} /></div>
        <span style={{ ...white, font: `32px ${MONO}`, animation: "sep-arrow 600ms ease 700ms both" }}>→</span>
        <div style={{ animation: "sep-arrive 600ms cubic-bezier(.2,.8,.2,1) 900ms both" }}><PersonShown person={s.person} /></div>
      </Stack>
    </Stack>
  );
  if (s.person) return (
    <Stack dir="col" gap={24} align="center">
      <span style={{ ...eyebrow, animation: "sep-rise 500ms ease both" }}>enters the story</span>
      <div style={{ animation: "sep-rise 600ms cubic-bezier(.2,.8,.2,1) 150ms both" }}><PersonShown person={s.person} big /></div>
    </Stack>
  );
  return (
    <Stack dir="col" gap={18} align="center">
      <span style={{ ...eyebrow, animation: "sep-rise 500ms ease both" }}>next</span>
      <div style={{ ...white, width: 820, maxWidth: "80%", font: `24px ${MONO}`, lineHeight: 1.6, animation: "sep-rise 400ms ease both" }}><Typed text={s.text} delay={500} /></div>
    </Stack>
  );
}

/** the curtain over the screen. `tick` draws the content again, so its animation runs again */
export function Separator({ separator, tick }: { separator: SeparatorShown | null; tick: number }) {
  return (
    <div data-testid="screen-separator" data-state={separator ? "shown" : "hidden"} style={{ position: "absolute", inset: 0, zIndex: 1, transition: "opacity 420ms ease", opacity: separator ? 1 : 0, pointerEvents: "none" }}>
      <style>{KEYFRAMES}</style>
      {/* the library's scrim, the one its dialog uses: its colour, opacity and blur are the theme's of whoever places the previewer */}
      <div element="overlay--dialog" data-part="scrim" style={{ position: "absolute", inset: 0, "--scrim-blur": "8px", "--scrim-opacity-pct": "55%" } as React.CSSProperties} />
      {separator ? <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><Content key={tick} s={separator} /></div> : null}
    </div>
  );
}
