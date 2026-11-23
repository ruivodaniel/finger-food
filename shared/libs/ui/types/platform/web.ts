// ============================================================
// THE WEB PART OF THE THEME
// What only a browser has: the cursor, the scrollbar, the focus outline,
// and the web's layout regions. Inferred from the theme schema.
// `hover`, the web-only state, is in axes.ts with the other states.
// ============================================================
import type { z } from 'zod';
import type * as S from '../schema/theme';
import type * as K from '../schema/tokens';

/** the token keys only the web has, wherever they appear in a surface */
export const WEB_ONLY_TOKEN_KEYS = ["cursor", "scrollbar", "outline"] as const;
export type WebOnlyTokenKey = (typeof WEB_ONLY_TOKEN_KEYS)[number];

export type CursorToken = z.infer<typeof K.CursorToken>;
export type OutlineTokens = z.infer<K.Tokens['OutlineTokens']>;
export type ScrollbarTokens = z.infer<K.Tokens['ScrollbarTokens']>;

// ── Layout regions: a region carries layout="…" in the DOM; camelCase here, kebab-case there ──
export type HeightScaleEntry = z.infer<typeof S.HeightScaleEntry>;
export type WidthScaleEntry = z.infer<typeof S.WidthScaleEntry>;
export type HeaderScaleTokens = z.infer<typeof S.HeaderScaleTokens>;
export type LeftSidebarTokens = z.infer<typeof S.LeftSidebarTokens>;
export type SidebarTokens = z.infer<typeof S.SidebarTokens>;
export type ContainerScaleEntry = z.infer<typeof S.ContainerScaleEntry>;
export type ContainerTokens = z.infer<typeof S.ContainerTokens>;
export type DialogScaleEntry = z.infer<typeof S.DialogScaleEntry>;
export type SheetScaleEntry = z.infer<typeof S.SheetScaleEntry>;
export type DialogScaleTokens = z.infer<typeof S.DialogScaleTokens>;
export type SheetScaleTokens = z.infer<typeof S.SheetScaleTokens>;
export type ThemeLayouts = z.infer<typeof S.ThemeLayouts>;
