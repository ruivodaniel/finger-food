// THE SCREEN PREVIEWER: shows a UI snapshot or a UI prototype. Live: it reads the row and the route of its UI document, builds the URL, and mounts the live screen
// at it, in a document of its own (an iframe). Picture: it asks the picture service. When the player asks, it shows the separator over the live screen. It touches no mock and draws no page: it only gives the screen room.
// Library rules: structure is Stack, type is `element`, the chrome buttons are the library's. The screen itself is an <iframe> or an <img>: a document, not a design,
// so its box is sized in CSS from the spec's sizes (the inline styles of this file): the frame of the box, the device's width and ratio, the scale that fits the
// page's own width into its box, the chrome's place over the corner, and the zoom's overlay.
import * as React from "react";
import { Button } from "../../../../../ui/web/primitives/components/button/v1";
import { Stack } from "../../../../../ui/web/primitives/components/stack/v1";
import { Icon } from "@libs/web-components";
import type { UiPrototype, UiSnapshot } from "../model";
import type { DataReader } from "../reader";
import { buildUrl, isSnapshot, locate } from "../locate";
import { wholeHeight } from "../live-screen/whole-height";
import type { LiveScreen } from "../live-screen/live-screen";
import { Separator } from "./Separator";
import type { PlayedPreviewer, SeparatorShown } from "../player/player";
import { DEFAULTS, DEVICE, FIT_RATIO, FRAME, SMALL, WIDTH, type DeviceName, type Layout, type Mode, type Switches } from "./spec";

type Device = (typeof DEVICE)[DeviceName];
type Row = UiSnapshot | UiPrototype;
export { buildUrl };
/** gives the URL of the picture of a UI snapshot on a device, at a cut, in a theme */
export interface PictureService { picture(uiSnapshotId: string, device: Device, cut: "fold" | "full", theme: string | undefined): Promise<string> }

type Shown = { row: Row; url: string; surface: DeviceName; title: string };
/** reads the row, the UI document it opens on, the UI node of that document and its route */
async function read(reader: DataReader, id: string, theme: string | undefined): Promise<Shown> {
  const { row, node, route } = await locate(reader, id);
  return { row, url: buildUrl(row, route, theme), surface: node.surface === "mobile" ? "mobile" : "desktop", title: row.title ?? node.title ?? row.id };
}

/** what the player asks of the screen previewer it plays in: the live screen it mounted, the separator over it, the pointer it draws, the screen at its first URL again */
export type ScreenPreviewerHandle = PlayedPreviewer;
/** where the pointer is on the screen, in the screen's own px; `ms`: how long it takes to get there */
type Pointer = { x: number; y: number; ms: number; down: boolean; presses: number };

/** the live screen in its box: an iframe as wide as the device, scaled to the box. `ratio` is width : height; "content" = the whole page's.
 *  Over it, in the same scale and never touching it: the separator, and the pointer of whoever plays in it */
