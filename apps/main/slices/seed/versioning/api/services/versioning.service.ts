/**
 * Versioning service — everything about history, for any entity in the versioned list: the history of an identity
 * (its versions with their labels, its branches, its releases), the entity as it was at a moment, what changed between
 * two versions, cloning a version (a restore, on its own branch), merging, releasing, and archiving a branch. The only layer that
 * throws. It reads each capsule table through that table's service and puts them together here; the versioned entities'
 * own tables are read and written through the library, in the version repository.
 */
import { BranchArchived, MAIN, StaleHead, VersionNotFound, type Author, type Intent } from "@libs/versioning";
import type { InnerCapsuleSelect } from "../models/inner-capsule.model";
import type { OuterCapsuleSelect } from "../models/outer-capsule.model";
import type { ReleaseSelect } from "../models/release.model";
import type { DrizzleVersionRepository } from "../repositories/version.repository";
import type { AccessAction, EntityAccess } from "../mount-types";
import type { ModuleErrors } from "../shared/module-errors";
import type { BranchService } from "./branch.service";
import type { InnerCapsuleService } from "./inner-capsule.service";
import type { OuterCapsuleService } from "./outer-capsule.service";
import type { ReleaseService } from "./release.service";
import type { VersionDeltaService } from "./version-delta.service";
import type { BranchView, Comparison, FieldDelta, History, ReleaseView, VersionAt, VersionView } from "../../shared/types";

export interface VersioningServiceDeps {
  versionRepo: DrizzleVersionRepository;
  outerCapsuleService: OuterCapsuleService;
  branchService: BranchService;
  innerCapsuleService: InnerCapsuleService;
  versionDeltaService: VersionDeltaService;
  releaseService: ReleaseService;
  /** Who may read or change each entity's history: the entity's owner answers, by entity. */
  access: Readonly<Record<string, EntityAccess>>;
  /** Names of authors, by id: the app's, since this slice keeps only ids. */
  authorNamesOf: (userIds: string[]) => Promise<Map<string, string>>;
  errors: ModuleErrors;
}

/** Who is asking, as the app's middleware left it on the request: handed to the entity's owner, never read here. */
export interface Asker {
  scopedAc: unknown;
}

/** A version, and the name of its branch. */
interface VersionWithBranch {
  version: InnerCapsuleSelect;
  branchName: string;
}

/** Where a clone or a merge goes, and what the caller knows. */
export interface VersionWriteOptions {
  toBranch?: string;
  expectedHead?: string;
  intent?: Intent;
}

/** What a release is called. */
export interface ReleaseDetails {
  title?: string;
  description?: string;
}

export class VersioningService {
  private readonly deps: VersioningServiceDeps;

  constructor(deps: VersioningServiceDeps) {
    this.deps = deps;
  }

  /** The versions of an identity on every branch, with their labels and what changed; its branches; its releases. */
  async getHistory(asker: Asker, entity: string, entityId: string): Promise<History> {
    return this.historyOf(await this.requireIdentity(asker, entity, entityId, "read"));
  }

  private async historyOf(identity: OuterCapsuleSelect): Promise<History> {
    const [versions, branches, releases] = await Promise.all([
      this.findVersions(identity.id),
      this.deps.branchService.getAllByOuterCapsuleIds([identity.id]),
      this.deps.releaseService.getAllByOuterCapsuleIds([identity.id]),
    ]);
    const deltas = await this.deps.versionDeltaService.getAllByToInnerCapsuleIds(versions.map((found) => found.version.id));
    const changesInto = new Map(deltas.map((delta) => [delta.toInnerCapsuleId, delta.fields]));
    const labels = this.computeLabels(versions, releases);
    const people = versions.flatMap(({ version }) => (version.authorType === "user" ? [version.authorId] : [])).concat(versions.flatMap(({ version }) => (version.instructedById ? [version.instructedById] : [])));
    const names = people.length ? await this.deps.authorNamesOf([...new Set(people)]) : new Map<string, string>();

    const versionViews = versions.map((found) => this.toVersionView(found, labels.get(found.version.id)!, changesInto.get(found.version.id) ?? null, names));
    const branchViews: BranchView[] = branches.map((branch) => ({
      name: branch.name,
      headVersionId: versions.find((found) => found.version.branchId === branch.id && found.version.validTo === null)?.version.id ?? null,
      archivedAt: branch.validTo?.toISOString() ?? null,
    }));
    return { versions: versionViews, branches: branchViews, releases: releases.map((release) => this.toReleaseView(release)) };
  }

