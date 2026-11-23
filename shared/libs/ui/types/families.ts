// ============================================================
// TOKEN SHAPES — a surface, and each morphological family
// Inferred from the theme schema (schema/tokens.ts): the schema is the source.
// ============================================================
import type { z } from 'zod';
import type * as S from './schema/tokens';
import type { Tokens } from './schema/tokens';
import type { Emphasis, Status, Sibling, Scale } from './axes';

export type SeparatorDimension = z.infer<typeof S.SeparatorDimension>;
export type ChildAlignValue = z.infer<typeof S.ChildAlignValue>;

// ── Foundational ─────────────────────────────────────────────
export type AnimationTokens = z.infer<Tokens['AnimationTokens']>;
export type BorderSideTokens = z.infer<Tokens['BorderSideTokens']>;
export type BorderTokens = z.infer<Tokens['BorderTokens']>;
export type RadiusTokens = z.infer<Tokens['RadiusTokens']>;
export type MarginTokens = z.infer<Tokens['MarginTokens']>;
export type BoundaryTokens = z.infer<Tokens['BoundaryTokens']>;
export type PaddingTokens = z.infer<Tokens['PaddingTokens']>;
export type GapTokens = z.infer<Tokens['GapTokens']>;
export type GradientStop = z.infer<Tokens['GradientStop']>;
export type GradientLayer = z.infer<Tokens['GradientLayer']>;
export type GradientDef = z.infer<Tokens['GradientDef']>;
export type ChildAlignTokens = z.infer<Tokens['ChildAlignTokens']>;
export type InteriorTokens = z.infer<Tokens['InteriorTokens']>;
export type TypographyTokens = z.infer<Tokens['TypographyTokens']>;
export type TransitionTokens = z.infer<Tokens['TransitionTokens']>;
export type DimensionPositionTokens = z.infer<Tokens['DimensionPositionTokens']>;
export type InteriorChildrenTokens = Pick<InteriorTokens, 'gap' | 'separator' | 'childAlign'>;
export type InteriorSelfTokens = Omit<InteriorTokens, keyof InteriorChildrenTokens>;

// ── Surface container — the universal base ───────────────────
export type SurfaceContainerTokens = z.infer<Tokens['SurfaceContainerTokens']>;
export type PartialSurfaceTokens = z.infer<Tokens['PartialSurfaceTokens']>;
export type StateKey = z.infer<Tokens['StateKey']>;
export type CombinedWhere = z.infer<Tokens['CombinedWhere']>;
export type CombinedEntry = z.infer<Tokens['CombinedEntry']>;
export type StatusKey = Status;
export type EmphasisKey = Emphasis;
/** the theme key stays `position` (authored in themes); the type is the sibling order */
export type PositionKey = Sibling;

// ── Separator and the families ───────────────────────────────
export type SeparatorTokens = z.infer<Tokens['SeparatorTokens']>;
export type OverlayTokens = z.infer<Tokens['OverlayTokens']>;
export type ElevatedOverlayTokens = z.infer<Tokens['ElevatedOverlayTokens']>;
export type ListContainerTokens = z.infer<Tokens['ListContainerTokens']>;
export type InteractiveControlTokens = z.infer<Tokens['InteractiveControlTokens']>;
export type SwitchTokens = z.infer<Tokens['SwitchTokens']>;
export type InteractiveControlGroupTokens = z.infer<Tokens['InteractiveControlGroupTokens']>;
export type FieldTokens = z.infer<Tokens['FieldTokens']>;
export type InlineSurfaceTokens = z.infer<Tokens['InlineSurfaceTokens']>;
export type ShapeTokens = z.infer<Tokens['ShapeTokens']>;
export type MediaTokens = z.infer<Tokens['MediaTokens']>;

// ── Size variants ────────────────────────────────────────────
export type SizeToken = Scale;
export type IconSizeRef = z.infer<Tokens['IconSizeRef']>;
export type SizeEntry = z.infer<Tokens['SizeEntry']>;
export type SizeTokens = z.infer<Tokens['SizeTokens']>;
export type FamilySizes = { sizes?: SizeTokens };

// ── Collected L2 defaults ────────────────────────────────────
export type MorphologicalFamilies = z.infer<Tokens['MorphologicalFamilies']>;
