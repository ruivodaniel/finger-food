// WHAT A PAGE AT A LIVE ADDRESS MOUNTS. /ui-snapshot/<id> names a UI snapshot: when its UI document is a component, the live component, alone; else the live screen,
// as for a UI prototype. The page that hosts them calls this once with its own URL, and keeps what it gets where the previewers, the player, the camera and an agent reach it.
import type { DataReader } from "../reader";
import { createLiveScreen, type Hosted, type LiveScreen } from "../live-screen/live-screen";
import { parse } from "../url";
import type { CodeRegistry } from "../../../../../ui/ui-data/v2/resolve";
import { createLiveComponent, type LiveComponent } from "./live-component";

/** what the page tells the document that frames it, once its live component is mounted and reachable as `window.liveComponent` */
export const LIVE_COMPONENT_MOUNTED = "live-component-mounted";
export type Mounted = { liveScreen: LiveScreen; liveComponent?: undefined } | { liveComponent: LiveComponent; liveScreen?: undefined };

export async function mountLive({ reader, element, themeHrefs, hosted, code, url }: { reader: DataReader; element: HTMLElement; themeHrefs: (theme: string | undefined) => string[]; /** the code components a UI document may name beside the UI library's */ hosted?: Hosted; /** the code registries of the libraries the app was built with */ code?: CodeRegistry[]; url: string }): Promise<Mounted> {
  const named = parse(url.replace(/^[a-z]+:\/\/[^/]+/i, ""));
  if (named?.kind === "ui-snapshot" && named.path === "/") {
    // a UI snapshot that cannot be read is the live screen's to say
    const kind = await reader.uiSnapshot(named.id).then((row) => reader.uiData(row.uiDataId)).then((u) => u.kind, () => null);
    if (kind === "component") {
      const liveComponent = createLiveComponent({ reader, element, themeHrefs, hosted, code });
      await liveComponent.mount(named.id, named.theme, named.mode);
      // alone on its page, with nothing around it; the component previewer that frames the page reaches it here, and is told it is there
      document.body.style.margin = "0";
      (window as unknown as { liveComponent: LiveComponent }).liveComponent = liveComponent;
      if (window.parent !== window) window.parent.postMessage({ type: LIVE_COMPONENT_MOUNTED }, "*");
      return { liveComponent };
    }
  }
  const liveScreen = createLiveScreen({ reader, element, themeHrefs, hosted, code });
  await liveScreen.mount(url);
  return { liveScreen };
}
