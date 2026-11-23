// Shared by the finger-food loaders: stable ids, the data folder, small readers.
import { createHash } from "crypto";
import { readFileSync } from "fs";
import { join, resolve } from "path";

/** The repository's data folder (…/data), from apps/main/core/api. */
export const DATA = resolve(process.cwd(), "../../../../data");
export const readJson = <T>(...p: string[]): T => JSON.parse(readFileSync(join(DATA, ...p), "utf8")) as T;
export const readText = (...p: string[]): string => readFileSync(join(DATA, ...p), "utf8");
export const jsonl = <T>(...p: string[]): T[] => readText(...p).split("\n").filter(Boolean).map((l) => JSON.parse(l) as T);

/** uuid5-like, stable on its keys: a re-run gives the same ids, so every loader can be run again. */
export const stableId = (ns: string) => (...k: string[]) => {
  const h = createHash("sha1").update(`finger-food:${ns}:` + k.join("|")).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, "0")}${h.slice(18, 20)}-${h.slice(20, 32)}`;
};

export const norm = (t: string) => (t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

/** Insert in slices: Postgres takes at most 65 535 parameters in one statement. */
export async function inChunks<T>(rows: T[], size: number, run: (slice: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += size) await run(rows.slice(i, i + size));
}
