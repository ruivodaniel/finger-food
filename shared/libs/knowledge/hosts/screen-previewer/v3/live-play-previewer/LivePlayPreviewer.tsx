// THE LIVE PLAY PREVIEWER: shows a UI prototype. Play: the player plays one of its live plays in a screen previewer. Prototype: a screen previewer opens
// /ui-prototype/<id>; the person clicks. It draws the play's parts around the screen (the header, the cast, the commands, the step list) and gives the five
// commands to the player. It runs no step and touches no screen: the player does, in the screen previewer.
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../../../../../ui/web/primitives/components/avatar/v1";
import { Button } from "../../../../../ui/web/primitives/components/button/v1";
import { List, ListItem, ListItemContent, ListItemIcon, ListItemTitle } from "../../../../../ui/web/primitives/components/list/v1";
import { Stack } from "../../../../../ui/web/primitives/components/stack/v1";
import { Icon } from "@libs/web-components";
import type { LivePlayUiEvent } from "../model";
import { createPlayer, type PlayedStep, type Player, type PlayerState } from "../player/player";
import type { DataReader } from "../reader";
import { ScreenPreviewer, type ScreenPreviewerHandle } from "../screen-previewer/ScreenPreviewer";
import { DRAWER, PANEL, PLAY_DEFAULTS, PLAY_WIDTH, STACK_AT, type PlayLayout, type PlayMode, type PlaySwitches } from "./spec";

export interface LivePlayPreviewerProps extends Partial<PlaySwitches> {
  /** the id of a UI prototype */
  id: string;
  mode?: PlayMode;
  /** the live play to play; none = the first of the prototype's */
  livePlayId?: string;
  layout?: PlayLayout;
  /** the theme the screen is shown in; none = the screen's own */
  theme?: string;
  reader: DataReader;
}

const said = (e: LivePlayUiEvent): string =>
  e.act === "goto" ? `open ${e.url ?? ""}` : e.act === "fill" ? `fill ${e.target ?? ""} with "${e.value ?? ""}"` : e.act === "set_url_param" ? `set ${e.target ?? ""} to ${e.value ?? ""} in the address`
  : e.act === "refetch" ? "ask the API again" : e.act === "wait" ? "wait" : `${e.act} ${e.target ?? ""}`;
const titleOf = (step: PlayedStep): string => (step.kind === "separator" ? step.separator?.text ?? "" : step.events.map(said).join(" · "));
const initials = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
/** the people of the play, in order of first appearance */
const castOf = (steps: PlayedStep[]) => steps.flatMap((s) => (s.separator?.person ? [s.separator.person] : [])).filter((p, i, all) => all.findIndex((x) => x.id === p.id) === i);

