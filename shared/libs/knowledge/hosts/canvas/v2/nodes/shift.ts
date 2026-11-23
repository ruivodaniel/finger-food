// Whether Shift is held, for the resizers: held, a resize keeps the proportions
import { useSyncExternalStore } from "react";
let SHIFT = false;
const subs = new Set<() => void>();
if (typeof window !== "undefined") {
  const set = (v: boolean) => { if (SHIFT !== v) { SHIFT = v; subs.forEach((f) => f()); } };
  window.addEventListener("keydown", (e) => { if (e.key === "Shift") set(true); });
  window.addEventListener("keyup", (e) => { if (e.key === "Shift") set(false); });
  window.addEventListener("blur", () => set(false));
}
export const useShift = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, () => SHIFT, () => false);
