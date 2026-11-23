/**
 * Release repository — the releases of identities.
 */
import { and, asc, desc, eq, inArray, isNull } from "drizzle-orm";
import { outerCapsule } from "../models/outer-capsule.model";
import { release, type ReleaseSelect } from "../models/release.model";
import type { VersioningDb } from "../mount-types";

export type NewRelease = Pick<ReleaseSelect, "outerCapsuleId" | "innerCapsuleId" | "title" | "description" | "authorId" | "authorType">;

export class DrizzleReleaseRepository {
  private readonly db: VersioningDb;
  private readonly createId: () => string;

  constructor(db: VersioningDb, createId: () => string) {
    this.db = db;
    this.createId = createId;
  }

  /** By number. */
  async findAllByOuterCapsuleIds(outerCapsuleIds: string[]): Promise<ReleaseSelect[]> {
    return this.db.select().from(release).where(inArray(release.outerCapsuleId, outerCapsuleIds)).orderBy(asc(release.number));
  }

  /** The next release of the identity, with the identity locked while it is made: the open one closes, and the new one takes
   * the next number. Numbering is part of the write, so that two releases never take the same number. */
  async create(newRelease: NewRelease): Promise<ReleaseSelect> {
    const now = new Date();
    return this.db.transaction(async (tx) => {
      await tx.select({ id: outerCapsule.id }).from(outerCapsule).where(eq(outerCapsule.id, newRelease.outerCapsuleId)).for("update");
      const [last] = await tx.select({ number: release.number }).from(release).where(eq(release.outerCapsuleId, newRelease.outerCapsuleId)).orderBy(desc(release.number)).limit(1);
      await tx.update(release).set({ validTo: now }).where(and(eq(release.outerCapsuleId, newRelease.outerCapsuleId), isNull(release.validTo)));
      const [created] = await tx.insert(release).values({ ...newRelease, id: this.createId(), number: (last?.number ?? 0) + 1, createdAt: now, validFrom: now }).returning();
      return created!;
    });
  }
}
