// Versioning, in four ideas:
//
//   · An entity has an identity (outer capsule) and versions (inner capsules). The API talks about its entity id.
//   · Every version is a full row of the entity's own table. Nothing is ever updated in place: a change is a new row.
//   · Versions sit on branches. Every identity starts with "main". The open version of a branch is its head.
//   · Each version has a seq (its position on its branch) and a delta (what changed from the version before it).
//
// The library is stateless and never opens a connection: every method takes the caller's handle (a db or a tx).
// It never checks access: the caller asks access control before it writes.
import {
  and,
  eq,
  getTableColumns,
  getTableName,
  gt,
  inArray,
  isNull,
  lte,
  or,
  sql,
  Subquery,
  type InferInsertModel,
  type InferSelectModel,
  type SQL,
} from "drizzle-orm";
import { SelectionProxyHandler } from "drizzle-orm/selection-proxy";
import {
  QueryBuilder,
  type PgColumn,
  type PgDatabase,
  type PgQueryResultHKT,
  type PgTable,
} from "drizzle-orm/pg-core";
import type { CapsuleTables, FieldDelta, InnerCapsuleRow } from "./types";

export type Row = Record<string, unknown>;
export type Author = {
  id: string;
  type: "user" | "agent" | "deterministic";
  /** Who asked the author to act: an agent acts on behalf of a user. */
  instructedBy?: string;
  /** An agent author: the workflow it ran in. */
  workflowId?: string;
  /** An agent author: the model that made the version. */
  modelVersion?: string;
};
/** Why a version was made, as its author says. */
export type Intent = { what?: string; why?: string };
/** Which rows a read means: a branch, a moment, some identities. Default: main, now, every identity. */
export type View = { branch?: string; at?: Date; entityIds?: string[] };

/** What says that an entity is a table: its name, stored as entity_type and used in the versioning routes, and its table. */
export type VersionedEntry<
  TTable extends PgTable = PgTable,
  TEntity extends string = string,
> = {
  entity: TEntity;
  table: TTable;
  /** The column (drizzle key) that is the row's primary key. Default "id". */
  id?: string;
  /** What changed between two of the entity's rows, as the entity sees it (a canvas: by node). Stored on every new version.
   * Without it, one entry per changed column. */
  delta?(
    from: InferSelectModel<TTable>,
    to: InferSelectModel<TTable>,
  ): FieldDelta[];
  /** The version's title, from its row. Without it, no title. */
  title?(row: InferSelectModel<TTable>): string | null;
  /** The version's slug, from its row: unique per entity among the heads of main. Without it, no slug. */
  slug?(row: InferSelectModel<TTable>): string | null;
  /** The entities under this one: those whose column `via` (a drizzle key) holds this one's entity id. Branching an entity
   * opens the branch on everything under it too. */
  children?: { entity: string; via: string }[];
};

/** An entry, with its name and table typed as written. */
export function defineVersionedEntity<
  TEntity extends string,
  TTable extends PgTable,
>(
  entity: TEntity,
  definition: Omit<VersionedEntry<TTable, TEntity>, "entity">,
): VersionedEntry<TTable, TEntity> {
  return { entity, ...definition };
}

export type VersioningConfig<TEntry extends VersionedEntry> = {
  /** Every entity the app versions. */
  versioned: readonly TEntry[];
  capsules: CapsuleTables;
  /** Ids for capsule rows and for new version rows: the app's own, so that they look like every other id it makes.
   * Default: crypto.randomUUID. */
  createId?: () => string;
  /** The clock. Default: () => new Date(). */
  now?: () => Date;
};

/** The caller's handle: a drizzle Postgres database or one of its transactions, on any driver and with any schema.
 * Only what the library uses of it. */
export type Handle = Pick<
  PgDatabase<PgQueryResultHKT>,
  | "select"
  | "selectDistinct"
  | "selectDistinctOn"
  | "insert"
  | "update"
  | "delete"
>;

export const MAIN = "main";

