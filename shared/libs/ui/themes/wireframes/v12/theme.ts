import type {WebTheme} from "../../../types";

// Wireframes v12 — a copy of the baseline (base v2) with one thing of its own: a surface is the foreground colour at 5% opacity
// (written on the four families that carry a surface: surface, field, control, control group).

type Block = {family?: any; elements?: Record<string, any>; contextual?: Record<string, any>};

// ── tokens ──
const tokens = {
  colors: {
    main: {white: "#ffffff", black: "#000000"},
    brand: {"1": "#000000", "2": "#666666", "3": "#999999", "4": "#cccccc"},
    status: {
      success: "content-green-soft",
      info: "content-blue-standard",
      warning: "content-orange-soft",
      error: "content-red-standard",
    },
    content: {
      tomato: {standard: "#F33500", soft: "#FFA995"},
      red: {standard: "#FC0436", soft: "#FFA6A2"},
      ruby: {standard: "#FB005B", soft: "#FFA5AE"},
      crimson: {standard: "#F90080", soft: "#FFA5BE"},
      pink: {standard: "#E700A5", soft: "#FF9BD3"},
      plum: {standard: "#B82CCC", soft: "#E699F2"},
      purple: {standard: "#9637DE", soft: "#CD9EFF"},
      violet: {standard: "#7145EB", soft: "#B1A7FF"},
      iris: {standard: "#5A4CF4", soft: "#A3ACFF"},
      indigo: {standard: "#3157FD", soft: "#94B2FF"},
      blue: {standard: "#0090FF", soft: "#9BCAFF"},
      sky: {standard: "#79E2FF", soft: "#C3F1FF"},
      cyan: {standard: "#00A2C7", soft: "#92D3E9"},
      teal: {standard: "#00A594", soft: "#92D5C9"},
      jade: {standard: "#00A582", soft: "#92D5BE"},
      green: {standard: "#00A767", soft: "#92D6AE"},
      grass: {standard: "#03AD41", soft: "#92DA9B"},
      mint: {standard: "#61F0D4", soft: "#B0FBE9"},
      lime: {standard: "#B5F200", soft: "#D6FD97"},
      yellow: {standard: "#FFE629", soft: "#FFF4A8"},
      amber: {standard: "#FFC53D", soft: "#FFE3AD"},
      orange: {standard: "#FA6800", soft: "#FFBA9B"},
      brown: {standard: "#B77B45", soft: "#E1BB9B"},
      bronze: {standard: "#A87D6B", soft: "#D7BBB0"},
      gold: {standard: "#9C825A", soft: "#CFBEA6"},
    },
    semanticTokens: {primary: "#000000", secondary: "#666666", accent: "#999999", muted: "#cccccc"},
  },
  modes: {
    colorScheme: {
      light: {background: "main-white", foreground: "main-black", derivation: {grayColorMixPercentage: "0%"}},
      dark: {
        background: "main-black",
        foreground: "main-white",
        chroma: {saturationFactor: 1, gamma: 1},
        derivation: {grayColorMixPercentage: "5%"},
      },
    },
  },
  typography: {
    fonts: {
      primary: "system-ui, -apple-system, sans-serif",
      secondary: "system-ui, -apple-system, sans-serif",
      quote: "system-ui, -apple-system, sans-serif",
      monoPrimary: "ui-monospace, Menlo, monospace",
      monoSecondary: "ui-monospace, Menlo, monospace",
    },
    types: {
      heading1: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 36,
        fontSizeDesktop: 40,
        fontWeight: 600,
        lineHeight: 1.15,
      },
      heading2: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 22,
        fontSizeDesktop: 24,
        fontWeight: 700,
        lineHeight: 1.2,
      },
      heading3: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 20,
        fontSizeDesktop: 22,
        fontWeight: 600,
        lineHeight: 1.25,
      },
      heading4: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 15,
        fontSizeDesktop: 16,
        fontWeight: 600,
        lineHeight: 1.35,
      },
      bodyExtraLarge: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 15,
        fontSizeDesktop: 18,
        fontWeight: 400,
        lineHeight: 1.55,
      },
      bodyLarge: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 400,
        lineHeight: 1.55,
      },
      body: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 14,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      bodySmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 13,
        fontWeight: 400,
        lineHeight: 1.45,
      },
      bodyExtraSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 11,
        fontSizeDesktop: 12,
        fontWeight: 400,
        lineHeight: 1.4,
      },
      quoteLarge: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 15,
        fontSizeDesktop: 18,
        fontWeight: 400,
        lineHeight: 1.6,
      },
      quote: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 400,
        lineHeight: 1.55,
      },
      quoteSmall: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 13,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      code: {
        fontFamily: "monoPrimary",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 13,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      numbersExtraLarge: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 32,
        fontSizeDesktop: 44,
        fontWeight: 700,
        lineHeight: 1,
      },
      numbersLarge: {
        fontFamily: "secondary",
        fontStyle: "normal",
        fontSizeMobile: 27,
        fontSizeDesktop: 30,
        fontWeight: 600,
        lineHeight: 1.1,
      },
      numbers: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 14,
        fontSizeDesktop: 15,
        fontWeight: 700,
        lineHeight: 1.5,
      },
      numbersSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 13,
        fontWeight: 700,
        lineHeight: 1.45,
      },
      numbersExtraSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 11,
        fontSizeDesktop: 11,
        fontWeight: 600,
        lineHeight: 1.4,
      },
      link: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 13,
        fontSizeDesktop: 15,
        fontWeight: 700,
        lineHeight: 1.5,
      },
    },
  },
  spacing: {unit: 1},
  radius: {
    none: "0px",
    "3xs": "0px",
    "2xs": "0px",
    xs: "0px",
    sm: "0px",
    md: "0px",
    lg: "0px",
    xl: "0px",
    "2xl": "0px",
    "3xl": "0px",
    full: "9999px",
  },
  borderWidths: {none: "0px", extraThin: "0.5px", thin: "1px", default: "1px", thick: "3px", extraThick: "4px"},
  effects: {card: [], sheet: [], drawer: [], popover: [], none: []},
  transitions: {
    duration: {extraFast: "50ms", fast: "100ms", average: "200ms", slow: "300ms", extraSlow: "500ms"},
    timing: {ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", linear: "linear"},
  },
  icons: {set: "lucide", sizes: {xs: 12, sm: 14, md: 16, lg: 18, xl: 22}, weight: 1.75},
};

