/**
 * Inner capsule repository — versions. Reads only: the versioning library writes them.
 */
import { asc, inArray } from "drizzle-orm";
import { innerCapsule, type InnerCapsuleSelect } from "../models/inner-capsule.model";
import type { VersioningDb } from "../mount-types";

export class DrizzleInnerCapsuleRepository {
  private readonly db: VersioningDb;

  constructor(db: VersioningDb) {
    this.db = db;
  }

  async findByIds(ids: string[]): Promise<InnerCapsuleSelect[]> {
    return this.db.select().from(innerCapsule).where(inArray(innerCapsule.id, ids));
  }

  /** On every branch, in the order they were made. */
  async findAllByOuterCapsuleIds(outerCapsuleIds: string[]): Promise<InnerCapsuleSelect[]> {
    return this.db
      .select()
      .from(innerCapsule)
      .where(inArray(innerCapsule.outerCapsuleId, outerCapsuleIds))
      .orderBy(asc(innerCapsule.validFrom), asc(innerCapsule.seq));
  }
}