/** Where a write goes, and which head the caller's change was made on. */
export type WriteOptions = {
  /** Default main. */
  branch?: string;
  /** The head the caller read. When the head moved since, the write is refused with StaleHead. */
  expectedHead?: string;
  intent?: Intent;
};

/** A write refused because the head of the branch moved since the caller read it. Thrown inside the caller's
 * transaction, so nothing of the write is kept. */
export class StaleHead extends Error {
  readonly expected: string;
  readonly head: string;

  constructor(expected: string, head: string) {
    super(
      `versioning: the head moved: expected ${expected}, the head is ${head}`,
    );
    this.name = "StaleHead";
    this.expected = expected;
    this.head = head;
  }
}

/** A version that is not one of the identity's: unknown, or another identity's. */
export class VersionNotFound extends Error {
  readonly versionId: string;
  readonly entityId: string;

  constructor(versionId: string, entityId: string) {
    super(`versioning: ${versionId} is not a version of ${entityId}`);
    this.name = "VersionNotFound";
    this.versionId = versionId;
    this.entityId = entityId;
  }
}

/** A clone refused because the branch it goes to is archived. */
export class BranchArchived extends Error {
  readonly branch: string;

  constructor(branch: string) {
    super(`versioning: the branch "${branch}" is archived`);
    this.name = "BranchArchived";
    this.branch = branch;
  }
}

/** What addVersion writes: one new version of an identity, on a branch, pointing at a row already inserted. */
interface AddVersionParams {
  outerCapsuleId: string;
  branchId: string;
  /** true on branch main */
  isMain: boolean;
  /** the head this one replaces; nothing on a new branch */
  follows?: InnerCapsuleRow;
  /** its position on the branch */
  seq: number;
  /** the row of the entity table this version points at */
  row: Row;
  /** first | continuation | branch | merge */
  origin: string;
  /** the versions it was made from */
  sources: string[];
  author: Author;
  intent?: Intent;
}