// ── layouts and body ──
const layouts = {
  page: {surface: {interior: {padding: {all: "none"}, gap: {all: "none"}}}},
  pageHeader: {
    height: "56px",
    sm: {height: "48px"},
    md: {height: "56px"},
    lg: {height: "72px"},
    surface: {interior: {padding: {x: "xl"}}},
  },
  secondPageHeader: {
    height: "40px",
    sm: {height: "32px"},
    md: {height: "40px"},
    lg: {height: "48px"},
    surface: {interior: {padding: {x: "xl"}}},
  },
  mainHeader: {
    height: "48px",
    sm: {height: "40px"},
    md: {height: "48px"},
    lg: {height: "64px"},
    surface: {interior: {padding: {x: "lg"}}},
  },
  secondMainHeader: {
    height: "40px",
    sm: {height: "32px"},
    md: {height: "40px"},
    lg: {height: "48px"},
    surface: {interior: {padding: {x: "lg"}}},
  },
  pageLeftSidebar: {
    width: "256px",
    sm: {width: "200px"},
    md: {width: "240px"},
    lg: {width: "300px"},
  },
  pageRightSidebar: {
    width: "320px",
    sm: {width: "280px"},
    md: {width: "320px"},
    lg: {width: "420px"},
    surface: {interior: {padding: {all: "md"}}},
  },
  mainRightSidebar: {
    width: "320px",
    sm: {width: "260px"},
    md: {width: "320px"},
    lg: {width: "420px"},
    surface: {interior: {padding: {all: "md"}}},
  },
  pageFooter: {height: "56px", surface: {interior: {padding: {x: "xl"}}}},
  mainContainer: {xs: {maxWidth: "448px"}, sm: {maxWidth: "640px"}, md: {maxWidth: "940px"}, lg: {maxWidth: "1340px"}},
  dialog: {sm: {maxWidth: "480px"}, md: {maxWidth: "640px"}, lg: {maxWidth: "940px"}},
  sheet: {sm: {size: "320px"}, md: {size: "420px"}, lg: {size: "640px"}},
  section: {surface: {interior: {gap: {all: "lg"}}}},
  mainBody: {surface: {interior: {padding: {x: "2xl", y: "xl"}}}},
  scrollArea: {scrollbar: {width: "8px"}},
  shellSideNav: {breakpoints: {stack: "767px"}},
};

