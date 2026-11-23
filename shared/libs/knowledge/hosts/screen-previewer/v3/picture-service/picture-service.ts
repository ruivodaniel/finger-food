// THE PICTURE SERVICE: gives the picture of a UI snapshot on a device, at a cut, in a theme at a version. It keeps every picture with what it was made with
// (each row read and its version, the versions of the component library and of the engine) and gives the kept one while all of them are the same.
// When it keeps none, or one of them changed, it asks the camera, keeps the two pictures the camera gives (fold and full) and gives the new one.
// It takes no picture and reads no page: the camera does. Where the pictures are kept is the store's (the table screen_image and its files).
import type { DataReader, Read } from "../reader";

/** a device: a name, the width of its window, the ratio of its window (width : height) */
export type Device = { name: string; width: number; aspectRatio: number };
/** fold = the device's window · full = the whole page at that width */
export type Cut = "fold" | "full";
export type Theme = { name: string; version: string };
/** everything a picture was drawn from */
export type MadeWith = { rows: Read[]; library: string; engine: string };
export type Key = { uiSnapshotId: string; device: Device; cut: Cut; theme: Theme };
/** a row of screen_image, in the shape of the canonical ERD. `file` is where its picture is, in the store's own terms */
export type ScreenImage = {
  id: string; uiSnapshotId: string; createdAt: string;
  deviceName: string; deviceWidth: number; deviceAspectRatio: string; cut: Cut;
  themeId: string; themeVersion: string; madeWith: MadeWith; file: string;
};
/** a picture, as bytes (PNG) */
export type Picture = Uint8Array;

export interface Camera {
  /** the two pictures of a UI snapshot on a device in a theme, taken after the delay (ms), and every row the live screen read */
  photograph(uiSnapshotId: string, device: Device, theme: Theme, delay: number): Promise<{ fold: Picture; full: Picture; madeWith: Read[] }>;
}
export interface ScreenImageStore {
  /** the screen image kept for the key, or nothing */
  find(key: Key): Promise<ScreenImage | null>;
  /** writes the screen image of the key with its picture, in the place of the one kept for the same key */
  write(row: Omit<ScreenImage, "id" | "file">, picture: Picture): Promise<ScreenImage>;
}
export interface PictureServiceCore {
  picture(uiSnapshotId: string, device: Device, cut: Cut, theme: Theme): Promise<ScreenImage>;
  findKept(uiSnapshotId: string, device: Device, cut: Cut, theme: Theme): Promise<ScreenImage | null>;
  isCurrent(uiSnapshotId: string, madeWith: MadeWith): Promise<boolean>;
  keep(key: Omit<Key, "cut">, pictures: { fold: Picture; full: Picture }, madeWith: MadeWith): Promise<Record<Cut, ScreenImage>>;
}

/** 1440 wide at 16 : 9 is "1440:810" */
export const ratioText = (device: Device): string => `${device.width}:${Math.round(device.width / device.aspectRatio)}`;

export function createPictureService({ reader, store, camera, versions, delay = 300, now = () => new Date().toISOString() }: {
  /** reads the versions the rows have now */
  reader: DataReader; store: ScreenImageStore; camera: Camera;
  /** the versions of the component library and of the engine now */
  versions: { library: string; engine: string };
  /** how long the camera waits before the picture, in ms */
  delay?: number; now?: () => string;
}): PictureServiceCore {
  const taking = new Map<string, Promise<Record<Cut, ScreenImage>>>();

  /** the version a row has now; nothing when the row is gone */
  async function versionNow(uiSnapshotId: string, read: Read): Promise<number | null> {
    try {
      if (read.table === "ui_snapshot") return (await reader.uiSnapshot(read.id)).version;
      if (read.table === "ui_prototype") return (await reader.uiPrototype(read.id)).version;
      if (read.table === "ui_node") return (await reader.uiNode(read.id)).version;
      if (read.table === "ui_data") return (await reader.uiData(read.id)).version;
      if (read.table === "route") return [...(await reader.routes("web")), ...(await reader.routes("mobile"))].find((r) => r.id === read.id)?.version ?? null;
      // any other table is a table of the world the UI snapshot stands in, at its moment
      const snapshot = await reader.uiSnapshot(uiSnapshotId);
      return (await reader.rows(snapshot.worldId, snapshot.t, read.table, [read.id]))[0]?.version ?? null;
    } catch { return null; }
  }

  const self: PictureServiceCore = {
    async picture(uiSnapshotId, device, cut, theme) {
      await reader.uiSnapshot(uiSnapshotId);   // no such UI snapshot: no picture
      const kept = await self.findKept(uiSnapshotId, device, cut, theme);
      if (kept && (await self.isCurrent(uiSnapshotId, kept.madeWith))) return kept;
      // one camera at a time for the same UI snapshot, device and theme: the two cuts come from one visit
      const k = [uiSnapshotId, device.name, device.width, ratioText(device), theme.name, theme.version].join(" ");
      let visit = taking.get(k);
      if (!visit) {
        visit = (async () => {
          const taken = await camera.photograph(uiSnapshotId, device, theme, delay);
          return self.keep({ uiSnapshotId, device, theme }, { fold: taken.fold, full: taken.full }, { rows: taken.madeWith, ...versions });
        })().finally(() => taking.delete(k));
        taking.set(k, visit);
      }
      return (await visit)[cut];
    },
    findKept: (uiSnapshotId, device, cut, theme) => store.find({ uiSnapshotId, device, cut, theme }),
    async isCurrent(uiSnapshotId, madeWith) {
      if (madeWith.library !== versions.library || madeWith.engine !== versions.engine) return false;
      const now_ = await Promise.all(madeWith.rows.map((r) => versionNow(uiSnapshotId, r)));
      return madeWith.rows.every((r, i) => now_[i] === r.version);
    },
    async keep({ uiSnapshotId, device, theme }, pictures, madeWith) {
      const row = (cut: Cut) => ({ uiSnapshotId, createdAt: now(), deviceName: device.name, deviceWidth: device.width, deviceAspectRatio: ratioText(device), cut, themeId: theme.name, themeVersion: theme.version, madeWith });
      return { fold: await store.write(row("fold"), pictures.fold), full: await store.write(row("full"), pictures.full) };
    },
  };
  return self;
}
