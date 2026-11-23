// THE COMPONENT PREVIEWER: shows a UI snapshot whose UI document is a component. Live: it mounts the live component, in a document of its own (an iframe at the
// address of the UI snapshot), and takes the size the live component reports: it hugs the component. Picture: it asks the picture service for the picture of the
// component at its own width and height. Whoever places it decides where it goes, and can give it a padding: room for what the component opens beside itself. It has no route, no device, no scale and no layout: those are the screen previewer's.
// The live component is in a document of its own so that it wears its own theme, whatever the page around it wears.
import * as React from "react";
import { Stack } from "../../../../../ui/web/primitives/components/stack/v1";
import type { DataReader } from "../reader";
import type { LiveComponent, Padding, Size } from "../live-component/live-component";
import { LIVE_COMPONENT_MOUNTED } from "../live-component/host";
import { build } from "../url";

export type ComponentMode = "live" | "picture";
/** gives the picture of a component (a UI snapshot whose UI document is a component) in a theme: where it is, and the width and height the component has */
export interface ComponentPictureService { picture(uiSnapshotId: string, theme: string | undefined): Promise<{ url: string; width: number; height: number }> }

export interface ComponentPreviewerProps {
  /** the id of a UI snapshot whose UI document is a component */
  id: string;
  /** live: the component runs · picture: an image of it (the default, as for a screen) */
  mode?: ComponentMode;
  /** the theme the component is drawn with: `<name>` (its last version) or `<name>@<version>`; absent = the one a component has when none is named. It can change while the component is shown */
  theme?: string;
  /** the mode of the theme: light, dark. It can change while the component is shown */
  themeMode?: string;
  /** room around the component, in px, for what it opens beside itself: a tooltip, a dropdown, the list of a select. One number for the four sides, or each side.
   *  Set by whoever places the previewer; none by default. It takes that space where the previewer is placed. Live only */
  padding?: number | Partial<Padding>;
  reader: DataReader;
  pictureService?: ComponentPictureService;
}
const NO_PADDING: Padding = { top: 0, right: 0, bottom: 0, left: 0 };
const paddingOf = (p: number | Partial<Padding> | undefined): Padding => (typeof p === "number" ? { top: p, right: p, bottom: p, left: p } : { ...NO_PADDING, ...(p ?? {}) });

/** the address a component is shown alone at: the one of its UI snapshot, with no path */
export const componentUrl = (uiSnapshotId: string, theme?: string, themeMode?: string): string => build({ kind: "ui-snapshot", id: uiSnapshotId, path: "/", query: {}, ...(theme ? { theme } : {}), ...(themeMode ? { mode: themeMode } : {}) });

type Shown = { url: string; title: string };
/** reads the UI snapshot and its UI document; a page is refused */
async function read(reader: DataReader, id: string, theme: string | undefined, themeMode: string | undefined): Promise<Shown> {
  const row = await reader.uiSnapshot(id), uiData = await reader.uiData(row.uiDataId);
  if (uiData.kind !== "component") throw new Error(`the UI document ${uiData.name} is a page: a page is shown in a screen previewer`);
  return { url: componentUrl(id, theme, themeMode), title: row.title ?? row.name ?? uiData.name };
}

/** the live component in its own document. The document is as wide as the place the previewer was given, so the component has that room to lay itself out in;
 *  the previewer shows only what the component draws: a box of the size the live component reports, the rest of the document cut off. That is the hug. */
