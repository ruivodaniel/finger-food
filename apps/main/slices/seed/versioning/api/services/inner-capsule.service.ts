/**
 * Inner capsule service — versions.
 */
import type { InnerCapsuleSelect } from "../models/inner-capsule.model";
import type { DrizzleInnerCapsuleRepository } from "../repositories/inner-capsule.repository";

export class InnerCapsuleService {
  private readonly repo: DrizzleInnerCapsuleRepository;

  constructor(repo: DrizzleInnerCapsuleRepository) {
    this.repo = repo;
  }

  getByIds(ids: string[]): Promise<InnerCapsuleSelect[]> {
    return this.repo.findByIds(ids);
  }

  /** On every branch, in the order they were made. */
  getAllByOuterCapsuleIds(outerCapsuleIds: string[]): Promise<InnerCapsuleSelect[]> {
    return this.repo.findAllByOuterCapsuleIds(outerCapsuleIds);
  }
}