// ── SURFACE: the family, then its elements, then what is inside a container ──
const surface: Block = {
  family: {
    interior: {gap: {all: "md"}, background: "foreground", backgroundAlpha: 0.05},
    transition: {duration: "fast", timing: "ease"},
    combined: [
      {where: {state: "disabled"}, partialSurface: {interior: {opacity: 0.45}}},
      {where: {status: "error"}, partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"}},
      {where: {status: "success"}, partialSurface: {interior: {foreground: "status-success"}, tint: "status-success"}},
      {where: {status: "warning"}, partialSurface: {interior: {foreground: "status-warning"}, tint: "status-warning"}},
      {where: {status: "info"}, partialSurface: {interior: {foreground: "foreground"}, tint: "status-info"}},
    ],
  },
  elements: {
    label: {
      surface: {
        combined: [
          {where: {status: "error"}, partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"}},
          {
            where: {status: "destructive"},
            partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"},
          },
          {
            where: {status: "success"},
            partialSurface: {interior: {foreground: "status-success"}, tint: "status-success"},
          },
          {
            where: {status: "warning"},
            partialSurface: {interior: {foreground: "status-warning"}, tint: "status-warning"},
          },
          {where: {status: "info"}, partialSurface: {interior: {foreground: "foreground"}, tint: "status-info"}},
        ],
      },
    },
    fieldDescription: {
      surface: {
        combined: [
          {where: {status: "error"}, partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"}},
          {
            where: {status: "destructive"},
            partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"},
          },
          {
            where: {status: "success"},
            partialSurface: {interior: {foreground: "status-success"}, tint: "status-success"},
          },
          {
            where: {status: "warning"},
            partialSurface: {interior: {foreground: "status-warning"}, tint: "status-warning"},
          },
          {where: {status: "info"}, partialSurface: {interior: {foreground: "foreground"}, tint: "status-info"}},
        ],
      },
    },
    fieldMessage: {
      surface: {
        combined: [
          {where: {status: "error"}, partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"}},
          {
            where: {status: "destructive"},
            partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"},
          },
          {
            where: {status: "success"},
            partialSurface: {interior: {foreground: "status-success"}, tint: "status-success"},
          },
          {
            where: {status: "warning"},
            partialSurface: {interior: {foreground: "status-warning"}, tint: "status-warning"},
          },
          {where: {status: "info"}, partialSurface: {interior: {foreground: "foreground"}, tint: "status-info"}},
        ],
      },
    },
    card: {interior: {padding: {x: "xl", y: "xl", childrenSmartBleed: true}, gap: {all: "md"}}},
    panel: {interior: {padding: {all: "lg", childrenSmartBleed: true}, gap: {all: "none"}}},
    header: {interior: {padding: {y: "md", x: "lg"}, gap: {all: "sm"}}},
    content: {interior: {padding: {y: "md", x: "lg"}}},
    footer: {interior: {padding: {y: "sm", x: "lg"}, gap: {all: "sm"}}},
    tile: {interior: {padding: {all: "md"}, gap: {all: "xs"}}, combined: []},
    separator: {height: "1px"},
    badge: {
      surface: {
        interior: {padding: {x: "md", y: "xs"}, gap: {all: "sm"}},
        combined: [
          {where: {status: "error"}, partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"}},
          {
            where: {status: "destructive"},
            partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"},
          },
          {
            where: {status: "success"},
            partialSurface: {interior: {foreground: "status-success"}, tint: "status-success"},
          },
          {
            where: {status: "warning"},
            partialSurface: {interior: {foreground: "status-warning"}, tint: "status-warning"},
          },
          {where: {status: "info"}, partialSurface: {interior: {foreground: "foreground"}, tint: "status-info"}},
        ],
      },
      sizes: {
        "3xs": {partialSurface: {interior: {padding: {all: "none"}}, dimensionPosition: {width: "8px", height: "8px"}}},
        "2xs": {partialSurface: {interior: {padding: {x: "2xs", y: "none"}}}},
        xs: {partialSurface: {interior: {padding: {x: "md", y: "xs"}}}},
        sm: {partialSurface: {interior: {padding: {x: "md", y: "xs"}}}},
        md: {partialSurface: {interior: {padding: {x: "lg", y: "sm"}}}},
        lg: {partialSurface: {interior: {padding: {x: "lg", y: "sm"}}}},
        xl: {partialSurface: {interior: {padding: {x: "sm", y: "xs"}}}},
      },
    },
    avatar: {
      surface: {interior: {padding: {all: "none"}, childAlign: {horizontal: "center", vertical: "center"}}},
      sizes: {
        "2xs": {
          partialSurface: {interior: {padding: {all: "none"}}, dimensionPosition: {width: "20px", height: "20px"}},
        },
        xs: {partialSurface: {interior: {padding: {all: "none"}}, dimensionPosition: {width: "24px", height: "24px"}}},
        sm: {partialSurface: {interior: {padding: {all: "none"}}, dimensionPosition: {width: "32px", height: "32px"}}},
        md: {partialSurface: {interior: {padding: {all: "none"}}, dimensionPosition: {width: "40px", height: "40px"}}},
        lg: {partialSurface: {interior: {padding: {all: "none"}}, dimensionPosition: {width: "48px", height: "48px"}}},
        xl: {partialSurface: {interior: {padding: {all: "none"}}, dimensionPosition: {width: "64px", height: "64px"}}},
      },
    },
    progress: {surface: {dimensionPosition: {height: "8px"}}},
    spinner: {
      surface: {
        interior: {padding: {all: "none"}},
        combined: [
          {where: {status: "error"}, partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"}},
          {
            where: {status: "destructive"},
            partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"},
          },
          {
            where: {status: "warning"},
            partialSurface: {interior: {foreground: "status-warning"}, tint: "status-warning"},
          },
          {
            where: {status: "success"},
            partialSurface: {interior: {foreground: "status-success"}, tint: "status-success"},
          },
          {where: {status: "info"}, partialSurface: {interior: {foreground: "foreground"}, tint: "status-info"}},
        ],
      },
    },
    checkboxInner: {interior: {padding: {all: "none"}}},
    radioInner: {interior: {padding: {all: "none"}}},
    tabPanel: {interior: {padding: {x: "none", y: "md"}}},
    treeViewGroup: {surface: {interior: {padding: {left: "md"}, gap: {all: "none"}}}},
    calendar: {surface: {interior: {padding: {all: "none"}, gap: {all: "none"}}}},
    group: {surface: {interior: {padding: {all: "none"}, gap: {all: "none"}}}},
    alert: {
      surface: {
        interior: {padding: {x: "md", y: "sm"}, gap: {all: "sm"}},
        combined: [
          {where: {status: "error"}, partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"}},
          {
            where: {status: "success"},
            partialSurface: {interior: {foreground: "status-success"}, tint: "status-success"},
          },
          {
            where: {status: "warning"},
            partialSurface: {interior: {foreground: "status-warning"}, tint: "status-warning"},
          },
          {where: {status: "info"}, partialSurface: {interior: {foreground: "foreground"}, tint: "status-info"}},
        ],
      },
    },
    listDraggableGroup: {interior: {padding: {left: "xl"}, gap: {all: "xs"}}},
    otpSeparator: {surface: {interior: {padding: {x: "xs"}}}},
    inputGroupAddon: {surface: {interior: {padding: {x: "xs", y: "none"}}}},
    emptyState: {surface: {interior: {padding: {all: "xl"}, childAlign: {horizontal: "center", vertical: "center"}}}},
  },
  contextual: {accordionItem: {content: {interior: {padding: {x: "md", y: "sm"}}}}},
};

// ── CONTROL: the family, then its elements ──
const control: Block = {
  family: {
    sizes: {
      "3xs": {partialSurface: {interior: {padding: {x: "2xs", y: "3xs"}}}, icon: {size: "3xs"}},
      "2xs": {partialSurface: {interior: {padding: {x: "xs", y: "2xs"}}}, icon: {size: "2xs"}},
      xs: {partialSurface: {interior: {padding: {x: "xs", y: "xs"}}}, icon: {size: "xs"}},
      sm: {partialSurface: {interior: {padding: {x: "lg", y: "sm"}}}, icon: {size: "xs"}},
      md: {partialSurface: {interior: {padding: {x: "xl", y: "md"}}}, icon: {size: "sm"}},
      lg: {partialSurface: {interior: {padding: {x: "2xl", y: "lg"}}}, icon: {size: "md"}},
      xl: {partialSurface: {interior: {padding: {x: "xl", y: "md"}}}, icon: {size: "lg"}},
      "2xl": {partialSurface: {interior: {padding: {x: "xl", y: "md"}}}, icon: {size: "lg"}},
      "3xl": {partialSurface: {interior: {padding: {x: "xl", y: "md"}}}, icon: {size: "lg"}},
    },
    surface: {
      interior: {padding: {x: "lg", y: "sm"}, gap: {all: "sm"}, background: "foreground", backgroundAlpha: 0.05},
      combined: [
        {where: {status: "error"}, partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"}},
        {
          where: {status: "destructive"},
          partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"},
        },
        {
          where: {status: "success"},
          partialSurface: {interior: {foreground: "status-success"}, tint: "status-success"},
        },
        {
          where: {status: "warning"},
          partialSurface: {interior: {foreground: "status-warning"}, tint: "status-warning"},
        },
        {where: {status: "info"}, partialSurface: {interior: {foreground: "foreground"}, tint: "status-info"}},
        {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
        {where: {state: "active"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
        {where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
        {where: {state: "focus"}},
        {where: {state: "disabled"}, partialSurface: {interior: {opacity: 0.45}}},
        {where: {state: "loading"}, partialSurface: {interior: {opacity: 0.7}}},
      ],
    },
  },
  elements: {
    chip: {
      surface: {
        interior: {padding: {x: "sm", y: "2xs"}, gap: {all: "2xs"}},
        combined: [
          {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
          {where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
        ],
      },
      sizes: {
        xs: {partialSurface: {interior: {padding: {x: "xs", y: "3xs"}}}},
        sm: {partialSurface: {interior: {padding: {x: "xs", y: "3xs"}}}},
        md: {partialSurface: {interior: {padding: {x: "sm", y: "2xs"}}}},
        lg: {partialSurface: {interior: {padding: {x: "sm", y: "xs"}}}},
        xl: {partialSurface: {interior: {padding: {x: "md", y: "xs"}}}},
      },
    },
    button: {surface: {interior: {gap: {all: "sm"}}}},
    switch: {
      track: {
        dimensionPosition: {width: "46px", height: "26px"},
        interior: {padding: {all: "none"}},
        combined: [{where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}}],
      },
      thumb: {
        dimensionPosition: {width: "20px", height: "20px", translateX: "3px", translateY: "0px"},
        combined: [
          {
            where: {state: "selected"},
            partialSurface: {
              dimensionPosition: {translateX: "4px", translateY: "0px"},
              tint: {color: "foreground", opacity: 0.8},
            },
          },
        ],
      },
    },
    checkbox: {
      sizes: {
        xs: {partialSurface: {dimensionPosition: {width: "12px", height: "12px"}}, icon: {size: "xs"}},
        sm: {partialSurface: {dimensionPosition: {width: "14px", height: "14px"}}, icon: {size: "xs"}},
        md: {partialSurface: {dimensionPosition: {width: "16px", height: "16px"}}, icon: {size: "sm"}},
        lg: {partialSurface: {dimensionPosition: {width: "20px", height: "20px"}}, icon: {size: "md"}},
        xl: {partialSurface: {dimensionPosition: {width: "24px", height: "24px"}}, icon: {size: "lg"}},
      },
      surface: {
        interior: {padding: {all: "none"}, childAlign: {horizontal: "center", vertical: "center"}},
        dimensionPosition: {width: "20px", height: "20px"},
        combined: [{where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}}],
      },
    },
    radio: {
      sizes: {
        xs: {partialSurface: {dimensionPosition: {width: "12px", height: "12px"}}},
        sm: {partialSurface: {dimensionPosition: {width: "14px", height: "14px"}}},
        md: {partialSurface: {dimensionPosition: {width: "16px", height: "16px"}}},
        lg: {partialSurface: {dimensionPosition: {width: "20px", height: "20px"}}},
        xl: {partialSurface: {dimensionPosition: {width: "24px", height: "24px"}}},
      },
      surface: {
        interior: {padding: {all: "none"}},
        dimensionPosition: {width: "20px", height: "20px"},
        combined: [{where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}}],
      },
    },
    tabTrigger: {
      surface: {
        interior: {padding: {x: "none", y: "sm"}},
        combined: [
          {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
          {where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
        ],
      },
    },
    treeViewItem: {
      surface: {
        interior: {padding: {x: "xs", y: "2xs"}, gap: {all: "xs"}},
        combined: [
          {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
          {where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
        ],
      },
    },
    breadcrumbItem: {
      surface: {
        interior: {padding: {x: "xs", y: "2xs"}, gap: {all: "xs"}},
        combined: [
          {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
          {where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
        ],
      },
    },
    sidebarItem: {
      surface: {
        interior: {
          padding: {x: "md", y: "sm"},
          gap: {all: "sm"},
          childAlign: {horizontal: "start", vertical: "center"},
        },
        combined: [
          {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
          {where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
        ],
      },
    },
    listDraggableRow: {
      surface: {
        interior: {padding: {x: "md", y: "sm"}},
        combined: [
          {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
          {where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
        ],
      },
    },
    listDraggableHandle: {
      surface: {
        interior: {padding: {all: "2xs"}},
        combined: [
          {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
          {where: {state: "active"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
          {where: {state: "focus"}},
        ],
      },
    },
    listTreeRow: {
      surface: {
        interior: {padding: {x: "xs", y: "2xs"}},
        combined: [
          {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
          {where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
        ],
      },
    },
    listTreeToggle: {
      surface: {
        interior: {padding: {all: "2xs"}},
        combined: [
          {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
          {where: {state: "focus"}},
        ],
      },
    },
    listTreeHandle: {
      surface: {
        interior: {padding: {all: "2xs"}},
        combined: [
          {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
          {where: {state: "active"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
          {where: {state: "focus"}},
        ],
      },
    },
    listItem: {
      surface: {
        interior: {padding: {y: "sm", x: "lg"}, gap: {all: "sm"}},
        combined: [
          {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
          {where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
        ],
        dimensionPosition: {width: "100%"},
      },
    },
    menuItem: {
      surface: {
        interior: {padding: {x: "md", y: "xs"}},
        combined: [
          {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
          {where: {state: "focus"}},
          {where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
          {
            where: {status: "destructive"},
            partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"},
          },
        ],
        dimensionPosition: {width: "100%"},
      },
    },
    accordionTrigger: {surface: {interior: {padding: {x: "md", y: "sm"}}}},
  },
};

// ── CONTROL GROUP: the family, then its elements, then what is inside a container ──
const controlGroup: Block = {
  family: {surface: {interior: {gap: {all: "none"}, background: "foreground", backgroundAlpha: 0.05}}},
  elements: {
    // the bar at the top of a shell: its height and its side inset. It leaves by sliding up: it loses its height while its row (the concept topbar-row),
    // which keeps its own, stands on its bottom edge
    topbar: {
      surface: {
        interior: {padding: {x: "lg"}, childAlign: {horizontal: "start", vertical: "end"}},
        dimensionPosition: {height: "56px"},
        transition: {property: "height", duration: "slow", timing: "easeInOut"},
      },
    },
    choiceGroup: {surface: {interior: {gap: {all: "sm"}}}},
    tabBar: {surface: {interior: {gap: {all: "xl"}}}},
    breadcrumb: {surface: {interior: {gap: {all: "xs"}}}},
    sidebar: {
      widthExpanded: "240px",
      widthCollapsed: "56px",
      surface: {interior: {padding: {y: "sm", x: "none"}, gap: {all: "2xs"}}},
    },
  },
  contextual: {
    sidebar: {
      header: {interior: {padding: {x: "sm", y: "md"}}},
      content: {interior: {padding: {x: "sm", y: "sm"}}},
      footer: {interior: {padding: {x: "sm", y: "sm"}}},
      sidebarItem: {interior: {padding: {x: "md", y: "sm"}, gap: {all: "md"}}},
    },
  },
};

// ── FIELD: the family, then its elements ──
const field: Block = {
  family: {
    sizes: {
      "3xs": {partialSurface: {interior: {padding: {x: "2xs", y: "3xs"}}}},
      "2xs": {partialSurface: {interior: {padding: {x: "xs", y: "2xs"}}}},
      xs: {partialSurface: {interior: {padding: {x: "xs", y: "xs"}}}},
      sm: {partialSurface: {interior: {padding: {x: "sm", y: "xs"}}}},
      md: {partialSurface: {interior: {padding: {x: "sm", y: "sm"}}}},
      lg: {partialSurface: {interior: {padding: {x: "md", y: "sm"}}}},
      xl: {partialSurface: {interior: {padding: {x: "lg", y: "md"}}}},
      "2xl": {partialSurface: {interior: {padding: {x: "lg", y: "md"}}}},
      "3xl": {partialSurface: {interior: {padding: {x: "lg", y: "md"}}}},
    },
    surface: {
      interior: {padding: {x: "sm", y: "sm"}, gap: {all: "sm"}, background: "foreground", backgroundAlpha: 0.05},
      combined: [
        {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
        {where: {state: "focus"}},
        {where: {status: "error"}, partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"}},
        {
          where: {status: "success"},
          partialSurface: {interior: {foreground: "status-success"}, tint: "status-success"},
        },
        {
          where: {status: "warning"},
          partialSurface: {interior: {foreground: "status-warning"}, tint: "status-warning"},
        },
        {where: {state: "disabled"}, partialSurface: {interior: {opacity: 0.6}}},
      ],
    },
    placeholderOpacity: 1,
  },
  elements: {
    fileUpload: {
      surface: {
        interior: {padding: {all: "xl"}, childAlign: {horizontal: "center", vertical: "center"}},
        combined: [{where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}}],
      },
    },
    otp: {surface: {interior: {padding: {all: "none"}, gap: {all: "xs"}}}},
    otpSlot: {
      surface: {
        interior: {padding: {all: "none"}, childAlign: {horizontal: "center", vertical: "center"}},
        boundary: {margin: {x: "xs"}},
        dimensionPosition: {width: "36px", height: "40px"},
        combined: [
          {where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
          {where: {state: "focus"}},
        ],
      },
    },
  },
};

// ── OVERLAY: the family, then its elements, then what is inside a container ──
const overlay: Block = {
  family: {surface: {interior: {background: "background"}}, overlay: {scrimOpacity: 0.3, scrimBlur: "none"}},
  elements: {
    dropdownMenu: {surface: {interior: {padding: {all: "sm"}, gap: {all: "none"}}}},
    dialog: {surface: {interior: {padding: {x: "lg", y: "md", childrenSmartBleed: true}, gap: {all: "none"}}}},
    alertDialog: {surface: {interior: {padding: {x: "lg", y: "md", childrenSmartBleed: true}, gap: {all: "none"}}}},
    sheet: {surface: {interior: {padding: {x: "lg", y: "md"}, gap: {all: "md"}}}},
    popover: {surface: {interior: {padding: {all: "sm"}, gap: {all: "sm"}}}},
    hoverCard: {surface: {interior: {padding: {all: "md"}, gap: {all: "none"}}}},
    tooltip: {surface: {interior: {foreground: "smart-fb", padding: {x: "sm", y: "xs"}}}},
    toast: {surface: {interior: {padding: {x: "md", y: "sm"}}}},
  },
  contextual: {
    dialog: {footer: {interior: {childAlign: {horizontal: "end"}}}},
    alertDialog: {footer: {interior: {childAlign: {horizontal: "end"}}}},
    sheet: {
      header: {interior: {padding: {x: "none", y: "sm"}}},
      content: {interior: {padding: {x: "none", y: "sm"}}},
      footer: {interior: {padding: {x: "none", y: "sm"}}},
    },
  },
};

// ── LIST: the family, then its elements, then what is inside a container ──
const list: Block = {
  family: {
    surface: {interior: {gap: {all: "none"}}},
    row: {
      interior: {padding: {y: "sm"}},
      combined: [
        {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
        {where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
      ],
    },
    separator: {height: "1px"},
  },
  elements: {
    treeView: {surface: {interior: {gap: {all: "none"}}}},
    list: {surface: {interior: {padding: {x: "lg", childrenSmartBleed: true}, gap: {all: "md"}}}},
    listDraggable: {surface: {interior: {gap: {all: "xs"}}}},
    listTree: {surface: {interior: {gap: {all: "none"}}}},
  },
  contextual: {menu: {label: {interior: {padding: {x: "md", y: "xs"}}}}},
};

// ── TABLE: the family, then its elements ──
const table: Block = {
  elements: {
    tableHeaderCell: {interior: {padding: {x: "lg", y: "sm"}}},
    tableRow: {
      combined: [
        {where: {state: "hover"}, partialSurface: {tint: {color: "foreground", opacity: 0.4}}},
        {where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
      ],
    },
    tableCell: {interior: {padding: {x: "lg", y: "md"}}},
    tableFooterCell: {interior: {padding: {x: "lg", y: "md"}}},
  },
};

// ── SHAPE: the family, then its elements ──
const shape: Block = {
  family: {
    surface: {interior: {foreground: "currentColor", background: "transparent"}, boundary: {border: {width: "none"}}},
  },
  elements: {
    listDraggableDropLine: {surface: {dimensionPosition: {height: "3px"}}},
    listTreeDropLine: {surface: {dimensionPosition: {height: "3px"}}},
  },
};

// ── MEDIA: the family, then its elements ──
const media: Block = {
  family: {objectFit: "cover"},
  elements: {
    image: {
      sizes: {
        "3xs": {partialSurface: {dimensionPosition: {width: "16px", height: "16px"}}},
        "2xs": {partialSurface: {dimensionPosition: {width: "24px", height: "24px"}}},
        xs: {partialSurface: {dimensionPosition: {width: "32px", height: "32px"}}},
        sm: {partialSurface: {dimensionPosition: {width: "48px", height: "48px"}}},
        md: {partialSurface: {dimensionPosition: {width: "64px", height: "64px"}}},
        lg: {partialSurface: {dimensionPosition: {width: "96px", height: "96px"}}},
        xl: {partialSurface: {dimensionPosition: {width: "160px", height: "160px"}}},
        "2xl": {partialSurface: {dimensionPosition: {width: "240px", height: "240px"}}},
        "3xl": {partialSurface: {dimensionPosition: {width: "320px", height: "320px"}}},
      },
      surface: {combined: [{where: {state: "loading"}}]},
    },
  },
};

// ── concepts: a name markup gives, with the parts it changes ──
const concepts = {
  // the row of the top bar: as tall as the bar, so it slides out whole
  "topbar-row": {self: {dimensionPosition: {height: "56px"}}},
  alert: {card: {interior: {padding: {all: "none"}}}, content: {interior: {padding: {x: "xl", y: "lg"}}}},
  "sidebar-row": {self: {dimensionPosition: {height: "36px"}}},
  "sidebar-group-heading": {self: {dimensionPosition: {height: "28px"}, interior: {padding: {x: "md"}}}},
  "sidebar-group-divider": {self: {dimensionPosition: {height: "28px"}, interior: {padding: {x: "md"}}}},
  "sidebar-topbar": {self: {dimensionPosition: {height: "56px"}, interior: {padding: {x: "md"}}}},
  "sidebar-zone-floating": {self: {interior: {padding: {x: "md"}}}},
  "sidebar-zone-compressed": {self: {interior: {padding: {y: "md"}}}},
  "sidebar-zone-floating-compressed": {self: {interior: {padding: {x: "md", y: "md"}}}},
  "example-label": {self: {dimensionPosition: {width: "6rem"}}},
};

// ── rules: chains that cross elements, flags and concepts ──
const rules = [
  {chain: [{key: "mainHeader"}, {key: "tabBar"}], tokens: {dimensionPosition: {height: "100%"}}},
  {chain: [{key: "mainHeader"}, {key: "tabTrigger"}], tokens: {dimensionPosition: {height: "100%"}}},
  {chain: [{key: "shellNav"}], tokens: {transition: {property: "width", duration: "slow", timing: "easeInOut"}}},
  {chain: [{key: "pageLeftSidebar"}], tokens: {transition: {property: "width", duration: "slow", timing: "easeInOut"}}},
  {chain: [{key: "pageRightSidebar"}], tokens: {transition: {property: "width", duration: "slow", timing: "easeInOut"}}},
  {chain: [{key: "mainRightSidebar"}], tokens: {transition: {property: "width", duration: "slow", timing: "easeInOut"}}},
  {chain: [{key: "pageHeader"}], tokens: {transition: {property: "height", duration: "slow", timing: "easeInOut"}}},
  {chain: [{key: "secondPageHeader"}], tokens: {transition: {property: "height", duration: "slow", timing: "easeInOut"}}},
  {chain: [{key: "mainHeader"}], tokens: {transition: {property: "height", duration: "slow", timing: "easeInOut"}}},
  {chain: [{key: "secondMainHeader"}], tokens: {transition: {property: "height", duration: "slow", timing: "easeInOut"}}},
  {chain: [{key: "pageFooter"}], tokens: {transition: {property: "height", duration: "slow", timing: "easeInOut"}}},
  {chain: [{key: "mainFooter"}], tokens: {transition: {property: "height", duration: "slow", timing: "easeInOut"}}},
  {
    chain: [{key: "shellNav", where: {flag: "away"}}],
    tokens: {
      dimensionPosition: {width: "0px"},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageLeftSidebar", where: {flag: "away"}}],
    tokens: {
      dimensionPosition: {width: "0px"},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageLeftSidebar", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensionPosition: {width: "0px"},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageLeftSidebar", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensionPosition: {width: "0px"},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageLeftSidebar", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensionPosition: {width: "0px"},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageRightSidebar", where: {flag: "away"}}],
    tokens: {
      dimensionPosition: {width: "0px"},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageRightSidebar", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensionPosition: {width: "0px"},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageRightSidebar", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensionPosition: {width: "0px"},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageRightSidebar", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensionPosition: {width: "0px"},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "mainRightSidebar", where: {flag: "away"}}],
    tokens: {
      dimensionPosition: {width: "0px"},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "mainRightSidebar", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensionPosition: {width: "0px"},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "mainRightSidebar", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensionPosition: {width: "0px"},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "mainRightSidebar", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensionPosition: {width: "0px"},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "secondPageHeader", where: {flag: "away"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "secondPageHeader", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "secondPageHeader", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "secondPageHeader", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "secondMainHeader", where: {flag: "away"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "secondMainHeader", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "secondMainHeader", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "secondMainHeader", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "pageFooter", where: {flag: "away"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "pageFooter", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "pageFooter", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "pageFooter", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainFooter", where: {flag: "away"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainFooter", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainFooter", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainFooter", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {chain: [{key: "sidebar"}, {key: "listTreeRow"}], tokens: {interior: {padding: {x: "md"}}}},
  {chain: [{key: "secondPageHeader"}, {key: "tabBar"}], tokens: {dimensionPosition: {height: "100%"}}},
  {chain: [{key: "secondPageHeader"}, {key: "tabTrigger"}], tokens: {dimensionPosition: {height: "100%"}}},
  {chain: [{key: "secondMainHeader"}, {key: "tabBar"}], tokens: {dimensionPosition: {height: "100%"}}},
  {chain: [{key: "secondMainHeader"}, {key: "tabTrigger"}], tokens: {dimensionPosition: {height: "100%"}}},
  {chain: [{key: "skeleton", where: {scale: "sm"}}], tokens: {dimensionPosition: {height: "16px"}}},
  {chain: [{key: "skeleton", where: {scale: "md"}}], tokens: {dimensionPosition: {height: "40px"}}},
  {chain: [{key: "skeleton", where: {scale: "lg"}}], tokens: {dimensionPosition: {height: "160px"}}},
  // a header hidden on scroll (its flag away): no height. The top bar, the page header, the main header
  {
    chain: [{key: "pageHeader", where: {flag: "away"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "pageHeader", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "pageHeader", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "pageHeader", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainHeader", where: {flag: "away"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainHeader", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainHeader", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainHeader", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensionPosition: {height: "0px"},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {chain: [{key: "topbar", where: {flag: "away"}}], tokens: {dimensionPosition: {height: "0px"}}},
  {chain: [{key: "stack", where: {scale: "3xs"}}], tokens: {interior: {gap: {all: "3xs"}}}},
  {chain: [{key: "stack", where: {scale: "2xs"}}], tokens: {interior: {gap: {all: "2xs"}}}},
  {chain: [{key: "stack", where: {scale: "xs"}}], tokens: {interior: {gap: {all: "xs"}}}},
  {chain: [{key: "stack", where: {scale: "sm"}}], tokens: {interior: {gap: {all: "sm"}}}},
  {chain: [{key: "stack", where: {scale: "md"}}], tokens: {interior: {gap: {all: "md"}}}},
  {chain: [{key: "stack", where: {scale: "lg"}}], tokens: {interior: {gap: {all: "lg"}}}},
  {chain: [{key: "stack", where: {scale: "xl"}}], tokens: {interior: {gap: {all: "xl"}}}},
  {chain: [{key: "stack", where: {scale: "2xl"}}], tokens: {interior: {gap: {all: "2xl"}}}},
  {chain: [{key: "stack", where: {scale: "3xl"}}], tokens: {interior: {gap: {all: "3xl"}}}},
  {
    chain: [{key: "badge", concept: "dot"}],
    tokens: {
      interior: {padding: {all: "none"}},
      combined: [
        {
          where: {status: "success"},
          partialSurface: {interior: {foreground: "status-success"}, tint: "status-success"},
        },
        {
          where: {status: "warning"},
          partialSurface: {interior: {foreground: "status-warning"}, tint: "status-warning"},
        },
        {where: {status: "error"}, partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"}},
        {
          where: {status: "destructive"},
          partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"},
        },
        {where: {status: "info"}, partialSurface: {interior: {foreground: "foreground"}, tint: "status-info"}},
      ],
    },
  },
  {
    chain: [{key: "badge"}, {key: "badge", concept: "dot"}],
    tokens: {
      dimensionPosition: {width: "6px", height: "6px"},
      combined: [
        {where: {status: "error"}, partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"}},
        {
          where: {status: "destructive"},
          partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"},
        },
      ],
    },
  },
  {chain: [{key: "sidebar"}, {key: "content"}, {key: "sidebarItem"}], tokens: {dimensionPosition: {height: "36px"}}},
  {chain: [{key: "sidebar"}, {key: "header"}, {key: "sidebarItem"}], tokens: {dimensionPosition: {height: "36px"}}},
  {chain: [{key: "sidebar"}, {key: "footer"}, {key: "sidebarItem"}], tokens: {dimensionPosition: {height: "36px"}}},
  {when: {concept: "logo-wide", where: {scale: "md"}}, self: {dimensionPosition: {width: "auto", height: "32px"}}},
  {
    when: {concept: "sidebar-sheet", where: {scale: "md"}},
    self: {dimensionPosition: {width: "240px"}, interior: {padding: {all: "none"}, gap: {all: "none"}}},
  },
  {when: {concept: "sidebar-provider"}, self: {dimensionPosition: {height: "100%"}}},
  {
    when: {concept: "sidebar", where: {scale: "md", flag: "peek-open"}},
    self: {
      dimensionPosition: {width: "240px", height: "var(--radix-popover-trigger-height)"},
      interior: {padding: {all: "none"}},
      animation: {name: "sidebar-peek-in", duration: "220ms", timing: "ease-in-out", fillMode: "both"},
    },
  },
  {
    when: {concept: "sidebar", where: {scale: "md", flag: "peek-closed"}},
    self: {
      dimensionPosition: {width: "240px", height: "var(--radix-popover-trigger-height)"},
      interior: {padding: {all: "none"}},
      animation: {name: "sidebar-peek-out", duration: "220ms", timing: "ease-in-out", fillMode: "both"},
    },
  },
  {when: {concept: "logo-square", where: {scale: "md"}}, self: {dimensionPosition: {width: "auto", height: "32px"}}},
  {chain: [{key: "sidebar"}, {key: "footer"}], tokens: {dimensionPosition: {height: "60px"}}},
  {
    chain: [{key: "sidebar"}, {key: "footer", concept: "sidebar-footer-two-rows"}],
    tokens: {dimensionPosition: {height: "auto"}},
  },
  {
    chain: [{key: "sidebar", where: {flag: "collapsed"}}, {key: "sidebarItem"}, {key: "badge", concept: "dot"}],
    tokens: {dimensionPosition: {translateX: "-9px", translateY: "-9px"}},
  },
  {
    chain: [{key: "sidebar", where: {flag: "collapsed"}}, {key: "header"}, {key: "badge", concept: "dot"}],
    tokens: {dimensionPosition: {translateX: "-9px", translateY: "-9px"}},
  },
  {
    chain: [{key: "sidebar", where: {flag: "collapsed"}}, {key: "header"}],
    tokens: {interior: {padding: {x: "none"}, childAlign: {horizontal: "center"}}},
  },
  {chain: [{key: "sidebar"}, {key: "content"}], tokens: {interior: {padding: {x: "none"}}}},
  {
    chain: [{key: "sidebar", where: {flag: "collapsed"}}, {key: "footer"}],
    tokens: {interior: {padding: {x: "none"}, childAlign: {horizontal: "center"}}},
  },
  {
    chain: [{key: "sidebar", where: {flag: "collapsed"}}, {key: "sidebarItem"}],
    tokens: {interior: {padding: {x: "none"}, childAlign: {horizontal: "center"}}},
  },
  {chain: [{key: "sidebar", where: {flag: "expanded"}}], tokens: {dimensionPosition: {width: "240px"}}},
  {chain: [{key: "sidebar", where: {flag: "collapsed"}}], tokens: {dimensionPosition: {width: "56px"}}},
];

const keyframes = {
  "sidebar-peek-in": {
    from: {clipPath: "inset(0 calc(100% - 3.5rem) 0 0)"},
    to: {clipPath: "inset(-60px -60px -60px -60px)"},
  },
  "sidebar-peek-out": {
    from: {clipPath: "inset(-60px -60px -60px -60px)"},
    to: {clipPath: "inset(0 calc(100% - 3.5rem) 0 0)"},
  },
};

export const wireframesTheme: WebTheme = {
  id: "wireframes",
  name: "Wireframes",
  version: 12,
  type: "wireframe",
  kind: "seed",
  ...tokens,
  layouts,
  families: {
    surfaceContainer: surface.family,
    interactiveControl: control.family,
    interactiveControlGroup: controlGroup.family,
    field: field.family,
    elevatedOverlay: overlay.family,
    listContainer: list.family,
    shape: shape.family,
    media: media.family,
  },
  elements: {
    ...surface.elements,
    ...control.elements,
    ...controlGroup.elements,
    ...field.elements,
    ...overlay.elements,
    ...list.elements,
    ...table.elements,
    ...shape.elements,
    ...media.elements,
  },
  contextual: {
    ...surface.contextual,
    ...control.contextual,
    ...controlGroup.contextual,
    ...field.contextual,
    ...overlay.contextual,
    ...list.contextual,
    ...table.contextual,
    ...shape.contextual,
    ...media.contextual,
  },
  concepts,
  keyframes,
  rules,
} as WebTheme;
