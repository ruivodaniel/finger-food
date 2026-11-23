import { describe, expect, it } from "vitest";
import { relativeTime } from "./relative-time";

const now = new Date("2026-07-30T12:00:00.000Z");
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();

describe("relativeTime", () => {
  it("collapses anything inside the last minute", () => {
    expect(relativeTime(ago(0), now)).toBe("just now");
    expect(relativeTime(ago(59_000), now)).toBe("just now");
  });

  it("counts minutes, hours, then days", () => {
    expect(relativeTime(ago(5 * 60_000), now)).toBe("5m ago");
    expect(relativeTime(ago(3 * 3_600_000), now)).toBe("3h ago");
    expect(relativeTime(ago(2 * 86_400_000), now)).toBe("2d ago");
  });

  it("falls back to a date once a week has passed", () => {
    expect(relativeTime(ago(20 * 86_400_000), now)).toMatch(/\d/);
    expect(relativeTime(ago(20 * 86_400_000), now)).not.toContain("ago");
  });

  it("renders nothing for an unparseable timestamp", () => {
    expect(relativeTime("not-a-date", now)).toBe("");
  });
});
