// The worker versions that declare the "client" runtime: the ones the frontend
// may import. This file is what the browser typecheck (tsconfig.client.json)
// compiles, with the DOM's types and no node's, so everything a client version
// reaches must compile in a browser. The test client-workers.test.ts holds this
// list equal to the contracts that declare "client", and walks the imports.
//
// Add a line when a version declares "client"; the test fails until you do.
import type { AnyWorkerContract, WorkerRun } from "@libs/orchestrator-lib-schema";
import * as audioToTextWhisperV1 from "./audio-to-text-whisper/v1";
import * as documentFormatConversionMarkdownItV1 from "./document-format-conversion-markdown-it/v1";
import * as mergeNativeV1 from "./merge-native/v1";

/** A client version runs on bytes alone: its run takes a WorkerCtx, never a NodeWorkerCtx. */
function client<W extends AnyWorkerContract>(version: { contract: W; run: WorkerRun<W> }) {
  return version;
}

export const clientWorkers = {
  "audio-to-text-whisper/v1": client(audioToTextWhisperV1),
  "document-format-conversion-markdown-it/v1": client(documentFormatConversionMarkdownItV1),
  "merge-native/v1": client(mergeNativeV1),
};
