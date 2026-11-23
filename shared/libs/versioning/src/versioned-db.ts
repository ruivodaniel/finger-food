// The versioned db: an object that inherits from a drizzle db and overrides what versioning changes.
//
//   select  reads the entity's current rows wherever a query names its table: in from and in a join
//   insert  creates the row, the identity and the first version
//   update  makes a new row and version for each current row that matches
//   delete  closes the identity of each current row that matches
//
// Tables of other entities run as written. What can't be versioned throws.
import { getTableColumns, type SQL, type SQLWrapper, type Subquery } from "drizzle-orm";
import type { PgColumn, PgTable, SelectedFields } from "drizzle-orm/pg-core";
import { StaleHead, type Author, type Handle, type Row, type VersionedEntry, type Versioning, type WriteOptions } from "./versioning";

export interface VersionedDbOptions {
  versioning: Versioning;
  /** The entities whose tables this db versions. */
  entries: readonly VersionedEntry[];
  /** Who writes: asked for only when something is written. A db that only reads needs none; a write without one throws. */
  author?: Author | (() => Author);
  /** expectedHead, branch and intent of the writes. */
  writeOptions?: WriteOptions;
  /** What a write on a head that moved throws. Default: the StaleHead itself. */
  staleHeadError?: (error: StaleHead) => Error;
}

/** A drizzle db or transaction that can be versioned. */
export interface VersionableDb extends Handle {
  transaction<TResult>(run: (tx: VersionableDb) => Promise<TResult>): Promise<TResult>;
}

type TableSource = PgTable | Subquery;
type JoinCondition = SQL | ((...fields: never[]) => SQL | undefined);
type JoinMethod = "innerJoin" | "leftJoin" | "rightJoin" | "fullJoin" | "crossJoin";
/** A select query's joins, which are properties of the query, so they can be replaced on it. */
type JoinableQuery = Record<JoinMethod, (table: TableSource, on?: JoinCondition) => unknown>;
/** A select before its from, whichever select made it. */
interface SelectBuilder {
  from(source: TableSource): unknown;
}

const JOIN_METHODS: JoinMethod[] = ["innerJoin", "leftJoin", "rightJoin", "fullJoin", "crossJoin"];
const REFUSED_METHODS = ["execute", "query", "$with", "with", "$count"];

/** What a versioned write answers: it runs when awaited, or through returning(), with every column or the ones asked for. */
function writeResult(table: PgTable, run: () => Promise<Row[]>) {
  return {
    async returning(fields?: SelectedFields): Promise<Row[]> {
      const rows = await run();
      if (fields === undefined) return rows;
      // a field is one of the table's columns, under any name: its key on the row is the column's key on the table
      const keyOf = new Map(Object.entries(getTableColumns(table)).map(([key, column]) => [column as unknown, key]));
      return rows.map((row) => Object.fromEntries(Object.entries(fields).map(([name, column]) => {
        const key = keyOf.get(column);
        if (key === undefined) throw new Error(`versioned db: returning() takes only the table's own columns, not ${name}`);
        return [name, row[key]];
      })));
    },
    then<TResult>(onDone: (rows: Row[]) => TResult, onFailed?: (error: unknown) => TResult) {
      return run().then(onDone, onFailed);
    },
  };
}

/** An update or delete: where() runs it. Awaited without one it throws, so it never changes every row by accident. */
function writeNeedingWhere(table: PgTable, run: (condition: SQL) => Promise<Row[]>) {
  return {
    where: (condition: SQL) => writeResult(table, () => run(condition)),
    then<TResult>(_onDone: (rows: Row[]) => TResult, onFailed: (error: unknown) => TResult) {
      return onFailed(new Error("versioned db: an update or delete needs a where()"));
    },
  };
}

