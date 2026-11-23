/**
 * Version delta service — what changed into a version.
 */
import type { VersionDeltaSelect } from "../models/version-delta.model";
import type { DrizzleVersionDeltaRepository } from "../repositories/version-delta.repository";

export class VersionDeltaService {
  private readonly repo: DrizzleVersionDeltaRepository;

  constructor(repo: DrizzleVersionDeltaRepository) {
    this.repo = repo;
  }

  getAllByToInnerCapsuleIds(toInnerCapsuleIds: string[]): Promise<VersionDeltaSelect[]> {
    return this.repo.findAllByToInnerCapsuleIds(toInnerCapsuleIds);
  }
}
