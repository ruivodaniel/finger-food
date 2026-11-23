/**
 * Slots — what goes in and out of a worker or a pipeline.
 *
 * One `slot(...)` declaration gives:
 * - types: TypeScript knows every input and output, so a wrong worker call
 *   fails to compile;
 * - checks: the same declaration validates at the API door, on every step and
 *   on the final output (validate.ts);
 * - API docs: the same declaration becomes the JSON Schema in /openapi.json;
 * - `Ref`: the small pointer to a file in S3 that every file travels as.
 * Our structured version of v0.6's `input_types` / `output_types`.
 *
 * A slot is typed by a type when it accepts content (`slot("type-image", …)`),
 * or by its formats when it accepts a file (`slot({ formats: [...] })`); then
 * its types are the ones the vocabulary says those formats carry. The ids are
 * types of the vocabulary, so an unknown id fails the build.
 */

import { z } from "zod";
import { FORMAT_IDS, typesOf, type CarriedBy, type ConstraintId, type FormatId, type TypeId } from "./ontology/vocabulary";


export type Limits = Partial<Record<ConstraintId, number>>;

export interface SlotOpts<S extends z.ZodType | undefined = z.ZodType | undefined> {
  /** one (default) or many */
  many?: boolean;
  /** the formats this slot accepts or produces; a subset of the formats carrying its types */
  formats?: readonly FormatId[];
  /** limit values on the type's constraint dimensions */
  limits?: Limits;
  /** for structured content: the shape of the value */
  schema?: S;
}

export interface FileSlotOpts<S extends z.ZodType | undefined = z.ZodType | undefined> extends SlotOpts<S> {
  formats: readonly FormatId[];
}

export interface SlotSpec<
  T extends TypeId = TypeId,
  Many extends boolean = boolean,
  S extends z.ZodType | undefined = z.ZodType | undefined,
> {
  readonly kind: "slot";
  readonly types: readonly T[];
  readonly many: Many;
  readonly formats?: readonly FormatId[];
  readonly limits: Limits;
  /** present only on structured-content slots; not optional so the value type can read it */
  readonly schema: S;
  /** true when typed by its formats (a file), false when typed by a type (content) */
  readonly file: boolean;
}

export type SlotMap = Record<string, SlotSpec>;

/** The types the given formats carry, at the type level. */
export type TypesOfFormats<F extends readonly FormatId[]> = CarriedBy<F[number]>;

type ManyOf<O extends SlotOpts> = O["many"] extends true ? true : false;
type SchemaOf<O extends SlotOpts> = O["schema"] extends z.ZodType ? O["schema"] : undefined;

// ── values ──────────────────────────────────────────────────────────────────

/** A stored artifact, by reference. Bytes never travel in a payload. */
export interface Ref<T extends TypeId = TypeId> {
  type: T;
  format: FormatId;
  ref: string;
  bytes?: number;
  meta?: Record<string, unknown>;
}

/** A small structured value carried inline; only for slots with a schema. */
export interface Inline<T extends TypeId = TypeId, V = unknown> {
  type: T;
  value: V;
}

export type ValueOf<S extends SlotSpec> = S["schema"] extends z.ZodType
  ? Inline<S["types"][number], z.infer<S["schema"]>> | Ref<S["types"][number]>
  : Ref<S["types"][number]>;
export type SlotValue<S extends SlotSpec> = S["many"] extends true ? ValueOf<S>[] : ValueOf<S>;
export type SlotValues<M extends SlotMap> = { [K in keyof M]: SlotValue<M[K]> };

export function isRef(v: unknown): v is Ref {
  return typeof v === "object" && v !== null && "ref" in v && typeof (v as { ref: unknown }).ref === "string";
}
/** Narrows a ref by its format: a pipeline branching on "is this already a pdf". */
export function isFormat<F extends FormatId>(ref: Ref, format: F): ref is Ref<CarriedBy<F>> {
  return ref.format === format;
}

// ── the helper ──────────────────────────────────────────────────────────────

export function slot<T extends TypeId, const O extends SlotOpts = SlotOpts<undefined>>(
  type: T,
  opts?: O,
): SlotSpec<T, ManyOf<O>, SchemaOf<O>>;
export function slot<const O extends FileSlotOpts>(
  opts: O,
): SlotSpec<TypesOfFormats<O["formats"]>, ManyOf<O>, SchemaOf<O>>;
export function slot(a: TypeId | FileSlotOpts, b?: SlotOpts): SlotSpec {
  if (typeof a === "string") {
    // the one rule the compiler cannot see: a PNG cannot hold audio
    for (const f of b?.formats ?? []) {
      if (!typesOf(f).includes(a)) throw new Error(`slot: format "${f}" does not carry "${a}"`);
    }
    return { kind: "slot", types: [a], many: b?.many ?? false, formats: b?.formats, limits: b?.limits ?? {}, schema: b?.schema ?? undefined, file: false };
  }
  if (!a.formats?.length) throw new Error("slot: a file slot names at least one format");
  const types = [...new Set(a.formats.flatMap(typesOf))];
  return { kind: "slot", types, many: a.many ?? false, formats: a.formats, limits: a.limits ?? {}, schema: a.schema ?? undefined, file: true };
}

// ── zod for a slot's value, used by the validators and the exposed set ───────

const FORMAT_ENUM = z.enum(FORMAT_IDS);

export function slotValueSchema(spec: SlotSpec): z.ZodType {
  const types = z.enum(spec.types as [TypeId, ...TypeId[]]);
  const formats = spec.formats?.length
    ? z.enum(spec.formats as [FormatId, ...FormatId[]])
    : FORMAT_ENUM.refine(
        (f) => typesOf(f).some((t) => spec.types.includes(t)),
        { message: "format does not carry a type of this slot" },
      );
  const ref = z.object({
    type: types,
    format: formats,
    ref: z.string().min(1),
    bytes: z.number().int().nonnegative().optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
  });
  const one = spec.schema ? z.union([ref, z.object({ type: types, value: spec.schema })]) : ref;
  return spec.many ? z.array(one) : one;
}

export function slotMapSchema(slots: SlotMap): z.ZodObject<Record<string, z.ZodType>> {
  return z.object(Object.fromEntries(Object.entries(slots).map(([k, s]) => [k, slotValueSchema(s)])));
}
