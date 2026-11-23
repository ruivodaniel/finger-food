/**
 * What the versioning API answers with. Shared by the slice's server and web sides.
 */
import type { FieldDelta } from "@libs/versioning";

export type { FieldDelta };

export interface VersionAuthor {
  id: string;
  /** Their name, as the app knows it. Absent: the app has none for them. */
  name?: string;
  type: "user" | "agent" | "deterministic";
  /** who asked the author to act: an agent acts on behalf of a user */
  instructedBy?: string;
  /** The name of who asked. */
  instructedByName?: string;
  /** an agent author: the workflow it ran in */
  workflowId?: string;
  /** an agent author: the model that made the version */
  modelVersion?: string;
}

/** One version, as the history lists it. */
export interface VersionView {
  versionId: string;
  branch: string;
  /** its position on its branch */
  seq: number;
  /** on main: <last release>.<versions since it> (0.3 before any release, 1.2 after one); on another branch: <branch>.<seq> */
  label: string;
  /** first | continuation | branch | merge */
  origin: string;
  /** the versions it was made from */
  sources: string[];
  author: VersionAuthor;
  title: string | null;
  slug: string | null;
  /** why it was made, as its author says */
  intent: { what: string | null; why: string | null };
  /** when it became the head of its branch (ISO) */
  at: string;
  /** the open version of its branch */
  isHead: boolean;
  /** what changed from the version it follows; null for the first */
  changes: FieldDelta[] | null;
}

export interface BranchView {
  name: string;
  headVersionId: string | null;
  /** when it was archived (ISO); null while it is open */
  archivedAt: string | null;
}

export interface ReleaseView {
  number: number;
  versionId: string;
  title: string | null;
  description: string | null;
  /** when it was released (ISO) */
  at: string;
}

export interface History {
  versions: VersionView[];
  branches: BranchView[];
  releases: ReleaseView[];
}

/** The entity as it was: the version that was the head of a branch at a moment, and its row. */
export interface VersionAt {
  version: VersionView;
  row: Record<string, unknown>;
}

export interface Comparison {
  fromVersionId: string;
  toVersionId: string;
  /** true when this delta was stored when the later version was made; false when it was computed now */
  stored: boolean;
  changes: FieldDelta[];
}

/** What a clone asks for. Onto the version's own branch, it is a restore. */
export interface CloneVersionInput {
  from: string;
  toBranch: string;
  expectedHead?: string;
  intent?: { what?: string; why?: string };
}

/** What a release asks for: a version of main, and what to call it. */
export interface ReleaseVersionInput {
  versionId: string;
  title?: string;
  description?: string;
}

/** What a merge asks for: at least two versions, and the values chosen. */
export interface MergeVersionsInput {
  sources: string[];
  toBranch: string;
  data: Record<string, unknown>;
  expectedHead?: string;
  intent?: { what?: string; why?: string };
}