  /** The entity as it was on a branch at a moment (now when none is given): that version and its row. */
  async readAt(asker: Asker, entity: string, entityId: string, view: { branch?: string; at?: string }): Promise<VersionAt> {
    const identity = await this.requireIdentity(asker, entity, entityId, "read");
    const branchName = view.branch ?? MAIN;
    const moment = view.at ? new Date(view.at) : new Date();
    // the head of the branch at that moment: valid from at or before it, and not closed by then
    const found = (await this.findVersions(identity.id)).find(({ version, branchName: name }) =>
      name === branchName && version.validFrom <= moment && (version.validTo === null || version.validTo > moment));
    if (!found) throw this.deps.errors.notFound(`no version of ${entityId} on ${branchName} at ${moment.toISOString()}`);
    const read = await this.deps.versionRepo.findVersionWithRow(entity, found.version.id);
    if (!read) throw this.deps.errors.notFound(`the row of version ${found.version.id} is gone`);
    return { version: await this.findVersionView(identity, found.version.id), row: read.row };
  }

  /** One version of an identity and its row, exactly: what a moment can't promise once a head has moved. */
  async readVersion(asker: Asker, entity: string, entityId: string, versionId: string): Promise<VersionAt> {
    const identity = await this.requireIdentity(asker, entity, entityId, "read");
    const found = await this.findVersion(versionId);
    if (!found || found.version.outerCapsuleId !== identity.id) throw this.deps.errors.notFound(`${versionId} is not a version of ${entityId}`);
    const read = await this.deps.versionRepo.findVersionWithRow(entity, versionId);
    if (!read) throw this.deps.errors.notFound(`the row of version ${versionId} is gone`);
    return { version: await this.findVersionView(identity, versionId), row: read.row };
  }

  /** What changed between two versions of an identity: the stored delta when the second was made right after the first,
   * otherwise computed now from the two rows. */
  async compare(asker: Asker, entity: string, entityId: string, fromVersionId: string, toVersionId: string): Promise<Comparison> {
    const identity = await this.requireIdentity(asker, entity, entityId, "read");
    for (const versionId of [fromVersionId, toVersionId]) {
      const found = await this.findVersion(versionId);
      if (!found || found.version.outerCapsuleId !== identity.id) throw this.deps.errors.notFound(`${versionId} is not a version of ${entityId}`);
    }
    const stored = (await this.deps.versionDeltaService.getAllByToInnerCapsuleIds([toVersionId])).find((delta) => delta.fromInnerCapsuleId === fromVersionId);
    if (stored) return { fromVersionId, toVersionId, stored: true, changes: stored.fields };
    const changes = await this.deps.versionRepo.compareVersions(entity, fromVersionId, toVersionId);
    if (!changes) throw this.deps.errors.notFound("one of the two versions has no row");
    return { fromVersionId, toVersionId, stored: false, changes };
  }

  /** The branches of an identity, with their heads. */
  async getBranches(asker: Asker, entity: string, entityId: string): Promise<BranchView[]> {
    return (await this.getHistory(asker, entity, entityId)).branches;
  }

  /** A clone of a version onto a branch, created when it does not exist; on the version's own branch it is a restore. A
   * head that moved since the caller read it, or an archived branch, is a conflict. Returns the new version. */
  async clone(asker: Asker, entity: string, entityId: string, fromVersionId: string, author: Author, options: VersionWriteOptions): Promise<VersionView> {
    const identity = await this.requireIdentity(asker, entity, entityId, "write");
    const { toBranch, expectedHead, intent } = options;
    const cloned = await this.runWrite(() => this.deps.versionRepo.clone(entity, entityId, fromVersionId, author, { branch: toBranch, expectedHead, intent }));
    if (!cloned) throw this.deps.errors.notFound(`${entityId} is removed`);
    return this.findVersionView(identity, cloned.versionId);
  }

