// THE CAMERA: opens the live screen at /ui-snapshot/<id>, with the theme in _theme, in a window of the device's width and aspect ratio; waits the delay;
// photographs the window (fold) and the whole page (full); asks the live screen what it read. It does not use the screen previewer and keeps nothing.
// The browser is given (Playwright's fits these two shapes): this file opens no browser of its own.
import type { Camera } from "../picture-service/picture-service";
import type { Read } from "../reader";
import { PREFIX } from "../url";
import { wholeHeight } from "../live-screen/whole-height";

export interface CameraWindow {
  goto(url: string, options?: { waitUntil?: "networkidle" }): Promise<unknown>;
  waitForTimeout(ms: number): Promise<void>;
  /** runs an expression inside the page and gives its value */
  evaluate<T>(expression: string): Promise<T>;
  setViewportSize(size: { width: number; height: number }): Promise<void>;
  screenshot(): Promise<Uint8Array>;
  close(): Promise<void>;
}
export interface CameraBrowser { newPage(options: { viewport: { width: number; height: number } }): Promise<CameraWindow> }

export function createCamera({ browser, origin }: {
  browser: CameraBrowser | (() => Promise<CameraBrowser>);
  /** where the live screen is served: http://localhost:8903 */
  origin: string;
}): Camera {
  return {
    async photograph(uiSnapshotId, device, theme, delay) {
      const width = device.width, height = Math.round(device.width / device.aspectRatio);
      const window = await (typeof browser === "function" ? await browser() : browser).newPage({ viewport: { width, height } });
      try {
        await window.goto(`${origin}${PREFIX["ui-snapshot"]}/${encodeURIComponent(uiSnapshotId)}?_theme=${encodeURIComponent(theme.name)}`, { waitUntil: "networkidle" });
        const there = await window.evaluate<boolean>("(async () => { for (let i = 0; i < 100 && !window.liveScreen; i++) await new Promise((r) => setTimeout(r, 50)); if (!window.liveScreen) return false; await window.liveScreen.settled(); await document.fonts.ready; return true; })()");
        if (!there) throw new Error(`there is no live screen at ${origin}${PREFIX["ui-snapshot"]}/${uiSnapshotId}`);
        await window.waitForTimeout(delay);
        const fold = await window.screenshot();
        const whole = await window.evaluate<number>(`(${wholeHeight.toString()})(document)`);
        await window.setViewportSize({ width, height: Math.max(height, Math.ceil(whole)) });
        await window.waitForTimeout(100);
        const full = await window.screenshot();
        const madeWith = await window.evaluate<Read[]>("window.liveScreen.whatWasRead()");
        return { fold, full, madeWith };
      } finally { await window.close(); }
    },
  };
}
