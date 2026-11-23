/**
 * Wire types — the client contract. web infers from these, never from the
 * entity schemas, so the persistence shape never leaks to a client.
 */

export type MeteorStatus = "draft" | "published";

/** What the public door serves: published meteors, the public fields. */
export interface PublicMeteor {
  id: string;
  name: string;
  description: string | null;
  diameterKm: string | null;
  discoveredAt: string | null;
}

/** What the company sees: the row. */
export interface MeteorView {
  id: string;
  organizationId: string;
  createdBy: string;
  name: string;
  description: string | null;
  diameterKm: string | null;
  discoveredAt: string | null;
  status: MeteorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface MeteorListQuery {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateMeteorInput {
  name: string;
  description?: string | null;
  diameterKm?: string | null;
  discoveredAt?: string | null;
}

export interface UpdateMeteorInput extends Partial<CreateMeteorInput> {
  status?: MeteorStatus;
}