  /** Two or more versions become one new version on a branch, from its head and the values the caller chose. A head that
   * moved since the caller read it is a conflict. Returns the new version. */
  async merge(asker: Asker, entity: string, entityId: string, sourceVersionIds: string[], data: Record<string, unknown>, author: Author, options: VersionWriteOptions): Promise<VersionView> {
    const identity = await this.requireIdentity(asker, entity, entityId, "write");
    const { toBranch, expectedHead, intent } = options;
    const merged = await this.runWrite(() => this.deps.versionRepo.merge(entity, entityId, data, sourceVersionIds, author, { branch: toBranch, expectedHead, intent }));
    if (!merged) throw this.deps.errors.notFound(`${entityId} has no open ${toBranch ?? MAIN} branch to merge on`);
    return this.findVersionView(identity, merged.versionId);
  }

  /** The same branch, from main's heads, on an entity and everything under it: v37's branchHierarchy. A name the entity has
   * already had is a conflict. Returns what was branched. */
  async branchHierarchy(asker: Asker, entity: string, entityId: string, name: string, author: Author): Promise<{ entity: string; entityId: string }[]> {
    const identity = await this.requireIdentity(asker, entity, entityId, "write");
    if (name === MAIN) throw this.deps.errors.badRequest("main is every entity's own branch");
    const { branches } = await this.historyOf(identity);
    if (branches.some((branch) => branch.name === name)) throw this.deps.errors.conflict(`${entityId} already has a branch ${name}`);
    return this.runWrite(() => this.deps.versionRepo.branchHierarchy(entity, entityId, name, author));
  }

  /** Archives a branch: its versions stay readable, and nothing more is written on it. Returns the branch. */
  async archiveBranch(asker: Asker, entity: string, entityId: string, name: string): Promise<BranchView> {
    const identity = await this.requireIdentity(asker, entity, entityId, "write");
    if (name === MAIN) throw this.deps.errors.badRequest("main cannot be archived");
    const archived = await this.deps.versionRepo.archiveBranch(entityId, name);
    if (!archived) throw this.deps.errors.notFound(`${entityId} has no open branch ${name}`);
    return (await this.historyOf(identity)).branches.find((branch) => branch.name === name)!;
  }

  /** A version of main promoted and numbered, later on main than the last release: labels count from it. */
  async release(asker: Asker, entity: string, entityId: string, versionId: string, author: Author, details: ReleaseDetails): Promise<ReleaseView> {
    const identity = await this.requireIdentity(asker, entity, entityId, "write");
    const found = await this.findVersion(versionId);
    if (!found || found.version.outerCapsuleId !== identity.id) throw this.deps.errors.notFound(`${versionId} is not a version of ${entityId}`);
    if (found.branchName !== MAIN) throw this.deps.errors.badRequest("only a version of main can be released");
    const lastRelease = (await this.deps.releaseService.getAllByOuterCapsuleIds([identity.id])).at(-1);
    const lastReleased = lastRelease && (await this.findVersion(lastRelease.innerCapsuleId));
    if (lastRelease && lastReleased && found.version.seq <= lastReleased.version.seq) throw this.deps.errors.conflict(`release ${lastRelease.number} is at or after this version`);
    const created = await this.deps.releaseService.create({
      outerCapsuleId: identity.id, innerCapsuleId: versionId,
      title: details.title ?? null, description: details.description ?? null, authorId: author.id, authorType: author.type,
    });
    return this.toReleaseView(created);
  }

  /** A write of the library: what it refuses becomes the error the caller sees. */
  private async runWrite<TResult>(write: () => Promise<TResult>): Promise<TResult> {
    try {
      return await write();
    } catch (error) {
      if (error instanceof StaleHead || error instanceof BranchArchived) throw this.deps.errors.conflict(error.message);
      if (error instanceof VersionNotFound) throw this.deps.errors.notFound(error.message);
      throw error;
    }
  }

