import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  extensionOf,
  fileRefType,
  type ArtifactSpec,
  type CarriedBy,
  type FileArtifacts,
  type FormatId,
  type NodeWorkerCtx,
  type Ref,
  type TypeId,
  type Usage,
} from "@libs/orchestrator-lib-schema";

export type MemoryArtifacts = FileArtifacts & { objects: Map<string, Uint8Array> };

/** FileArtifacts over a map, laid out as the orchestrator's store lays them out (`orch/derived/…`). */
export function memoryArtifacts(): MemoryArtifacts {
  const objects = new Map<string, Uint8Array>();
  const get = (key: string) => {
    const b = objects.get(key);
    if (!b) throw new Error(`memory store: no object ${key}`);
    return b;
  };
  const putBytes = async <F extends FormatId, T extends TypeId = CarriedBy<F>>(bytes: Uint8Array, spec: ArtifactSpec<F, T>): Promise<Ref<T>> => {
    objects.set(spec.key, bytes);
    const type: T = spec.type ?? (fileRefType(spec.format) as never);
    return { type, format: spec.format, ref: spec.key, bytes: bytes.byteLength, meta: spec.meta };
  };
  return {
    objects,
    key: (...parts) => ["orch/derived", ...parts].join("/"),
    putBytes,
    async putFile(localPath, spec) {
      return putBytes(new Uint8Array(await readFile(localPath)), spec);
    },
    async getBytes(ref) {
      return get(ref.ref);
    },
    async materialize(ref, workdir) {
      const ext = extensionOf(ref.format) || path.extname(ref.ref);
      const local = path.join(workdir, `${path.basename(ref.ref, path.extname(ref.ref))}${ext}`);
      await writeFile(local, get(ref.ref));
      return local;
    },
  };
}

/** A worker's context over an in-memory store; `deps` as the worker's contract declares them, parsed. */
export async function makeCtx<D = undefined>(deps?: D) {
  const artifacts = memoryArtifacts();
  const reports: Partial<Usage>[] = [];
  const workdir = await mkdtemp(path.join(os.tmpdir(), "orch-test-"));
  const ctx: NodeWorkerCtx<D> = {
    runId: "run1",
    stepKey: "step",
    workdir,
    artifacts,
    deps: deps as D,
    report: (u) => void reports.push(u),
  };
  return { ctx, artifacts, reports, workdir };
}

export async function putUpload<F extends FormatId>(artifacts: MemoryArtifacts, name: string, bytes: Uint8Array, format: F): Promise<Ref<CarriedBy<F>>> {
  return artifacts.putBytes(bytes, { format, key: `orch/uploads/${name}` });
}