const Live = React.forwardRef<ScreenPreviewerHandle, { url: string; title: string; device: Device; width: string; ratio: number | "content"; usable: boolean }>(function Live({ url, title, device, width, ratio, usable }, handle) {
  const box = React.useRef<HTMLDivElement>(null), frame = React.useRef<HTMLIFrameElement>(null);
  const [px, setPx] = React.useState(0);
  const [measured, setMeasured] = React.useState<number | null>(null);
  const [separator, setSeparator] = React.useState<{ shown: SeparatorShown | null; tick: number }>({ shown: null, tick: 0 });
  const [pointer, setPointer] = React.useState<Pointer | null>(null);
  React.useEffect(() => {
    const el = box.current; if (!el) return;
    const see = () => setPx(el.clientWidth); see();
    const ro = new ResizeObserver(see); ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const liveScreen = () => (frame.current?.contentWindow as (Window & { liveScreen?: LiveScreen }) | null | undefined)?.liveScreen ?? null;
  const measure = React.useCallback(async () => {
    if (ratio !== "content") return;
    await liveScreen()?.settled();
    await new Promise((r) => setTimeout(r, 150));
    if (frame.current?.contentDocument) setMeasured(device.width / wholeHeight(frame.current.contentDocument));
  }, [ratio, device.width]);
  React.useEffect(() => { setMeasured(null); }, [url, device.width]);
  const r = ratio === "content" ? measured ?? device.aspectRatio : ratio;
  const height = device.width / r;
  // the pointer waits off the screen, past its bottom right corner, until it is first sent somewhere
  const off = { x: device.width + 60, y: height + 60 };
  React.useImperativeHandle(handle, () => ({
    liveScreen,
    showSeparator: (shown) => setSeparator((was) => ({ shown, tick: was.tick + 1 })),
    hideSeparator: () => setSeparator((was) => ({ ...was, shown: null })),
    movePointer: (to, ms) => setPointer((was) => ({ x: to.x, y: to.y, ms, down: false, presses: was?.presses ?? 0 })),
    pressPointer: () => setPointer((was) => (was ? { ...was, ms: 90, down: true } : was)),
    releasePointer: () => setPointer((was) => (was ? { ...was, ms: 90, down: false, presses: was.presses + 1 } : was)),
    pointerOff: (ms) => setPointer((was) => (was ? { ...was, ...off, ms, down: false } : was)),
    restart: () => new Promise<void>((ok) => {
      const f = frame.current; if (!f) return ok();
      setSeparator((was) => ({ ...was, shown: null })); setPointer(null);
      const loaded = () => { f.removeEventListener("load", loaded); ok(); };
      f.addEventListener("load", loaded);
      f.src = url;
    }),
  }), [url, off.x, off.y]);
  const scaled: React.CSSProperties = { position: "absolute", top: 0, left: 0, width: device.width, height, transform: `scale(${px / device.width})`, transformOrigin: "top left" };
  const where = pointer ?? { ...off, ms: 0, down: false, presses: 0 };
  return (
    <div ref={box} style={{ width, flex: "none", position: "relative", overflow: "hidden", background: "#fff", aspectRatio: String(r) }}>
      <iframe ref={frame} src={url} title={title} onLoad={() => void measure()} style={{ ...scaled, border: 0, background: "#fff", pointerEvents: usable ? "auto" : "none" }} />
      <div style={{ ...scaled, pointerEvents: "none", zIndex: 1 }}>
        <Separator separator={separator.shown} tick={separator.tick} />
        <div data-testid="screen-previewer-pointer" style={{ position: "absolute", left: 0, top: 0, transform: `translate(${where.x}px, ${where.y}px)`, transition: `transform ${where.ms}ms ease-in-out`, zIndex: 2 }}>
          <style>{"@keyframes screen-previewer-press { from { transform: translate(-50%, -50%) scale(.2); opacity: .75 } to { transform: translate(-50%, -50%) scale(1.6); opacity: 0 } }"}</style>
          {where.presses ? <div key={where.presses} style={{ position: "absolute", left: 0, top: 0, width: 54, height: 54, borderRadius: "50%", border: "3px solid rgba(80,110,255,.9)", background: "rgba(80,110,255,.18)", animation: "screen-previewer-press 650ms ease-out forwards" }} /> : null}
          {/* the arrow's tip is the point: the drawing's tip is at (4, 2) */}
          <svg width="26" height="26" viewBox="0 0 24 24" style={{ position: "absolute", left: -4, top: -2, transform: `scale(${where.down ? 0.8 : 1})`, transformOrigin: "4px 2px", transition: "transform 90ms ease" }}><path d="M4 2l15 9-6.5 1.5L9 19z" fill="#111" stroke="#fff" strokeWidth="1.4" /></svg>
        </div>
      </div>
    </div>
  );
});

/** the picture in its box; a picture that cannot be given is a note with the reason and a link to the live screen */
function Picture({ shown, service, device, cut, theme, width, fixed }: { shown: Shown; service?: PictureService; device: Device; cut: "fold" | "full"; theme?: string; width: string; fixed: boolean }) {
  const [src, setSrc] = React.useState<string | null>(null);
  const [failed, setFailed] = React.useState<string | null>(null);
  React.useEffect(() => {
    let off = false; setSrc(null); setFailed(null);
    if (!isSnapshot(shown.row)) { setFailed("a UI prototype has no picture"); return; }
    if (!service) { setFailed("there is no picture service"); return; }
    service.picture(shown.row.id, device, cut, theme).then((u) => { if (!off) setSrc(u); }, (e: unknown) => { if (!off) setFailed(e instanceof Error ? e.message : String(e)); });
    return () => { off = true; };
  }, [shown.row, service, device, cut, theme]);
  return (
    <div style={{ width, flex: "none", position: "relative", overflow: "hidden", background: failed ? "#d92d20" : "#fff", ...(fixed ? { aspectRatio: String(device.aspectRatio) } : {}) }}>
      {failed ? (
        <Stack dir="col" gap={6} pad={12} style={{ color: "#fff" }}>
          <span element="type--body-small" style={{ color: "inherit" }}>no picture: {failed}</span>
          <span element="type--body-small" style={{ color: "inherit" }}><a href={shown.url} style={{ color: "inherit", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer">open the live screen</a></span>
        </Stack>
      ) : src ? <img src={src} alt={shown.title} onError={() => setFailed("the picture cannot be loaded")} style={{ display: "block", width: "100%", ...(fixed ? { height: "100%", objectFit: "cover", objectPosition: "top" } : { height: "auto" }) }} /> : null}
    </div>
  );
}

/** zoom: the screen big, over everything; a click outside it closes. What it holds is centred by its own margin, so a picture taller than the window starts at its top and scrolls */
function Zoom({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  React.useEffect(() => { const key = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", key); return () => window.removeEventListener("keydown", key); }, [onClose]);
  return <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(0, 0, 0, .6)", display: "flex", overflow: "auto", padding: "3vh 0" }}>{children}</div>;
}

export interface ScreenPreviewerProps extends Partial<Switches> {
  /** the id of a UI snapshot, or of a UI prototype */
  id: string;
  layout?: Layout;
  /** the theme the screen is drawn with; absent = the one a screen has when its URL names none */
  theme?: string;
  reader: DataReader;
  pictureService?: PictureService;
}

export const ScreenPreviewer = React.forwardRef<ScreenPreviewerHandle, ScreenPreviewerProps>(function ScreenPreviewer({ id, layout: asked = "standard", theme, reader, pictureService, ...given }, handle) {
  const v: Switches = { ...DEFAULTS, ...given };
  const [shown, setShown] = React.useState<Shown | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);
  const [hovered, setHovered] = React.useState(false);
  const [zoom, setZoom] = React.useState(false);
  React.useEffect(() => {
    let off = false; setShown(null); setProblem(null);
    read(reader, id, theme).then((s) => { if (!off) setShown(s); }, (e: unknown) => { if (!off) setProblem(e instanceof Error ? e.message : String(e)); });
    return () => { off = true; };
  }, [reader, id, theme]);
  if (problem) return <span element="type--body-small" style={{ color: "var(--color-status-error, #a83232)" }}>{problem}</span>;
  if (!shown) return null;

  const layout: Layout = asked;
  const device = DEVICE[v.device === "auto" ? shown.surface : v.device];
  const fitW = v.size === "fit", hug = layout === "hug-height";
  const positive = (x: number, d: number) => (x > 0 ? x : d);
  const frame: [number, number] = v.size === "custom" ? [positive(v.customWidth, 480), positive(v.customHeight, 360)] : FRAME[v.size] ?? FRAME.medium;
  const width = layout === "box" ? frame[0] : v.size === "custom" ? positive(v.customWidth, 480) : WIDTH[device.name][v.size] ?? WIDTH[device.name].medium;
  const small = !fitW && width <= SMALL;
  // a UI prototype is there to be clicked; a UI snapshot is used only when it can scroll
  const usable = v.scroll || !isSnapshot(shown.row);
  // a click on the screen opens the zoom, when the screen itself is not used
  const clickZooms = v.zoomOnClick && !usable;
  const screen = (w: string, ratio: number | "content") => v.mode === "live"
    ? <Live ref={handle} url={shown.url} title={shown.title} device={device} width={w} ratio={ratio} usable={usable} />
    : <Picture shown={shown} service={pictureService} device={device} cut={ratio === "content" ? "full" : "fold"} theme={theme} width={w} fixed={ratio !== "content"} />;
  const outline = v.bordered ? { outline: "1px solid var(--color-gray-200, rgba(0,0,0,.12))", outlineOffset: -1 } : {};

  const body = layout === "box" ? (
    <div style={{ ...(fitW ? { width: "100%", aspectRatio: FIT_RATIO } : { width: frame[0], height: frame[1] }), containerType: "size", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-gray-100, rgba(0,0,0,.05))", ...outline }}>
      {screen(`min(100cqw, calc(100cqh * ${device.aspectRatio}))`, device.aspectRatio)}
    </div>
  ) : <div style={outline}>{screen(fitW ? "100%" : `${width}px`, hug ? "content" : device.aspectRatio)}</div>;

  const chrome = v.chrome && hovered && !small ? (
    <div style={{ position: "absolute", top: 8, right: 8, zIndex: 2, padding: 2, borderRadius: 8, background: "rgba(255, 255, 255, .86)", border: "1px solid rgba(0, 0, 0, .1)", boxShadow: "0 1px 3px rgba(0, 0, 0, .12)", backdropFilter: "blur(4px)", color: "#1a1a1a" }}>
      <Stack dir="row" gap={4} align="center">
        <Button asChild buttonType="icon" startIcon="externalLink" emphasis="secondary" scale="xs"><a href={shown.url} target="_blank" rel="noopener noreferrer" aria-label="open in its own tab"><Icon name="externalLink" scale="xs" /></a></Button>
        <Button buttonType="icon" startIcon="maximize" emphasis="secondary" scale="xs" aria-label="zoom" onClick={() => setZoom(true)} />
      </Stack>
    </div>
  ) : null;
  const big = Math.min(device.width, 1600);

  return (
    <div concept="screen-previewer" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ position: "relative", width: fitW ? "100%" : "fit-content" }}>
      {clickZooms ? <div role="button" aria-label="zoom" onClick={() => setZoom(true)} style={{ cursor: "zoom-in" }}>{body}</div> : body}
      {chrome}
      {zoom ? (
        <Zoom onClose={() => setZoom(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: `min(94vw, ${big}px)`, margin: "auto", flex: "none", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
            {v.mode === "live"
              ? <iframe src={shown.url} title={shown.title} style={{ display: "block", width: "100%", height: "88vh", border: 0, background: "#fff" }} />
              : <Picture shown={shown} service={pictureService} device={device} cut="full" theme={theme} width="100%" fixed={false} />}
          </div>
        </Zoom>
      ) : null}
    </div>
  );
});