  /** Every version of an identity on every branch, in the order they were made, with its branch's name. */
  private async findVersions(outerCapsuleId: string): Promise<VersionWithBranch[]> {
    const [versions, branches] = await Promise.all([
      this.deps.innerCapsuleService.getAllByOuterCapsuleIds([outerCapsuleId]),
      this.deps.branchService.getAllByOuterCapsuleIds([outerCapsuleId]),
    ]);
    const nameOf = new Map(branches.map((branch) => [branch.id, branch.name]));
    return versions.map((version) => ({ version, branchName: nameOf.get(version.branchId)! }));
  }

  /** One version, with its branch's name. */
  private async findVersion(versionId: string): Promise<VersionWithBranch | undefined> {
    const [version] = await this.deps.innerCapsuleService.getByIds([versionId]);
    if (!version) return undefined;
    const [branch] = await this.deps.branchService.getByIds([version.branchId]);
    return { version, branchName: branch!.name };
  }

  private async findVersionView(identity: OuterCapsuleSelect, versionId: string): Promise<VersionView> {
    const history = await this.historyOf(identity);
    return history.versions.find((version) => version.versionId === versionId)!;
  }

  /** The entity is in the versioned list, the identity is one of it, and the entity's owner lets the asker read it, or
   * write it. Not readable is not found, as for the entity itself: nobody learns that what they may not see exists. Read but
   * not written is forbidden. An entity whose owner gave no answer is nobody's to read. */
  private async requireIdentity(asker: Asker, entity: string, entityId: string, action: AccessAction): Promise<OuterCapsuleSelect> {
    const notFound = this.deps.errors.notFound(`no ${entity} ${entityId}`);
    if (!this.deps.versionRepo.hasEntity(entity)) throw this.deps.errors.notFound(`"${entity}" is not versioned`);
    const allows = this.deps.access[entity];
    if (!allows || !(await allows(asker.scopedAc, entityId, "read"))) throw notFound;
    if (action === "write" && !(await allows(asker.scopedAc, entityId, "write"))) throw this.deps.errors.forbidden(`not allowed to change ${entity} ${entityId}`);
    const [identity] = await this.deps.outerCapsuleService.getAllByEntityIds([entityId]);
    if (!identity || identity.entityType !== entity) throw notFound;
    return identity;
  }

  /** The label of every version, computed when read. On main: the number of the last release at or before it, and the
   * versions since that release (0.<seq> before any release). On another branch: <branch>.<seq>. */
  private computeLabels(versions: VersionWithBranch[], releases: ReleaseSelect[]): Map<string, string> {
    const seqOf = new Map(versions.map((found) => [found.version.id, found.version.seq]));
    const releasedAt = releases.map((release) => ({ number: release.number, seq: seqOf.get(release.innerCapsuleId) ?? 0 }));
    const labels = new Map<string, string>();
    for (const found of versions) {
      if (found.branchName !== MAIN) {
        labels.set(found.version.id, `${found.branchName}.${found.version.seq}`);
        continue;
      }
      const lastRelease = releasedAt.filter((released) => released.seq <= found.version.seq).at(-1);
      labels.set(found.version.id, lastRelease ? `${lastRelease.number}.${found.version.seq - lastRelease.seq}` : `0.${found.version.seq}`);
    }
    return labels;
  }

  private toReleaseView(release: ReleaseSelect): ReleaseView {
    return { number: release.number, versionId: release.innerCapsuleId, title: release.title, description: release.description, at: release.validFrom.toISOString() };
  }

  private toVersionView(found: VersionWithBranch, label: string, changes: FieldDelta[] | null, names: Map<string, string>): VersionView {
    const version: InnerCapsuleSelect = found.version;
    return {
      versionId: version.id, branch: found.branchName, seq: version.seq, label, origin: version.originKind, sources: version.sourceVersionIds,
      author: {
        id: version.authorId, name: names.get(version.authorId), type: version.authorType,
        instructedBy: version.instructedById ?? undefined, instructedByName: version.instructedById ? names.get(version.instructedById) : undefined,
        workflowId: version.authorWorkflowId ?? undefined, modelVersion: version.authorModelVersion ?? undefined,
      },
      title: version.title, slug: version.slug, intent: { what: version.intentWhat, why: version.intentWhy },
      at: version.validFrom.toISOString(), isHead: version.validTo === null, changes,
    };
  }
}
