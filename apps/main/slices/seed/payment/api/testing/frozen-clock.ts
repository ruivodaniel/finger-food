/**
 * The tests' clock (a vitest setup file): Date is frozen at one instant before every test, so the services and the
 * in-memory repositories read it with `new Date()` like the real code does. A test moves it with `vi.setSystemTime`.
 * Only Date is faked; timers and promises run as usual.
 */

import { afterEach, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-02-12T11:30:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});
