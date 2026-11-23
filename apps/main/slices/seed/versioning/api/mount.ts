/**
 * mountVersioningApi — the slice's one assembly point: the library over the slice's own capsule tables, repositories →
 * services → router, from what the app hands it.
 */
import { createVersioning } from "@libs/versioning";
import { capsuleTables } from "./models";
import { DrizzleBranchRepository } from "./repositories/branch.repository";
import { DrizzleInnerCapsuleRepository } from "./repositories/inner-capsule.repository";
import { DrizzleOuterCapsuleRepository } from "./repositories/outer-capsule.repository";
import { DrizzleReleaseRepository } from "./repositories/release.repository";
import { DrizzleVersionDeltaRepository } from "./repositories/version-delta.repository";
import { DrizzleVersionRepository } from "./repositories/version.repository";
import { createVersioningRouter } from "./routes/create-versioning-router";
import { BranchService } from "./services/branch.service";
import { InnerCapsuleService } from "./services/inner-capsule.service";
import { OuterCapsuleService } from "./services/outer-capsule.service";
import { ReleaseService } from "./services/release.service";
import { VersionDeltaService } from "./services/version-delta.service";
import { VersioningService } from "./services/versioning.service";
import type { MountVersioningApiOptions, MountVersioningApiResult, VersioningDb } from "./mount-types";
import { createVersionedDbFor } from "./shared/versioned-db";

export function mountVersioningApi<TDb extends VersioningDb>({ db, versioned, access, authorNamesOf, createId, errors, now }: MountVersioningApiOptions<TDb>): MountVersioningApiResult<TDb> {
  const versioning = createVersioning({ versioned: [...versioned], capsules: capsuleTables, createId, now });
  const versioningService = new VersioningService({
    versionRepo: new DrizzleVersionRepository(db, versioning),
    outerCapsuleService: new OuterCapsuleService(new DrizzleOuterCapsuleRepository(db)),
    branchService: new BranchService(new DrizzleBranchRepository(db)),
    innerCapsuleService: new InnerCapsuleService(new DrizzleInnerCapsuleRepository(db)),
    versionDeltaService: new VersionDeltaService(new DrizzleVersionDeltaRepository(db)),
    releaseService: new ReleaseService(new DrizzleReleaseRepository(db, createId)),
    access,
    authorNamesOf,
    errors,
  });
  return {
    router: createVersioningRouter({ versioningService, errors }),
    versionedDbFor: createVersionedDbFor({ db, versioning, errors }),
    versioning,
    services: { versioning: versioningService },
  };
}
