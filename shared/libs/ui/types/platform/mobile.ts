// ============================================================
// THE MOBILE PART OF THE THEME
// A mobile theme authors the same shapes as a web theme, with three differences:
//   · the tokens only the web has are not there (cursor, scrollbar, outline)
//   · its states are mobile's (no `hover`; `long-pressed`, `swiped`)
//   · its elements are the ones the ELEMENTS table gives to mobile
// and it adds what only a phone has: its own layout regions, press feedback, safe areas, bundled fonts.
// Inferred from the theme schema; the schema types the shared shapes as the web's, MobileTokens makes them mobile's.
// ============================================================
import type { z } from 'zod';
import type * as S from '../schema/theme';
import type { MobileState } from '../axes';
import type { ColorRef } from '../primitives';
import type { CombinedWhere, SurfaceContainerTokens, MorphologicalFamilies } from '../families';
import type { ChainRule } from '../cascade';
import type { WebOnlyTokenKey } from './web';

/** where a combined override applies, on mobile: mobile's states in place of the web's */
export type MobileCombinedWhere = Omit<CombinedWhere, 'state'> & { state?: 'default' | MobileState };

/** A shared token shape as a mobile theme may author it: the web-only keys removed at every depth,
 *  and every `where` taking mobile's states. */
export type MobileTokens<T> =
  T extends readonly (infer U)[] ? MobileTokens<U>[]
  : T extends object ? {
      [K in keyof T as K extends WebOnlyTokenKey ? never : K]:
        K extends 'where' ? MobileCombinedWhere : MobileTokens<T[K]>;
    }
  : T;

export type MobileFamilies = MobileTokens<MorphologicalFamilies>;
export type MobileElementTypes = MobileTokens<z.infer<typeof S.MobileElementTypes>>;
export type MobileConceptOverrides = {
  [conceptName: string]: {
    [familyOrElementName: string]: MobileTokens<SurfaceContainerTokens> & { accent?: ColorRef; contextual?: Partial<MobileElementTypes> };
  };
};
export type MobileContextualOverrides = { [parentType: string]: Partial<MobileElementTypes> };
export type MobileThemeRule = { chain: ChainRule['chain']; tokens: MobileTokens<SurfaceContainerTokens> };

export type SafeAreaEdge = z.infer<typeof S.SafeAreaEdge>;
export type MobileRegionTokens = MobileTokens<z.infer<typeof S.MobileRegionTokens>>;
export type MobileBarTokens = MobileTokens<z.infer<typeof S.MobileBarTokens>>;
export type MobileLayouts = MobileTokens<z.infer<typeof S.MobileLayouts>>;
export type MobilePress = z.infer<typeof S.MobilePress>;
export type FontSourceBundled = z.infer<typeof S.FontSourceBundled>;
export type MobileTypography = z.infer<typeof S.MobileTypography>;
