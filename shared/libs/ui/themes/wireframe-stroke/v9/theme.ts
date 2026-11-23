import type {WebThemeV2} from "../../../types/schema/v2";
// Wireframe Stroke v8 — one whole theme: the content of v5, in the order a theme is written (tokens, layouts and body, each family followed by its elements, concepts, rules).
// It is not yet rewritten from the baseline: its states and statuses are v5's own.
type Block = {
  family?: any;
  elements?: Record<string, any>;
  contextual?: Record<string, any>;
};
// ── tokens ──
const tokens = {
  colors: {
    main: {white: "#ffffff", black: "#1a1823"},
    brand: {"1": "#4a2d8f", "2": "#241a3d", "3": "#a495c7", "4": "#6b6779"},
    status: {success: "#2f6d4f", info: "#4a2d8f", warning: "#c99b2a", error: "#a83232"},
    content: {
      tomato: {standard: "#B05A48", soft: "#F1CEC6"},
      red: {standard: "#B05855", soft: "#F1CDCA"},
      ruby: {standard: "#B05763", soft: "#F1CDCF"},
      crimson: {standard: "#B45474", soft: "#F2CCD6"},
      pink: {standard: "#A65283", soft: "#EDCBDC"},
      plum: {standard: "#86518F", soft: "#DFCBE2"},
      purple: {standard: "#715093", soft: "#D7CBE5"},
      violet: {standard: "#5C5297", soft: "#CDCCE7"},
      iris: {standard: "#50559B", soft: "#C9CDE9"},
      indigo: {standard: "#415A9F", soft: "#C4CFEB"},
      blue: {standard: "#4580C0", soft: "#C6DCF4"},
      sky: {standard: "#91C8D9", soft: "#DDF1F6"},
      cyan: {standard: "#4A8A9F", soft: "#C9DEE6"},
      teal: {standard: "#4B8A80", soft: "#C9DFDA"},
      jade: {standard: "#4E8875", soft: "#CADED6"},
      green: {standard: "#4F8968", soft: "#CADED1"},
      grass: {standard: "#588C5F", soft: "#CDDFCE"},
      mint: {standard: "#97CEC1", soft: "#DFF2ED"},
      lime: {standard: "#B5D388", soft: "#E9F4DA"},
      yellow: {standard: "#E0D37B", soft: "#F7F3D6"},
      amber: {standard: "#D8B773", soft: "#F6EBD4"},
      orange: {standard: "#C2714C", soft: "#F5D5C8"},
      brown: {standard: "#8D725C", soft: "#E0D5CD"},
      bronze: {standard: "#85726A", soft: "#DDD5D2"},
      gold: {standard: "#7E7362", soft: "#DAD6CF"},
    },
    semanticTokens: {primary: "#4a2d8f", secondary: "#241a3d", accent: "#a495c7", muted: "#6b6779"},
  },
  modes: {
    colorScheme: {
      light: {background: "#faf9fc", foreground: "#1a1823", derivation: {grayColorMixPercentage: "6%"}},
      dark: {
        background: "#1a1823",
        foreground: "#faf9fc",
        chroma: {saturationFactor: 0.8, gamma: 1.1},
        derivation: {grayColorMixPercentage: "6%"},
      },
      "dark-low-contrast": {
        background: "#676371",
        foreground: "#D2CFD9",
        chroma: {saturationFactor: 0.7, gamma: 1.1},
        derivation: {grayColorMixPercentage: "6%"},
      },
      "light-warm-low-contrast": {
        background: "#CDC7BE",
        foreground: "#7D7670",
        chroma: {saturationFactor: 0.9, gamma: 1.1},
        derivation: {grayColorMixPercentage: "6%"},
      },
    },
  },
  typography: {
    fonts: {
      primary: "IBM Plex Sans",
      secondary: "IBM Plex Sans",
      quote: "IBM Plex Sans",
      monoPrimary: "IBM Plex Mono",
      monoSecondary: "IBM Plex Mono",
    },
    fontSources: {
      "IBM Plex Sans": {
        type: "google",
        url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;450;500;600&display=swap",
      },
      "IBM Plex Mono": {
        type: "google",
        url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap",
      },
    },
    types: {
      heading1: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 24,
        fontSizeDesktop: 27,
        fontWeight: 450,
        lineHeight: 1.35,
        letterSpacing: "-0.02em",
      },
      heading2: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 19,
        fontSizeDesktop: 21,
        fontWeight: 450,
        lineHeight: 1.35,
        letterSpacing: "-0.015em",
      },
      heading3: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 17,
        fontSizeDesktop: 19,
        fontWeight: 500,
        lineHeight: 1.4,
        letterSpacing: "-0.01em",
      },
      heading4: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 15,
        fontSizeDesktop: 16,
        fontWeight: 600,
        lineHeight: 1.4,
      },
      bodyExtraLarge: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 15,
        fontSizeDesktop: 16,
        fontWeight: 400,
        lineHeight: 1.6,
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
        fontSizeMobile: 13,
        fontSizeDesktop: 13.5,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      bodySmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 12.5,
        fontWeight: 400,
        lineHeight: 1.45,
      },
      bodyExtraSmall: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 11,
        fontSizeDesktop: 11.5,
        fontWeight: 400,
        lineHeight: 1.4,
      },
      quoteLarge: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 15,
        fontSizeDesktop: 16,
        fontWeight: 400,
        lineHeight: 1.6,
      },
      quote: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 13,
        fontSizeDesktop: 13.5,
        fontWeight: 400,
        lineHeight: 1.55,
      },
      quoteSmall: {
        fontFamily: "quote",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 12.5,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      code: {
        fontFamily: "monoPrimary",
        fontStyle: "normal",
        fontSizeMobile: 12,
        fontSizeDesktop: 12.5,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      numbersExtraLarge: {
        fontFamily: "monoPrimary",
        fontStyle: "normal",
        fontSizeMobile: 34,
        fontSizeDesktop: 46,
        fontWeight: 400,
        lineHeight: 1,
        letterSpacing: "-0.035em",
      },
      numbersLarge: {
        fontFamily: "monoPrimary",
        fontStyle: "normal",
        fontSizeMobile: 21,
        fontSizeDesktop: 27,
        fontWeight: 400,
        lineHeight: 1.1,
        letterSpacing: "-0.02em",
      },
      numbers: {
        fontFamily: "monoPrimary",
        fontStyle: "normal",
        fontSizeMobile: 13,
        fontSizeDesktop: 13,
        fontWeight: 400,
        lineHeight: 1.5,
      },
      numbersSmall: {
        fontFamily: "monoPrimary",
        fontStyle: "normal",
        fontSizeMobile: 11.5,
        fontSizeDesktop: 11.5,
        fontWeight: 400,
        lineHeight: 1.45,
      },
      numbersExtraSmall: {
        fontFamily: "monoPrimary",
        fontStyle: "normal",
        fontSizeMobile: 10.5,
        fontSizeDesktop: 10.5,
        fontWeight: 400,
        lineHeight: 1.4,
        letterSpacing: "0.1em",
      },
      link: {
        fontFamily: "primary",
        fontStyle: "normal",
        fontSizeMobile: 13,
        fontSizeDesktop: 13.5,
        fontWeight: 500,
        lineHeight: 1.5,
      },
    },
  },
  spacing: {unit: 0.875},
  radius: {
    none: "0px",
    "3xs": "0px",
    "2xs": "0px",
    xs: "0px",
    sm: "0px",
    md: "0px",
    lg: "0px",
    xl: "16px",
    "2xl": "0px",
    "3xl": "0px",
    full: "9999px",
  },
  borderWidths: {none: "0px", extraThin: "0.3px", thin: "1px", default: "1px", thick: "3px", extraThick: "4px"},
  effects: {
    card: [{type: "drop-shadow", x: 0, y: 1, blur: 2, color: "main-black", opacity: 0.05}],
    sheet: [
      {type: "drop-shadow", x: 0, y: 1, blur: 3, color: "main-black", opacity: 0.1},
      {type: "drop-shadow", x: 0, y: 12, blur: 40, color: "main-black", opacity: 0.08},
    ],
    drawer: [{type: "drop-shadow", x: -20, y: 0, blur: 44, color: "main-black", opacity: 0.16}],
    popover: [{type: "drop-shadow", x: 0, y: 8, blur: 24, color: "main-black", opacity: 0.3}],
  },
  transitions: {
    duration: {extraFast: "50ms", fast: "100ms", average: "160ms", slow: "300ms", extraSlow: "500ms"},
    timing: {ease: "ease", easeIn: "ease-in", easeOut: "ease-out", easeInOut: "ease-in-out", linear: "linear"},
  },
  icons: {set: "lucide", sizes: {xs: 12, sm: 14, md: 16, lg: 18, xl: 22}, weight: 1.75},
};
// ── layouts and body ──
const layouts = {
  // what a divider is: the line across and the line down. Markup says where one is
  divider: {
    across: {width: "thin", style: "solid", color: "gray-200"},
    down: {width: "thin", style: "solid", color: "gray-200"},
  },
  shellSideNav: {breakpoints: {stack: "767px"}},
  surface: {interior: {background: "background", padding: {}, gap: {}}},
  page: {surface: {interior: {padding: {all: "none"}, gap: {all: "none"}}}},
  pageHeader: {
    surface: {
      boundary: {border: {bottom: {width: "thin", style: "solid", color: "gray-200"}}},
      interior: {background: "background", foreground: "smart-fb", padding: {x: "xl"}},
      dimensions: {height: {sm: "48px", md: "56px", lg: "72px"}},
    },
  },
  secondPageHeader: {
    surface: {
      boundary: {border: {bottom: {width: "thin", style: "solid", color: "gray-200"}}},
      interior: {background: "background", foreground: "smart-fb", padding: {x: "xl"}},
      dimensions: {height: {sm: "32px", md: "40px", lg: "48px"}},
    },
  },
  mainHeader: {
    surface: {
      boundary: {border: {bottom: {width: "thin", style: "solid", color: "gray-200"}}},
      interior: {padding: {x: "lg"}, background: "background", foreground: "smart-fb"},
      dimensions: {height: {sm: "40px", md: "48px", lg: "64px"}},
    },
  },
  secondMainHeader: {
    surface: {
      boundary: {border: {bottom: {width: "thin", style: "solid", color: "gray-200"}}},
      interior: {padding: {x: "lg"}, background: "background", foreground: "smart-fb"},
      dimensions: {height: {sm: "32px", md: "40px", lg: "48px"}},
    },
  },
  pageLeftSidebar: {
    surface: {
      interior: {background: "background"},
      boundary: {border: {right: {width: "thin", style: "solid", color: "gray-200"}}},
      dimensions: {width: {sm: "200px", md: "240px", lg: "300px"}},
    },
  },
  pageRightSidebar: {
    surface: {
      interior: {background: "background", padding: {all: "md"}},
      boundary: {border: {left: {width: "thin", style: "solid", color: "gray-200"}}},
      dimensions: {width: {sm: "280px", md: "320px", lg: "420px"}},
    },
  },
  mainRightSidebar: {
    surface: {
      interior: {background: "background", padding: {all: "md"}},
      boundary: {border: {left: {width: "thin", style: "solid", color: "gray-200"}}},
      dimensions: {width: {sm: "260px", md: "320px", lg: "420px"}},
    },
  },
  pageFooter: {
    surface: {
      boundary: {border: {top: {width: "thin", style: "solid", color: "gray-200"}}},
      interior: {background: "background", foreground: "smart-fb", padding: {x: "xl"}},
      dimensions: {height: {md: "56px"}},
    },
  },
  emphasis: {
    primary: {surface: {interior: {background: "secondary", foreground: "smart-fb"}}},
    secondary: {surface: {interior: {background: "gray-100", foreground: "smart-fb"}}},
  },
  mainContainer: {surface: {dimensions: {maxWidth: {xs: "448px", sm: "640px", md: "940px", lg: "1340px"}}}},
  dialog: {surface: {dimensions: {maxWidth: {sm: "480px", md: "640px", lg: "940px"}}}},
  sheet: {
    surface: {
      dimensions: {width: {sm: "320px", md: "420px", lg: "640px", "2xl": "960px", "3xl": "calc(100vw - 48px)"}},
    },
  },
  section: {surface: {interior: {gap: {all: "lg"}}}},
  mainBody: {surface: {interior: {padding: {x: "xl", y: "lg"}}}},
  scrollArea: {scrollbar: {thumbColor: "gray-300", trackColor: "transparent", width: "8px"}},
};
const body = {surface: {interior: {background: "brand-1-gray-100"}}};
// ── SURFACE: the family, then its elements, then what is inside a container ──
const surface: Block = {
  family: {
    interior: {background: "background", foreground: "smart-fb", gap: {all: "md"}, padding: {}},
    boundary: {border: {width: "thin", style: "solid", color: "gray-200"}, radius: {all: "none"}},
    defaultTypography: {typographyType: "body"},
    transition: {duration: "fast", timing: "easeOut"},
    combined: [
      {where: {state: "disabled"}, partialSurface: {interior: {opacity: 0.45}, cursor: "not-allowed"}},
      {
        where: {status: "error"},
        partialSurface: {
          tint: "status-error",
          interior: {background: "background", foreground: "status-error"},
          boundary: {border: {color: "transparent"}},
        },
      },
      {
        where: {status: "success"},
        partialSurface: {
          tint: "status-success",
          interior: {background: "background", foreground: "status-success"},
          boundary: {border: {color: "transparent"}},
        },
      },
      {
        where: {status: "warning"},
        partialSurface: {
          tint: "status-warning",
          interior: {background: "background", foreground: "status-warning"},
          boundary: {border: {color: "transparent"}},
        },
      },
      {
        where: {status: "info"},
        partialSurface: {
          tint: "primary",
          interior: {background: "accent", foreground: "smart-fb"},
          boundary: {border: {color: "transparent"}},
        },
      },
      {
        where: {emphasis: "hero"},
        partialSurface: {
          interior: {background: "secondary", foreground: "smart-fb"},
          boundary: {border: {color: "secondary"}},
        },
      },
      {
        where: {emphasis: "quiet"},
        partialSurface: {
          interior: {background: "transparent", foreground: "gray-600"},
          boundary: {border: {color: "transparent"}},
        },
      },
    ],
  },
  elements: {
    label: {
      surface: {
        interior: {background: "transparent", foreground: "gray-500", padding: {}},
        boundary: {border: {width: "none"}},
        defaultTypography: {typographyType: "numbersExtraSmall", textTransform: "uppercase"},
      },
    },
    fieldDescription: {
      surface: {
        interior: {background: "transparent", foreground: "gray-600", padding: {}},
        boundary: {border: {width: "none"}},
        defaultTypography: {typographyType: "bodySmall"},
      },
    },
    fieldMessage: {
      surface: {
        interior: {background: "transparent", padding: {}},
        boundary: {border: {width: "none"}},
        defaultTypography: {typographyType: "bodySmall"},
      },
    },
    card: {
      interior: {padding: {x: "lg", y: "md", childrenSmartBleed: true}, gap: {all: "none"}},
      boundary: {effect: "card"},
    },
    panel: {interior: {padding: {all: "lg", childrenSmartBleed: true}, gap: {all: "none"}}},
    header: {
      interior: {background: "transparent", foreground: "currentColor", padding: {y: "md"}, gap: {all: "sm"}},
      boundary: {border: {width: "none", bottom: {width: "thin", style: "solid", color: "gray-100"}}},
      defaultTypography: {typographyType: "heading4"},
    },
    content: {
      interior: {background: "transparent", foreground: "currentColor", padding: {y: "md"}},
      boundary: {border: {width: "none"}},
    },
    footer: {
      interior: {background: "transparent", foreground: "currentColor", padding: {y: "sm"}, gap: {all: "sm"}},
      boundary: {border: {width: "none", top: {width: "thin", style: "solid", color: "gray-100"}}},
    },
    tile: {
      interior: {background: "background", foreground: "smart-fb", padding: {all: "md"}, gap: {all: "xs"}},
      boundary: {border: {width: "thin", style: "solid", color: "gray-200"}, radius: {all: "none"}},
      combined: [
        {
          where: {emphasis: "hero"},
          partialSurface: {
            interior: {background: "secondary", foreground: "smart-fb"},
            boundary: {border: {color: "secondary"}},
          },
        },
        {
          where: {emphasis: "quiet"},
          partialSurface: {interior: {background: "background"}, boundary: {border: {color: "transparent"}}},
        },
      ],
    },
    separator: {
      surface: {interior: {background: "gray-200", padding: {}}, boundary: {border: {width: "none"}}},
      height: "1px",
    },
    badge: {
      surface: {
        interior: {background: "background", foreground: "smart-fb", padding: {x: "xs", y: "3xs"}, gap: {all: "xs"}},
        boundary: {border: {width: "thin", style: "solid", color: "gray-300"}},
        defaultTypography: {typographyType: "numbersSmall"},
        combined: [
          {
            where: {status: "error"},
            partialSurface: {
              interior: {background: "status-error", foreground: "smart-fb"},
              boundary: {border: {color: "status-error"}},
            },
          },
          {
            where: {status: "destructive"},
            partialSurface: {
              interior: {background: "status-error", foreground: "smart-fb"},
              boundary: {border: {color: "status-error"}},
            },
          },
          {
            where: {status: "success"},
            partialSurface: {
              tint: "status-success",
              interior: {background: "background", foreground: "status-success"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {status: "warning"},
            partialSurface: {
              tint: "status-warning",
              interior: {background: "background", foreground: "status-warning"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {status: "info"},
            partialSurface: {
              tint: "primary",
              interior: {background: "accent", foreground: "smart-fb"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {emphasis: "primary"},
            partialSurface: {
              interior: {background: "primary", foreground: "smart-fb"},
              boundary: {border: {color: "primary"}},
            },
          },
          {
            where: {emphasis: "primary", status: "error"},
            partialSurface: {
              interior: {background: "status-error", foreground: "smart-fb"},
              boundary: {border: {color: "status-error"}},
            },
          },
          {
            where: {emphasis: "primary", status: "destructive"},
            partialSurface: {
              interior: {background: "status-error", foreground: "smart-fb"},
              boundary: {border: {color: "status-error"}},
            },
          },
          {
            where: {emphasis: "primary", status: "success"},
            partialSurface: {
              tint: "status-success",
              interior: {background: "background", foreground: "status-success"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {emphasis: "primary", status: "warning"},
            partialSurface: {
              tint: "status-warning",
              interior: {background: "background", foreground: "status-warning"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {emphasis: "primary", status: "info"},
            partialSurface: {
              tint: "primary",
              interior: {background: "accent", foreground: "smart-fb"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {emphasis: "quiet"},
            partialSurface: {
              interior: {background: "transparent", foreground: "gray-500"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {where: {scale: "3xs"}, partialSurface: {interior: {padding: {all: "none"}}}},
          {
            where: {scale: "2xs"},
            partialSurface: {
              interior: {padding: {x: "2xs", y: "none"}},
              defaultTypography: {typographyType: "numbersExtraSmall"},
            },
          },
          {
            where: {scale: "xs"},
            partialSurface: {
              interior: {padding: {x: "xs", y: "3xs"}},
              defaultTypography: {typographyType: "numbersExtraSmall"},
            },
          },
          {
            where: {scale: "sm"},
            partialSurface: {
              interior: {padding: {x: "xs", y: "3xs"}},
              defaultTypography: {typographyType: "numbersSmall"},
            },
          },
          {
            where: {scale: "md"},
            partialSurface: {
              interior: {padding: {x: "xs", y: "2xs"}},
              defaultTypography: {typographyType: "numbersSmall"},
            },
          },
          {
            where: {scale: "lg"},
            partialSurface: {interior: {padding: {x: "sm", y: "2xs"}}, defaultTypography: {typographyType: "numbers"}},
          },
          {
            where: {scale: "xl"},
            partialSurface: {interior: {padding: {x: "sm", y: "xs"}}, defaultTypography: {typographyType: "numbers"}},
          },
        ],
        dimensions: {width: {"3xs": "8px", "2xs": "auto"}, height: {"3xs": "8px", "2xs": "auto"}},
      },
    },
    avatar: {
      surface: {
        interior: {
          background: "primary",
          foreground: "smart-fb",
          padding: {all: "none"},
          childAlign: {horizontal: "center", vertical: "center"},
        },
        boundary: {radius: {all: "full"}, border: {width: "none"}},
        defaultTypography: {typographyType: "numbersSmall"},
        dimensions: {
          width: {"2xs": "20px", xs: "24px", sm: "32px", md: "40px", lg: "48px", xl: "64px"},
          height: {"2xs": "20px", xs: "24px", sm: "32px", md: "40px", lg: "48px", xl: "64px"},
        },
        combined: [
          {
            where: {scale: "2xs"},
            partialSurface: {
              interior: {padding: {all: "none"}},
              defaultTypography: {typographyType: "numbersExtraSmall"},
            },
          },
          {
            where: {scale: "xs"},
            partialSurface: {
              interior: {padding: {all: "none"}},
              defaultTypography: {typographyType: "numbersExtraSmall"},
            },
          },
          {
            where: {scale: "sm"},
            partialSurface: {
              interior: {padding: {all: "none"}},
              defaultTypography: {typographyType: "numbersSmall"},
            },
          },
          {
            where: {scale: "md"},
            partialSurface: {
              interior: {padding: {all: "none"}},
              defaultTypography: {typographyType: "numbersSmall"},
            },
          },
          {
            where: {scale: "lg"},
            partialSurface: {
              interior: {padding: {all: "none"}},
              defaultTypography: {typographyType: "numbers"},
            },
          },
          {
            where: {scale: "xl"},
            partialSurface: {
              interior: {padding: {all: "none"}},
              defaultTypography: {typographyType: "numbers"},
            },
          },
        ],
      },
    },
    progress: {
      surface: {
        interior: {background: "gray-100", padding: {}},
        boundary: {border: {width: "none"}},
        dimensions: {height: {md: "4px"}},
      },
    },
    progressInner: {interior: {background: "primary"}},
    skeleton: {surface: {interior: {background: "gray-100"}, boundary: {border: {width: "none"}}}},
    spinner: {
      surface: {
        interior: {foreground: "primary", background: "transparent", padding: {all: "none"}},
        boundary: {border: {width: "none"}},
        combined: [
          {
            where: {status: "error"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "transparent", backgroundAlpha: 1, foreground: "status-error"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {status: "destructive"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "transparent", backgroundAlpha: 1, foreground: "status-error"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {status: "warning"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "transparent", backgroundAlpha: 1, foreground: "status-warning"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {status: "success"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "transparent", backgroundAlpha: 1, foreground: "status-success"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {status: "info"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "transparent", backgroundAlpha: 1, foreground: "primary"},
              boundary: {border: {color: "transparent"}},
            },
          },
        ],
      },
    },
    checkboxInner: {
      interior: {background: "transparent", foreground: "currentColor", padding: {all: "none"}},
      boundary: {border: {width: "none"}, radius: {all: "none"}},
    },
    radioInner: {
      interior: {background: "transparent", foreground: "primary", padding: {all: "none"}},
      boundary: {border: {width: "none"}, radius: {all: "full"}},
    },
    tabPanel: {
      interior: {background: "transparent", padding: {x: "none", y: "md"}},
      boundary: {border: {width: "none"}, radius: {all: "none"}},
    },
    treeViewGroup: {
      surface: {
        interior: {background: "transparent", padding: {left: "md"}, gap: {all: "none"}},
        boundary: {border: {width: "none"}},
      },
    },
    calendar: {
      surface: {
        interior: {background: "transparent", padding: {all: "none"}, gap: {all: "none"}},
        boundary: {border: {width: "none"}, radius: {all: "none"}, effect: "none"},
      },
    },
    group: {
      surface: {
        interior: {background: "transparent", padding: {all: "none"}, gap: {all: "none"}},
        boundary: {border: {width: "none"}, radius: {all: "none"}, effect: "none"},
      },
    },
    alert: {surface: {interior: {padding: {x: "md", y: "sm"}, gap: {all: "sm"}}}},
    breadcrumbSeparator: {
      surface: {
        interior: {background: "transparent", foreground: "gray-400", padding: {}},
        boundary: {border: {width: "none"}},
      },
    },
    listDraggableGroup: {
      interior: {background: "transparent", padding: {left: "xl"}, gap: {all: "xs"}},
      boundary: {border: {width: "none"}},
    },
    listDraggableGhost: {
      interior: {background: "gray-100", padding: {}},
      boundary: {border: {width: "thin", style: "dashed", color: "gray-300"}, radius: {all: "none"}},
    },
    listTreeGhost: {
      interior: {background: "gray-100", padding: {}},
      boundary: {border: {width: "thin", style: "dashed", color: "gray-300"}, radius: {all: "none"}},
    },
    otpSeparator: {
      surface: {
        interior: {background: "transparent", foreground: "gray-400", padding: {x: "xs"}},
        boundary: {border: {width: "none"}},
      },
    },
    inputGroupAddon: {
      surface: {
        interior: {background: "transparent", foreground: "gray-600", padding: {x: "xs", y: "none"}},
        boundary: {border: {width: "none"}, radius: {all: "none"}},
        defaultTypography: {typographyType: "bodySmall"},
      },
    },
  },
  contextual: {accordionItem: {content: {interior: {padding: {x: "md", y: "sm"}}}}},
};
// ── CONTROL: the family, then its elements ──
const control: Block = {
  family: {
    surface: {
      interior: {background: "background", foreground: "smart-fb", padding: {x: "md", y: "sm"}, gap: {all: "sm"}},
      boundary: {border: {width: "thin", style: "solid", color: "gray-300"}, radius: {all: "none"}},
      defaultTypography: {typographyType: "body"},
      cursor: "pointer",
      combined: [
        {
          where: {emphasis: "hero"},
          partialSurface: {
            tint: "secondary",
            interior: {background: "tint", foreground: "main-white"},
            boundary: {border: {color: "transparent"}},
          },
        },
        {
          where: {emphasis: "primary"},
          partialSurface: {
            tint: "primary",
            interior: {background: "tint", foreground: "main-white"},
            boundary: {border: {color: "transparent"}},
          },
        },
        {
          where: {emphasis: "secondary"},
          partialSurface: {
            interior: {background: "background", foreground: "smart-fb"},
            boundary: {border: {color: "gray-300"}},
          },
        },
        {
          where: {emphasis: "tertiary"},
          partialSurface: {
            interior: {background: "transparent", foreground: "primary"},
            boundary: {border: {color: "transparent"}},
          },
        },
        {
          where: {emphasis: "quiet"},
          partialSurface: {
            interior: {background: "transparent", foreground: "gray-600"},
            boundary: {border: {color: "transparent"}},
          },
        },
        {
          where: {status: "error"},
          partialSurface: {
            tint: "status-error",
            interior: {foreground: "status-error"},
            boundary: {border: {color: "status-error"}},
          },
        },
        {
          where: {status: "destructive"},
          partialSurface: {
            tint: "status-error",
            interior: {foreground: "status-error"},
            boundary: {border: {color: "status-error"}},
          },
        },
        {
          where: {status: "success"},
          partialSurface: {
            tint: "status-success",
            interior: {foreground: "status-success"},
            boundary: {border: {color: "status-success"}},
          },
        },
        {
          where: {status: "warning"},
          partialSurface: {
            tint: "status-warning",
            interior: {foreground: "status-warning"},
            boundary: {border: {color: "status-warning"}},
          },
        },
        {
          where: {status: "info"},
          partialSurface: {tint: "primary", interior: {foreground: "primary"}, boundary: {border: {color: "primary"}}},
        },
        {
          where: {emphasis: "primary", status: "error"},
          partialSurface: {
            interior: {background: "tint", foreground: "main-white"},
            boundary: {border: {color: "transparent"}},
          },
        },
        {
          where: {emphasis: "primary", status: "destructive"},
          partialSurface: {
            interior: {background: "tint", foreground: "main-white"},
            boundary: {border: {color: "transparent"}},
          },
        },
        {
          where: {emphasis: "primary", status: "success"},
          partialSurface: {
            interior: {background: "tint", foreground: "main-white"},
            boundary: {border: {color: "transparent"}},
          },
        },
        {
          where: {emphasis: "primary", status: "warning"},
          partialSurface: {
            interior: {background: "tint", foreground: "main-white"},
            boundary: {border: {color: "transparent"}},
          },
        },
        {
          where: {emphasis: "primary", status: "info"},
          partialSurface: {
            interior: {background: "tint", foreground: "main-white"},
            boundary: {border: {color: "transparent"}},
          },
        },
        {
          where: {state: "hover"},
          partialSurface: {interior: {background: "background"}, boundary: {border: {color: "gray-500"}}},
        },
        {
          where: {emphasis: "primary", state: "hover"},
          partialSurface: {
            interior: {background: "primary", foreground: "smart-fb"},
            boundary: {border: {color: "transparent"}},
          },
        },
        {
          where: {emphasis: "hero", state: "hover"},
          partialSurface: {
            interior: {background: "primary", foreground: "smart-fb"},
            boundary: {border: {color: "transparent"}},
          },
        },
        {
          where: {emphasis: "tertiary", state: "hover"},
          partialSurface: {
            interior: {background: "accent", foreground: "smart-fb"},
            boundary: {border: {color: "transparent"}},
          },
        },
        {
          where: {emphasis: "quiet", state: "hover"},
          partialSurface: {
            interior: {background: "gray-100", foreground: "smart-fb"},
            boundary: {border: {color: "transparent"}},
          },
        },
        {where: {state: "active"}, partialSurface: {interior: {background: "gray-100"}}},
        {
          where: {state: "selected"},
          partialSurface: {
            interior: {background: "accent", foreground: "smart-fb"},
            boundary: {border: {color: "primary"}},
          },
        },
        {
          where: {state: "selected", status: "error"},
          partialSurface: {
            interior: {background: "status-error", foreground: "smart-fb"},
            boundary: {border: {color: "status-error"}},
          },
        },
        {
          where: {state: "selected", status: "destructive"},
          partialSurface: {
            interior: {background: "status-error", foreground: "smart-fb"},
            boundary: {border: {color: "status-error"}},
          },
        },
        {
          where: {state: "selected", status: "success"},
          partialSurface: {
            interior: {background: "status-success", foreground: "smart-fb"},
            boundary: {border: {color: "status-success"}},
          },
        },
        {
          where: {state: "selected", status: "warning"},
          partialSurface: {
            interior: {background: "status-warning", foreground: "smart-fb"},
            boundary: {border: {color: "status-warning"}},
          },
        },
        {
          where: {state: "selected", status: "info"},
          partialSurface: {
            interior: {background: "primary", foreground: "smart-fb"},
            boundary: {border: {color: "primary"}},
          },
        },
        {
          where: {state: "focus"},
          partialSurface: {boundary: {outline: {width: "thin", style: "solid", color: "primary", offset: "1px"}}},
        },
        {where: {state: "disabled"}, partialSurface: {interior: {opacity: 0.45}, cursor: "not-allowed"}},
        {where: {state: "loading"}, partialSurface: {cursor: "progress", interior: {opacity: 0.7}}},
        {
          where: {scale: "3xs"},
          partialSurface: {
            interior: {padding: {x: "2xs", y: "3xs"}},
            defaultTypography: {typographyType: "bodyExtraSmall"},
          },
          icon: {size: "3xs"},
        },
        {
          where: {scale: "2xs"},
          partialSurface: {
            interior: {padding: {x: "xs", y: "2xs"}},
            defaultTypography: {typographyType: "bodyExtraSmall"},
          },
          icon: {size: "2xs"},
        },
        {
          where: {scale: "xs"},
          partialSurface: {
            interior: {padding: {x: "xs", y: "xs"}},
            defaultTypography: {typographyType: "bodyExtraSmall"},
          },
          icon: {size: "xs"},
        },
        {
          where: {scale: "sm"},
          partialSurface: {interior: {padding: {x: "sm", y: "xs"}}, defaultTypography: {typographyType: "bodySmall"}},
          icon: {size: "xs"},
        },
        {
          where: {scale: "md"},
          partialSurface: {interior: {padding: {x: "md", y: "sm"}}, defaultTypography: {typographyType: "body"}},
          icon: {size: "sm"},
        },
        {
          where: {scale: "lg"},
          partialSurface: {interior: {padding: {x: "lg", y: "sm"}}, defaultTypography: {typographyType: "bodyLarge"}},
          icon: {size: "md"},
        },
        {
          where: {scale: "xl"},
          partialSurface: {
            interior: {padding: {x: "xl", y: "md"}},
            defaultTypography: {typographyType: "bodyExtraLarge"},
          },
          icon: {size: "lg"},
        },
        {
          where: {scale: "2xl"},
          partialSurface: {
            interior: {padding: {x: "xl", y: "md"}},
            defaultTypography: {typographyType: "bodyExtraLarge"},
          },
          icon: {size: "lg"},
        },
        {
          where: {scale: "3xl"},
          partialSurface: {
            interior: {padding: {x: "xl", y: "md"}},
            defaultTypography: {typographyType: "bodyExtraLarge"},
          },
          icon: {size: "lg"},
        },
      ],
    },
  },
  elements: {
    chip: {
      surface: {
        interior: {background: "accent", foreground: "smart-fb", padding: {x: "xs", y: "3xs"}, gap: {all: "xs"}},
        boundary: {border: {width: "thin", style: "solid", color: "gray-300"}},
        defaultTypography: {typographyType: "numbersExtraSmall", textTransform: "uppercase"},
        combined: [
          {where: {state: "hover"}, partialSurface: {boundary: {border: {color: "primary"}}}},
          {
            where: {state: "selected"},
            partialSurface: {
              interior: {background: "primary", foreground: "smart-fb"},
              boundary: {border: {color: "primary"}},
            },
          },
          {where: {scale: "xs"}, partialSurface: {interior: {padding: {x: "xs", y: "3xs"}}}},
          {where: {scale: "sm"}, partialSurface: {interior: {padding: {x: "xs", y: "3xs"}}}},
          {where: {scale: "md"}, partialSurface: {interior: {padding: {x: "sm", y: "2xs"}}}},
          {
            where: {scale: "lg"},
            partialSurface: {
              interior: {padding: {x: "sm", y: "xs"}},
              defaultTypography: {typographyType: "numbersSmall"},
            },
          },
          {
            where: {scale: "xl"},
            partialSurface: {interior: {padding: {x: "md", y: "xs"}}, defaultTypography: {typographyType: "numbers"}},
          },
        ],
      },
    },
    button: {surface: {interior: {gap: {all: "sm"}}, defaultTypography: {typographyType: "body"}}},
    switch: {
      track: {
        dimensions: {width: {md: "30px"}, height: {md: "17px"}},
        interior: {background: "gray-300", padding: {all: "none"}},
        boundary: {radius: {all: "none"}, border: {width: "none"}},
        combined: [
          {
            where: {emphasis: "primary"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "gray-300", backgroundAlpha: 1},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {emphasis: "primary", state: "hover"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "gray-400", backgroundAlpha: 1},
              boundary: {border: {color: "transparent"}},
            },
          },
          {where: {state: "selected"}, partialSurface: {interior: {background: "primary"}}},
          {
            where: {emphasis: "primary", state: "selected"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "primary", backgroundAlpha: 1},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {emphasis: "primary", state: "disabled"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "gray-300", backgroundAlpha: 1, opacity: 0.45},
              boundary: {border: {color: "transparent"}},
            },
          },
        ],
      },
      thumb: {
        dimensions: {width: {md: "13px"}, height: {md: "13px"}},
        position: {shift: {x: "3px", y: "0px"}},
        interior: {background: "background"},
        boundary: {radius: {all: "none"}, border: {width: "none"}},
        combined: [{where: {state: "selected"}, partialSurface: {position: {shift: {x: "3px", y: "0px"}}}}],
      },
    },
    checkbox: {
      surface: {
        interior: {
          background: "background",
          foreground: "smart-fb",
          padding: {all: "none"},
          childAlign: {horizontal: "center", vertical: "center"},
        },
        boundary: {border: {width: "thin", style: "solid", color: "gray-500"}, radius: {all: "none"}},
        dimensions: {
          width: {xs: "12px", sm: "14px", md: "16px", lg: "20px", xl: "24px"},
          height: {xs: "12px", sm: "14px", md: "16px", lg: "20px", xl: "24px"},
        },
        combined: [
          {
            where: {emphasis: "primary"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "background", backgroundAlpha: 1, foreground: "smart-fb"},
              boundary: {border: {color: "gray-500"}},
            },
          },
          {
            where: {state: "hover"},
            partialSurface: {interior: {background: "background"}, boundary: {border: {color: "primary"}}},
          },
          {
            where: {emphasis: "primary", state: "hover"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "background", backgroundAlpha: 1},
              boundary: {border: {color: "primary"}},
            },
          },
          {
            where: {state: "selected"},
            partialSurface: {
              interior: {background: "primary", foreground: "smart-fb"},
              boundary: {border: {color: "primary"}},
            },
          },
          {
            where: {emphasis: "primary", state: "selected"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "primary", backgroundAlpha: 1, foreground: "smart-fb"},
              boundary: {border: {color: "primary"}},
            },
          },
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
        interior: {background: "background", padding: {all: "none"}},
        boundary: {border: {width: "thin", style: "solid", color: "gray-500"}, radius: {all: "full"}},
        dimensions: {
          width: {xs: "12px", sm: "14px", md: "16px", lg: "20px", xl: "24px"},
          height: {xs: "12px", sm: "14px", md: "16px", lg: "20px", xl: "24px"},
        },
        combined: [
          {
            where: {emphasis: "primary"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "background", backgroundAlpha: 1, foreground: "smart-fb"},
              boundary: {border: {color: "gray-500"}},
            },
          },
          {
            where: {state: "hover"},
            partialSurface: {interior: {background: "background"}, boundary: {border: {color: "primary"}}},
          },
          {
            where: {emphasis: "primary", state: "hover"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "background", backgroundAlpha: 1, foreground: "smart-fb"},
              boundary: {border: {color: "primary"}},
            },
          },
          {where: {state: "selected"}, partialSurface: {boundary: {border: {width: "thin", color: "primary"}}}},
          {
            where: {emphasis: "primary", state: "selected"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "background", backgroundAlpha: 1, foreground: "primary"},
              boundary: {border: {width: "thin", color: "primary"}},
            },
          },
        ],
      },
    },
    tabTrigger: {
      surface: {
        interior: {background: "transparent", foreground: "gray-600", padding: {x: "none", y: "sm"}},
        boundary: {border: {width: "none", bottom: {width: "thick", style: "solid", color: "transparent"}}},
        combined: [
          {
            where: {state: "hover"},
            partialSurface: {
              interior: {background: "transparent", foreground: "smart-fb"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {state: "selected"},
            partialSurface: {
              interior: {background: "transparent", foreground: "smart-fb"},
              boundary: {border: {bottom: {color: "primary"}}},
            },
          },
        ],
      },
    },
    treeViewItem: {
      surface: {
        interior: {background: "transparent", foreground: "smart-fb", padding: {x: "xs", y: "2xs"}, gap: {all: "xs"}},
        boundary: {border: {width: "none"}, radius: {all: "none"}},
        combined: [
          {
            where: {emphasis: "primary"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "transparent", backgroundAlpha: 1, foreground: "smart-fb"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {state: "hover"},
            partialSurface: {interior: {background: "gray-100"}, boundary: {border: {color: "transparent"}}},
          },
          {
            where: {state: "selected"},
            partialSurface: {
              tint: "primary",
              interior: {background: "background", backgroundAlpha: 1, foreground: "smart-fb"},
              boundary: {border: {color: "transparent"}},
            },
          },
        ],
      },
    },
    breadcrumbItem: {
      surface: {
        interior: {background: "transparent", foreground: "gray-600", padding: {x: "xs", y: "2xs"}, gap: {all: "xs"}},
        boundary: {border: {width: "none"}, radius: {all: "none"}},
        defaultTypography: {typographyType: "bodySmall"},
        combined: [
          {
            where: {emphasis: "primary"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "transparent", backgroundAlpha: 1, foreground: "gray-600"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {state: "hover"},
            partialSurface: {
              interior: {background: "transparent", foreground: "primary"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {state: "selected"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "transparent", backgroundAlpha: 1, foreground: "smart-fb"},
              boundary: {border: {color: "transparent"}},
            },
          },
        ],
      },
    },
    sidebarItem: {
      surface: {
        interior: {
          background: "transparent",
          foreground: "gray-600",
          padding: {x: "lg", y: "sm"},
          gap: {all: "sm"},
          childAlign: {horizontal: "start", vertical: "center"},
        },
        boundary: {
          border: {width: "none", left: {width: "thick", style: "solid", color: "transparent"}},
          radius: {all: "none"},
        },
        combined: [
          {
            where: {state: "hover"},
            partialSurface: {
              interior: {background: "background", foreground: "smart-fb"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {state: "selected"},
            partialSurface: {
              interior: {background: "background", foreground: "smart-fb"},
              boundary: {border: {left: {color: "primary"}}},
            },
          },
          {
            where: {emphasis: "primary"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "transparent", backgroundAlpha: 1, foreground: "gray-600"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {emphasis: "primary", state: "hover"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "background", backgroundAlpha: 1, foreground: "smart-fb"},
              boundary: {border: {color: "transparent"}},
            },
          },
          {
            where: {emphasis: "primary", state: "selected"},
            partialSurface: {
              tint: "transparent",
              interior: {background: "background", backgroundAlpha: 1, foreground: "smart-fb"},
              boundary: {border: {color: "transparent", left: {color: "primary"}}},
            },
          },
        ],
      },
    },
    listDraggableRow: {
      surface: {
        interior: {background: "background", foreground: "smart-fb", padding: {x: "md", y: "sm"}},
        boundary: {border: {width: "thin", style: "solid", color: "gray-200"}, radius: {all: "none"}},
        combined: [
          {where: {state: "hover"}, partialSurface: {boundary: {border: {color: "gray-300"}}}},
          {
            where: {state: "selected"},
            partialSurface: {
              tint: "primary",
              interior: {background: "background"},
              boundary: {border: {color: "primary"}},
            },
          },
        ],
      },
    },
    listDraggableHandle: {
      surface: {
        interior: {background: "transparent", foreground: "gray-400", padding: {all: "2xs"}},
        boundary: {border: {width: "none"}, radius: {all: "none"}},
        cursor: "grab",
        combined: [
          {where: {state: "hover"}, partialSurface: {interior: {foreground: "gray-700"}}},
          {where: {state: "active"}, partialSurface: {interior: {foreground: "primary"}, cursor: "grabbing"}},
          {where: {state: "focus"}, partialSurface: {interior: {foreground: "primary"}}},
        ],
      },
    },
    listTreeRow: {
      surface: {
        interior: {background: "transparent", foreground: "smart-fb", padding: {x: "xs", y: "2xs"}},
        boundary: {border: {width: "none"}, radius: {all: "none"}},
        combined: [
          {where: {state: "hover"}, partialSurface: {interior: {background: "gray-100"}}},
          {where: {state: "selected"}, partialSurface: {tint: "primary", interior: {background: "background"}}},
        ],
      },
    },
    listTreeToggle: {
      surface: {
        interior: {background: "transparent", foreground: "gray-400", padding: {all: "2xs"}},
        boundary: {border: {width: "none"}, radius: {all: "none"}},
        cursor: "pointer",
        combined: [
          {where: {state: "hover"}, partialSurface: {interior: {foreground: "gray-700"}}},
          {where: {state: "focus"}, partialSurface: {interior: {foreground: "primary"}}},
        ],
      },
    },
    listTreeHandle: {
      surface: {
        interior: {background: "transparent", foreground: "gray-400", padding: {all: "2xs"}},
        boundary: {border: {width: "none"}, radius: {all: "none"}},
        cursor: "grab",
        combined: [
          {where: {state: "hover"}, partialSurface: {interior: {foreground: "gray-700"}}},
          {where: {state: "active"}, partialSurface: {interior: {foreground: "primary"}, cursor: "grabbing"}},
          {where: {state: "focus"}, partialSurface: {interior: {foreground: "primary"}}},
        ],
      },
    },
    listItem: {
      surface: {
        interior: {background: "transparent", padding: {y: "sm"}, gap: {all: "sm"}},
        boundary: {border: {width: "thin", style: "solid", color: "gray-200"}, radius: {all: "none"}},
        combined: [
          {
            where: {state: "hover"},
            partialSurface: {interior: {background: "background"}, boundary: {border: {color: "gray-100"}}},
          },
          {
            where: {state: "selected"},
            partialSurface: {
              interior: {background: "accent", foreground: "smart-fb"},
              boundary: {border: {color: "gray-100"}},
            },
          },
        ],
      },
    },
    menuItem: {
      surface: {
        interior: {background: "transparent", padding: {x: "md", y: "sm"}},
        boundary: {border: {width: "none"}, radius: {all: "none"}},
        combined: [
          {where: {state: "hover"}, partialSurface: {interior: {background: "gray-100", foreground: "smart-fb"}}},
          {
            where: {state: "focus"},
            partialSurface: {interior: {background: "gray-100"}, boundary: {outline: {width: "none", style: "none"}}},
          },
          {where: {state: "selected"}, partialSurface: {interior: {background: "accent", foreground: "smart-fb"}}},
          {where: {status: "destructive"}, partialSurface: {interior: {foreground: "status-error"}}},
        ],
      },
    },
    accordionTrigger: {
      surface: {
        interior: {background: "gray-50", padding: {x: "md", y: "sm"}},
        boundary: {border: {width: "none"}},
        defaultTypography: {typographyType: "heading4"},
      },
    },
  },
};
// ── CONTROL GROUP: the family, then its elements, then what is inside a container ──
const controlGroup: Block = {
  family: {
    surface: {
      interior: {background: "transparent", gap: {all: "none"}, padding: {}},
      boundary: {border: {width: "none"}},
    },
  },
  elements: {
    // the bar at the top of a shell: its height and its side inset. It leaves by sliding up: it loses its height while its row (the concept topbar-row),
    // which keeps its own, stands on its bottom edge
    topbar: {
      surface: {
        interior: {background: "background", padding: {x: "lg"}, childAlign: {horizontal: "start", vertical: "end"}},
        dimensions: {height: {md: "56px"}},
        transition: {property: "height", duration: "slow", timing: "easeInOut"},
      },
    },
    choiceGroup: {
      surface: {
        interior: {background: "transparent", gap: {all: "sm"}, padding: {}},
        boundary: {border: {width: "none"}},
      },
    },
    tabBar: {
      surface: {
        boundary: {border: {width: "none", bottom: {width: "thin", style: "solid", color: "gray-200"}}},
        interior: {gap: {all: "lg"}},
      },
    },
    breadcrumb: {
      surface: {
        interior: {background: "transparent", padding: {}, gap: {all: "xs"}},
        boundary: {border: {width: "none"}},
      },
    },
    sidebar: {
      surface: {
        transition: {property: "width", duration: "slow", timing: "easeInOut"},
        interior: {background: "background", padding: {y: "sm"}, gap: {all: "2xs"}},
        boundary: {border: {right: {width: "thin", style: "solid", color: "gray-200"}}},
        dimensions: {width: {md: "240px"}},
        combined: [{where: {state: "collapsed"}, partialSurface: {dimensions: {width: {md: "56px"}}}}],
      },
    },
  },
  contextual: {
    sidebar: {
      header: {interior: {padding: {x: "sm", y: "md"}, gap: {all: "xs"}}},
      content: {interior: {padding: {x: "sm", y: "sm"}}},
      footer: {interior: {padding: {x: "sm", y: "sm"}, background: "transparent"}},
      sidebarItem: {interior: {padding: {x: "md", y: "sm"}, gap: {all: "md"}}},
    },
  },
};
// ── FIELD: the family, then its elements ──
const field: Block = {
  family: {
    surface: {
      interior: {background: "background", foreground: "smart-fb", padding: {x: "sm", y: "sm"}, gap: {all: "sm"}},
      boundary: {border: {width: "thin", style: "solid", color: "gray-300"}},
      cursor: "text",
      combined: [
        {where: {state: "hover"}, partialSurface: {boundary: {border: {color: "gray-500"}}}},
        {
          where: {state: "focus"},
          partialSurface: {
            boundary: {
              border: {color: "primary"},
              outline: {width: "thin", style: "solid", color: "primary", offset: "0px"},
            },
          },
        },
        {where: {status: "error"}, partialSurface: {tint: "status-error", boundary: {border: {color: "status-error"}}}},
        {
          where: {status: "success"},
          partialSurface: {tint: "status-success", boundary: {border: {color: "status-success"}}},
        },
        {
          where: {status: "warning"},
          partialSurface: {tint: "status-warning", boundary: {border: {color: "status-warning"}}},
        },
        {
          where: {state: "disabled"},
          partialSurface: {interior: {background: "background", opacity: 0.6}, cursor: "not-allowed"},
        },
        {
          where: {scale: "3xs"},
          partialSurface: {
            interior: {padding: {x: "2xs", y: "3xs"}},
            defaultTypography: {typographyType: "bodyExtraSmall"},
          },
        },
        {
          where: {scale: "2xs"},
          partialSurface: {
            interior: {padding: {x: "xs", y: "2xs"}},
            defaultTypography: {typographyType: "bodyExtraSmall"},
          },
        },
        {
          where: {scale: "xs"},
          partialSurface: {interior: {padding: {x: "xs", y: "xs"}}, defaultTypography: {typographyType: "bodySmall"}},
        },
        {
          where: {scale: "sm"},
          partialSurface: {interior: {padding: {x: "sm", y: "xs"}}, defaultTypography: {typographyType: "bodySmall"}},
        },
        {
          where: {scale: "md"},
          partialSurface: {interior: {padding: {x: "sm", y: "sm"}}, defaultTypography: {typographyType: "body"}},
        },
        {
          where: {scale: "lg"},
          partialSurface: {interior: {padding: {x: "md", y: "sm"}}, defaultTypography: {typographyType: "bodyLarge"}},
        },
        {
          where: {scale: "xl"},
          partialSurface: {
            interior: {padding: {x: "lg", y: "md"}},
            defaultTypography: {typographyType: "bodyExtraLarge"},
          },
        },
        {
          where: {scale: "2xl"},
          partialSurface: {
            interior: {padding: {x: "lg", y: "md"}},
            defaultTypography: {typographyType: "bodyExtraLarge"},
          },
        },
        {
          where: {scale: "3xl"},
          partialSurface: {
            interior: {padding: {x: "lg", y: "md"}},
            defaultTypography: {typographyType: "bodyExtraLarge"},
          },
        },
      ],
    },
    placeholderColor: "gray-500",
    placeholderOpacity: 1,
    caretColor: "primary",
  },
  elements: {
    fileUpload: {
      surface: {
        interior: {
          background: "background",
          foreground: "gray-600",
          padding: {all: "xl"},
          childAlign: {horizontal: "center", vertical: "center"},
        },
        boundary: {border: {width: "default", style: "dashed", color: "gray-300"}},
        cursor: "pointer",
        combined: [
          {
            where: {state: "selected"},
            partialSurface: {
              tint: "primary",
              boundary: {border: {color: "primary"}},
              interior: {background: "background"},
            },
          },
        ],
      },
    },
    otp: {
      surface: {
        interior: {background: "transparent", padding: {all: "none"}, gap: {all: "xs"}},
        boundary: {border: {width: "none"}, radius: {all: "none"}},
      },
    },
    otpSlot: {
      surface: {
        interior: {
          background: "background",
          foreground: "smart-fb",
          padding: {all: "none"},
          childAlign: {horizontal: "center", vertical: "center"},
        },
        boundary: {border: {width: "thin", style: "solid", color: "gray-300"}, radius: {all: "none"}},
        dimensions: {width: {md: "36px"}, height: {md: "40px"}},
        defaultTypography: {typographyType: "numbers", textAlign: "center"},
        combined: [
          {
            where: {state: "selected"},
            partialSurface: {
              boundary: {
                border: {color: "primary"},
                outline: {width: "thin", style: "solid", color: "primary", offset: "0px"},
              },
            },
          },
          {where: {state: "focus"}, partialSurface: {boundary: {border: {color: "primary"}}}},
        ],
      },
    },
    select: {surface: {cursor: "pointer"}},
  },
};
// ── OVERLAY: the family, then its elements, then what is inside a container ──
const overlay: Block = {
  family: {
    surface: {
      interior: {background: "background"},
      boundary: {effect: "sheet", border: {width: "thin", style: "solid", color: "gray-200"}},
    },
    overlay: {scrimColor: "secondary", scrimOpacity: 0.45, scrimBlur: "xs"},
  },
  elements: {
    listDraggableOverlay: {
      surface: {
        interior: {background: "background"},
        boundary: {effect: "sheet", border: {width: "thin", style: "solid", color: "primary"}},
      },
    },
    listTreeOverlay: {
      surface: {
        interior: {background: "background"},
        boundary: {effect: "sheet", border: {width: "thin", style: "solid", color: "primary"}},
      },
    },
    dropdownMenu: {surface: {interior: {padding: {all: "sm", childrenSmartBleed: true}, gap: {all: "none"}}}},
    dialog: {surface: {interior: {padding: {x: "lg", y: "md", childrenSmartBleed: true}, gap: {all: "none"}}}},
    alertDialog: {surface: {interior: {padding: {x: "lg", y: "md", childrenSmartBleed: true}, gap: {all: "none"}}}},
    sheet: {
      surface: {
        boundary: {effect: "drawer", border: {width: "none"}},
        interior: {padding: {x: "lg", y: "md", childrenSmartBleed: true}, gap: {all: "none"}},
      },
    },
    popover: {surface: {boundary: {effect: "popover"}, interior: {padding: {all: "sm"}, gap: {all: "sm"}}}},
    hoverCard: {surface: {boundary: {effect: "popover"}, interior: {padding: {all: "md"}, gap: {all: "none"}}}},
    tooltip: {
      surface: {
        interior: {background: "secondary", foreground: "smart-fb", padding: {x: "sm", y: "xs"}},
        boundary: {border: {width: "none"}, effect: "card"},
        defaultTypography: {typographyType: "bodySmall"},
      },
    },
    toast: {surface: {interior: {padding: {x: "md", y: "sm"}}, boundary: {effect: "sheet"}}},
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
    surface: {interior: {gap: {all: "none"}, padding: {}}},
    row: {
      interior: {padding: {y: "sm"}},
      combined: [
        {where: {state: "hover"}, partialSurface: {interior: {background: "background"}}},
        {where: {state: "selected"}, partialSurface: {tint: "primary", interior: {background: "background"}}},
      ],
    },
  },
  elements: {
    treeView: {
      surface: {
        interior: {background: "transparent", padding: {}, gap: {all: "none"}},
        boundary: {border: {width: "none"}},
      },
    },
    list: {surface: {interior: {padding: {x: "lg", childrenSmartBleed: true}, gap: {all: "md"}}}},
    listDraggable: {surface: {interior: {gap: {all: "xs"}}}},
    listTree: {surface: {interior: {gap: {all: "none"}}}},
  },
  contextual: {
    menu: {
      label: {
        interior: {background: "transparent", foreground: "smart-fb", padding: {x: "md", y: "xs"}},
        boundary: {border: {width: "none"}},
        defaultTypography: {typographyType: "heading4", textTransform: "none"},
      },
      separator: {interior: {background: "gray-200"}},
    },
  },
};
// ── TABLE: the family, then its elements ──
const table: Block = {
  elements: {
    tableHeaderCell: {
      interior: {padding: {x: "lg", y: "xs"}, foreground: "gray-500", background: "transparent"},
      boundary: {border: {width: "none", bottom: {width: "thin", style: "solid", color: "gray-200"}}},
      defaultTypography: {typographyType: "numbersExtraSmall", textTransform: "uppercase", textAlign: "left"},
    },
    tableRoot: {boundary: {border: {width: "none"}}, interior: {background: "transparent", padding: {}}},
    tableRow: {
      boundary: {border: {width: "none", bottom: {width: "thin", style: "solid", color: "gray-100"}}},
      interior: {background: "transparent"},
      combined: [
        {where: {state: "hover"}, partialSurface: {interior: {background: "background"}}},
        {where: {state: "selected"}, partialSurface: {tint: "primary", interior: {background: "background"}}},
      ],
    },
    tableCell: {
      interior: {padding: {x: "lg", y: "sm"}},
      boundary: {border: {width: "none"}},
      defaultTypography: {typographyType: "body"},
    },
    tableFooterCell: {
      interior: {padding: {x: "lg", y: "md"}, background: "transparent"},
      boundary: {border: {width: "none"}},
      defaultTypography: {typographyType: "bodySmall"},
    },
  },
};
// ── SHAPE: the family, then its elements ──
const shape: Block = {
  family: {
    surface: {
      interior: {foreground: "currentColor", background: "transparent", padding: {}},
      boundary: {border: {width: "none"}},
    },
  },
  elements: {
    icon: {},
    listDraggableDropLine: {
      surface: {
        interior: {background: "primary", padding: {}},
        boundary: {border: {width: "none"}},
        dimensions: {height: {md: "3px"}},
      },
    },
    listDraggableDropInto: {
      surface: {
        interior: {background: "transparent", padding: {}},
        boundary: {border: {width: "thin", style: "solid", color: "primary"}, radius: {all: "none"}},
      },
    },
    listTreeLine: {surface: {interior: {background: "gray-300", padding: {}}, boundary: {border: {width: "none"}}}},
    listTreeDropLine: {
      surface: {
        interior: {background: "primary", padding: {}},
        boundary: {border: {width: "none"}},
        dimensions: {height: {md: "3px"}},
      },
    },
    listTreeDropInto: {
      surface: {
        interior: {background: "transparent", padding: {}},
        boundary: {border: {width: "thin", style: "solid", color: "primary"}, radius: {all: "none"}},
      },
    },
  },
};
// ── MEDIA: the family, then its elements ──
const media: Block = {
  family: {surface: {interior: {background: "gray-100", padding: {}}}, objectFit: "cover"},
  elements: {
    image: {
      surface: {
        combined: [{where: {state: "loading"}, partialSurface: {interior: {background: "gray-50"}}}],
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
    self: {interior: {padding: {y: "xs", x: "sm"}}, boundary: {radius: {all: "full"}, border: {width: "thin", style: "solid", color: "gray-200"}}},
  },
  // a region that reaches under the page header: its content starts after the header and scrolls under it
  "under-page-header": {self: {position: {under: {top: ["pageHeader"]}}}},
  // a header one sees through, a little
  "see-through": {self: {interior: {backgroundAlpha: 0.85}}},
  // the row of the top bar: as tall as the bar, so it slides out whole
  "topbar-row": {self: {dimensions: {height: {md: "56px"}}}},
  chart: {
    self: {
      vars: {
        "--chart-series-1": "brand-1",
        "--chart-series-2": "content-teal-standard",
        "--chart-series-3": "content-amber-standard",
        "--chart-series-4": "content-crimson-standard",
        "--chart-series-5": "content-indigo-standard",
        "--chart-series-6": "content-grass-standard",
        "--chart-series-7": "content-orange-standard",
        "--chart-series-8": "content-plum-standard",
        "--chart-ink": "gray-400",
        "--chart-ink-soft": "gray-200",
        "--chart-label": "gray-600",
        "--chart-bg": "transparent",
        "--chart-stroke": "2",
      },
    },
  },
  "micro-chart": {
    self: {
      vars: {
        "--chart-series-1": "brand-1",
        "--chart-ink": "gray-400",
        "--chart-ink-soft": "gray-200",
        "--chart-label": "gray-600",
        "--chart-stroke": "1.5",
      },
    },
  },
  "data-tooltip": {
    self: {
      interior: {background: "background", foreground: "smart-fb", padding: {x: "md", y: "sm"}, gap: {all: "sm"}},
      boundary: {border: {width: "thin", style: "solid", color: "gray-300"}, effect: "none"},
      defaultTypography: {typographyType: "bodySmall"},
    },
  },
  "data-tooltip-header": {
    self: {
      interior: {foreground: "foreground", padding: {bottom: "xs"}},
      boundary: {border: {width: "none", bottom: {width: "thin", style: "solid", color: "gray-200"}}},
      defaultTypography: {typographyType: "bodySmall"},
    },
  },
  "data-tooltip-footer": {
    self: {
      interior: {foreground: "gray-600", padding: {top: "xs"}},
      boundary: {border: {width: "none", top: {width: "thin", style: "solid", color: "gray-200"}}},
      defaultTypography: {typographyType: "bodyExtraSmall"},
    },
  },
  summary: {
    card: {interior: {padding: {all: "none"}, gap: {all: "none"}}, boundary: {effect: "none"}},
    content: {interior: {padding: {x: "lg", y: "md"}}},
    tile: {
      interior: {background: "transparent", padding: {x: "lg", y: "none"}, gap: {all: "2xs"}},
      boundary: {border: {width: "none", left: {width: "thin", style: "solid", color: "gray-200"}}, effect: "none"},
      combined: [
        {
          where: {emphasis: "secondary"},
          partialSurface: {interior: {padding: {left: "none"}}, boundary: {border: {left: {width: "none"}}}},
        },
      ],
    },
  },
  product: {
    card: {interior: {padding: {all: "none"}, gap: {all: "none"}}, boundary: {effect: "card"}},
    content: {interior: {padding: {all: "none"}}},
    tile: {
      interior: {background: "transparent", padding: {x: "xl", y: "lg"}, gap: {all: "none"}},
      boundary: {border: {width: "none"}, effect: "none"},
    },
    badge: {
      interior: {background: "background", foreground: "gray-600", padding: {x: "sm", y: "2xs"}, gap: {all: "xs"}},
      boundary: {border: {width: "thin", style: "solid", color: "gray-300"}},
      defaultTypography: {typographyType: "bodySmall", textTransform: "none"},
      combined: [
        {
          where: {emphasis: "primary"},
          partialSurface: {
            boundary: {border: {color: "transparent"}},
            defaultTypography: {typographyType: "numbersSmall"},
          },
        },
        {
          where: {emphasis: "quiet"},
          partialSurface: {interior: {background: "gray-100"}, boundary: {border: {color: "transparent"}}},
        },
      ],
    },
    icon: {
      combined: [
        {where: {status: "success"}, partialSurface: {interior: {foreground: "status-success"}}},
        {where: {status: "warning"}, partialSurface: {interior: {foreground: "status-warning"}}},
        {where: {status: "error"}, partialSurface: {interior: {foreground: "status-error"}}},
      ],
    },
  },
  aside: {
    tile: {
      interior: {
        background: "transparent",
        padding: {all: "xl"},
        childAlign: {horizontal: "center", vertical: "center"},
      },
      boundary: {border: {width: "none", left: {width: "thin", style: "solid", color: "gray-200"}}, effect: "none"},
      dimensions: {height: {md: "100%"}},
    },
    button: {dimensions: {width: {md: "100%"}}, interior: {childAlign: {horizontal: "center"}}},
  },
  figures: {
    card: {
      interior: {padding: {all: "none"}, gap: {all: "none"}},
      boundary: {border: {width: "thin", style: "solid", color: "gray-200"}, effect: "none"},
    },
    content: {interior: {padding: {all: "none"}}},
    tile: {
      interior: {background: "background", padding: {x: "lg", y: "md"}, gap: {all: "xs"}},
      boundary: {border: {width: "none", left: {width: "thin", style: "solid", color: "gray-200"}}, effect: "none"},
      combined: [
        {
          where: {emphasis: "secondary"},
          partialSurface: {interior: {background: "gray-50"}, boundary: {border: {left: {width: "none"}}}},
        },
      ],
    },
  },
  wordmark: {avatar: {boundary: {radius: {all: "none"}}}},
  "organization-logo": {self: {boundary: {radius: {all: "none"}}}},
  "example-label": {self: {dimensions: {width: {md: "6rem"}}}},
  "logo-wide": {self: {dimensions: {width: {md: "132px"}, height: {md: "32px"}}}},
  "logo-square": {self: {dimensions: {width: {md: "32px"}, height: {md: "32px"}}}},
  "sidebar-row": {self: {dimensions: {height: {md: "36px"}}}},
  "menu-header": {self: {interior: {padding: {all: "md"}}}},
  "sidebar-zone-floating": {self: {interior: {padding: {x: "md"}}}},
  "sidebar-zone-compressed": {self: {interior: {padding: {y: "md"}}}},
  "sidebar-zone-floating-compressed": {self: {interior: {padding: {x: "md", y: "md"}}}},
  "sidebar-floating": {
    self: {boundary: {radius: {all: "lg"}, border: {width: "thin", style: "solid", color: "gray-200"}, effect: "card"}},
  },
  "sidebar-compressed": {
    self: {
      boundary: {
        radius: {topRight: "lg", bottomRight: "lg"},
        border: {width: "thin", style: "solid", color: "gray-200"},
        effect: "card",
      },
    },
  },
  "sidebar-floating-compressed": {
    self: {boundary: {radius: {all: "lg"}, border: {width: "thin", style: "solid", color: "gray-200"}, effect: "card"}},
  },
  "sidebar-group-heading": {
    self: {
      dimensions: {height: {md: "28px"}},
      interior: {padding: {x: "md"}, foreground: "gray-400"},
      boundary: {border: {top: {width: "thin", style: "solid", color: "gray-200"}}},
    },
  },
  "sidebar-topbar": {
    self: {
      dimensions: {height: {md: "56px"}},
      interior: {background: "background", padding: {x: "md"}},
      boundary: {border: {bottom: {width: "thin", style: "solid", color: "gray-200"}}},
    },
  },
  "sidebar-group-divider": {self: {dimensions: {height: {md: "28px"}}, interior: {padding: {x: "md"}}}},
  sort: {tabBar: {boundary: {border: {width: "none"}}, interior: {gap: {all: "lg"}}}},
  group: {separator: {interior: {background: "gray-300"}}},
  timeline: {separator: {interior: {background: "gray-200"}}},
  hero: {
    label: {interior: {foreground: "currentColor"}},
    button: {
      combined: [
        {
          where: {emphasis: "secondary"},
          partialSurface: {
            interior: {background: "transparent", foreground: "currentColor"},
            boundary: {border: {color: "currentColor"}},
          },
        },
        {where: {emphasis: "quiet"}, partialSurface: {interior: {foreground: "currentColor"}}},
      ],
    },
  },
  progressList: {progress: {dimensions: {height: {md: "8px"}}}},
  keyValues: {
    list: {interior: {padding: {x: "none"}, gap: {all: "none"}}},
    listItem: {
      interior: {padding: {x: "none", y: "sm"}},
      boundary: {border: {width: "none", bottom: {width: "thin", style: "solid", color: "gray-200"}}},
      combined: [{where: {position: "last"}, partialSurface: {boundary: {border: {bottom: {width: "none"}}}}}],
    },
  },
  rows: {
    list: {interior: {padding: {x: "none"}, gap: {all: "none"}}},
    listItem: {
      interior: {padding: {x: "none", y: "sm"}},
      boundary: {border: {width: "none", bottom: {width: "thin", style: "solid", color: "gray-200"}}},
      combined: [{where: {position: "last"}, partialSurface: {boundary: {border: {bottom: {width: "none"}}}}}],
    },
  },
  chosen: {
    label: {interior: {foreground: "currentColor"}},
    button: {combined: [{where: {emphasis: "quiet"}, partialSurface: {interior: {foreground: "currentColor"}}}]},
  },
  stats: {
    tile: {
      interior: {background: "transparent", foreground: "currentColor", padding: {left: "xl", right: "none", y: "sm"}},
      boundary: {
        border: {
          width: "none",
          left: {width: "thin", style: "solid", color: "primary"},
          bottom: {width: "thin", style: "solid", color: "primary"},
        },
        effect: "none",
      },
      combined: [{where: {position: "last"}, partialSurface: {boundary: {border: {bottom: {width: "none"}}}}}],
    },
  },
  document: {
    content: {
      interior: {padding: {x: "none", y: "md"}, gap: {all: "md"}},
      defaultTypography: {typographyType: "bodyExtraLarge"},
    },
  },
  "persona-previewer": {
    card: {
      interior: {padding: {all: "none"}, gap: {all: "none"}},
      boundary: {border: {left: {width: "extraThick", style: "solid", color: "gray-200"}}},
      breakpoints: {narrow: "520px"},
    },
    tile: {interior: {padding: {all: "none"}, gap: {all: "none"}}, boundary: {border: {width: "none"}}},
  },
  "persona-previewer-stacked": {
    card: {
      interior: {padding: {all: "none"}, gap: {all: "none"}},
      boundary: {border: {top: {width: "extraThick", style: "solid", color: "gray-200"}}},
    },
    tile: {interior: {padding: {all: "none"}, gap: {all: "none"}}, boundary: {border: {width: "none"}}},
  },
  "organization-previewer": {
    card: {
      interior: {padding: {all: "none"}, gap: {all: "none"}},
      boundary: {border: {left: {width: "extraThick", style: "solid", color: "gray-200"}}},
    },
    tile: {interior: {padding: {all: "none"}, gap: {all: "none"}}, boundary: {border: {width: "none"}}},
  },
  "organization-previewer-stacked": {
    card: {
      interior: {padding: {all: "none"}, gap: {all: "none"}},
      boundary: {border: {top: {width: "extraThick", style: "solid", color: "gray-200"}}},
    },
    tile: {interior: {padding: {all: "none"}, gap: {all: "none"}}, boundary: {border: {width: "none"}}},
  },
  "goal-previewer": {
    card: {interior: {padding: {all: "none"}, gap: {all: "none"}}, boundary: {border: {left: {width: "none"}}}},
    tile: {
      interior: {padding: {all: "none"}, gap: {all: "none"}, background: "accent", foreground: "smart-fb"},
      boundary: {border: {width: "none"}},
    },
  },
  "goal-group-previewer": {
    card: {interior: {padding: {all: "none"}, gap: {all: "none"}}, boundary: {border: {left: {width: "none"}}}},
    tile: {
      interior: {padding: {all: "none"}, gap: {all: "none"}, background: "primary", foreground: "smart-fb"},
      boundary: {border: {width: "none"}},
    },
  },
  "exploration-previewer": {
    card: {interior: {padding: {all: "none"}, gap: {all: "none"}}, boundary: {border: {left: {width: "none"}}}},
    tile: {
      interior: {padding: {all: "none"}, gap: {all: "none"}, background: "status-success", foreground: "smart-fb"},
      boundary: {border: {width: "none"}},
    },
  },
  "canvas-card": {card: {interior: {padding: {all: "none"}, gap: {all: "none"}}}},
  "canvas-note": {tile: {interior: {padding: {all: "none"}, gap: {all: "none"}}}},
  "live-play-player": {button: {boundary: {radius: {all: "full"}}}},
  "role-select": {button: {interior: {childAlign: {horizontal: "start"}}}},
  "erd-node-previewer": {
    card: {interior: {padding: {all: "none"}, gap: {all: "none"}}},
    tile: {interior: {padding: {all: "none"}, gap: {all: "none"}}, boundary: {border: {width: "none"}}},
  },
  "use-case-previewer": {
    card: {interior: {padding: {all: "none"}, gap: {all: "none"}}, boundary: {border: {left: {width: "none"}}}},
    tile: {
      tint: "primary",
      interior: {padding: {all: "none"}, gap: {all: "none"}, background: "background", foreground: "smart-fb"},
      boundary: {border: {width: "none"}},
    },
  },
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
  {
    chain: [{key: "mainHeader"}, {key: "tabBar"}],
    tokens: {dimensions: {height: {md: "100%"}}, boundary: {border: {width: "none"}}},
  },
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
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "pageLeftSidebar", where: {flag: "away"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "pageLeftSidebar", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "pageLeftSidebar", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "pageLeftSidebar", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "pageRightSidebar", where: {flag: "away"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "pageRightSidebar", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "pageRightSidebar", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "pageRightSidebar", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "mainRightSidebar", where: {flag: "away"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "mainRightSidebar", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "mainRightSidebar", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "mainRightSidebar", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {width: {md: "0px"}},
      transition: {property: "width", duration: "slow", timing: "easeInOut"},
      interior: {padding: {all: "none"}},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "secondPageHeader", where: {flag: "away"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "secondPageHeader", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "secondPageHeader", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "secondPageHeader", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "secondMainHeader", where: {flag: "away"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "secondMainHeader", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "secondMainHeader", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "secondMainHeader", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "pageFooter", where: {flag: "away"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "pageFooter", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "pageFooter", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "pageFooter", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "mainFooter", where: {flag: "away"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "mainFooter", where: {flag: "away", scale: "sm"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "mainFooter", where: {flag: "away", scale: "md"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {
    chain: [{key: "mainFooter", where: {flag: "away", scale: "lg"}}],
    tokens: {
      dimensions: {height: {md: "0px"}},
      transition: {property: "height", duration: "slow", timing: "easeInOut"},
      boundary: {border: {width: "none"}},
    },
  },
  {chain: [{key: "sidebar"}, {key: "listTreeRow"}], tokens: {interior: {padding: {x: "md"}}}},
  {
    chain: [{key: "secondPageHeader"}, {key: "tabBar"}],
    tokens: {dimensions: {height: {md: "100%"}}, boundary: {border: {width: "none"}}},
  },
  {chain: [{key: "secondPageHeader"}, {key: "tabTrigger"}], tokens: {dimensions: {height: {md: "100%"}}}},
  {
    chain: [{key: "secondMainHeader"}, {key: "tabBar"}],
    tokens: {dimensions: {height: {md: "100%"}}, boundary: {border: {width: "none"}}},
  },
  {chain: [{key: "secondMainHeader"}, {key: "tabTrigger"}], tokens: {dimensions: {height: {md: "100%"}}}},
  {chain: [{key: "pageLeftSidebar"}, {key: "sidebar"}], tokens: {boundary: {border: {width: "none"}}}},
  // the zone of a floating sidebar has no ground and no line of its own: the sidebar floats over the page
  {chain: [{key: "pageLeftSidebar", concept: "sidebar-zone-floating"}], tokens: {interior: {background: "transparent"}, boundary: {border: {width: "none"}}}},
  {chain: [{key: "pageLeftSidebar", concept: "sidebar-zone-floating-compressed"}], tokens: {interior: {background: "transparent"}, boundary: {border: {width: "none"}}}},
  // a floating sidebar keeps its own frame, also in the page's side zone
  {chain: [{key: "pageLeftSidebar"}, {key: "sidebar", concept: "sidebar-floating"}], tokens: {boundary: {border: {width: "thin", style: "solid", color: "gray-200"}}}},
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
      boundary: {radius: {all: "none"}},
      animation: {name: "sidebar-peek-in", duration: "220ms", timing: "ease-in-out", fillMode: "both"},
    },
  },
  {
    when: {concept: "sidebar", where: {scale: "md", flag: "peek-closed"}},
    self: {
      dimensions: {width: {md: "240px"}, height: {md: "var(--radix-popover-trigger-height)"}},
      interior: {padding: {all: "none"}},
      boundary: {radius: {all: "none"}},
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
    when: {concept: "data-number"},
    self: {
      interior: {padding: {all: "none"}, gap: {all: "xs"}},
      boundary: {border: {width: "none"}, radius: {all: "none"}},
    },
    children: {
      "data-number-unit": {interior: {foreground: "gray-600"}},
      "data-number-symbol": {interior: {foreground: "gray-500", padding: {left: "2xs"}}},
      "data-number-exponent": {interior: {foreground: "gray-600"}},
      "data-number-placeholder": {interior: {foreground: "gray-500"}},
    },
  },
  {
    when: {concept: "data-number", where: {scale: "xl"}},
    children: {
      "data-number-unit": {defaultTypography: {typographyType: "numbersLarge"}},
      "data-number-symbol": {defaultTypography: {typographyType: "numbersLarge"}},
      "data-number-exponent": {defaultTypography: {typographyType: "numbersLarge"}},
    },
  },
  {
    when: {concept: "data-number", where: {scale: "lg"}},
    children: {
      "data-number-unit": {defaultTypography: {typographyType: "numbers"}},
      "data-number-symbol": {defaultTypography: {typographyType: "numbers"}},
      "data-number-exponent": {defaultTypography: {typographyType: "numbers"}},
    },
  },
  {
    when: {concept: "data-number", where: {scale: "md"}},
    children: {
      "data-number-unit": {defaultTypography: {typographyType: "numbersSmall"}},
      "data-number-symbol": {defaultTypography: {typographyType: "numbersSmall"}},
      "data-number-exponent": {defaultTypography: {typographyType: "numbersSmall"}},
    },
  },
  {
    when: {concept: "data-number", where: {scale: "sm"}},
    children: {
      "data-number-unit": {defaultTypography: {typographyType: "numbersExtraSmall"}},
      "data-number-symbol": {defaultTypography: {typographyType: "numbersExtraSmall"}},
      "data-number-exponent": {defaultTypography: {typographyType: "numbersExtraSmall"}},
    },
  },
  {
    when: {concept: "data-number", where: {scale: "xs"}},
    children: {
      "data-number-unit": {defaultTypography: {typographyType: "numbersExtraSmall"}},
      "data-number-symbol": {defaultTypography: {typographyType: "numbersExtraSmall"}},
      "data-number-exponent": {defaultTypography: {typographyType: "numbersExtraSmall"}},
    },
  },
  {
    when: {concept: "data-number", where: {status: "info"}},
    children: {
      "data-number-value": {interior: {foreground: "status-info"}},
      "data-number-trend": {interior: {foreground: "status-info"}},
    },
  },
  {
    when: {concept: "data-number", where: {status: "success"}},
    children: {
      "data-number-value": {interior: {foreground: "status-success"}},
      "data-number-trend": {interior: {foreground: "status-success"}},
    },
  },
  {
    when: {concept: "data-number", where: {status: "warning"}},
    children: {
      "data-number-value": {interior: {foreground: "status-warning"}},
      "data-number-trend": {interior: {foreground: "status-warning"}},
    },
  },
  {
    when: {concept: "data-number", where: {status: "error"}},
    children: {
      "data-number-value": {interior: {foreground: "status-error"}},
      "data-number-trend": {interior: {foreground: "status-error"}},
    },
  },
  {
    when: {concept: "data-number", where: {status: "destructive"}},
    children: {
      "data-number-value": {interior: {foreground: "status-error"}},
      "data-number-trend": {interior: {foreground: "status-error"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "hero"}},
    self: {
      interior: {background: "gray-500", padding: {x: "sm", y: "2xs"}},
      boundary: {border: {width: "thin", style: "solid", color: "gray-500"}},
    },
    children: {
      "data-number-value": {interior: {foreground: "main-white"}},
      "data-number-unit": {interior: {foreground: "main-white"}},
      "data-number-symbol": {interior: {foreground: "main-white"}},
      "data-number-exponent": {interior: {foreground: "main-white"}},
      "data-number-trend": {interior: {foreground: "main-white"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "hero", status: "neutral"}},
    self: {interior: {background: "gray-500"}, boundary: {border: {color: "gray-500"}}},
    children: {
      "data-number-value": {interior: {foreground: "main-white"}},
      "data-number-unit": {interior: {foreground: "main-white"}},
      "data-number-symbol": {interior: {foreground: "main-white"}},
      "data-number-exponent": {interior: {foreground: "main-white"}},
      "data-number-trend": {interior: {foreground: "main-white"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "hero", status: "info"}},
    self: {interior: {background: "status-info"}, boundary: {border: {color: "status-info"}}},
    children: {
      "data-number-value": {interior: {foreground: "main-white"}},
      "data-number-unit": {interior: {foreground: "main-white"}},
      "data-number-symbol": {interior: {foreground: "main-white"}},
      "data-number-exponent": {interior: {foreground: "main-white"}},
      "data-number-trend": {interior: {foreground: "main-white"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "hero", status: "success"}},
    self: {interior: {background: "status-success"}, boundary: {border: {color: "status-success"}}},
    children: {
      "data-number-value": {interior: {foreground: "main-white"}},
      "data-number-unit": {interior: {foreground: "main-white"}},
      "data-number-symbol": {interior: {foreground: "main-white"}},
      "data-number-exponent": {interior: {foreground: "main-white"}},
      "data-number-trend": {interior: {foreground: "main-white"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "hero", status: "warning"}},
    self: {interior: {background: "status-warning"}, boundary: {border: {color: "status-warning"}}},
    children: {
      "data-number-value": {interior: {foreground: "main-white"}},
      "data-number-unit": {interior: {foreground: "main-white"}},
      "data-number-symbol": {interior: {foreground: "main-white"}},
      "data-number-exponent": {interior: {foreground: "main-white"}},
      "data-number-trend": {interior: {foreground: "main-white"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "hero", status: "error"}},
    self: {interior: {background: "status-error"}, boundary: {border: {color: "status-error"}}},
    children: {
      "data-number-value": {interior: {foreground: "main-white"}},
      "data-number-unit": {interior: {foreground: "main-white"}},
      "data-number-symbol": {interior: {foreground: "main-white"}},
      "data-number-exponent": {interior: {foreground: "main-white"}},
      "data-number-trend": {interior: {foreground: "main-white"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "hero", status: "destructive"}},
    self: {interior: {background: "status-error"}, boundary: {border: {color: "status-error"}}},
    children: {
      "data-number-value": {interior: {foreground: "main-white"}},
      "data-number-unit": {interior: {foreground: "main-white"}},
      "data-number-symbol": {interior: {foreground: "main-white"}},
      "data-number-exponent": {interior: {foreground: "main-white"}},
      "data-number-trend": {interior: {foreground: "main-white"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "primary"}},
    self: {
      tint: "gray-500",
      interior: {background: "background", padding: {x: "sm", y: "2xs"}},
      boundary: {border: {width: "thin", style: "solid", color: "gray-400"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "primary", status: "neutral"}},
    self: {tint: "gray-500", interior: {background: "background"}, boundary: {border: {color: "gray-500"}}},
    children: {
      "data-number-value": {interior: {foreground: "gray-500"}},
      "data-number-unit": {interior: {foreground: "gray-500"}},
      "data-number-symbol": {interior: {foreground: "gray-500"}},
      "data-number-exponent": {interior: {foreground: "gray-500"}},
      "data-number-trend": {interior: {foreground: "gray-500"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "primary", status: "info"}},
    self: {tint: "status-info", interior: {background: "background"}, boundary: {border: {color: "status-info"}}},
    children: {
      "data-number-value": {interior: {foreground: "status-info"}},
      "data-number-unit": {interior: {foreground: "status-info"}},
      "data-number-symbol": {interior: {foreground: "status-info"}},
      "data-number-exponent": {interior: {foreground: "status-info"}},
      "data-number-trend": {interior: {foreground: "status-info"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "primary", status: "success"}},
    self: {tint: "status-success", interior: {background: "background"}, boundary: {border: {color: "status-success"}}},
    children: {
      "data-number-value": {interior: {foreground: "status-success"}},
      "data-number-unit": {interior: {foreground: "status-success"}},
      "data-number-symbol": {interior: {foreground: "status-success"}},
      "data-number-exponent": {interior: {foreground: "status-success"}},
      "data-number-trend": {interior: {foreground: "status-success"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "primary", status: "warning"}},
    self: {tint: "status-warning", interior: {background: "background"}, boundary: {border: {color: "status-warning"}}},
    children: {
      "data-number-value": {interior: {foreground: "status-warning"}},
      "data-number-unit": {interior: {foreground: "status-warning"}},
      "data-number-symbol": {interior: {foreground: "status-warning"}},
      "data-number-exponent": {interior: {foreground: "status-warning"}},
      "data-number-trend": {interior: {foreground: "status-warning"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "primary", status: "error"}},
    self: {tint: "status-error", interior: {background: "background"}, boundary: {border: {color: "status-error"}}},
    children: {
      "data-number-value": {interior: {foreground: "status-error"}},
      "data-number-unit": {interior: {foreground: "status-error"}},
      "data-number-symbol": {interior: {foreground: "status-error"}},
      "data-number-exponent": {interior: {foreground: "status-error"}},
      "data-number-trend": {interior: {foreground: "status-error"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "primary", status: "destructive"}},
    self: {tint: "status-error", interior: {background: "background"}, boundary: {border: {color: "status-error"}}},
    children: {
      "data-number-value": {interior: {foreground: "status-error"}},
      "data-number-unit": {interior: {foreground: "status-error"}},
      "data-number-symbol": {interior: {foreground: "status-error"}},
      "data-number-exponent": {interior: {foreground: "status-error"}},
      "data-number-trend": {interior: {foreground: "status-error"}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "secondary"}},
    self: {
      interior: {padding: {bottom: "3xs"}},
      boundary: {border: {width: "none", bottom: {width: "thin", style: "solid", color: "gray-400"}}},
    },
  },
  {
    when: {concept: "data-number", where: {emphasis: "secondary", status: "neutral"}},
    self: {boundary: {border: {bottom: {color: "gray-500"}}}},
  },
  {
    when: {concept: "data-number", where: {emphasis: "secondary", status: "info"}},
    self: {boundary: {border: {bottom: {color: "status-info"}}}},
  },
  {
    when: {concept: "data-number", where: {emphasis: "secondary", status: "success"}},
    self: {boundary: {border: {bottom: {color: "status-success"}}}},
  },
  {
    when: {concept: "data-number", where: {emphasis: "secondary", status: "warning"}},
    self: {boundary: {border: {bottom: {color: "status-warning"}}}},
  },
  {
    when: {concept: "data-number", where: {emphasis: "secondary", status: "error"}},
    self: {boundary: {border: {bottom: {color: "status-error"}}}},
  },
  {
    when: {concept: "data-number", where: {emphasis: "secondary", status: "destructive"}},
    self: {boundary: {border: {bottom: {color: "status-error"}}}},
  },
  {
    when: {concept: "data-number", where: {emphasis: "tertiary", status: "neutral"}},
    children: {"data-number-value": {interior: {foreground: "gray-500"}}},
  },
  {
    when: {concept: "data-number", where: {emphasis: "tertiary", status: "info"}},
    children: {"data-number-value": {interior: {foreground: "status-info"}}},
  },
  {
    when: {concept: "data-number", where: {emphasis: "tertiary", status: "success"}},
    children: {"data-number-value": {interior: {foreground: "status-success"}}},
  },
  {
    when: {concept: "data-number", where: {emphasis: "tertiary", status: "warning"}},
    children: {"data-number-value": {interior: {foreground: "status-warning"}}},
  },
  {
    when: {concept: "data-number", where: {emphasis: "tertiary", status: "error"}},
    children: {"data-number-value": {interior: {foreground: "status-error"}}},
  },
  {
    when: {concept: "data-number", where: {emphasis: "tertiary", status: "destructive"}},
    children: {"data-number-value": {interior: {foreground: "status-error"}}},
  },
  {
    when: {concept: "data-number", where: {emphasis: "quiet"}},
    children: {
      "data-number-value": {interior: {foreground: "gray-500"}},
      "data-number-unit": {interior: {foreground: "gray-400"}},
      "data-number-symbol": {interior: {foreground: "gray-400"}},
    },
  },
  {
    chain: [{key: "badge", concept: "dot"}],
    tokens: {
      interior: {padding: {all: "none"}, background: "gray-300"},
      boundary: {border: {width: "none"}, radius: {all: "full"}},
      combined: [
        {where: {status: "success"}, partialSurface: {interior: {background: "status-success"}}},
        {where: {status: "warning"}, partialSurface: {interior: {background: "status-warning"}}},
        {where: {status: "error"}, partialSurface: {interior: {background: "status-error"}}},
        {where: {status: "destructive"}, partialSurface: {interior: {background: "status-error"}}},
        {where: {status: "info"}, partialSurface: {interior: {background: "primary"}}},
        {where: {emphasis: "quiet"}, partialSurface: {interior: {background: "gray-300"}}},
      ],
    },
  },
  {
    chain: [{key: "badge"}, {key: "badge", concept: "dot"}],
    tokens: {
      dimensions: {width: {md: "6px"}, height: {md: "6px"}},
      combined: [
        {where: {status: "error"}, partialSurface: {tint: "background", interior: {background: "background"}}},
        {where: {status: "destructive"}, partialSurface: {tint: "background", interior: {background: "background"}}},
      ],
    },
  },
  {when: {concept: "count-of"}, self: {interior: {foreground: "gray-400"}}},
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
// ── density ──
const density = {
  modes: {compact: {all: 0.85, font: 0.95, icon: 0.9}, regular: 1, spacious: {all: 1.2, font: 1.05, icon: 1.1}},
  concepts: {"dense-table": {all: 0.7, font: 0.9, icon: 0.85}},
};
export const daintaTheme: WebThemeV2 = {
  dsl: 2,
  id: "wireframe-stroke",
  name: "Wireframe Stroke",
  version: 8,
  type: "wireframe",
  kind: "seed",
  ...tokens,
  layouts,
  body,
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
  density,
} as WebThemeV2;
