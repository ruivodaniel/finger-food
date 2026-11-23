import { beforeEach, describe, expect, it } from "vitest";
import { createPictureService, ratioText, type Camera, type Key, type Picture, type ScreenImage, type ScreenImageStore } from "../picture-service/picture-service";
import type { DataReader } from "../reader";
import { reader as world } from "./world";

const desktop = { name: "desktop", width: 1440, aspectRatio: 16 / 9 }, theme = { name: "borro", version: "v2" };
const bytes = (s: string): Picture => new TextEncoder().encode(s);
const text = (p: Picture) => new TextDecoder().decode(p);

let kept: { row: ScreenImage; picture: Picture }[], visits: number, moment: number, reader: DataReader;
const same = (r: ScreenImage, k: Key) => r.uiSnapshotId === k.uiSnapshotId && r.deviceName === k.device.name && r.cut === k.cut && r.themeId === k.theme.name && r.themeVersion === k.theme.version;
const store: ScreenImageStore = {
  find: async (key) => kept.find((x) => same(x.row, key))?.row ?? null,
  write: async (row, picture) => { const full: ScreenImage = { ...row, id: `${row.uiSnapshotId}-${row.cut}`, file: `${row.cut}.png` }; kept = kept.filter((x) => x.row.id !== full.id); kept.push({ row: full, picture }); return full; },
};
const camera: Camera = { photograph: async () => { visits++; return { fold: bytes(`fold ${visits}`), full: bytes(`full ${visits}`), madeWith: [{ table: "ui_snapshot", id: "s1", version: 1 }, { table: "ui_data", id: "ui-list", version: 1 }, { table: "organization", id: "b", version: 0 }] }; } };
const service = (versions = { library: "1", engine: "1" }) => createPictureService({ reader, store, camera, versions, now: () => "2026-11-12T10:00:00.000Z" });

beforeEach(() => {
  kept = []; visits = 0; moment = 0;
  // the world's rows at the moment the test is at: moment 1 gives organization b another version
  reader = { ...world, rows: (w, _t, table, ids) => world.rows(w, moment, table, ids) };
});

describe("the picture service", () => {
  it("asks the camera when it keeps no picture, and keeps the two cuts with what they were made with", async () => {
    const image = await service().picture("s1", desktop, "fold", theme);
    expect(visits).toBe(1);
    expect(image).toMatchObject({ uiSnapshotId: "s1", deviceName: "desktop", deviceWidth: 1440, deviceAspectRatio: "1440:810", cut: "fold", themeId: "borro", themeVersion: "v2", createdAt: "2026-11-12T10:00:00.000Z" });
    expect(image.madeWith).toEqual({ rows: [{ table: "ui_snapshot", id: "s1", version: 1 }, { table: "ui_data", id: "ui-list", version: 1 }, { table: "organization", id: "b", version: 0 }], library: "1", engine: "1" });
    expect(kept.map((x) => [x.row.cut, text(x.picture)])).toEqual([["fold", "fold 1"], ["full", "full 1"]]);
  });
  it("gives the kept picture while every row has the same version", async () => {
    const s = service();
    await s.picture("s1", desktop, "fold", theme);
    expect((await s.picture("s1", desktop, "full", theme)).cut).toBe("full");
    expect(visits).toBe(1);
  });
  it("asks the camera again when a row it was made with has another version", async () => {
    const s = service();
    await s.picture("s1", desktop, "fold", theme);
    moment = 1;
    await s.picture("s1", desktop, "fold", theme);
    expect(visits).toBe(2);
    expect(text(kept.find((x) => x.row.cut === "fold")!.picture)).toBe("fold 2");
  });
  it("asks the camera again when a row it was made with is gone", async () => {
    const s = service();
    await s.picture("s1", desktop, "fold", theme);
    reader = { ...world, rows: async (_w, _t, _table, ids) => ids.map(() => null) };
    await service().picture("s1", desktop, "fold", theme);
    expect(visits).toBe(2);
  });
  it("asks the camera again when the component library or the engine has another version", async () => {
    await service().picture("s1", desktop, "fold", theme);
    await service({ library: "2", engine: "1" }).picture("s1", desktop, "fold", theme);
    expect(visits).toBe(2);
  });
  it("keeps one picture for each device and each theme version", async () => {
    const s = service();
    await s.picture("s1", desktop, "fold", theme);
    await s.picture("s1", desktop, "fold", { name: "borro", version: "v3" });
    expect(visits).toBe(2);
  });
  it("sends the camera once when the two cuts are asked together", async () => {
    const s = service();
    await Promise.all([s.picture("s1", desktop, "fold", theme), s.picture("s1", desktop, "full", theme)]);
    expect(visits).toBe(1);
  });
  it("gives an error for a UI snapshot that does not exist, and sends no camera", async () => {
    await expect(service().picture("nope", desktop, "fold", theme)).rejects.toThrow("no UI snapshot nope");
    expect(visits).toBe(0);
  });
  it("writes the ratio of the device's window as width to height", () => expect(ratioText({ name: "mobile", width: 390, aspectRatio: 390 / 844 })).toBe("390:844"));
});
