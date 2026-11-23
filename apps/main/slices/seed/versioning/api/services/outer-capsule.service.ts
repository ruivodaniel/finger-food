/**
 * Outer capsule service — identities.
 */
import type { OuterCapsuleSelect } from "../models/outer-capsule.model";
import type { DrizzleOuterCapsuleRepository } from "../repositories/outer-capsule.repository";

export class OuterCapsuleService {
  private readonly repo: DrizzleOuterCapsuleRepository;

  constructor(repo: DrizzleOuterCapsuleRepository) {
    this.repo = repo;
  }

  getAllByEntityIds(entityIds: string[]): Promise<OuterCapsuleSelect[]> {
    return this.repo.findAllByEntityIds(entityIds);
  }
}
