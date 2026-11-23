/**
 * The capabilities: capability ontology v0.6
 * (_meta/research/orchestrator/daniel/orchestrator-scaffold-v02/catalog/ontology.json),
 * trimmed to the nodes this orchestrator implements. A node is the Worker Type.
 * Its canonical contract is the minimum every worker of the capability accepts
 * and produces, in slots; a worker contract narrows it and may add slots.
 *
 * Naming: every node is a v0.6 node, under its v0.6 id. A worker is named
 * <capability>-<vendor>, the vendor id from the v0.6 converter tool library
 * (confirmed with Daniel, 2026-09-25).
 *
 * Additions vs v0.6:
 * - a canonical contract written for document-format-conversion, which v0.6
 *   leaves without one;
 * - extract, output-image and merge follow their v0.6 signatures, with untyped
 *   slots where the content can be of any kind;
 * - a file slot is typed by its formats instead of a type.
 *
 * data-access and part-text are the v0.6 nodes, each with a canonical contract
 * written for it. audio-to-text is the v0.6 node, its contract as v0.6 writes
 * it (audio in, text out), the slots named like image-to-text's. part-text's text may take turns to produce: a turn can ask for
 * the data it needs (its schema axis), but what it ends in is text.
 *
 * config_axes and execution_species are documentation; no code reads them.
 */

import type { FormatId, TypeId } from "./vocabulary";

export interface CanonicalSlot {
  slot: string;
  type?: TypeId;
  formats?: readonly FormatId[];
  many?: boolean;
}

interface Capability {
  label: string;
  path: string;
  definition: string;
  config_axes: readonly string[];
  execution_species: readonly string[];
  canonical_contract: { inputs: readonly CanonicalSlot[]; outputs: readonly CanonicalSlot[] };
}

export const CAPABILITIES = {
  "image-to-text": {
    label: "Image → Text",
    path: "worker-capabilities/transform-represent/convert/modality-conversion",
    definition: "Convert visual textual content into machine-readable text.",
    config_axes: ["model", "language", "layout", "confidence_threshold"],
    execution_species: ["model", "stochastic", "hybrid"],
    canonical_contract: { inputs: [{ slot: "image", type: "type-image" }], outputs: [{ slot: "text", type: "type-text" }] },
  },
  "audio-to-text": {
    label: "Audio → Text",
    path: "worker-capabilities/transform-represent/convert/modality-conversion",
    definition: "Convert spoken audio into textual representation.",
    config_axes: ["model", "language", "timestamps", "diarization", "beam_size"],
    execution_species: ["model", "stochastic", "hybrid"],
    canonical_contract: { inputs: [{ slot: "audio", type: "type-audio" }], outputs: [{ slot: "text", type: "type-text" }] },
  },
  extract: {
    label: "Extract",
    path: "worker-capabilities/select-decompose",
    definition: "Return content of a requested kind from a carrier.",
    config_axes: ["target_kind", "schema", "preserve_provenance"],
    execution_species: ["deterministic", "model", "stochastic", "hybrid"],
    canonical_contract: { inputs: [{ slot: "carrier" }], outputs: [{ slot: "content" }] },
  },
  "output-image": {
    label: "Image",
    path: "worker-capabilities/produce/output-export",
    definition: "Export an image-compatible part or composition as an image artifact.",
    config_axes: ["format", "dimensions", "quality", "background"],
    execution_species: ["deterministic", "model", "hybrid"],
    canonical_contract: { inputs: [{ slot: "source" }], outputs: [{ slot: "images", type: "type-image", many: true }] },
  },
  merge: {
    label: "Merge",
    path: "worker-capabilities/combine-compute/merge",
    definition: "Combine compatible parts into one whole.",
    config_axes: ["ordering", "conflict_policy"],
    execution_species: ["deterministic", "model"],
    canonical_contract: { inputs: [{ slot: "parts", many: true }], outputs: [{ slot: "whole" }] },
  },
  "document-format-conversion": {
    label: "Document Format",
    path: "worker-capabilities/transform-represent/convert/format-conversion",
    definition: "Convert between document file formats while preserving document content and, where possible, layout.",
    config_axes: ["from", "to", "fidelity", "page_range", "template", "style"],
    execution_species: ["deterministic", "model", "hybrid"],
    canonical_contract: {
      inputs: [{ slot: "document", formats: ["format-pdf", "format-docx", "format-doc", "format-odt", "format-pptx", "format-html", "format-markdown"] }],
      outputs: [{ slot: "document", formats: ["format-pdf", "format-docx", "format-html", "format-markdown"] }],
    },
  },
  "data-access": {
    label: "Data Access",
    path: "worker-capabilities/data-access",
    definition: "Obtain data or resources from known or discoverable sources once the worker has been invoked.",
    config_axes: ["source", "timeout"],
    execution_species: ["deterministic"],
    canonical_contract: { inputs: [{ slot: "request", type: "type-structured-content" }], outputs: [{ slot: "result", type: "type-structured-content" }] },
  },
  "part-text": {
    label: "Text",
    path: "worker-capabilities/produce/produce-parts",
    definition: "Produce textual content from a specification, context, source material, or constraints.",
    config_axes: ["model", "template", "style", "length", "schema"],
    execution_species: ["deterministic", "model", "stochastic"],
    canonical_contract: { inputs: [{ slot: "conversation", type: "type-structured-content" }], outputs: [{ slot: "reply", type: "type-structured-content" }] },
  },
} as const satisfies Record<string, Capability>;

export type CapabilityId = keyof typeof CAPABILITIES;
