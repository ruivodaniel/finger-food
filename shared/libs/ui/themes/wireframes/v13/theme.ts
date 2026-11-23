import type {WebThemeV2} from "../../../types/schema/v2";
// Wireframes v12 — a copy of the baseline (base v2) with one thing of its own: a surface is the foreground colour at 5% opacity
// (written on the four families that carry a surface: surface, field, control, control group).
type Block = {
  family?: any;
  elements?: Record<string, any>;
  contextual?: Record<string, any>;
};
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
  // the screen previewer lifts off the page with a shadow, so its edge is seen without a line on it
  effects: {card: [], sheet: [], drawer: [], popover: [], none: [], "screen-previewer": [{type: "drop-shadow", x: 0, y: 1, blur: 3, color: "main-black", opacity: 0.1}, {type: "drop-shadow", x: 0, y: 12, blur: 40, color: "main-black", opacity: 0.12}]},
  transitions: {
    duration: {extraFast: "50ms", fast: "100ms", average: "200ms", slow: "300ms", extraSlow: "500ms"},
    timing: {ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", linear: "linear"},
  },
  icons: {set: "lucide", sizes: {xs: 12, sm: 14, md: 16, lg: 18, xl: 22}, weight: 1.75},
};
// ── layouts and body ──
const layouts = {
  // what a divider is: the line across and the line down. Markup says where one is
  divider: {
    across: {width: "thin", style: "solid", color: "foreground"},
    down: {width: "thin", style: "solid", color: "foreground"},
  },
  page: {surface: {interior: {padding: {all: "none"}, gap: {all: "none"}}}},
  pageHeader: {
    surface: {interior: {padding: {x: "xl"}}, dimensions: {height: {sm: "48px", md: "56px", lg: "72px"}}},
  },
  secondPageHeader: {
    surface: {interior: {padding: {x: "xl"}}, dimensions: {height: {sm: "32px", md: "40px", lg: "48px"}}},
  },
  mainHeader: {
    surface: {interior: {padding: {x: "lg"}}, dimensions: {height: {sm: "40px", md: "48px", lg: "64px"}}},
  },
  secondMainHeader: {
    surface: {interior: {padding: {x: "lg"}}, dimensions: {height: {sm: "32px", md: "40px", lg: "48px"}}},
  },
  pageLeftSidebar: {
    surface: {dimensions: {width: {sm: "200px", md: "240px", lg: "300px"}}},
  },
  pageRightSidebar: {
    surface: {interior: {padding: {all: "md"}}, dimensions: {width: {sm: "280px", md: "320px", lg: "420px"}}},
  },
  mainRightSidebar: {
    surface: {interior: {padding: {all: "md"}}, dimensions: {width: {sm: "260px", md: "320px", lg: "420px"}}},
  },
  pageFooter: {surface: {interior: {padding: {x: "xl"}}, dimensions: {height: {md: "56px"}}}},
  mainContainer: {surface: {dimensions: {maxWidth: {xs: "448px", sm: "640px", md: "940px", lg: "1340px"}}}},
  dialog: {surface: {dimensions: {maxWidth: {sm: "480px", md: "640px", lg: "940px"}}}},
  sheet: {
    surface: {
      dimensions: {width: {sm: "320px", md: "420px", lg: "640px", "2xl": "960px", "3xl": "calc(100vw - 48px)"}},
    },
  },
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
          {where: {scale: "3xs"}, partialSurface: {interior: {padding: {all: "none"}}}},
          {where: {scale: "2xs"}, partialSurface: {interior: {padding: {x: "2xs", y: "none"}}}},
          {where: {scale: "xs"}, partialSurface: {interior: {padding: {x: "md", y: "xs"}}}},
          {where: {scale: "sm"}, partialSurface: {interior: {padding: {x: "md", y: "xs"}}}},
          {where: {scale: "md"}, partialSurface: {interior: {padding: {x: "lg", y: "sm"}}}},
          {where: {scale: "lg"}, partialSurface: {interior: {padding: {x: "lg", y: "sm"}}}},
          {where: {scale: "xl"}, partialSurface: {interior: {padding: {x: "sm", y: "xs"}}}},
        ],
        dimensions: {width: {"3xs": "8px", "2xs": "auto"}, height: {"3xs": "8px", "2xs": "auto"}},
      },
    },
    avatar: {
      surface: {
        interior: {padding: {all: "none"}, childAlign: {horizontal: "center", vertical: "center"}},
        dimensions: {
          width: {"2xs": "20px", xs: "24px", sm: "32px", md: "40px", lg: "48px", xl: "64px"},
          height: {"2xs": "20px", xs: "24px", sm: "32px", md: "40px", lg: "48px", xl: "64px"},
        },
        combined: [
          {where: {scale: "2xs"}, partialSurface: {interior: {padding: {all: "none"}}}},
          {where: {scale: "xs"}, partialSurface: {interior: {padding: {all: "none"}}}},
          {where: {scale: "sm"}, partialSurface: {interior: {padding: {all: "none"}}}},
          {where: {scale: "md"}, partialSurface: {interior: {padding: {all: "none"}}}},
          {where: {scale: "lg"}, partialSurface: {interior: {padding: {all: "none"}}}},
          {where: {scale: "xl"}, partialSurface: {interior: {padding: {all: "none"}}}},
        ],
      },
    },
    progress: {surface: {dimensions: {height: {md: "8px"}}}},
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
        {where: {scale: "3xs"}, partialSurface: {interior: {padding: {x: "2xs", y: "3xs"}}}, icon: {size: "3xs"}},
        {where: {scale: "2xs"}, partialSurface: {interior: {padding: {x: "xs", y: "2xs"}}}, icon: {size: "2xs"}},
        {where: {scale: "xs"}, partialSurface: {interior: {padding: {x: "xs", y: "xs"}}}, icon: {size: "xs"}},
        {where: {scale: "sm"}, partialSurface: {interior: {padding: {x: "lg", y: "sm"}}}, icon: {size: "xs"}},
        {where: {scale: "md"}, partialSurface: {interior: {padding: {x: "xl", y: "md"}}}, icon: {size: "sm"}},
        {where: {scale: "lg"}, partialSurface: {interior: {padding: {x: "2xl", y: "lg"}}}, icon: {size: "md"}},
        {where: {scale: "xl"}, partialSurface: {interior: {padding: {x: "xl", y: "md"}}}, icon: {size: "lg"}},
        {where: {scale: "2xl"}, partialSurface: {interior: {padding: {x: "xl", y: "md"}}}, icon: {size: "lg"}},
        {where: {scale: "3xl"}, partialSurface: {interior: {padding: {x: "xl", y: "md"}}}, icon: {size: "lg"}},
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
          {where: {scale: "xs"}, partialSurface: {interior: {padding: {x: "xs", y: "3xs"}}}},
          {where: {scale: "sm"}, partialSurface: {interior: {padding: {x: "xs", y: "3xs"}}}},
          {where: {scale: "md"}, partialSurface: {interior: {padding: {x: "sm", y: "2xs"}}}},
          {where: {scale: "lg"}, partialSurface: {interior: {padding: {x: "sm", y: "xs"}}}},
          {where: {scale: "xl"}, partialSurface: {interior: {padding: {x: "md", y: "xs"}}}},
        ],
      },
    },
    button: {surface: {interior: {gap: {all: "sm"}}}},
    switch: {
      track: {
        dimensions: {width: {md: "46px"}, height: {md: "26px"}},
        interior: {padding: {all: "none"}},
        combined: [{where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}}],
      },
      thumb: {
        dimensions: {width: {md: "20px"}, height: {md: "20px"}},
        position: {shift: {x: "3px", y: "0px"}},
        combined: [
          {
            where: {state: "selected"},
            partialSurface: {
              position: {shift: {x: "4px", y: "0px"}},
              tint: {color: "foreground", opacity: 0.8},
            },
          },
        ],
      },
    },
    checkbox: {
      surface: {
        interior: {padding: {all: "none"}, childAlign: {horizontal: "center", vertical: "center"}},
        dimensions: {
          width: {xs: "12px", sm: "14px", md: "16px", lg: "20px", xl: "24px"},
          height: {xs: "12px", sm: "14px", md: "16px", lg: "20px", xl: "24px"},
        },
        combined: [
          {where: {state: "selected"}, partialSurface: {tint: {color: "foreground", opacity: 0.8}}},
          {where: {scale: "xs"}, icon: {size: "xs"}},
          {where: {scale: "sm"}, icon: {size: "xs"}},
          {where: {scale: "md"}, icon: {size: "sm"}},
          {where: {scale: "lg"}, icon: {size: "md"}},
          {where: {scale: "xl"}, icon: {size: "lg"}},
        ],
      },
    },
    radio: {
      surface: {
        interior: {padding: {all: "none"}},
        dimensions: {
          width: {xs: "12px", sm: "14px", md: "16px", lg: "20px", xl: "24px"},
          height: {xs: "12px", sm: "14px", md: "16px", lg: "20px", xl: "24px"},
        },
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
        dimensions: {width: {md: "100%"}},
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
        dimensions: {width: {md: "100%"}},
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
        dimensions: {height: {md: "56px"}},
        transition: {property: "height", duration: "slow", timing: "easeInOut"},
      },
    },
    choiceGroup: {surface: {interior: {gap: {all: "sm"}}}},
    tabBar: {surface: {interior: {gap: {all: "xl"}}}},
    breadcrumb: {surface: {interior: {gap: {all: "xs"}}}},
    sidebar: {
      surface: {
        interior: {padding: {y: "sm", x: "none"}, gap: {all: "2xs"}},
        dimensions: {width: {md: "240px"}},
        combined: [{where: {state: "collapsed"}, partialSurface: {dimensions: {width: {md: "56px"}}}}],
      },
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
        {where: {scale: "3xs"}, partialSurface: {interior: {padding: {x: "2xs", y: "3xs"}}}},
        {where: {scale: "2xs"}, partialSurface: {interior: {padding: {x: "xs", y: "2xs"}}}},
        {where: {scale: "xs"}, partialSurface: {interior: {padding: {x: "xs", y: "xs"}}}},
        {where: {scale: "sm"}, partialSurface: {interior: {padding: {x: "sm", y: "xs"}}}},
        {where: {scale: "md"}, partialSurface: {interior: {padding: {x: "sm", y: "sm"}}}},
        {where: {scale: "lg"}, partialSurface: {interior: {padding: {x: "md", y: "sm"}}}},
        {where: {scale: "xl"}, partialSurface: {interior: {padding: {x: "lg", y: "md"}}}},
        {where: {scale: "2xl"}, partialSurface: {interior: {padding: {x: "lg", y: "md"}}}},
        {where: {scale: "3xl"}, partialSurface: {interior: {padding: {x: "lg", y: "md"}}}},
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
        dimensions: {width: {md: "36px"}, height: {md: "40px"}},
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
    sheet: {surface: {interior: {padding: {x: "lg", y: "md", childrenSmartBleed: true}, gap: {all: "none"}}}},
    popover: {surface: {interior: {padding: {all: "sm"}, gap: {all: "sm"}}}},
    hoverCard: {surface: {interior: {padding: {all: "md"}, gap: {all: "none"}}}},
    tooltip: {surface: {interior: {foreground: "smart-fb", padding: {x: "sm", y: "xs"}}}},
    toast: {surface: {interior: {padding: {x: "md", y: "sm"}}}},
  },
  contextual: {
    dialog: {footer: {interior: {childAlign: {horizontal: "end"}}}},
    alertDialog: {footer: {interior: {childAlign: {horizontal: "end"}}}},
    sheet: {
      header: {interior: {padding: {y: "sm"}}},
      content: {interior: {padding: {y: "sm"}}},
      footer: {interior: {padding: {y: "sm"}}},
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
    listDraggableDropLine: {surface: {dimensions: {height: {md: "3px"}}}},
    listTreeDropLine: {surface: {dimensions: {height: {md: "3px"}}}},
  },
};
// ── MEDIA: the family, then its elements ──
const media: Block = {
  family: {objectFit: "cover"},
  elements: {
    image: {
      surface: {
        combined: [{where: {state: "loading"}}],
        dimensions: {
          width: {
            "3xs": "16px",
            "2xs": "24px",
            xs: "32px",
            sm: "48px",
            md: "64px",
            lg: "96px",
            xl: "160px",
            "2xl": "240px",
            "3xl": "320px",
          },
          height: {
            "3xs": "16px",
            "2xs": "24px",
            xs: "32px",
            sm: "48px",
            md: "64px",
            lg: "96px",
            xl: "160px",
            "2xl": "240px",
            "3xl": "320px",
          },
        },
      },
    },
  },
};
// ── concepts: a name markup gives, with the parts it changes ──
const concepts = {
  // the sizes of the patterns: a pattern names what a thing is, the theme gives its size
  "kpi-hero-text": {self: {defaultTypography: {textAlign: "center"}}},
  "kpi-card-body": {self: {dimensions: {minWidth: {md: "220px"}}}},
  "chart-events-panel": {self: {dimensions: {maxWidth: {md: "420px"}, maxHeight: {md: "360px"}}}},
  "chart-legend-row": {self: {interior: {padding: {left: "md"}}}},
  // the icon picker: the panel has one width, the grid of icons a height it scrolls within
  "icon-picker-panel": {self: {dimensions: {width: {md: "360px"}}}},
  "icon-picker-grid": {self: {dimensions: {maxHeight: {md: "300px"}}}},
  // the legend of a chart: an item is the swatch and the name, the swatch a small square in the colour of the series
  "chart-legend-item": {self: {interior: {gap: {all: "xs"}}, cursor: "pointer"}},
  "chart-legend-swatch": {self: {dimensions: {width: {md: "10px"}, height: {md: "10px"}}, boundary: {radius: {all: "xs"}}}},
  // a card that holds a table whose rows scroll inside it, as a box of a fixed height
  "table-box": {self: {dimensions: {height: {md: "360px"}}}},
  // the card of a container pattern's example: one width, so the examples compare
  "container-example": {self: {dimensions: {width: {md: "520px"}}}},
  "slice-entity-chip": {
    self: {interior: {padding: {y: "xs", x: "sm"}}, boundary: {radius: {all: "full"}, border: {width: "thin", style: "solid", color: "foreground"}}},
  },
  // a region that reaches under the page header: its content starts after the header and scrolls under it
  "under-page-header": {self: {position: {under: {top: ["pageHeader"]}}}},
  // the row of the top bar: as tall as the bar, so it slides out whole
  "topbar-row": {self: {dimensions: {height: {md: "56px"}}}},
  alert: {card: {interior: {padding: {all: "none"}}}, content: {interior: {padding: {x: "xl", y: "lg"}}}},
  "sidebar-row": {self: {dimensions: {height: {md: "36px"}}}},
  "sidebar-group-heading": {self: {dimensions: {height: {md: "28px"}}, interior: {padding: {x: "md"}}}},
  "sidebar-group-divider": {self: {dimensions: {height: {md: "28px"}}, interior: {padding: {x: "md"}}}},
  "sidebar-topbar": {self: {dimensions: {height: {md: "56px"}}, interior: {padding: {x: "md"}}}},
  "sidebar-zone-floating": {self: {interior: {padding: {x: "md"}}}},
  "sidebar-zone-compressed": {self: {interior: {padding: {y: "md"}}}},
  "sidebar-zone-floating-compressed": {self: {interior: {padding: {x: "md", y: "md"}}}},
  "example-label": {self: {dimensions: {width: {md: "6rem"}}}},
};
// ── rules: chains that cross elements, flags and concepts ──
const rules = [
  // a sheet enters from outside the edge it comes from, and leaves the same way; its scrim fades
  {
    chain: [{key: "sheet", where: {flag: "from-right"}}],
    tokens: {animation: {name: "sheet-in-right", duration: "300ms", timing: "ease-in-out", fillMode: "both"}},
  },
  {
    chain: [{key: "sheet", where: {flag: "to-right"}}],
    tokens: {animation: {name: "sheet-out-right", duration: "300ms", timing: "ease-in-out", fillMode: "both"}},
  },
  {
    chain: [{key: "sheet", where: {flag: "from-left"}}],
    tokens: {animation: {name: "sheet-in-left", duration: "300ms", timing: "ease-in-out", fillMode: "both"}},
  },
  {
    chain: [{key: "sheet", where: {flag: "to-left"}}],
    tokens: {animation: {name: "sheet-out-left", duration: "300ms", timing: "ease-in-out", fillMode: "both"}},
  },
  {
    chain: [{key: "sheet", where: {flag: "from-top"}}],
    tokens: {animation: {name: "sheet-in-top", duration: "300ms", timing: "ease-in-out", fillMode: "both"}},
  },
  {
    chain: [{key: "sheet", where: {flag: "to-top"}}],
    tokens: {animation: {name: "sheet-out-top", duration: "300ms", timing: "ease-in-out", fillMode: "both"}},
  },
  {
    chain: [{key: "sheet", where: {flag: "from-bottom"}}],
    tokens: {animation: {name: "sheet-in-bottom", duration: "300ms", timing: "ease-in-out", fillMode: "both"}},
  },
  {
    chain: [{key: "sheet", where: {flag: "to-bottom"}}],
    tokens: {animation: {name: "sheet-out-bottom", duration: "300ms", timing: "ease-in-out", fillMode: "both"}},
  },
  {
    chain: [{key: "sheet", where: {flag: "scrim-in"}}],
    tokens: {animation: {name: "scrim-in", duration: "300ms", timing: "ease-in-out", fillMode: "both"}},
  },
  {
    chain: [{key: "sheet", where: {flag: "scrim-out"}}],
    tokens: {animation: {name: "scrim-out", duration: "300ms", timing: "ease-in-out", fillMode: "both"}},
  },
  {chain: [{key: "mainHeader"}, {key: "tabBar"}], tokens: {dimensions: {height: {md: "100%"}}}},
  {chain: [{key: "mainHeader"}, {key: "tabTrigger"}], tokens: {dimensions: {height: {md: "100%"}}}},
  {chain: [{key: "shellNav"}], tokens: {transition: {property: "width", duration: "slow", timing: "easeInOut"}}},
  {chain: [{key: "pageLeftSidebar"}], tokens: {transition: {property: "width", duration: "slow", timing: "easeInOut"}}},
  {
    chain: [{key: "pageRightSidebar"}],
    tokens: {transition: {property: "width", duration: "slow", timing: "easeInOut"}},
  },
  {
    chain: [{key: "mainRightSidebar"}],
    tokens: {transition: {property: "width", duration: "slow", timing: "easeInOut"}},
  },
  {chain: [{key: "pageHeader"}], tokens: {transition: {property: "height", duration: "slow", timing: "easeInOut"}}},
  {
    chain: [{key: "secondPageHeader"}],
    tokens: {transition: {property: "height", duration: "slow", timing: "easeInOut"}},
  },
  {chain: [{key: "mainHeader"}], tokens: {transition: {property: "height", duration: "slow", timing: "easeInOut"}}},
  {
    chain: [{key: "secondMainHeader"}],
    tokens: {transition: {property: "height", duration: "slow", timing: "easeInOut"}},
  },
  {chain: [{key: "pageFooter"}], tokens: {transition: {property: "height", duration: "slow", timing: "easeInOut"}}},
  {chain: [{key: "mainFooter"}], tokens: {transition: {property: "height", duration: "slow", timing: "easeInOut"}}},
  {
    chain: [{key: "shellNav", where: {flag: "away"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageLeftSidebar", where: {flag: "away"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageLeftSidebar", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageLeftSidebar", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageLeftSidebar", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageRightSidebar", where: {flag: "away"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageRightSidebar", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageRightSidebar", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "pageRightSidebar", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "mainRightSidebar", where: {flag: "away"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "mainRightSidebar", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "mainRightSidebar", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "mainRightSidebar", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
    },
  },
  {
    chain: [{key: "secondPageHeader", where: {flag: "away"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "secondPageHeader", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "secondPageHeader", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "secondPageHeader", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "secondMainHeader", where: {flag: "away"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "secondMainHeader", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "secondMainHeader", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "secondMainHeader", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "pageFooter", where: {flag: "away"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "pageFooter", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "pageFooter", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "pageFooter", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainFooter", where: {flag: "away"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainFooter", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainFooter", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainFooter", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {chain: [{key: "sidebar"}, {key: "listTreeRow"}], tokens: {interior: {padding: {x: "md"}}}},
  {chain: [{key: "secondPageHeader"}, {key: "tabBar"}], tokens: {dimensions: {height: {md: "100%"}}}},
  {chain: [{key: "secondPageHeader"}, {key: "tabTrigger"}], tokens: {dimensions: {height: {md: "100%"}}}},
  {chain: [{key: "secondMainHeader"}, {key: "tabBar"}], tokens: {dimensions: {height: {md: "100%"}}}},
  {chain: [{key: "secondMainHeader"}, {key: "tabTrigger"}], tokens: {dimensions: {height: {md: "100%"}}}},
  {chain: [{key: "skeleton", where: {scale: "sm"}}], tokens: {dimensions: {height: {md: "16px"}}}},
  {chain: [{key: "skeleton", where: {scale: "md"}}], tokens: {dimensions: {height: {md: "40px"}}}},
  {chain: [{key: "skeleton", where: {scale: "lg"}}], tokens: {dimensions: {height: {md: "160px"}}}},
  // a header hidden on scroll (its flag away): no height. The top bar, the page header, the main header
  {
    chain: [{key: "pageHeader", where: {flag: "away"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "pageHeader", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "pageHeader", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "pageHeader", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainHeader", where: {flag: "away"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainHeader", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainHeader", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {
    chain: [{key: "mainHeader", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
    },
  },
  {chain: [{key: "topbar", where: {flag: "away"}}], tokens: {dimensions: {height: {md: "0px"}}}},
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
      dimensions: {width: {md: "6px"}, height: {md: "6px"}},
      combined: [
        {where: {status: "error"}, partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"}},
        {
          where: {status: "destructive"},
          partialSurface: {interior: {foreground: "status-error"}, tint: "status-error"},
        },
      ],
    },
  },
  {chain: [{key: "sidebar"}, {key: "content"}, {key: "sidebarItem"}], tokens: {dimensions: {height: {md: "36px"}}}},
  {chain: [{key: "sidebar"}, {key: "header"}, {key: "sidebarItem"}], tokens: {dimensions: {height: {md: "36px"}}}},
  {chain: [{key: "sidebar"}, {key: "footer"}, {key: "sidebarItem"}], tokens: {dimensions: {height: {md: "36px"}}}},
  {when: {concept: "logo-wide", where: {scale: "md"}}, self: {dimensions: {width: {md: "auto"}, height: {md: "32px"}}}},
  {
    when: {concept: "sidebar-sheet", where: {scale: "md"}},
    self: {dimensions: {width: {md: "240px"}}, interior: {padding: {all: "none"}, gap: {all: "none"}}},
  },
  {when: {concept: "sidebar-provider"}, self: {dimensions: {height: {md: "100%"}}}},
  {
    when: {concept: "sidebar", where: {scale: "md", flag: "peek-open"}},
    self: {
      dimensions: {width: {md: "240px"}, height: {md: "var(--radix-popover-trigger-height)"}},
      interior: {padding: {all: "none"}},
      animation: {name: "sidebar-peek-in", duration: "220ms", timing: "ease-in-out", fillMode: "both"},
    },
  },
  {
    when: {concept: "sidebar", where: {scale: "md", flag: "peek-closed"}},
    self: {
      dimensions: {width: {md: "240px"}, height: {md: "var(--radix-popover-trigger-height)"}},
      interior: {padding: {all: "none"}},
      animation: {name: "sidebar-peek-out", duration: "220ms", timing: "ease-in-out", fillMode: "both"},
    },
  },
  {
    when: {concept: "logo-square", where: {scale: "md"}},
    self: {dimensions: {width: {md: "auto"}, height: {md: "32px"}}},
  },
  {chain: [{key: "sidebar"}, {key: "footer"}], tokens: {dimensions: {height: {md: "60px"}}}},
  {
    chain: [{key: "sidebar"}, {key: "footer", concept: "sidebar-footer-two-rows"}],
    tokens: {dimensions: {height: {md: "auto"}}},
  },
  {
    chain: [{key: "sidebar", where: {flag: "collapsed"}}, {key: "sidebarItem"}, {key: "badge", concept: "dot"}],
    tokens: {position: {shift: {x: "-9px", y: "-9px"}}},
  },
  {
    chain: [{key: "sidebar", where: {flag: "collapsed"}}, {key: "header"}, {key: "badge", concept: "dot"}],
    tokens: {position: {shift: {x: "-9px", y: "-9px"}}},
  },
  {
    chain: [{key: "sidebar", where: {flag: "collapsed"}}, {key: "header"}],
    tokens: {interior: {padding: {x: "none"}, childAlign: {horizontal: "center"}}},
  },
  // a container's header that holds its tabs: no room over or under them, and the tab bar draws no line of its own, so the tabs sit on the header's bottom line
  {chain: [{key: "header", concept: "tabs"}], tokens: {interior: {padding: {y: "none"}}}},
  {chain: [{key: "header", concept: "tabs"}, {key: "tabBar"}], tokens: {boundary: {border: {width: "none"}}}},
  {chain: [{key: "sidebar"}, {key: "content"}], tokens: {interior: {padding: {x: "none"}}}},
  // a sidebar that holds a tree of contents, not a navigation: the tree stands in from every edge, and the sidebar adds no room of its own
  {chain: [{key: "sidebar", concept: "sidebar-tree"}], tokens: {interior: {padding: {y: "none"}}}},
  {chain: [{key: "sidebar"}, {key: "content", concept: "sidebar-tree-content"}], tokens: {interior: {padding: {x: "sm", y: "sm"}}}},
  {
    chain: [{key: "sidebar", where: {flag: "collapsed"}}, {key: "footer"}],
    tokens: {interior: {padding: {x: "none"}, childAlign: {horizontal: "center"}}},
  },
  {
    chain: [{key: "sidebar", where: {flag: "collapsed"}}, {key: "sidebarItem"}],
    tokens: {interior: {padding: {x: "none"}, childAlign: {horizontal: "center"}}},
  },
  {chain: [{key: "sidebar", where: {flag: "expanded"}}], tokens: {dimensions: {width: {md: "240px"}}}},
  {chain: [{key: "sidebar", where: {flag: "collapsed"}}], tokens: {dimensions: {width: {md: "56px"}}}},
];
const keyframes = {
  "sheet-in-right": {from: {transform: "translateX(100%)"}, to: {transform: "none"}},
  "sheet-out-right": {from: {transform: "none"}, to: {transform: "translateX(100%)"}},
  "sheet-in-left": {from: {transform: "translateX(-100%)"}, to: {transform: "none"}},
  "sheet-out-left": {from: {transform: "none"}, to: {transform: "translateX(-100%)"}},
  "sheet-in-top": {from: {transform: "translateY(-100%)"}, to: {transform: "none"}},
  "sheet-out-top": {from: {transform: "none"}, to: {transform: "translateY(-100%)"}},
  "sheet-in-bottom": {from: {transform: "translateY(100%)"}, to: {transform: "none"}},
  "sheet-out-bottom": {from: {transform: "none"}, to: {transform: "translateY(100%)"}},
  "scrim-in": {from: {opacity: "0"}, to: {opacity: "1"}},
  "scrim-out": {from: {opacity: "1"}, to: {opacity: "0"}},
  "sidebar-peek-in": {
    from: {clipPath: "inset(0 calc(100% - 3.5rem) 0 0)"},
    to: {clipPath: "inset(-60px -60px -60px -60px)"},
  },
  "sidebar-peek-out": {
    from: {clipPath: "inset(-60px -60px -60px -60px)"},
    to: {clipPath: "inset(0 calc(100% - 3.5rem) 0 0)"},
  },
};
export const wireframesTheme: WebThemeV2 = {
  dsl: 2,
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
} as WebThemeV2;