function Live({ shown, theme, themeMode, padding }: { shown: Shown; theme?: string; themeMode?: string; padding: Padding }) {
  const room = React.useRef<HTMLDivElement>(null), frame = React.useRef<HTMLIFrameElement>(null);
  const [width, setWidth] = React.useState(0);
  const [size, setSize] = React.useState<Size | null>(null);
  const stop = React.useRef<(() => void) | null>(null);
  const reach = () => (frame.current?.contentWindow as (Window & { liveComponent?: LiveComponent }) | null | undefined)?.liveComponent;
  // the theme and its mode change in the document that is there: nothing reloads. A live component that mounts later takes the ones of that moment
  const look = React.useRef({ theme, themeMode, padding }); look.current = { theme, themeMode, padding };
  const pad = `${padding.top} ${padding.right} ${padding.bottom} ${padding.left}`;
  React.useEffect(() => { reach()?.setPadding(look.current.padding); }, [pad]);
  React.useEffect(() => { reach()?.setTheme(theme, themeMode); }, [theme, themeMode]);
  React.useEffect(() => {
    const el = room.current; if (!el) return;
    const see = () => setWidth(el.clientWidth); see();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(see); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const loaded = React.useCallback(() => {
    const live = reach();
    if (!live) return;
    live.setTheme(look.current.theme, look.current.themeMode);
    live.setPadding(look.current.padding);
    const take = (s: Size) => { if (s.width > 0 && s.height > 0) setSize({ width: Math.ceil(s.width), height: Math.ceil(s.height) }); };
    stop.current?.(); stop.current = live.onSize(take);
    void live.settled().then(() => take(live.size()));
  }, []);
  // the page says when its live component is mounted: it mounts after the page has loaded
  React.useEffect(() => {
    setSize(null);
    const told = (e: MessageEvent) => { if (e.source === frame.current?.contentWindow && (e.data as { type?: string } | null)?.type === LIVE_COMPONENT_MOUNTED) loaded(); };
    window.addEventListener("message", told);
    return () => { window.removeEventListener("message", told); stop.current?.(); stop.current = null; };
  }, [shown.url, loaded]);
  return (
    <div ref={room} style={{ width: "100%" }}>
      <div data-part="hug" style={{ display: "inline-block", verticalAlign: "top", overflow: "hidden", width: size ? size.width + padding.left + padding.right : "100%", height: size ? size.height + padding.top + padding.bottom : 1, maxWidth: "100%" }}>
        <iframe ref={frame} src={shown.url} title={shown.title} onLoad={loaded} data-testid="component-previewer-live" style={{ display: "block", border: 0, background: "transparent", width: width || "100%", height: size ? size.height + padding.top + padding.bottom : 1 }} />
      </div>
    </div>
  );
}

/** the picture, at the component's own width and height; a picture that cannot be given is a note with the reason and a link to the live component */
function Picture({ id, shown, service, theme }: { id: string; shown: Shown; service?: ComponentPictureService; theme?: string }) {
  const [picture, setPicture] = React.useState<{ url: string; width: number; height: number } | null>(null);
  const [failed, setFailed] = React.useState<string | null>(null);
  React.useEffect(() => {
    let off = false; setPicture(null); setFailed(null);
    if (!service) { setFailed("there is no picture service"); return; }
    service.picture(id, theme).then((p) => { if (!off) setPicture(p); }, (e: unknown) => { if (!off) setFailed(e instanceof Error ? e.message : String(e)); });
    return () => { off = true; };
  }, [id, service, theme]);
  if (failed) return (
    <div data-testid="component-previewer-no-picture" style={{ background: "#d92d20" }}>
      <Stack dir="col" gap={6} pad={12} style={{ color: "#fff" }}>
        <span element="type--body-small" style={{ color: "inherit" }}>no picture: {failed}</span>
        <span element="type--body-small" style={{ color: "inherit" }}><a href={shown.url} style={{ color: "inherit", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer">open the live component</a></span>
      </Stack>
    </div>
  );
  return picture ? <img data-testid="component-previewer-picture" src={picture.url} alt={shown.title} width={picture.width} height={picture.height} onError={() => setFailed("the picture cannot be loaded")} style={{ display: "block", maxWidth: "100%", height: "auto" }} /> : null;
}

export function ComponentPreviewer({ id, mode = "picture", theme, themeMode, padding, reader, pictureService }: ComponentPreviewerProps) {
  const [shown, setShown] = React.useState<Shown | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);
  React.useEffect(() => {
    let off = false; setShown(null); setProblem(null);
    read(reader, id, theme, themeMode).then((s) => { if (!off) setShown(s); }, (e: unknown) => { if (!off) setProblem(e instanceof Error ? e.message : String(e)); });
    return () => { off = true; };
  // the address is built once for a UI snapshot, with the theme and the mode it starts in; a later change of them goes to the live component, and nothing reloads
  }, [reader, id]);   // eslint-disable-line react-hooks/exhaustive-deps
  if (problem) return <span element="type--body-small" data-testid="component-previewer-problem" style={{ color: "var(--color-status-error, #a83232)" }}>{problem}</span>;
  if (!shown) return null;
  // it hugs: it shows what the component draws and no more, never wider than the place it was given
  return (
    <div concept="component-previewer" style={mode === "live" ? { width: "100%" } : { display: "inline-block", maxWidth: "100%", verticalAlign: "top" }}>
      {mode === "live" ? <Live shown={shown} theme={theme} themeMode={themeMode} padding={paddingOf(padding)} /> : <Picture id={id} shown={shown} service={pictureService} theme={theme} />}
    </div>
  );
}