export function createVersioning<TEntry extends VersionedEntry>(
  config: VersioningConfig<TEntry>,
) {
  type Entity = TEntry["entity"];
  /** A row of the entity's own table. Inside the library a table is only a PgTable (drizzle cannot type a query on a
   * table that is a type parameter), so a row read here is cast to this on the way out. */
  type RowOf<TEntity extends Entity> = InferSelectModel<
    Extract<TEntry, { entity: TEntity }>["table"]
  >;
  /** Some of the entity's own columns. */
  type PatchOf<TEntity extends Entity> = Partial<
    InferInsertModel<Extract<TEntry, { entity: TEntity }>["table"]>
  >;

  const { outerCapsule, branch, innerCapsule, versionDelta } = config.capsules;
  const createId = config.createId ?? (() => crypto.randomUUID());
  const now = config.now ?? (() => new Date());

  // ── the entity's table ──────────────────────────────────────────────────────────────────────────────────────────

  const findEntry = (entity: string) =>
    config.versioned.find((entry) => entry.entity === entity);

  /** The entity's table, and the key and column of its row id. */
  function getEntityTable(entity: Entity) {
    const entry = findEntry(entity);
    if (!entry)
      throw new Error(`versioning: "${entity}" is not in the versioned list`);
    const columns: Record<string, PgColumn> = getTableColumns(entry.table);
    const idKey = entry.id ?? "id";
    const idColumn = columns[idKey];
    if (!idColumn)
      throw new Error(
        `versioning: ${getTableName(entry.table)} has no "${idKey}" column`,
      );
    return { table: entry.table, idKey, idColumn };
  }
  type EntityTable = ReturnType<typeof getEntityTable>;

  /** What changed between two of the entity's rows: the entity's own delta when it has one, otherwise one entry per
   * column that differs (the row id aside). */
  function computeChanges(entity: Entity, from: Row, to: Row): FieldDelta[] {
    const entry = findEntry(entity)!;
    if (entry.delta) return entry.delta(from, to);
    const columnNames = new Set([...Object.keys(from), ...Object.keys(to)]);
    columnNames.delete(entry.id ?? "id");
    return [...columnNames]
      .filter(
        (column) => JSON.stringify(from[column]) !== JSON.stringify(to[column]),
      )
      .map((column) => ({ field: column, from: from[column], to: to[column] }));
  }

  async function findRow(
    db: Handle,
    entityTable: EntityTable,
    rowId: string,
  ): Promise<Row | undefined> {
    const [row] = await db
      .select()
      .from(entityTable.table)
      .where(eq(entityTable.idColumn, rowId));
    return row;
  }

  /** A copy of a row as a new row, with a new id. Returns the new row. */
  async function insertCopy(
    tx: Handle,
    entityTable: EntityTable,
    row: Row,
  ): Promise<Row> {
    const [copy] = await tx
      .insert(entityTable.table)
      .values({ ...row, [entityTable.idKey]: createId() })
      .returning();
    return copy;
  }

  // ── reading versions ────────────────────────────────────────────────────────────────────────────────────────────

  // A version's columns, named, so that reading one gives an InnerCapsuleRow.
  const versionColumns = {
    id: innerCapsule.id,
    outerCapsuleId: innerCapsule.outerCapsuleId,
    branchId: innerCapsule.branchId,
    entityType: innerCapsule.entityType,
    entityRowId: innerCapsule.entityRowId,
    createdAt: innerCapsule.createdAt,
    validFrom: innerCapsule.validFrom,
    validTo: innerCapsule.validTo,
    originKind: innerCapsule.originKind,
    authorId: innerCapsule.authorId,
    authorType: innerCapsule.authorType,
    instructedById: innerCapsule.instructedById,
    authorWorkflowId: innerCapsule.authorWorkflowId,
    authorModelVersion: innerCapsule.authorModelVersion,
    title: innerCapsule.title,
    slug: innerCapsule.slug,
    isMain: innerCapsule.isMain,
    sourceVersionIds: innerCapsule.sourceVersionIds,
    intentWhat: innerCapsule.intentWhat,
    intentWhy: innerCapsule.intentWhy,
    seq: innerCapsule.seq,
  };

  async function findVersion(
    db: Handle,
    versionId: string,
  ): Promise<InnerCapsuleRow | undefined> {
    const [version] = await db
      .select(versionColumns)
      .from(innerCapsule)
      .where(eq(innerCapsule.id, versionId));
    return version;
  }

  async function findHead(
    db: Handle,
    outerCapsuleId: string,
    branchName: string,
  ): Promise<InnerCapsuleRow | undefined> {
    const [row] = await db
      .select({ version: versionColumns })
      .from(innerCapsule)
      .innerJoin(branch, eq(branch.id, innerCapsule.branchId))
      .where(
        and(
          eq(innerCapsule.outerCapsuleId, outerCapsuleId),
          eq(branch.name, branchName),
          isNull(branch.validTo),
          isNull(innerCapsule.validTo),
        ),
      );
    return row?.version;
  }

  /** The id branches and versions point at, for an entity id. Nothing when the identity is unknown or removed. */
  async function findAliveOuterCapsuleId(
    db: Handle,
    entityId: string,
  ): Promise<string | undefined> {
    const [row] = await db
      .select({ id: outerCapsule.id })
      .from(outerCapsule)
      .where(
        and(eq(outerCapsule.entityId, entityId), isNull(outerCapsule.validTo)),
      );
    return row?.id;
  }

  /** A version of this identity, or an error: a clone or a merge may only use the identity's own versions. */
  async function findVersionOfIdentity(
    db: Handle,
    outerCapsuleId: string,
    entityId: string,
    versionId: string,
  ): Promise<InnerCapsuleRow> {
    const version = await findVersion(db, versionId);
    if (!version || version.outerCapsuleId !== outerCapsuleId)
      throw new VersionNotFound(versionId, entityId);
    return version;
  }

  // ── writing versions ────────────────────────────────────────────────────────────────────────────────────────────

  /** Before a write on an existing branch: lock the branch row (so writes on one branch run one after the other, and the
   * second reads the head the first left), read its head, and refuse a stale one. Nothing when the branch has no head. */
  async function lockHead(
    tx: Handle,
    outerCapsuleId: string,
    options: WriteOptions,
  ): Promise<InnerCapsuleRow | undefined> {
    const branchName = options.branch ?? MAIN;
    const [locked] = await tx
      .select({ id: branch.id })
      .from(branch)
      .where(
        and(
          eq(branch.outerCapsuleId, outerCapsuleId),
          eq(branch.name, branchName),
          isNull(branch.validTo),
        ),
      )
      .for("update");
    if (!locked) return undefined;
    const head = await findHead(tx, outerCapsuleId, branchName);
    if (
      head &&
      options.expectedHead !== undefined &&
      options.expectedHead !== head.id
    )
      throw new StaleHead(options.expectedHead, head.id);
    return head;
  }

  /** What every new version records about itself: who made it, why, and its title and slug from its row. */
  function describeVersion(
    entity: Entity,
    row: Row,
    author: Author,
    intent?: Intent,
  ) {
    const entry = findEntry(entity)!;
    return {
      authorId: author.id,
      authorType: author.type,
      instructedById: author.instructedBy ?? null,
      authorWorkflowId: author.workflowId ?? null,
      authorModelVersion: author.modelVersion ?? null,
      title: entry.title?.(row) ?? null,
      slug: entry.slug?.(row) ?? null,
      intentWhat: intent?.what ?? null,
      intentWhy: intent?.why ?? null,
    };
  }

  /** The new version of a row: closes the head it replaces, opens this one, and stores what changed from that head. */
  async function addVersion(
    tx: Handle,
    entity: Entity,
    entityTable: EntityTable,
    params: AddVersionParams,
  ): Promise<{ versionId: string; seq: number }> {
    const {
      outerCapsuleId,
      branchId,
      isMain,
      follows,
      seq,
      row,
      origin,
      sources,
      author,
      intent,
    } = params;
    const time = now();
    const versionId = createId();
    if (follows)
      await tx
        .update(innerCapsule)
        .set({ validTo: time })
        .where(eq(innerCapsule.id, follows.id));
    await tx.insert(innerCapsule).values({
      id: versionId,
      outerCapsuleId,
      branchId,
      entityType: entity,
      entityRowId: String(row[entityTable.idKey]),
      createdAt: time,
      validFrom: time,
      validTo: null,
      originKind: origin,
      ...describeVersion(entity, row, author, intent),
      isMain,
      sourceVersionIds: sources,
      seq,
    });
    const rowBefore =
      follows && (await findRow(tx, entityTable, follows.entityRowId));
    if (follows && rowBefore) {
      await tx.insert(versionDelta).values({
        id: createId(),
        fromInnerCapsuleId: follows.id,
        toInnerCapsuleId: versionId,
        entityType: entity,
        fields: computeChanges(entity, rowBefore, row),
        computedAt: time,
      });
    }
    return { versionId, seq };
  }

  return {
    /** A new id, made the way the app makes them. */
    createId,

    /** Whether an entity is in the versioned list: a caller that takes the entity's name from a URL asks this first. */
    hasEntity(entity: string): entity is Entity {
      return findEntry(entity) !== undefined;
    },

    /** The entity's table, and the key and column of its row id. */
    getEntityTable(entity: Entity) {
      return getEntityTable(entity);
    },

    /** Before the entity's first row is inserted: the identity. Returns its entity id, the id the API will talk about: the
     * one given, or a new one. */
    async createOuterCapsule(
      db: Handle,
      entity: Entity,
      entityId: string = createId(),
    ): Promise<string> {
      getEntityTable(entity);
      const time = now();
      await db
        .insert(outerCapsule)
        .values({
          id: createId(),
          entityId,
          entityType: entity,
          createdAt: time,
          validFrom: time,
          validTo: null,
        });
      return entityId;
    },

    /** After the entity's first row is inserted: branch main and its first version, seq 0. Returns the row. */
    async createFirstInnerCapsule<TEntity extends Entity>(
      db: Handle,
      entity: TEntity,
      rowId: string,
      entityId: string,
      author: Author,
      intent?: Intent,
    ): Promise<RowOf<TEntity>> {
      const entityTable = getEntityTable(entity);
      const row = await findRow(db, entityTable, rowId);
      if (!row)
        throw new Error(`versioning: no ${entity} row ${rowId} to version`);
      const outerCapsuleId = await findAliveOuterCapsuleId(db, entityId);
      if (!outerCapsuleId)
        throw new Error(`versioning: no outer capsule for ${entityId}`);
      const time = now();
      const branchId = createId();
      await db
        .insert(branch)
        .values({
          id: branchId,
          outerCapsuleId,
          name: MAIN,
          createdAt: time,
          validFrom: time,
          validTo: null,
        });
      await db.insert(innerCapsule).values({
        id: createId(),
        outerCapsuleId,
        branchId,
        entityType: entity,
        entityRowId: rowId,
        createdAt: time,
        validFrom: time,
        validTo: null,
        originKind: "first",
        ...describeVersion(entity, row, author, intent),
        isMain: true,
        sourceVersionIds: [],
        seq: 0,
      });
      return row as RowOf<TEntity>;
    },

    /** The head of a branch: the version a caller edits on, and hands back as expectedHead. Nothing when there is none. */
    async getHead(
      db: Handle,
      entity: Entity,
      entityId: string,
      branchName = MAIN,
    ): Promise<{ versionId: string; seq: number; rowId: string } | null> {
      getEntityTable(entity);
      const outerCapsuleId = await findAliveOuterCapsuleId(db, entityId);
      if (!outerCapsuleId) return null;
      const head = await findHead(db, outerCapsuleId, branchName);
      return head
        ? { versionId: head.id, seq: head.seq, rowId: head.entityRowId }
        : null;
    },

    /** One version and the row it points at. Nothing for an unknown version, or one of another entity. */
    async getVersion<TEntity extends Entity>(
      db: Handle,
      entity: TEntity,
      versionId: string,
    ): Promise<{ version: InnerCapsuleRow; row: RowOf<TEntity> } | null> {
      const entityTable = getEntityTable(entity);
      const version = await findVersion(db, versionId);
      if (!version || version.entityType !== entity) return null;
      const row = await findRow(db, entityTable, version.entityRowId);
      return row ? { version, row: row as RowOf<TEntity> } : null;
    },

    /** What changed between any two versions of an entity, as a new version would store it (the entity's delta, or one
     * entry per changed column). null when either version is unknown or of another entity. */
    async compareVersions(
      db: Handle,
      entity: Entity,
      fromVersionId: string,
      toVersionId: string,
    ): Promise<FieldDelta[] | null> {
      const entityTable = getEntityTable(entity);
      const [fromVersion, toVersion] = await Promise.all([
        findVersion(db, fromVersionId),
        findVersion(db, toVersionId),
      ]);
      if (
        !fromVersion ||
        !toVersion ||
        fromVersion.entityType !== entity ||
        toVersion.entityType !== entity
      )
        return null;
      const [fromRow, toRow] = await Promise.all([
        findRow(db, entityTable, fromVersion.entityRowId),
        findRow(db, entityTable, toVersion.entityRowId),
      ]);
      if (!fromRow || !toRow) return null;
      return computeChanges(entity, fromRow, toRow);
    },

    /** An edit: the head's row plus the patch becomes a new row and the next version on the branch. A patch key left
     * undefined keeps its column. Nothing changed: no version, the head's row is returned. null when the identity is
     * not alive or the branch does not exist. */
    async save<TEntity extends Entity>(
      tx: Handle,
      entity: TEntity,
      entityId: string,
      patch: PatchOf<TEntity>,
      author: Author,
      options: WriteOptions = {},
    ): Promise<RowOf<TEntity> | null> {
      const entityTable = getEntityTable(entity);
      const outerCapsuleId = await findAliveOuterCapsuleId(tx, entityId);
      if (!outerCapsuleId) return null;
      const head = await lockHead(tx, outerCapsuleId, options);
      if (!head) return null;
      const current = await findRow(tx, entityTable, head.entityRowId);
      if (!current) return null;

      const given = Object.fromEntries(
        Object.entries(patch).filter(([, value]) => value !== undefined),
      );
      const next: Row = {
        ...current,
        ...given,
        [entityTable.idKey]: current[entityTable.idKey],
      };
      if (computeChanges(entity, current, next).length === 0)
        return current as RowOf<TEntity>;

      const row = await insertCopy(tx, entityTable, next);
      await addVersion(tx, entity, entityTable, {
        outerCapsuleId,
        branchId: head.branchId,
        isMain: head.isMain,
        follows: head,
        seq: head.seq + 1,
        row,
        origin: "continuation",
        sources: [head.id],
        author,
        intent: options.intent,
      });
      return row as RowOf<TEntity>;
    },

    /** A clone of any version of the identity onto a branch: its row is copied as the branch's next version. On the
     * version's own branch it is a restore: history is kept, the restored version stays where it was. A branch that does
     * not exist is created, the clone its first version (seq 0), and no other branch moves. Refused with BranchArchived on
     * an archived branch. */
    async clone(
      tx: Handle,
      entity: Entity,
      entityId: string,
      fromVersionId: string,
      author: Author,
      options: WriteOptions = {},
    ): Promise<{ versionId: string; seq: number } | null> {
      const entityTable = getEntityTable(entity);
      const outerCapsuleId = await findAliveOuterCapsuleId(tx, entityId);
      if (!outerCapsuleId) return null;
      const source = await findVersionOfIdentity(
        tx,
        outerCapsuleId,
        entityId,
        fromVersionId,
      );
      const sourceRow = await findRow(tx, entityTable, source.entityRowId);
      if (!sourceRow) return null;

      const branchName = options.branch ?? MAIN;
      const [existing] = await tx
        .select({ id: branch.id, validTo: branch.validTo })
        .from(branch)
        .where(
          and(
            eq(branch.outerCapsuleId, outerCapsuleId),
            eq(branch.name, branchName),
          ),
        );
      if (existing?.validTo) throw new BranchArchived(branchName);
      const head = existing
        ? await lockHead(tx, outerCapsuleId, options)
        : undefined;

      const time = now();
      const branchId = existing?.id ?? createId();
      if (!existing)
        await tx
          .insert(branch)
          .values({
            id: branchId,
            outerCapsuleId,
            name: branchName,
            createdAt: time,
            validFrom: time,
            validTo: null,
          });
      const row = await insertCopy(tx, entityTable, sourceRow);
      return addVersion(tx, entity, entityTable, {
        outerCapsuleId,
        branchId,
        isMain: branchName === MAIN,
        follows: head,
        seq: head ? head.seq + 1 : 0,
        row,
        origin: "branch",
        sources: [source.id],
        author,
        intent: options.intent,
      });
    },

    /** The entity and everything under it, through each entry's children, as they are on main now: root first. */
    async findDescendants(
      db: Handle,
      entity: Entity,
      entityId: string,
    ): Promise<{ entity: Entity; entityId: string }[]> {
      const found = [{ entity, entityId }];
      const seen = new Set([entityId]);
      for (let index = 0; index < found.length; index++) {
        const parent = found[index]!;
        for (const child of findEntry(parent.entity)?.children ?? []) {
          const childTable = getEntityTable(child.entity);
          const viaColumn: PgColumn | undefined = getTableColumns(
            childTable.table,
          )[child.via];
          if (!viaColumn)
            throw new Error(
              `versioning: ${child.entity} has no column ${child.via}`,
            );
          const rows = await db
            .select({ rowId: childTable.idColumn })
            .from(childTable.table)
            .where(
              and(
                eq(viaColumn, parent.entityId),
                this.whereCurrent(child.entity),
              ),
            );
          const entityIds = await this.findEntityIdsOfRows(
            db,
            child.entity,
            rows.map((row) => String(row.rowId)),
          );
          for (const childId of entityIds.values()) {
            if (seen.has(childId)) continue;
            seen.add(childId);
            found.push({ entity: child.entity, entityId: childId });
          }
        }
      }
      return found;
    },

    /** The same branch on an entity and everything under it, each with a first version there: a copy of main's head. In the
     * caller's transaction. Returns what was branched. */
    async branchHierarchy(
      tx: Handle,
      entity: Entity,
      entityId: string,
      name: string,
      author: Author,
    ): Promise<{ entity: Entity; entityId: string }[]> {
      const branched: { entity: Entity; entityId: string }[] = [];
      const descendants = await this.findDescendants(tx, entity, entityId);
      for (const found of descendants) {
        const head = await this.getHead(tx, found.entity, found.entityId);
        if (!head) continue;
        await this.clone(
          tx,
          found.entity,
          found.entityId,
          head.versionId,
          author,
          {
            branch: name,
            intent: {
              what: `Branch ${name}`,
              why: "Branching it with everything under it",
            },
          },
        );
        branched.push(found);
      }
      return branched;
    },

    /** Archives a branch: its versions stay readable, and nothing more is written on it. Main cannot be archived. true when
     * it was open. */
    async archiveBranch(
      tx: Handle,
      entityId: string,
      name: string,
    ): Promise<boolean> {
      if (name === MAIN) throw new Error("versioning: main cannot be archived");
      const outerCapsuleId = await findAliveOuterCapsuleId(tx, entityId);
      if (!outerCapsuleId) return false;
      const closed = await tx
        .update(branch)
        .set({ validTo: now() })
        .where(
          and(
            eq(branch.outerCapsuleId, outerCapsuleId),
            eq(branch.name, name),
            isNull(branch.validTo),
          ),
        )
        .returning({ id: branch.id });
      return closed.length > 0;
    },

    /** A merge: the head's row plus the values the caller chose (which side wins each field is the entity's decision)
     * becomes the next version on the branch, with every merged version as a source. At least two sources, all
     * versions of this identity. */
    async merge<TEntity extends Entity>(
      tx: Handle,
      entity: TEntity,
      entityId: string,
      values: PatchOf<TEntity>,
      sourceVersionIds: string[],
      author: Author,
      options: WriteOptions = {},
    ): Promise<RowOf<TEntity> | null> {
      const entityTable = getEntityTable(entity);
      if (sourceVersionIds.length < 2)
        throw new Error("versioning: a merge needs at least two versions");
      const outerCapsuleId = await findAliveOuterCapsuleId(tx, entityId);
      if (!outerCapsuleId) return null;
      for (const id of sourceVersionIds)
        await findVersionOfIdentity(tx, outerCapsuleId, entityId, id);
      const head = await lockHead(tx, outerCapsuleId, options);
      if (!head) return null;
      const current = await findRow(tx, entityTable, head.entityRowId);
      if (!current) return null;

      const given = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== undefined),
      );
      const row = await insertCopy(tx, entityTable, { ...current, ...given });
      await addVersion(tx, entity, entityTable, {
        outerCapsuleId,
        branchId: head.branchId,
        isMain: head.isMain,
        follows: head,
        seq: head.seq + 1,
        row,
        origin: "merge",
        sources: sourceVersionIds,
        author,
        intent: options.intent,
      });
      return row as RowOf<TEntity>;
    },

    /** The entity id of each row: a row holds nothing of its identity, its version points at it. Keyed by row id. */
    async findEntityIdsOfRows(
      db: Handle,
      entity: Entity,
      rowIds: string[],
    ): Promise<Map<string, string>> {
      const pairs = await db
        .select({
          rowId: innerCapsule.entityRowId,
          entityId: outerCapsule.entityId,
        })
        .from(innerCapsule)
        .innerJoin(
          outerCapsule,
          eq(outerCapsule.id, innerCapsule.outerCapsuleId),
        )
        .where(
          and(
            eq(innerCapsule.entityType, entity),
            inArray(innerCapsule.entityRowId, rowIds),
          ),
        );
      return new Map(pairs.map((pair) => [pair.rowId, pair.entityId]));
    },

    /** The entity's current rows as a subquery named like its table: the head of main of each identity alive now, with the
     * row id column holding the entity id. A query that reads this in place of the table sees one row per identity. */
    currentRows(entity: Entity): Subquery {
      const entityTable = getEntityTable(entity);
      const columns: Record<string, PgColumn> = getTableColumns(
        entityTable.table,
      );
      const currentRowsSql = new QueryBuilder()
        .select({
          ...columns,
          [entityTable.idKey]: sql`${outerCapsule.entityId}`
            .mapWith(entityTable.idColumn)
            .as(entityTable.idColumn.name),
        })
        .from(entityTable.table)
        .innerJoin(
          innerCapsule,
          and(
            eq(innerCapsule.entityRowId, entityTable.idColumn),
            eq(innerCapsule.entityType, entity),
            isNull(innerCapsule.validTo),
          ),
        )
        .innerJoin(
          branch,
          and(eq(branch.id, innerCapsule.branchId), eq(branch.name, MAIN)),
        )
        .innerJoin(
          outerCapsule,
          and(
            eq(outerCapsule.id, innerCapsule.outerCapsuleId),
            isNull(outerCapsule.validTo),
          ),
        )
        .getSQL();
      // Selected as the table's own columns, so that every query reads them as "goal"."id", also next to a join.
      const name = getTableName(entityTable.table);
      return new Proxy(
        new Subquery(currentRowsSql, columns, name),
        new SelectionProxyHandler({
          alias: name,
          sqlAliasedBehavior: "alias",
          sqlBehavior: "error",
        }),
      );
    },

    /** A WHERE fragment for a read: the entity's rows that are the version of the branch now (or at view.at), of an
     * identity alive then. AND it into the read, as a scope is. */
    whereCurrent(entity: Entity, view: View = {}): SQL {
      const entityTable = getEntityTable(entity);
      const at = view.at;
      const isOpenAt = (validFrom: PgColumn, validTo: PgColumn) =>
        at
          ? and(lte(validFrom, at), or(isNull(validTo), gt(validTo, at)))
          : isNull(validTo);
      const versionRows = new QueryBuilder()
        .select({ rowId: innerCapsule.entityRowId })
        .from(innerCapsule)
        .innerJoin(branch, eq(branch.id, innerCapsule.branchId))
        .innerJoin(
          outerCapsule,
          eq(outerCapsule.id, innerCapsule.outerCapsuleId),
        )
        .where(
          and(
            eq(innerCapsule.entityType, entity),
            eq(branch.name, view.branch ?? MAIN),
            isOpenAt(innerCapsule.validFrom, innerCapsule.validTo),
            isOpenAt(outerCapsule.validFrom, outerCapsule.validTo),
            view.entityIds
              ? inArray(outerCapsule.entityId, view.entityIds)
              : undefined,
          ),
        );
      return inArray(entityTable.idColumn, versionRows);
    },

    /** Removes the identity: it and every open version are closed. No row is touched; reads at an earlier moment still
     * find it. true when it was alive. */
    async remove(
      tx: Handle,
      entity: Entity,
      entityId: string,
    ): Promise<boolean> {
      getEntityTable(entity);
      const time = now();
      const closed = await tx
        .update(outerCapsule)
        .set({ validTo: time })
        .where(
          and(
            eq(outerCapsule.entityId, entityId),
            isNull(outerCapsule.validTo),
          ),
        )
        .returning({ id: outerCapsule.id });
      if (closed.length === 0) return false;
      await tx
        .update(innerCapsule)
        .set({ validTo: time })
        .where(
          and(
            eq(innerCapsule.outerCapsuleId, closed[0]!.id),
            isNull(innerCapsule.validTo),
          ),
        );
      return true;
    },
  };
}

export type Versioning<TEntry extends VersionedEntry = VersionedEntry> =
  ReturnType<typeof createVersioning<TEntry>>;
