// merge-native v1, as a runner loads it: the contract and the run.
// A published version is never edited; a change is a new version folder.
export * as contract from "./contract";
export type * from "./contract";
export { run } from "./worker";
