// ============================================================
// SEMANTIC COLOR REFERENCES
// Application-level color identities set by the theme designer. Inferred from the theme schema.
// ============================================================
import type { z } from 'zod';
import type * as S from './schema/primitives';

export type SemanticColorRef = z.infer<typeof S.SemanticColorRef>;