function Header({ s }: { s: PlayerState }) {
  return (
    <Stack dir="col" gap={4} data-testid="live-play-header">
      <span element="type--heading3">{s.play!.title}</span>
      {s.play!.description ? <span element="type--body-small" emphasis="quiet">{s.play!.description}</span> : null}
    </Stack>
  );
}
function Cast({ s }: { s: PlayerState }) {
  const cast = castOf(s.steps);
  if (!cast.length) return null;
  return (
    <Stack dir="row" gap={12} wrap data-testid="live-play-cast">
      {cast.map((p) => (
        <Stack key={p.id} dir="row" gap={8} align="center">
          <Avatar scale="sm">{p.image ? <AvatarImage src={p.image} alt="" /> : null}<AvatarFallback>{initials(p.name)}</AvatarFallback></Avatar>
          <span element="type--body-small">{p.name}</span>
        </Stack>
      ))}
    </Stack>
  );
}
/** the commands and the step list. The commands are the player's five: load is done when the previewer opens; here are reset, play, pause and next */
function Transport({ s, player, commands, count, steps, more }: { s: PlayerState; player: Player; commands: boolean; count: boolean; steps: boolean; /** the commands of the layout, after the player's */ more?: React.ReactNode }) {
  const over = s.at >= s.steps.length;
  return (
    <Stack dir="col" gap={12} concept="live-play-player" data-testid="live-play-transport">
      {commands ? (
        <Stack dir="row" gap={12} align="center" justify="center">
          <Button buttonType="icon" startIcon="skipBack" emphasis="secondary" scale="md" aria-label="back to the first step" disabled={s.at === 0 && !s.problem} onClick={() => void player.reset()} data-testid="live-play-reset-btn" />
          {s.playing
            ? <Button buttonType="icon" startIcon="pause" emphasis="primary" scale="lg" aria-label="pause" onClick={() => player.pause()} data-testid="live-play-pause-btn" />
            : <Button buttonType="icon" startIcon="play" emphasis="primary" scale="lg" aria-label="play" disabled={over} onClick={() => void player.play()} data-testid="live-play-play-btn" />}
          <Button buttonType="icon" startIcon="skipForward" emphasis="secondary" scale="md" aria-label="next step" disabled={over || s.playing} onClick={() => void player.next()} data-testid="live-play-next-btn" />
          {more}
        </Stack>
      ) : null}
      {count ? (
        <Stack dir="row" gap={8} justify="center">
          <span element="type--body-extra-small" emphasis="quiet">{over ? `${s.steps.length} steps, played` : `step ${s.at + 1} of ${s.steps.length}`}</span>
          {s.problem ? <span element="type--body-extra-small" status="error" data-testid="live-play-problem">{s.problem}</span> : null}
        </Stack>
      ) : null}
      {steps ? (
        <List position="fill">
          {s.steps.map((step, i) => (
            <ListItem key={step.id} state={i === s.at ? "selected" : undefined} data-testid={`live-play-step-${i + 1}-row`}>
              <ListItemIcon><span element="type--body-extra-small" emphasis="quiet">{i + 1}</span></ListItemIcon>
              <ListItemIcon><Icon name={step.kind === "separator" ? "bookmark" : "play"} scale="sm" /></ListItemIcon>
              <ListItemContent><ListItemTitle>{step.kind === "separator" ? <span emphasis="quiet">{titleOf(step)}</span> : titleOf(step)}</ListItemTitle></ListItemContent>
            </ListItem>
          ))}
        </List>
      ) : null}
    </Stack>
  );
}

