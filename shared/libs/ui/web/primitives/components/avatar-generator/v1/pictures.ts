// Generated pictures from the libraries other than boring-avatars. Each draws an SVG from the seed and the theme's colours: the same seed, the same picture.
import { createAvatar as dicebear } from "@dicebear/core";
import * as dicebearStyles from "@dicebear/collection";
import { createAvatar as space } from "@usespaceui/avatars";
import { morphatarDataUri } from "@morphatar/react";
import { toSvg as jdenticon } from "jdenticon";

const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
const bare = (hex: string) => hex.replace("#", "");
const svgUri = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
const hash = (seed: string) => [...seed].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** the picture of `kind` for `seed`, as an image source, or null when the kind is not one of these libraries' */
export function pictureSource(kind: string, seed: string, colors: string[]): string | null {
  const [library, ...rest] = kind.split("-");
  const style = rest.join("-");
  const five = [0, 1, 2, 3, 4].map((n) => colors[(hash(seed) + n * 7) % colors.length]);
  switch (library) {
    case "dicebear": {
      const found = (dicebearStyles as unknown as Record<string, never>)[camel(style)];
      if (!found) return null;
      const c = colors.map(bare);
      return dicebear(found, { seed, backgroundColor: c, ringColor: c, rowColor: c, baseColor: c, shapeColor: c, topColor: c, shape1Color: c, shape2Color: c, shape3Color: c } as never).toDataUri();
    }
    case "space": return svgUri(space({ name: seed, variant: style as never, colors: five }));
    case "morphatar": return morphatarDataUri({ seed, variant: style as never, colors: five });
    case "jdenticon": return svgUri(jdenticon(seed, 96));
    default: return null;
  }
}
