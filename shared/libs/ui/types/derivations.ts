// ============================================================
// DERIVED COLOR REFERENCES
// Colors derived from primitives: gray scales, brand light/dark,
// status light/dark variants. Inferred from the theme schema.
// ============================================================
import type { z } from 'zod';
import type * as S from './schema/primitives';

export type GrayStep = z.infer<typeof S.GrayStep>;
export type DerivedColorRef = z.infer<typeof S.DerivedColorRef>;
