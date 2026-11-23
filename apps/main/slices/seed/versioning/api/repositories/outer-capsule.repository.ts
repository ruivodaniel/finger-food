/**
 * Outer capsule repository — identities. Reads only: the versioning library creates them.
 */
import { inArray } from "drizzle-orm";
import { outerCapsule, type OuterCapsuleSelect } from "../models/outer-capsule.model";
import type { VersioningDb } from "../mount-types";

export class DrizzleOuterCapsuleRepository {
  private readonly db: VersioningDb;

  constructor(db: VersioningDb) {
    this.db = db;
  }

  async findAllByEntityIds(entityIds: string[]): Promise<OuterCapsuleSelect[]> {
    return this.db.select().from(outerCapsule).where(inArray(outerCapsule.entityId, entityIds));
  }
}
