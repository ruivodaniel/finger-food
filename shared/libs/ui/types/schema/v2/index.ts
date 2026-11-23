export * from "./theme";
import type { z } from "zod";
import type { WebTheme as WebThemeSchema } from "./theme";
/** a web theme written in the theme language v2 */
export type WebThemeV2 = z.infer<typeof WebThemeSchema>;
