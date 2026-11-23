/**
 * Version delta repository — what changed into a version. Reads only: the versioning library stores them.
 */
import { inArray } from "drizzle-orm";
import { versionDelta, type VersionDeltaSelect } from "../models/version-delta.model";
import type { VersioningDb } from "../mount-types";

export class DrizzleVersionDeltaRepository {
  private readonly db: VersioningDb;

  constructor(db: VersioningDb) {
    this.db = db;
  }

  async findAllByToInnerCapsuleIds(toInnerCapsuleIds: string[]): Promise<VersionDeltaSelect[]> {
    if (toInnerCapsuleIds.length === 0) return [];
    return this.db.select().from(versionDelta).where(inArray(versionDelta.toInnerCapsuleId, toInnerCapsuleIds));
  }
}
