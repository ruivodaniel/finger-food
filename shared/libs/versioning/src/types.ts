// The shape of the capsule tables the library is given. The library defines no
// table and owns no migration: the app (the versioning slice's models) defines
// them, migrates them, and injects them into createVersioning. Any drizzle
// tables with these columns, under these keys and holding these values, are the
// right shape; their names and SQL types are the app's.
import type { ColumnBaseConfig, ColumnDataType } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

/** A column of the shape: what it holds, and whether it may be null. */
type Column<TData, TNotNull extends boolean = true> = PgColumn<ColumnBaseConfig<ColumnDataType, string> & { data: TData; notNull: TNotNull }>;

/** What a column of the shape holds when read: its data, or null when it may be null. */
type ValueOf<TColumn> = TColumn extends PgColumn<infer TConfig> ? (TConfig["notNull"] extends true ? TConfig["data"] : TConfig["data"] | null) : never;
type RowOf<Columns> = { [Name in keyof Columns]: ValueOf<Columns[Name]> };

/** What changed between two versions: [{ field, from, to }]. */
export type FieldDelta = { field: string; from: unknown; to: unknown };

export type OuterCapsuleColumns = {
  id: Column<string>;
  entityId: Column<string>;
  entityType: Column<string>;
  createdAt: Column<Date>;
  validFrom: Column<Date>;
  validTo: Column<Date, false>;
};
export type BranchColumns = {
  id: Column<string>;
  outerCapsuleId: Column<string>;
  name: Column<string>;
  createdAt: Column<Date>;
  validFrom: Column<Date>;
  validTo: Column<Date, false>;
};
export type InnerCapsuleColumns = {
  id: Column<string>;
  outerCapsuleId: Column<string>;
  branchId: Column<string>;
  entityType: Column<string>;
  entityRowId: Column<string>;
  createdAt: Column<Date>;
  validFrom: Column<Date>;
  validTo: Column<Date, false>;
  /** first | continuation | branch | merge */
  originKind: Column<string>;
  authorId: Column<string>;
  /** user | agent | deterministic */
  authorType: Column<string>;
  /** who asked the author to act: an agent acts on behalf of a user */
  instructedById: Column<string, false>;
  /** an agent author: the workflow it ran in */
  authorWorkflowId: Column<string, false>;
  /** an agent author: the model that made the version */
  authorModelVersion: Column<string, false>;
  title: Column<string, false>;
  /** unique per entity type among the heads of main */
  slug: Column<string, false>;
  isMain: Column<boolean>;
  sourceVersionIds: Column<string[]>;
  intentWhat: Column<string, false>;
  intentWhy: Column<string, false>;
  /** its position on its branch: 0 for the first, the head's + 1 for each next one */
  seq: Column<number>;
};
export type VersionDeltaColumns = {
  id: Column<string>;
  fromInnerCapsuleId: Column<string>;
  toInnerCapsuleId: Column<string>;
  entityType: Column<string>;
  fields: Column<FieldDelta[]>;
  computedAt: Column<Date>;
};

export type CapsuleTables = {
  /** The identity: branches and versions point at its id, the API talks about its entityId. Alive while validTo is null. */
  outerCapsule: PgTable & OuterCapsuleColumns;
  /** A line of versions of one identity. Every identity starts with "main". */
  branch: PgTable & BranchColumns;
  /** One version: points at one row of the entity table. The head of a branch is the one with validTo null. */
  innerCapsule: PgTable & InnerCapsuleColumns;
  /** What changed between two versions. */
  versionDelta: PgTable & VersionDeltaColumns;
};

/** An inner capsule row, as the library reads it: derived from the shape's columns. */
export type InnerCapsuleRow = RowOf<InnerCapsuleColumns>;
