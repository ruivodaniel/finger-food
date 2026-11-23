// ============================================================
// THE NATIVE THEME — what the mobile theme engine emits
// ============================================================
//
// The web engine turns a theme into CSS and lets the browser resolve the
// cascade. React Native has no CSS and no cascade, so this engine emits the
// same rules as DATA: per element, a list of fragments already in the order
// the cascade would apply them. A component asks for its element with its
// axes; the runtime keeps the fragments that match and merges them in order.
//
// Colours stay as references in the fragments and are resolved through the
// palette of the active mode, so one set of fragments serves light and dark.

import type { Emphasis, MobileState, Sibling, Scale, Status } from '../../types/axes';
import type { MobileElementKey } from '../../types/elements';
import type { SafeAreaEdge } from '../../types/platform/mobile';

/** a colour as the theme names it: a palette key, a raw colour, or one of the three the runtime resolves */
export type NativeColorRef = string;   // palette key · "#hex" · "rgb(…)" · "tint" · "smart-bw" · "transparent" · "currentColor"

export type NativeViewStyle = Record<string, number | string>;
export type NativeTextStyle = Record<string, number | string>;

export type FragmentWhen = {
  emphasis?: Emphasis;
  status?: Status;
  /** "default" = no state is on */
  state?: MobileState | 'default';
  scale?: Scale;
  position?: Sibling;
};

/** One rule of the cascade, as data. */
export type Fragment = {
  /** the axes it needs; absent = always */
  when?: FragmentWhen;
  /** the composition colours: resolved together at the end (see runtime `compose`) */
  vars?: { bg?: NativeColorRef; bgAlpha?: number; fg?: NativeColorRef; tint?: NativeColorRef; borderColor?: NativeColorRef };
  /** style keys of the container, already in React Native's units */
  view?: NativeViewStyle;
  /** style keys of the container whose value is a colour reference */
  viewColors?: Record<string, NativeColorRef>;
  /** style keys of the text inside */
  text?: NativeTextStyle;
  /** the name of a shadow of the mode (`modes[mode].shadows`) */
  shadow?: string;
  icon?: { size?: number; weight?: number };
};

export type ElementExtras = {
  placeholderColor?: NativeColorRef;
  placeholderOpacity?: number;
  caretColor?: NativeColorRef;
  obfuscationCharacter?: string;
  scrimColor?: NativeColorRef;
  scrimOpacity?: number;
  objectFit?: string;
  aspectRatio?: string;
  separatorHeight?: number | string;
  separatorWidth?: number | string;
};

export type NativeElement = {
  family: string;
  /** family rules then element rules, sorted the way the cascade applies them */
  fragments: Fragment[];
  /** the surfaces inside the element: startIcon, endIcon, row, separator, track, thumb */
  parts?: Record<string, Fragment[]>;
  extras?: ElementExtras;
};

export type NativeRegion = {
  fragments: Fragment[];
  height?: number | string;
  width?: number | string;
  sizes?: Partial<Record<'sm' | 'md' | 'lg', { height: number | string }>>;
  safeArea?: readonly SafeAreaEdge[];
};

export type NativeTypographyLevel = {
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  lineHeight: number;
  fontStyle: 'normal' | 'italic';
  letterSpacing?: number;
};

export type NativeMode = {
  /** every colour the theme can name, resolved */
  palette: Record<string, string>;
  /** every named effect as a box shadow */
  shadows: Record<string, string>;
};

export type NativeTheme = {
  id: string;
  name: string;
  version?: number;
  platform: 'mobile';

  modes: Record<string, NativeMode>;

  spacing: Record<string, number>;
  radius: Record<string, number>;
  borderWidths: Record<string, number>;
  typography: { fonts: Record<string, string>; types: Record<string, NativeTypographyLevel> };
  icons?: { set: string; sizes: Record<string, number>; weight: number };
  transitions: { duration: Record<string, number>; timing: Record<string, string> };

  elements: Partial<Record<MobileElementKey, NativeElement>>;
  layouts: Record<string, NativeRegion>;
  dialog?: Record<string, { maxWidth: number | string }>;
  sheet?: Record<string, { size: number | string }>;

  press: { opacityDim: number; ripple: { color: NativeColorRef; borderless: boolean } };

  /** what the theme authors that this engine does not emit yet — never dropped silently */
  unsupported: string[];
};
