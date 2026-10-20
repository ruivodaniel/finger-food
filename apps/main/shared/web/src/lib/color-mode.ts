/**
 * Color mode — dark or light, a per-viewer preference kept in this browser
 * until the Preferences backend owns it. The theme ships both palettes; the
 * mode is only `data-mode` (plus the `dark` class) on <html>, so nothing
 * regenerates.
 */

const STORAGE_KEY = "color-mode";

export function isDarkMode(): boolean {
  return document.documentElement.getAttribute("data-mode") === "dark";
}

function applyColorMode(dark: boolean): void {
  const root = document.documentElement;
  if (dark) root.setAttribute("data-mode", "dark");
  else root.removeAttribute("data-mode");
  root.classList.toggle("dark", dark);
}

export function setColorMode(dark: boolean): void {
  applyColorMode(dark);
  try {
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // storage unavailable — the mode lasts for this page only
  }
}

/** Startup: re-apply the stored mode before the first render (no flash). */
export function restoreColorMode(): void {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "dark") applyColorMode(true);
  } catch {
    // storage unavailable — start light
  }
}
