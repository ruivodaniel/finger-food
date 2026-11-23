// ============================================================
// THE CASCADE — elements (L3), concepts (L4), contextual (L5), rules (L6)
// Inferred from the theme schema (schema/theme.ts), which builds the elements from the ELEMENTS table.
// ============================================================
import type { z } from 'zod';
import type * as S from './schema/theme';
import type { Tokens } from './schema/tokens';
import type { WebElementKey } from './elements';
import type { SizeTokens } from './families';

export type TableRowTokens = z.infer<Tokens['TableRowTokens']>;

/** kept for consumers */
export type WithSizes<T> = T & { sizes?: SizeTokens };

/** what a WEB theme may author: the elements the table gives to the web (a mobile theme's are MobileElementTypes) */
export type ElementTypes = z.infer<typeof S.ElementTypes>;
/** the tokens of one element */
export type TokensOf<K extends WebElementKey> = NonNullable<ElementTypes[K]>;

export type ConceptOverrides = z.infer<typeof S.cascade.ConceptOverrides>;
export type ContextualOverrides = z.infer<typeof S.cascade.ContextualOverrides>;
export type ChainSegment = z.infer<typeof S.ChainSegment>;
export type ChainRule = z.infer<typeof S.cascade.ChainRule>;
export type GroupedRule = z.infer<typeof S.cascade.GroupedRule>;
export type ThemeRule = z.infer<typeof S.cascade.ThemeRule>;
