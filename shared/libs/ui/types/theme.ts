// ============================================================
// THE THEME TYPE
// One type for the repo, inferred from the theme schema (schema/theme.ts): the schema is the source.
// A theme is for one platform and says which: a web theme and a mobile theme share the core and the
// shapes of every level, and each adds its own part (platform/web.ts, platform/mobile.ts).
// ============================================================
import type { z } from 'zod';
import type * as S from './schema/theme';
import type {
  MobileFamilies, MobileElementTypes, MobileConceptOverrides, MobileContextualOverrides, MobileThemeRule, MobileLayouts,
} from './platform/mobile';

/** What every theme has, whatever its platform. */
export type ThemeCore = z.infer<typeof S.ThemeCore>;

/** A theme for the web. `platform` absent means web. */
export type WebTheme = z.infer<typeof S.WebTheme>;

/** A theme for mobile: the same levels, in mobile's shapes, plus what only a phone has. */
export type MobileTheme = Omit<z.infer<typeof S.MobileTheme>, 'families' | 'elements' | 'concepts' | 'contextual' | 'rules' | 'layouts'> & {
  families: MobileFamilies;
  elements: MobileElementTypes;
  concepts?: MobileConceptOverrides;
  contextual?: MobileContextualOverrides;
  rules?: MobileThemeRule[];
  layouts?: MobileLayouts;
};

export type Theme = WebTheme | MobileTheme;
