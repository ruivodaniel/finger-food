/**
 * Artifacts: every slot value that is a file lives in object storage and
 * travels as a reference. These are the interfaces a worker sees; whoever runs
 * the worker implements them (the orchestrator over S3, a browser over memory
 * or a presigned upload).
 *
 * Two levels, so a worker's type says where it can run:
 * - ByteArtifacts: read and write bytes. Any runtime.
 * - FileArtifacts: also a local file in and out. Node only (a process that
 *   hands a file to a binary, like LibreOffice).
 */

import { FORMATS, type CarriedBy, type FormatId, type TypeId } from "./ontology/vocabulary";
import type { Ref } from "./slot";

export interface ArtifactSpec<F extends FormatId = FormatId, T extends TypeId = TypeId> {
  /** absent = the type the slot is typed by; for a file slot, the first type the format carries */
  type?: T;
  format: F;
  /** the object key, complete; use `store.key(...)` to build it */
  key: string;
  meta?: Record<string, unknown>;
}

/** The type a file ref carries when the slot is typed by formats: the first the format packages. */
export function fileRefType<F extends FormatId>(format: F): CarriedBy<F> {
  return FORMATS[format].packages[0];
}

export interface ByteArtifacts {
  /** a key under the runner's own prefix, e.g. `orch/derived/<parts joined>` */
  key(...parts: string[]): string;
  putBytes<F extends FormatId, T extends TypeId = CarriedBy<F>>(bytes: Uint8Array, spec: ArtifactSpec<F, T>): Promise<Ref<T>>;
  getBytes(ref: Ref): Promise<Uint8Array>;
}

export interface FileArtifacts extends ByteArtifacts {
  putFile<F extends FormatId, T extends TypeId = CarriedBy<F>>(localPath: string, spec: ArtifactSpec<F, T>): Promise<Ref<T>>;
  /** Download a ref into the workdir; returns the local path. */
  materialize(ref: Ref, workdir: string): Promise<string>;
}

export type MemoryArtifacts = ByteArtifacts & { readonly objects: Map<string, Uint8Array> };

/**
 * ByteArtifacts over a map, for a runner without object storage: a browser
 * running a client worker, a test. `prefix` heads every key it builds.
 */
export function createMemoryArtifacts(prefix = "memory"): MemoryArtifacts {
  const objects = new Map<string, Uint8Array>();
  return {
    objects,
    key: (...parts) => [prefix, ...parts].join("/"),
    async putBytes<F extends FormatId, T extends TypeId = CarriedBy<F>>(bytes: Uint8Array, spec: ArtifactSpec<F, T>): Promise<Ref<T>> {
      objects.set(spec.key, bytes);
      const type: T = spec.type ?? (fileRefType(spec.format) as never);
      return { type, format: spec.format, ref: spec.key, bytes: bytes.byteLength, meta: spec.meta };
    },
    async getBytes(ref) {
      const bytes = objects.get(ref.ref);
      if (!bytes) throw new Error(`no object ${ref.ref}`);
      return bytes;
    },
  };
}
