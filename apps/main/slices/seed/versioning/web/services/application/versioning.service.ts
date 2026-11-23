/**
 * Versioning, for any versioned entity: its history, the version a view sees, one version exactly, what changed between two,
 * and the writes. Reads are query options, under one key per entity, so that a write refreshes everything about it.
 */

import { queryOptions } from "@tanstack/react-query";
import type { CloneVersionInput, MergeVersionsInput, ReleaseVersionInput } from "../../../shared/types";
import type { View } from "../../shared/components/types";
import { versioningApi } from "../api/versioning.api";

const keys = {
  all: ["versioned"] as const,
  entity: (entity: string, entityId: string) => ["versioned", entity, entityId] as const,
};

export const versioningService = {
  keys,
  getHistory: (entity: string, entityId: string) =>
    queryOptions({ queryKey: [...keys.entity(entity, entityId), "history"], queryFn: () => versioningApi.getHistory(entity, entityId) }),
  /** The version a view sees: the head of a branch, or what it was at a moment. */
  getVersionAt: (entity: string, entityId: string, view: View) =>
    queryOptions({
      queryKey: [...keys.entity(entity, entityId), "at", view.branch ?? null, view.at ?? null],
      queryFn: () => versioningApi.readAt(entity, entityId, view),
    }),
  /** A version never changes, so its row is kept by its id. Nothing to read without one. */
  getVersion: (entity: string, entityId: string, versionId: string | null | undefined) =>
    queryOptions({
      queryKey: [...keys.entity(entity, entityId), "version", versionId ?? null],
      queryFn: () => versioningApi.readVersion(entity, entityId, versionId!),
      enabled: Boolean(versionId),
    }),
  /** What changed between two versions. Nothing to read without both. */
  getComparison: (entity: string, entityId: string, comparing: { fromVersionId: string; toVersionId: string } | null) =>
    queryOptions({
      queryKey: [...keys.entity(entity, entityId), "compare", comparing?.fromVersionId ?? null, comparing?.toVersionId ?? null],
      queryFn: () => versioningApi.compare(entity, entityId, comparing!.fromVersionId, comparing!.toVersionId),
      enabled: Boolean(comparing),
    }),
  cloneVersion: (entity: string, entityId: string, input: CloneVersionInput) => versioningApi.cloneVersion(entity, entityId, input),
  merge: (entity: string, entityId: string, input: MergeVersionsInput) => versioningApi.merge(entity, entityId, input),
  release: (entity: string, entityId: string, input: ReleaseVersionInput) => versioningApi.release(entity, entityId, input),
  branchHierarchy: (entity: string, entityId: string, name: string) => versioningApi.branchHierarchy(entity, entityId, name),
  archiveBranch: (entity: string, entityId: string, branch: string) => versioningApi.archiveBranch(entity, entityId, branch),
};
