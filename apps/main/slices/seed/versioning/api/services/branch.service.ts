/**
 * Branch service — the branches of identities.
 */
import type { BranchSelect } from "../models/branch.model";
import type { DrizzleBranchRepository } from "../repositories/branch.repository";

export class BranchService {
  private readonly repo: DrizzleBranchRepository;

  constructor(repo: DrizzleBranchRepository) {
    this.repo = repo;
  }

  getByIds(ids: string[]): Promise<BranchSelect[]> {
    return this.repo.findByIds(ids);
  }

  /** In the order they were made. */
  getAllByOuterCapsuleIds(outerCapsuleIds: string[]): Promise<BranchSelect[]> {
    return this.repo.findAllByOuterCapsuleIds(outerCapsuleIds);
  }
}