export function LivePlayPreviewer({ id, mode = "play", livePlayId, layout = "player", theme, reader, ...given }: LivePlayPreviewerProps) {
  const v: PlaySwitches = { ...PLAY_DEFAULTS[layout], ...given };
  const previewer = React.useRef<ScreenPreviewerHandle>(null), box = React.useRef<HTMLDivElement>(null);
  const [, redraw] = React.useReducer((n: number) => n + 1, 0);
  const [failure, setFailure] = React.useState<string | null>(null);
  const [hovered, setHovered] = React.useState(false);
  const [width, setWidth] = React.useState<number | null>(null);
  // the step list's drawer is open; the previewer is shown big
  const [listed, setListed] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  React.useEffect(() => {
    if (!expanded) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [expanded]);
  const player = React.useMemo(() => createPlayer({ reader, previewer: () => previewer.current, theme }), [reader, theme]);
  React.useEffect(() => player.subscribe(redraw), [player]);
  React.useEffect(() => {
    let off = false; setFailure(null);
    (async () => {
      const play = livePlayId ?? (await reader.livePlays(id))[0]?.id;
      if (!play) throw new Error("this UI prototype has no live play");
      if (!off) await player.load(play);
    })().catch((e: unknown) => { if (!off) setFailure(e instanceof Error ? e.message : String(e)); });
    return () => { off = true; player.pause(); };
  }, [player, reader, id, livePlayId]);
  React.useEffect(() => {
    const el = box.current; if (!el) return;
    const see = () => setWidth(el.clientWidth); see();
    const ro = new ResizeObserver(see); ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const s = player.state();
  const outer: React.CSSProperties = { width: PLAY_WIDTH[v.size] ?? "100%", maxWidth: "100%" };
  // the screen: the prototype in a screen previewer, as wide as the room it is given. The player plays in it; in mode prototype the person clicks
  const screen = <ScreenPreviewer ref={previewer} id={id} mode="live" layout="standard" size="fit" chrome={false} theme={theme} reader={reader} />;
  const note = failure ? <span element="type--body-small" status="error">{failure}</span> : null;

  if (mode === "prototype") return <div ref={box} data-testid="live-play-previewer" style={outer}>{screen}</div>;
  // the commands of this previewer, after the player's: the step list's drawer (only when the commands are over the screen: beside it, the list is already there) and expand
  const more = (
    <>
      {v.steps && v.commandsOnHover ? <Button buttonType="icon" startIcon="list" emphasis={listed ? "primary" : "secondary"} scale="md" aria-label={listed ? "hide the steps" : "show the steps"} aria-pressed={listed} onClick={() => setListed(!listed)} data-testid="live-play-steps-btn" /> : null}
      {v.expand ? <Button buttonType="icon" startIcon={expanded ? "minimize" : "maximize"} emphasis="secondary" scale="md" aria-label={expanded ? "back to its size" : "expand"} onClick={() => setExpanded(!expanded)} data-testid="live-play-expand-btn" /> : null}
    </>
  );
  let body: React.ReactNode;
  if (v.commandsOnHover) {
    // the screen alone: the commands over it while the pointer is there. The step list is a drawer over the screen, from the right, at the same level as the commands:
    // it wears the library's sheet and keeps its own size, whatever the size of the screen
    const shown = v.commands && !!s.play && (hovered || !!s.problem);
    body = (
      <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ position: "relative" }}>
        {screen}
        {v.commands && s.play ? (
          <div style={{ position: "absolute", left: "50%", bottom: 14, transform: "translateX(-50%)", transition: "opacity 220ms ease", opacity: shown ? 1 : 0, pointerEvents: shown ? "auto" : "none", zIndex: 3 }}>
            <Transport s={s} player={player} commands count={v.stepCount} steps={false} more={more} />
          </div>
        ) : null}
        {v.steps && listed && s.play ? (
          <div element="overlay--sheet" scale="md" data-testid="live-play-steps-drawer" style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: DRAWER, maxWidth: "100%", overflowY: "auto", zIndex: 2 }}>
            <Transport s={s} player={player} commands={false} count={false} steps />
          </div>
        ) : null}
      </div>
    );
  } else {
    // the commands and the step list beside the screen; under it when the room is narrow
    const stacked = width !== null && width < STACK_AT;
    body = (
      <Stack dir={stacked ? "col" : "row"} gap={24} align="start">
        <div style={{ flex: "1 1 0", minWidth: 0, width: stacked ? "100%" : undefined }}>{screen}</div>
        {(v.commands || v.steps) && s.play ? <div style={{ width: stacked ? "100%" : PANEL, flexShrink: 0 }}><Transport s={s} player={player} commands={v.commands} count={v.stepCount} steps={v.steps} more={more} /></div> : null}
      </Stack>
    );
  }
  // expanded: the same previewer, big, over everything; a click outside it or Escape brings it back. Nothing is drawn again, so the play goes on
  const over: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0, 0, 0, .6)", display: "flex", overflow: "auto", padding: "3vh 0" };
  const bare = v.commandsOnHover && !v.header && !v.cast;
  const big: React.CSSProperties = { width: "min(94vw, 1600px)", margin: "auto", flex: "none", ...(bare ? {} : { background: "var(--color-surface, #fff)", padding: 24, borderRadius: 8 }) };
  return (
    <div ref={box} data-testid="live-play-previewer" style={expanded ? over : outer} onClick={expanded ? () => setExpanded(false) : undefined}>
      <div concept="live-play-player" onClick={(e) => e.stopPropagation()} style={expanded ? big : undefined}>
        <Stack dir="col" gap={16}>
          {v.header && s.play ? <Header s={s} /> : null}
          {v.cast && s.play ? <Cast s={s} /> : null}
          {note}
          {body}
        </Stack>
      </div>
    </div>
  );
}
