/**
 * Branch repository — the branches of identities. Reads only: the versioning library creates and archives them.
 */
import { asc, inArray } from "drizzle-orm";
import { branch, type BranchSelect } from "../models/branch.model";
import type { VersioningDb } from "../mount-types";

export class DrizzleBranchRepository {
  private readonly db: VersioningDb;

  constructor(db: VersioningDb) {
    this.db = db;
  }

  async findByIds(ids: string[]): Promise<BranchSelect[]> {
    return this.db.select().from(branch).where(inArray(branch.id, ids));
  }

  /** In the order they were made. */
  async findAllByOuterCapsuleIds(outerCapsuleIds: string[]): Promise<BranchSelect[]> {
    return this.db.select().from(branch).where(inArray(branch.outerCapsuleId, outerCapsuleIds)).orderBy(asc(branch.createdAt));
  }
}
