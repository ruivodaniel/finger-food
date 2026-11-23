/**
 * Release service — the releases of identities.
 */
import type { ReleaseSelect } from "../models/release.model";
import type { DrizzleReleaseRepository, NewRelease } from "../repositories/release.repository";

export class ReleaseService {
  private readonly repo: DrizzleReleaseRepository;

  constructor(repo: DrizzleReleaseRepository) {
    this.repo = repo;
  }

  /** By number. */
  getAllByOuterCapsuleIds(outerCapsuleIds: string[]): Promise<ReleaseSelect[]> {
    return this.repo.findAllByOuterCapsuleIds(outerCapsuleIds);
  }

  create(newRelease: NewRelease): Promise<ReleaseSelect> {
    return this.repo.create(newRelease);
  }
}