export function createVersionedDb<TDb extends VersionableDb>(db: TDb, options: VersionedDbOptions): TDb {
  const { versioning, entries, writeOptions = {}, staleHeadError } = options;
  const authorNow = (): Author => {
    if (!options.author) throw new Error("versioned db: a write needs an author, and this db was made without one");
    return typeof options.author === "function" ? options.author() : options.author;
  };

  const entityOfTable = (table: TableSource) => entries.find((entry) => entry.table === table)?.entity;
  const currentRowsOr = (table: TableSource): TableSource => {
    const entity = entityOfTable(table);
    return entity ? versioning.currentRows(entity) : table;
  };
  const findCurrentRows = (tx: Handle, entity: string, condition: SQL) => tx.select().from(versioning.currentRows(entity)).where(condition) as Promise<Row[]>;

  /** The select's from reads current rows, and so does every join on the query it makes. */
  const fromCurrentRows = (builder: SelectBuilder) => ({
    from(table: TableSource) {
      const query = builder.from(currentRowsOr(table)) as JoinableQuery;
      for (const joinMethod of JOIN_METHODS) {
        const join = query[joinMethod];
        query[joinMethod] = (joinedTable, on) => join(currentRowsOr(joinedTable), on);
      }
      return query;
    },
  });

  const insertRows = (entity: string, table: PgTable, values: Row | Row[]) => db.transaction(async (tx) => {
    const { idKey } = versioning.getEntityTable(entity);
    const created: Row[] = [];
    for (const given of [values].flat()) {
      const rowId = versioning.createId();
      await tx.insert(table).values({ ...given, [idKey]: rowId });
      const givenId = given[idKey] === undefined ? undefined : String(given[idKey]);
      const entityId = await versioning.createOuterCapsule(tx, entity, givenId);
      const row = await versioning.createFirstInnerCapsule(tx, entity, rowId, entityId, authorNow(), writeOptions.intent);
      created.push({ ...row, [idKey]: entityId });
    }
    return created;
  });

  const updateRows = (entity: string, patch: Row, condition: SQL) => db.transaction(async (tx) => {
    const { idKey } = versioning.getEntityTable(entity);
    const updated: Row[] = [];
    for (const current of await findCurrentRows(tx, entity, condition)) {
      const entityId = String(current[idKey]);
      const row = await versioning.save(tx, entity, entityId, patch, authorNow(), writeOptions);
      if (row) updated.push({ ...row, [idKey]: entityId });
    }
    return updated;
  }).catch((error: unknown) => {
    throw error instanceof StaleHead && staleHeadError ? staleHeadError(error) : error;
  });

  const removeRows = (entity: string, condition: SQL) => db.transaction(async (tx) => {
    const { idKey } = versioning.getEntityTable(entity);
    const removed = await findCurrentRows(tx, entity, condition);
    for (const current of removed) await versioning.remove(tx, entity, String(current[idKey]));
    return removed;
  });

  const overrides = {
    select: (fields?: SelectedFields) => fromCurrentRows((fields ? db.select(fields) : db.select()) as SelectBuilder),
    selectDistinct: (fields?: SelectedFields) => fromCurrentRows((fields ? db.selectDistinct(fields) : db.selectDistinct()) as SelectBuilder),
    selectDistinctOn: (on: (PgColumn | SQLWrapper)[], fields?: SelectedFields) => fromCurrentRows((fields ? db.selectDistinctOn(on, fields) : db.selectDistinctOn(on)) as SelectBuilder),

    insert(table: PgTable) {
      const entity = entityOfTable(table);
      if (!entity) return db.insert(table);
      return { values: (values: Row | Row[]) => writeResult(table, () => insertRows(entity, table, values)) };
    },
    update(table: PgTable) {
      const entity = entityOfTable(table);
      if (!entity) return db.update(table);
      return { set: (patch: Row) => writeNeedingWhere(table, (condition) => updateRows(entity, patch, condition)) };
    },
    delete(table: PgTable) {
      const entity = entityOfTable(table);
      if (!entity) return db.delete(table);
      return writeNeedingWhere(table, (condition) => removeRows(entity, condition));
    },

    transaction: <TResult>(run: (tx: VersionableDb) => Promise<TResult>) => db.transaction((tx) => run(createVersionedDb(tx, options))),
  };

  const refused = Object.fromEntries(REFUSED_METHODS.map((method) => [method, () => {
    throw new Error(`versioned db: ${method} can't be versioned`);
  }]));

  return Object.assign(Object.create(db), overrides, refused);
}
