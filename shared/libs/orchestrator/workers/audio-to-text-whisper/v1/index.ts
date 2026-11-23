// audio-to-text-whisper v1, as a runner loads it: the contract and the run,
// and the pinned model (what a host serves for it).
// A published version is never edited; a change is a new version folder.
export * as contract from "./contract";
export type * from "./contract";
export { run } from "./worker";
export { MODEL, modelFilePath } from "./model";
