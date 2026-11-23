// The versioning slice's public web surface: what the core may import, and the only door to its shared/components.
export { mountVersioningWeb } from "./services/application/mount";
export type { MountVersioningWebOptions, VersioningHttp } from "./services/application/mount";
export { ArchiveBranch } from "./shared/components/ArchiveBranch";
export { BranchHierarchy } from "./shared/components/BranchHierarchy";
export { BranchPicker } from "./shared/components/BranchPicker";
export { History } from "./shared/components/History";
export { Release } from "./shared/components/Release";
export { Restore } from "./shared/components/Restore";
export type { Presenter, PresenterField, VersionComparison, View } from "./shared/components/types";
export { ValueDiff } from "./shared/components/ValueDiff";
export { VersionBadge } from "./shared/components/VersionBadge";
export { VersionChanges } from "./shared/components/VersionChanges";
export { VersionedEntity } from "./shared/components/VersionedEntity";
export { VersionMerge, type VersionMergeInputs } from "./shared/components/VersionMerge";
