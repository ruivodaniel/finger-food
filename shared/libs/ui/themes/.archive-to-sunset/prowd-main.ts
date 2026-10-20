import type { Theme } from '../../types';

export const prowdMainTheme: Theme = {
  id: 'prowd-main',
  name: 'Prowd Main',
  modes: {
    colorScheme: {
      light: {
        background: 'main-white',
        foreground: 'main-black',
        derivation: {
          brandLightAmount: 74,
          brandDarkAmount: 20,
          statusLightAmount: 74,
          statusDarkAmount: 20,
          grayColorMixPercentage: '5%',
          flatSaturationAdjust: 0,
        },
      },
      dark: {
        background: 'main-black',
        foreground: 'main-white',
        derivation: {
          brandLightAmount: 54,
          brandDarkAmount: 80,
          statusLightAmount: 54,
          statusDarkAmount: 20,
          grayColorMixPercentage: '4%',
          flatSaturationAdjust: 0,
        },
      },
      lowContrastLight: {
        background: 'gray-pure-300',
        foreground: 'gray-pure-500',
        derivation: {
          brandLightAmount: 74,
          brandDarkAmount: 20,
          statusLightAmount: 74,
          statusDarkAmount: 20,
          grayColorMixPercentage: '5%',
          flatSaturationAdjust: 0,
        },
      },
      lowContrastDark: {
        background: 'gray-pure-500',
        foreground: 'gray-pure-300',
        derivation: {
          brandLightAmount: 74,
          brandDarkAmount: 20,
          statusLightAmount: 74,
          statusDarkAmount: 20,
          grayColorMixPercentage: '5%',
          flatSaturationAdjust: 0,
        },
      },
    },
    density: 'default',
    textSize: 'default',
  },
  colors: {
    main: { white: '#ffffff', black: '#1a1a1a' },
    brand: {
      '1': '#3b82f6',
      '2': '#8b5cf6',
      '3': '#ec4899',
      '4': '#f97316',
    },
    flat: {
      red: '#ef4444',
      orange: '#f97316',
      yellow: '#eab308',
      lime: '#84cc16',
      green: '#22c55e',
      mint: '#10b981',
      turquoise: '#14b8a6',
      blue: '#3b82f6',
      violet: '#6366f1',
      purple: '#a855f7',
      pink: '#ec4899',
    },
    status: {
      success: 'flat-green',
      info: 'brand-1',
      warning: 'flat-yellow',
      error: 'flat-red',
    },
    semanticTokens: {
      primary: 'brand-1',
      secondary: 'brand-2',
      accent: 'gray-300',
      muted: 'gray-200',
    },
  },
  typography: {
    fonts: {
      primary: 'Inter',
      secondary: 'Inter',
      quote: 'DM Serif Display',
      monoPrimary: 'JetBrains Mono',
      monoSecondary: 'JetBrains Mono',
    },
    fontSources: {
      'Inter': {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
      },
      'DM Serif Display': {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap',
      },
      'JetBrains Mono': {
        type: 'google',
        url: 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap',
      },
    },
    types: {
      heading1: {
        fontFamily: 'primary',
        fontStyle: 'normal',
        fontSizeMobile: 36,
        fontSizeDesktop: 56,
        fontWeight: 800,
        lineHeight: 1.05,
        letterSpacing: '-0.02em',
      },
      heading2: {
        fontFamily: 'primary',
        fontStyle: 'normal',
        fontSizeMobile: 28,
        fontSizeDesktop: 40,
        fontWeight: 700,
        lineHeight: 1.1,
        letterSpacing: '-0.02em',
      },
      heading3: {
        fontFamily: 'primary',
        fontStyle: 'normal',
        fontSizeMobile: 22,
        fontSizeDesktop: 30,
        fontWeight: 700,
        lineHeight: 1.2,
      },
      heading4: {
        fontFamily: 'primary',
        fontStyle: 'normal',
        fontSizeMobile: 18,
        fontSizeDesktop: 22,
        fontWeight: 600,
        lineHeight: 1.25,
      },
      bodyExtraLarge: {
        fontFamily: 'secondary',
        fontStyle: 'normal',
        fontSizeMobile: 18,
        fontSizeDesktop: 20,
        fontWeight: 500,
        lineHeight: 1.6,
      },
      bodyLarge: {
        fontFamily: 'secondary',
        fontStyle: 'normal',
        fontSizeMobile: 16,
        fontSizeDesktop: 18,
        fontWeight: 500,
        lineHeight: 1.6,
      },
      body: {
        fontFamily: 'secondary',
        fontStyle: 'normal',
        fontSizeMobile: 14,
        fontSizeDesktop: 16,
        fontWeight: 400,
        lineHeight: 1.6,
      },
      bodySmall: {
        fontFamily: 'secondary',
        fontStyle: 'normal',
        fontSizeMobile: 13,
        fontSizeDesktop: 14,
        fontWeight: 400,
        lineHeight: 1.55,
      },
      bodyExtraSmall: {
        fontFamily: 'secondary',
        fontStyle: 'normal',
        fontSizeMobile: 12,
        fontSizeDesktop: 12,
        fontWeight: 400,
        lineHeight: 1.45,
      },
      quoteLarge: {
        fontFamily: 'quote',
        fontStyle: 'italic',
        fontSizeMobile: 20,
        fontSizeDesktop: 24,
        fontWeight: 400,
        lineHeight: 1.7,
        letterSpacing: '-0.01em',
      },
      quote: {
        fontFamily: 'quote',
        fontStyle: 'italic',
        fontSizeMobile: 16,
        fontSizeDesktop: 18,
        fontWeight: 400,
        lineHeight: 1.7,
        letterSpacing: '-0.01em',
      },
      quoteSmall: {
        fontFamily: 'quote',
        fontStyle: 'italic',
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 400,
        lineHeight: 1.6,
      },
      code: {
        fontFamily: 'monoPrimary',
        fontStyle: 'normal',
        fontSizeMobile: 13,
        fontSizeDesktop: 14,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      numbersExtraLarge: {
        fontFamily: 'monoSecondary',
        fontStyle: 'normal',
        fontSizeMobile: 32,
        fontSizeDesktop: 44,
        fontWeight: 700,
        lineHeight: 1.1,
      },
      numbersLarge: {
        fontFamily: 'monoSecondary',
        fontStyle: 'normal',
        fontSizeMobile: 22,
        fontSizeDesktop: 28,
        fontWeight: 600,
        lineHeight: 1.2,
      },
      numbers: {
        fontFamily: 'monoSecondary',
        fontStyle: 'normal',
        fontSizeMobile: 14,
        fontSizeDesktop: 16,
        fontWeight: 500,
        lineHeight: 1.5,
      },
      numbersSmall: {
        fontFamily: 'monoSecondary',
        fontStyle: 'normal',
        fontSizeMobile: 12,
        fontSizeDesktop: 13,
        fontWeight: 500,
        lineHeight: 1.45,
      },
      numbersExtraSmall: {
        fontFamily: 'monoSecondary',
        fontStyle: 'normal',
        fontSizeMobile: 11,
        fontSizeDesktop: 11,
        fontWeight: 400,
        lineHeight: 1.4,
      },
      link: {
        fontFamily: 'primary',
        fontStyle: 'normal',
        fontSizeMobile: 16,
        fontSizeDesktop: 16,
        fontWeight: 500,
        lineHeight: 1.5,
        letterSpacing: '-0.01em',
      },
    },
  },
  spacing: { unit: 1 },
  radius: {
    none: '0px',
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },
  effects: {
    none: [],
    xs: [
      { type: 'drop-shadow', x: 0, y: 1, blur: 1, color: 'main-black', opacity: 0.06 },
    ],
    sm: [
      { type: 'drop-shadow', x: 0, y: 1, blur: 2, color: 'main-black', opacity: 0.08 },
      { type: 'drop-shadow', x: 0, y: 1, blur: 1, color: 'main-black', opacity: 0.06 },
    ],
    md: [
      { type: 'drop-shadow', x: 0, y: 6, blur: 16, color: 'main-black', opacity: 0.12 },
      { type: 'drop-shadow', x: 0, y: 2, blur: 4, color: 'main-black', opacity: 0.08 },
    ],
    lg: [
      { type: 'drop-shadow', x: 0, y: 12, blur: 28, color: 'main-black', opacity: 0.18 },
      { type: 'drop-shadow', x: 0, y: 4, blur: 8, color: 'main-black', opacity: 0.1 },
    ],
    xl: [
      { type: 'drop-shadow', x: 0, y: 24, blur: 48, color: 'main-black', opacity: 0.22 },
      { type: 'drop-shadow', x: 0, y: 8, blur: 16, color: 'main-black', opacity: 0.12 },
    ],
  },
  transitions: {
    duration: {
      extraFast: '50ms',
      fast: '100ms',
      average: '200ms',
      slow: '300ms',
      extraSlow: '500ms',
    },
    timing: {
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      linear: 'linear',
    },
  },
  borderWidths: {
    none: '0px',
    extraThin: '0.5px',
    thin: '1px',
    default: '2px',
    thick: '4px',
    extraThick: '6px',
  },
  icons: {
    set: 'lucide',
    sizes: { xs: 12, sm: 14, md: 16, lg: 20, xl: 24 },
    weight: 2,
  },
  // ===========================================================================
  // L2 — Family Defaults
  // ===========================================================================
  layouts: {
    surface: { interior: {
      gap: { all: 'md' },
      padding: { all: 'md' },
    }},
    pageHeader: {
      height: '56px',
      sm: { height: '48px' },
      md: { height: '56px' },
      lg: { height: '72px' },
    },
    mainHeader: {
      height: '48px',
      sm: { height: '40px' },
      md: { height: '48px' },
      lg: { height: '64px' },
    },
    leftSidebar: {
      width: '280px',
      widthCollapsed: '56px',
      sm: { width: '200px' },
      md: { width: '280px' },
      lg: { width: '360px' },
    },
    rightSidebar: {
      width: '320px',
      sm: { width: '280px' },
      md: { width: '320px' },
      lg: { width: '480px' },
    },
    contextPanel: {
      width: '240px',
      sm: { width: '200px' },
      md: { width: '240px' },
      lg: { width: '320px' },
    },
    container: {
      xs: { maxWidth: '480px' },
      sm: { maxWidth: '640px' },
      md: { maxWidth: '860px' },
      lg: { maxWidth: '1120px' },
      xl: { maxWidth: '1400px' },
    },
  },
  families: {
    surfaceContainer: {
      boundary: {
        border: { width: 'thin', style: 'solid', color: 'gray-pure-200' },
        radius: { all: 'lg' },
        effect: 'sm',
      },
      interior: {
        padding: { x: 'md', y: 'sm' },
        gap: { all: 'xl' },
        separator: 'none',
      },
    },
    elevatedOverlay: {
      surface: {
        boundary: {
          radius: { all: 'lg' },
          effect: 'md',
        },
        interior: { background: 'gray-50' },
      },
      overlay: { scrimOpacity: 0.5 },
    },
    listContainer: {
      surface: {
        boundary: {
          border: { width: 'none' },
          radius: { all: 'none' },
          effect: 'none',
        },
        interior: {
          padding: { all: 'none' },
          gap: { all: 'sm' },
        },
      },
      row: {
        interior: { padding: { x: 'md', y: 'sm' } },
      },
      separator: {
        height: '1px',
        surface: {
          interior: { background: 'gray-pure-200' },
        },
      },
    },
    interactiveControl: {
      surface: {
        boundary: {
          radius: { all: 'md' },
          effect: 'none',
        },
        interior: {
          padding: { x: 'md', y: 'sm' },
        },
        cursor: 'pointer',
        combined: [
          { where: { state: 'disabled' }, partialSurface: { interior: { opacity: 0.5 } } },
          { where: { state: 'focus' }, partialSurface: { boundary: { outline: { color: 'brand-1' } } } },
          { where: { state: 'hover' }, partialSurface: { interior: { backgroundAlpha: 0.85 } } },
          { where: { state: 'selected' }, partialSurface: { interior: { background: 'brand-1', foreground: 'smart-bw' }, boundary: { border: { color: 'brand-1' } } } },
          { where: { status: 'warning' }, partialSurface: { tint: 'status-warning' } },
          { where: { status: 'error' }, partialSurface: { tint: 'status-error' } },
          { where: { status: 'success' }, partialSurface: { tint: 'status-success' } },
          { where: { status: 'info' }, partialSurface: { tint: 'status-info' } },
          { where: { emphasis: 'primary' }, partialSurface: { tint: 'primary', interior: { background: 'tint', foreground: 'smart-bw' }, boundary: { border: { color: 'transparent' } } } },
          { where: { emphasis: 'secondary' }, partialSurface: { tint: 'primary', interior: { background: 'transparent', foreground: 'tint' }, boundary: { border: { width: 'none' }, effect: 'none' } } },
          { where: { emphasis: 'tertiary' }, partialSurface: { tint: 'primary', interior: { background: 'transparent', backgroundAlpha: 0, foreground: 'gray-500' }, boundary: { border: { width: 'none' }, effect: 'none' } } },
          { where: { emphasis: 'quiet' }, partialSurface: { tint: 'primary', interior: { background: 'transparent', backgroundAlpha: 0, foreground: 'tint' }, boundary: { border: { width: 'none' }, effect: 'none' }, defaultTypography: { textDecoration: 'underline' } } },
        ],
      },
    },
    interactiveControlGroup: {
      surface: {
        interior: { gap: { all: 'sm' } },
      },
    },
    field: {
      surface: {
        boundary: {
          border: { width: 'thin' },
          radius: { all: 'md' },
          effect: 'none',
        },
        interior: {
          background: 'main-white',
          padding: { x: 'md', y: 'sm' },
        },
        combined: [
          { where: { state: 'focus' }, partialSurface: { boundary: { outline: { color: 'brand-1' } } } },
          { where: { state: 'disabled' }, partialSurface: { interior: { background: 'gray-100', opacity: 0.6 } } },
          { where: { status: 'error' }, partialSurface: { boundary: { border: { color: 'status-error' } } } },
          { where: { status: 'warning' }, partialSurface: { boundary: { border: { color: 'status-warning' } } } },
          { where: { status: 'success' }, partialSurface: { boundary: { border: { color: 'status-success' } } } },
        ],
      },
      placeholderColor: 'gray-400',
      placeholderOpacity: 0.8,
      caretColor: 'brand-1',
      obfuscation: {
        character: '•',
        letterSpacing: '0.2em',
      },
    },
    shape: {
      surface: {
        interior: { foreground: 'currentColor' },
      },
    },
    media: {
      surface: {
        boundary: { radius: { all: 'md' } },
      },
      objectFit: 'cover',
    },
  },

  // ===========================================================================
  // L3 — Element Overrides (sparse — only what differs from family)
  // ===========================================================================

  elements: {
    // ── Surface Containers ────────────────────────────────────
    card: {
      boundary: {
        border: { width: 'thin', style: 'solid', color: 'gray-pure-200' },
        radius: { all: 'xl' },
        effect: 'md',
      },
      interior: {
        background: 'main-white',
        padding: { x: 'lg', y: 'md' },
        gap: { all: 'sm' },
      },
    },
    panel: {
      boundary: { radius: { all: 'none' }, effect: 'none' },
      interior: { padding: { all: 'none' }, gap: { all: 'none' } },
    },
    page: {
      interior: {
        background: 'brand-1-gray-100',
        padding: { x: 'lg', y: 'lg' },
        gap: { all: 'lg' },
      },
      boundary: { radius: { all: 'none' } },
    },
    pageSidebar: {
      boundary: {
        border: { right: { width: 'thin', style: 'solid' } },
        radius: { all: 'none' },
        effect: 'none',
      },
      interior: { padding: { all: 'md' } },
    },
    section: {
      boundary: { border: { width: 'none' }, radius: { all: 'none' }, effect: 'none' },
      interior: { padding: { all: 'none' } },
    },
    alert: {
      boundary: {
        radius: { all: 'md' },
        border: { width: 'thin', style: 'solid', color: 'brand-1' },
      },
      interior: {
        background: 'brand-1-light',
        padding: { x: 'md', y: 'sm' },
      },
      combined: [
        { where: { status: 'warning' }, partialSurface: { interior: { background: 'gray-50' }, boundary: { border: { color: 'status-warning' } } } },
        { where: { status: 'error' }, partialSurface: { interior: { background: 'status-error-light' }, boundary: { border: { color: 'status-error' } } } },
        { where: { status: 'success' }, partialSurface: { interior: { background: 'status-success-light' }, boundary: { border: { color: 'status-success' } } } },
        { where: { status: 'info' }, partialSurface: { interior: { background: 'brand-1-light' }, boundary: { border: { color: 'brand-1' } } } },
      ],
    },
    tile: {
      boundary: { border: { width: 'thin', style: 'solid', color: 'brand-1'}, radius: { all: 'md' }, effect: 'none' },
      interior: { background: 'transparent', padding: { all: 'xs' }, gap: { all: 'sm' } },
      combined: [
        { where: { state: 'selected' }, partialSurface: { interior: { background: 'brand-4-light', foreground: 'brand-4' }, boundary: { border: { width: 'none' } } } },
      ],
    },
    progress: {
      surface: {
        boundary: { border: { width: 'none' }, radius: { all: 'full' }, effect: 'none' },
        interior: { background: 'gray-200', padding: { all: 'none' } },
      },
    },
    spinner: {
      surface: {
        boundary: { border: { width: 'none' }, radius: { all: 'full' }, effect: 'none' },
        interior: { foreground: 'brand-1', padding: { all: 'none' } },
      },
    },
    skeleton: {
      surface: {
        boundary: { border: { width: 'none' }, radius: { all: 'md' }, effect: 'none' },
        interior: { background: 'gray-100', padding: { all: 'none' } },
      },
    },
    emptyState: {
      surface: {
        boundary: { border: { width: 'thin', style: 'dashed', color: 'gray-pure-200' }, radius: { all: 'lg' } },
        interior: { background: 'transparent', padding: { x: 'xl', y: 'xl' }, foreground: 'gray-500', gap: { all: 'md' } },
      },
    },
    badge: {
      surface: {
        boundary: { radius: { all: 'sm' }, border: { width: 'none' } },
        interior: {
          background: 'brand-1-light',
          foreground: 'brand-1',
          padding: { all: 'none', x: 'md', y: 'md' },
        },
        combined: [
          { where: { emphasis: 'tertiary' }, partialSurface: { interior: { background: 'transparent', foreground: 'brand-1', padding: { all: 'none', x: 'md', y: 'md' } }, boundary: { radius: { all: 'none' } } } },
          { where: { emphasis: 'quiet' }, partialSurface: { interior: { background: 'transparent', padding: { all: 'none', x: 'md', y: 'md' } } } },
          { where: { status: 'success' }, partialSurface: { interior: { background: 'status-success-light', foreground: 'status-success' } } },
          { where: { status: 'error' }, partialSurface: { interior: { background: 'status-error-light', foreground: 'status-error' } } },
          { where: { status: 'warning' }, partialSurface: { interior: { background: 'status-warning-light', foreground: 'status-warning' } } },
          { where: { status: 'info' }, partialSurface: { interior: { background: 'brand-1-light', foreground: 'brand-1', padding: { x: 'md', y: 'md' } } } },
        ],
      },
      sizes: {
        xs: { partialSurface: { interior: { padding: { all: 'none', x: 'xs', y: 'xs' } }, defaultTypography: { typographyType: 'bodyExtraSmall' } } },
        sm: { partialSurface: { interior: { padding: { all: 'none', x: 'sm', y: 'xs' } }, defaultTypography: { typographyType: 'bodyExtraSmall' } } },
        md: { partialSurface: { interior: { padding: { all: 'none', x: 'sm', y: 'xs' } }, defaultTypography: { typographyType: 'bodySmall' } } },
        lg: { partialSurface: { interior: { padding: { all: 'none', x: 'md', y: 'xs' } }, defaultTypography: { typographyType: 'body' } } },
        xl: { partialSurface: { interior: { padding: { all: 'none', x: 'md', y: 'sm' } }, defaultTypography: { typographyType: 'bodyLarge' } } },
      },
    },
    avatar: {
      surface: {
        boundary: { radius: { all: 'full' }, border: { width: 'none' } },
        interior: { background: 'gray-200', foreground: 'gray-600' },
      },
    },
    header: {
      boundary: { border: { bottom: { width: 'thin', style: 'solid' } } },
      interior: { padding: { x: 'md', y: 'sm' }, gap: { all: 'sm' } },
    },
    content: {
      interior: { padding: { x: 'md', y: 'md' }, gap: { all: 'md' } },
    },
    // v3: tab panels borrowed surface--content before they got their own identity; same tokens, unrevised
    tabPanel: {
      interior: { padding: { x: 'md', y: 'md' }, gap: { all: 'md' } },
    },
    // v3: these nodes carried element="type--body-small" before they got their own identity; same typography, unrevised
    label: { defaultTypography: { typographyType: 'bodySmall' } },
    fieldDescription: { defaultTypography: { typographyType: 'bodySmall' } },
    fieldMessage: { defaultTypography: { typographyType: 'bodySmall' } },
    buttonGroupText: { defaultTypography: { typographyType: 'bodySmall' } },
    breadcrumbItem: { surface: { defaultTypography: { typographyType: 'bodySmall' } } },
    footer: {
      boundary: { border: { top: { width: 'thin', style: 'solid' } } },
      interior: { padding: { x: 'md', y: 'sm' }, gap: { all: 'md' } },
    },

    // ── Elevated Overlays ─────────────────────────────────────
    dialog: {
      surface: {
        boundary: { radius: { all: 'lg' }, effect: 'lg', border: { width: 'thin' } },
        interior: { background: 'main-white', padding: { x: 'lg', y: 'lg' } },
      },
      overlay: { scrimOpacity: 0.5 },
    },
    popover: {
      surface: {
        boundary: { radius: { all: 'md' }, effect: 'md', border: { width: 'thin' } },
        interior: { background: 'main-white', padding: { all: 'md' } },
      },
    },
    tooltip: {
      surface: {
        boundary: { radius: { all: 'md' }, effect: 'md', border: { width: 'none' } },
        interior: { background: 'gray-900', foreground: 'main-white', padding: { x: 'sm', y: 'xs' } },
        defaultTypography: { typographyType: 'bodySmall' },
      },
    },
    toast: {
      surface: {
        boundary: { radius: { all: 'md' }, effect: 'md', border: { width: 'thin' } },
        interior: { background: 'main-white', padding: { x: 'md', y: 'sm' } },
        combined: [
          { where: { status: 'success' }, partialSurface: { boundary: { border: { color: 'status-success' } }, interior: { background: 'status-success-light' } } },
          { where: { status: 'error' }, partialSurface: { boundary: { border: { color: 'status-error' } }, interior: { background: 'status-error-light' } } },
          { where: { status: 'warning' }, partialSurface: { boundary: { border: { color: 'status-warning' } }, interior: { background: 'status-warning-light' } } },
          { where: { status: 'info' }, partialSurface: { boundary: { border: { color: 'brand-1' } }, interior: { background: 'brand-1-light' } } },
        ],
      },
    },
    sheet: {
      surface: {
        boundary: { radius: { all: 'lg' }, effect: 'lg' },
        interior: { background: 'main-white' },
      },
      overlay: { scrimOpacity: 0.5 },
    },
    alertDialog: {
      surface: {
        boundary: { radius: { all: 'lg' }, effect: 'lg' },
        interior: { background: 'main-white', padding: { x: 'lg', y: 'lg' }, gap: { all: 'md' } },
        combined: [
          { where: { status: 'destructive' }, partialSurface: { boundary: { border: { color: 'status-error' } } } },
        ],
      },
      overlay: { scrimOpacity: 0.5 },
    },
    hoverCard: {
      surface: {
        boundary: { radius: { all: 'md' }, effect: 'md' },
        interior: { background: 'main-white', padding: { x: 'md', y: 'sm' } },
      },
    },

    // ── Interactive Controls ──────────────────────────────────
    button: {
      surface: {
        interior: {
          foreground: 'smart-bw',
          gap: {all: 'md'}
        },
        boundary: { radius: { all: 'md' }, effect: 'none' },
      },
      sizes: {
        xs: { partialSurface: { interior: { padding: { x: 'xs', y: 'xs' } }, defaultTypography: { typographyType: 'bodyExtraSmall' } }, icon: { size: 'xs' } },
        sm: { partialSurface: { interior: { padding: { x: 'sm', y: 'xs' } }, defaultTypography: { typographyType: 'bodySmall' } }, icon: { size: 'sm' } },
        md: { partialSurface: { interior: { padding: { x: 'md', y: 'sm' } }, defaultTypography: { typographyType: 'body' } }, icon: { size: 'md' } },
        lg: { partialSurface: { interior: { padding: { x: 'lg', y: 'md' } }, defaultTypography: { typographyType: 'bodyLarge' } }, icon: { size: 'lg' } },
        xl: { partialSurface: { interior: { padding: { x: 'xl', y: 'lg' } }, defaultTypography: { typographyType: 'bodyExtraLarge' } }, icon: { size: 'xl' } },
      },
      startIcon: {
        interior: { background: 'foreground', backgroundAlpha: 0.1, padding: {right: 'sm'} },
        smartBleed: 'border',
      },
      endIcon: {
        interior: { background: 'foreground', backgroundAlpha: 0.1, padding: {left: 'sm'} },
        smartBleed: 'border',
      },
    },
    checkbox: {
      surface: {
        boundary: { radius: { all: 'sm' }, border: { width: 'thin' } },
        interior: { background: 'main-white' },
        combined: [
          { where: { state: 'selected' }, partialSurface: { interior: { background: 'brand-1', foreground: 'main-white' }, boundary: { border: { color: 'brand-1' } } } },
        ],
      },
    },
    switch: {
      surface: {
        boundary: { radius: { all: 'full' }, border: { width: 'none' } },
        interior: { background: 'gray-300' },
        combined: [
          { where: { state: 'selected' }, partialSurface: { interior: { background: 'brand-1' } } },
        ],
      },
    },
    chip: {
      surface: {
        boundary: { radius: { all: 'full' }, border: { width: 'thin', color: 'gray-pure-200' } },
        interior: { background: 'gray-100', padding: { x: 'sm', y: 'xs' } },
        defaultTypography: { typographyType: 'bodySmall' },
      },
      sizes: {
        xs: { partialSurface: { interior: { padding: { x: 'xs', y: 'xs' } }, defaultTypography: { typographyType: 'bodyExtraSmall' } }, icon: { size: 'xs' } },
        sm: { partialSurface: { interior: { padding: { x: 'sm', y: 'xs' } }, defaultTypography: { typographyType: 'bodySmall' } }, icon: { size: 'sm' } },
        md: { partialSurface: { interior: { padding: { x: 'sm', y: 'xs' } }, defaultTypography: { typographyType: 'body' } }, icon: { size: 'md' } },
        lg: { partialSurface: { interior: { padding: { x: 'md', y: 'sm' } }, defaultTypography: { typographyType: 'bodyLarge' } }, icon: { size: 'lg' } },
        xl: { partialSurface: { interior: { padding: { x: 'lg', y: 'sm' } }, defaultTypography: { typographyType: 'bodyExtraLarge' } }, icon: { size: 'xl' } },
      },
    },
    toggle: {
      surface: {
        boundary: { radius: { all: 'md' }, border: { width: 'thin' } },
        interior: { background: 'main-white' },
        combined: [
          { where: { state: 'selected' }, partialSurface: { interior: { background: 'brand-1-light', foreground: 'brand-1' }, boundary: { border: { color: 'brand-1' } } } },
        ],
      },
    },
    radio: {
      surface: {
        boundary: { radius: { all: 'full' }, border: { width: 'thin' } },
        interior: { background: 'main-white' },
        combined: [
          { where: { state: 'selected' }, partialSurface: { interior: { background: 'brand-1', foreground: 'main-white' }, boundary: { border: { color: 'brand-1' } } } },
        ],
      },
    },
    tabTrigger: {
      surface: {
        boundary: { radius: { all: 'none' }, effect: 'none', border: { width: 'none' } },
        interior: { padding: { x: 'md', y: 'sm' }, background: 'transparent' },
        combined: [
          { where: { state: 'selected' }, partialSurface: { interior: { background: 'transparent', foreground: 'brand-1' }, boundary: { border: { width: 'none', bottom: { width: 'default', style: 'solid', color: 'brand-1' } } } } },
          { where: { state: 'hover' }, partialSurface: { interior: { background: 'transparent', foreground: 'brand-1' } }, transition: { duration: 'fast', timing: 'easeOut' } },
        ],
      },
    },
    // v3: accordion triggers borrowed control--tab-trigger before they got their own identity; same tokens, unrevised
    accordionTrigger: {
      surface: {
        boundary: { radius: { all: 'none' }, effect: 'none', border: { width: 'none' } },
        interior: { padding: { x: 'md', y: 'sm' }, background: 'transparent' },
        combined: [
          { where: { state: 'selected' }, partialSurface: { interior: { background: 'transparent', foreground: 'brand-1' }, boundary: { border: { width: 'none', bottom: { width: 'default', style: 'solid', color: 'brand-1' } } } } },
          { where: { state: 'hover' }, partialSurface: { interior: { background: 'transparent', foreground: 'brand-1' } }, transition: { duration: 'fast', timing: 'easeOut' } },
        ],
      },
    },

    // ── Interactive Control Groups ────────────────────────────
    sidebar: {
      widthExpanded: '240px',
      widthCollapsed: '56px',
      surface: {
        boundary: { border: { width: 'none', style: 'none', color: 'transparent' } },
        interior: { padding: { x: 'sm', y: 'sm' }, gap: { all: 'xs' } },
      },
    },
    tabBar: { surface: { interior: { gap: { all: 'sm' } } } },
    topbar: { surface: { interior: { gap: { all: 'sm' } } } },
    breadcrumb: { surface: { interior: { gap: { all: 'xs' } } } },
    paginationBar: { surface: { interior: { gap: { all: 'xs' } } } },
    buttonGroup: { surface: { interior: { gap: { all: 'none' } } } },
    choiceGroup: { surface: { interior: { gap: { all: 'none' } } } }, // v3: was toggleGroup; radio groups share this key now, unrevised

    // ── Fields ────────────────────────────────────────────────
    input: {
      surface: {
        boundary: { border: { width: 'thin' }, radius: { all: 'md' } },
      },
      sizes: {
        xs: { partialSurface: { interior: { padding: { x: 'xs', y: 'xs' } }, defaultTypography: { typographyType: 'bodyExtraSmall' } } },
        sm: { partialSurface: { interior: { padding: { x: 'sm', y: 'xs' } }, defaultTypography: { typographyType: 'bodySmall' } } },
        md: { partialSurface: { interior: { padding: { x: 'md', y: 'sm' } }, defaultTypography: { typographyType: 'body' } } },
        lg: { partialSurface: { interior: { padding: { x: 'md', y: 'md' } }, defaultTypography: { typographyType: 'bodyLarge' } } },
        xl: { partialSurface: { interior: { padding: { x: 'lg', y: 'md' } }, defaultTypography: { typographyType: 'bodyExtraLarge' } } },
      },
    },
    textarea: {
      surface: {
        boundary: { border: { width: 'thin' }, radius: { all: 'md' } },
      },
      sizes: {
        xs: { partialSurface: { interior: { padding: { x: 'xs', y: 'xs' } }, defaultTypography: { typographyType: 'bodyExtraSmall' } } },
        sm: { partialSurface: { interior: { padding: { x: 'sm', y: 'xs' } }, defaultTypography: { typographyType: 'bodySmall' } } },
        md: { partialSurface: { interior: { padding: { x: 'md', y: 'sm' } }, defaultTypography: { typographyType: 'body' } } },
        lg: { partialSurface: { interior: { padding: { x: 'md', y: 'md' } }, defaultTypography: { typographyType: 'bodyLarge' } } },
        xl: { partialSurface: { interior: { padding: { x: 'lg', y: 'md' } }, defaultTypography: { typographyType: 'bodyExtraLarge' } } },
      },
    },
    select: {
      surface: {
        boundary: { border: { width: 'thin' }, radius: { all: 'md' } },
      },
      sizes: {
        xs: { partialSurface: { interior: { padding: { x: 'xs', y: 'xs' } }, defaultTypography: { typographyType: 'bodyExtraSmall' } } },
        sm: { partialSurface: { interior: { padding: { x: 'sm', y: 'xs' } }, defaultTypography: { typographyType: 'bodySmall' } } },
        md: { partialSurface: { interior: { padding: { x: 'md', y: 'sm' } }, defaultTypography: { typographyType: 'body' } } },
        lg: { partialSurface: { interior: { padding: { x: 'md', y: 'md' } }, defaultTypography: { typographyType: 'bodyLarge' } } },
        xl: { partialSurface: { interior: { padding: { x: 'lg', y: 'md' } }, defaultTypography: { typographyType: 'bodyExtraLarge' } } },
      },
    },
    combobox: {
      surface: {
        boundary: { border: { width: 'thin' }, radius: { all: 'md' } },
      },
      sizes: {
        xs: { partialSurface: { interior: { padding: { x: 'xs', y: 'xs' } }, defaultTypography: { typographyType: 'bodyExtraSmall' } } },
        sm: { partialSurface: { interior: { padding: { x: 'sm', y: 'xs' } }, defaultTypography: { typographyType: 'bodySmall' } } },
        md: { partialSurface: { interior: { padding: { x: 'md', y: 'sm' } }, defaultTypography: { typographyType: 'body' } } },
        lg: { partialSurface: { interior: { padding: { x: 'md', y: 'md' } }, defaultTypography: { typographyType: 'bodyLarge' } } },
        xl: { partialSurface: { interior: { padding: { x: 'lg', y: 'md' } }, defaultTypography: { typographyType: 'bodyExtraLarge' } } },
      },
    },
    datePicker: {
      surface: {
        boundary: { border: { width: 'thin' }, radius: { all: 'md' } },
      },
      sizes: {
        xs: { partialSurface: { interior: { padding: { x: 'xs', y: 'xs' } }, defaultTypography: { typographyType: 'bodyExtraSmall' } } },
        sm: { partialSurface: { interior: { padding: { x: 'sm', y: 'xs' } }, defaultTypography: { typographyType: 'bodySmall' } } },
        md: { partialSurface: { interior: { padding: { x: 'md', y: 'sm' } }, defaultTypography: { typographyType: 'body' } } },
        lg: { partialSurface: { interior: { padding: { x: 'md', y: 'md' } }, defaultTypography: { typographyType: 'bodyLarge' } } },
        xl: { partialSurface: { interior: { padding: { x: 'lg', y: 'md' } }, defaultTypography: { typographyType: 'bodyExtraLarge' } } },
      },
    },
    multiSelect: {
      surface: {
        boundary: { border: { width: 'thin' }, radius: { all: 'md' } },
        interior: { background: 'main-white' },
      },
      sizes: {
        xs: { partialSurface: { interior: { padding: { x: 'xs', y: 'xs' } }, defaultTypography: { typographyType: 'bodyExtraSmall' } } },
        sm: { partialSurface: { interior: { padding: { x: 'sm', y: 'xs' } }, defaultTypography: { typographyType: 'bodySmall' } } },
        md: { partialSurface: { interior: { padding: { x: 'md', y: 'sm' } }, defaultTypography: { typographyType: 'body' } } },
        lg: { partialSurface: { interior: { padding: { x: 'md', y: 'md' } }, defaultTypography: { typographyType: 'bodyLarge' } } },
        xl: { partialSurface: { interior: { padding: { x: 'lg', y: 'md' } }, defaultTypography: { typographyType: 'bodyExtraLarge' } } },
      },
    },
    inputGroup: {
      surface: {
        boundary: { border: { width: 'thin' }, radius: { all: 'md' } },
        interior: { background: 'main-white', padding: { all: 'none' } },
      },
    },
    fileUpload: {
      surface: {
        boundary: { border: { width: 'thin', style: 'dashed', color: 'gray-pure-200' }, radius: { all: 'md' } },
        interior: { background: 'transparent', padding: { x: 'md', y: 'sm' }, gap: { all: 'sm' } },
      },
    },

    // ── Lists ─────────────────────────────────────────────────
    list: {},
    tableRoot: {
      boundary: { border: { width: 'none' }, radius: { all: 'none' } },
    },
    tableRow: {
      boundary: {
        border: { bottom: { width: 'extraThin', style: 'solid' } },
      },
    },
    accordion: {},
    menu: {
      surface: {
        interior: { padding: { y: 'xs' }, gap: { all: 'none' } },
      },
    },
    treeView: {
      surface: {
        interior: { gap: { all: 'none' } },
      },
    },
  },

  // ===========================================================================
  // L4 — Concept Overrides (product-specific)
  // ===========================================================================

  concepts: {
    knowledge: {
      card: {
        accent: 'brand-1',
        boundary: {
          border: { width: 'default', color: 'gray-pure-500' },
        },
        contextual: {
          header: {
            smartBleed: 'normal',
            interior: { background: 'brand-2', foreground: 'main-white', padding: {bottom: 'xl'} },
            boundary: { border: { width: 'none' }, effect: 'none' },
          },
          content: {
            smartBleed: 'normal',
            interior: { background: 'transparent' },
          }
        },
      },
    },
  },

  // ===========================================================================
  // L5 — Contextual Overrides (parent → child)
  // ===========================================================================

  contextual: {
    sidebar: {
      sidebarItem: {
        interior: { padding: { x: 'sm', y: 'xs' }, gap: { all: 'sm' } },
        boundary: { radius: { all: 'md' } },
        combined: [
          { where: { state: 'hover' }, partialSurface: { interior: { background: 'gray-100' } } },
          { where: { state: 'selected' }, partialSurface: { interior: { background: 'brand-1', foreground: 'main-white' } } },
        ],
      },
      navItemIcon: {
        interior: { foreground: 'inherit' },
      },
      navItemTitle: {
        interior: { foreground: 'inherit' },
      },
    },
    sidebar: {
      header: { interior: { padding: { x: 'sm', y: 'sm' } } },
      content: { interior: { padding: { x: 'xs', y: 'xs' } } },
      footer: { interior: { padding: { x: 'sm', y: 'xs' } } },
    },
    panel: {
      header: { interior: { padding: { y: 'sm' } } },
      content: { interior: { padding: { x: 'md', y: 'sm' } } },
      footer: { interior: { padding: { y: 'sm' } } },
    },
    card: {
      badge: { interior: { padding: { x: 'xs', y: 'xs' } } },
    },
  }
};
