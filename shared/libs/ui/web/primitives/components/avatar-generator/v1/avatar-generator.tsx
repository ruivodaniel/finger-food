import * as React from "react";
import BoringAvatar from "boring-avatars";

import { cn } from "../../../../lib/utils";
import { RADIX_HUES } from "../../../../../types/color-system";
import { pictureSource } from "./pictures";
import { BORING_PICTURES, GENERATED_PICTURES, type AvatarGeneratorProps, type GeneratedPicture } from "./types";

// THE COLOURS OF A PICTURE are the theme's content colours, read from the theme's variables where the picture stands: the library picks among them
// by the seed, so the same seed gives the same picture, and the more colours it is given, the more the pictures differ. No colour is written here.
type Boring = (typeof BORING_PICTURES)[number];
const TONES: Record<Boring, readonly ("standard" | "soft")[]> = {
  marble: ["standard"], beam: ["soft"], pixel: ["standard", "soft"], sunset: ["standard", "soft"], ring: ["standard", "soft"], bauhaus: ["standard", "soft"],
};
const paletteOf = (picture: GeneratedPicture, css: CSSStyleDeclaration, ctx: CanvasRenderingContext2D | null): string[] =>
  (TONES[picture as Boring] ?? ["standard", "soft"]).flatMap((tone) => RADIX_HUES.map((hue) => css.getPropertyValue(`--color-content-${hue}-${tone}`).trim())).filter(Boolean).map((c) => hexOf(c, ctx));

/** a CSS colour as hex, whatever way it is written: the picture libraries compute on their colours */
function hexOf(color: string, ctx: CanvasRenderingContext2D | null): string {
  if (!ctx || !color) return "#888888";
  ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = "#888888"; ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
}

type Drawn = { picture: Boring; colors: string[] } | { src: string };

/** A picture drawn from a seed, filling what holds it: the same seed, the same picture. It writes the one raw `<img>` of the avatars (its entry in rules/primitives.ts). */
function AvatarGenerator({ seed, picture, className, ...props }: AvatarGeneratorProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const [drawn, setDrawn] = React.useState<Drawn | null>(null);
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const css = getComputedStyle(ref.current);
    const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
    const kind: GeneratedPicture = picture && (GENERATED_PICTURES as readonly string[]).includes(picture) ? picture : "marble";
    const colors = paletteOf(kind, css, ctx);
    const palette = colors.length ? colors : [1, 2, 3, 4, 5].map((n) => hexOf(css.getPropertyValue(`--chart-${n}`).trim(), ctx));
    const src = (BORING_PICTURES as readonly string[]).includes(kind) ? null : pictureSource(kind, seed, palette);
    setDrawn(src ? { src } : { picture: kind as Boring, colors: palette });
  }, [seed, picture]);
  return (
    <span ref={ref} className={cn("absolute inset-0 block", className)} aria-hidden {...props}>
      {drawn && "src" in drawn ? (
        <img src={drawn.src} alt="" className="h-full w-full object-cover" />
      ) : drawn ? (
        <BoringAvatar name={seed} variant={drawn.picture} colors={drawn.colors} size="100%" square />
      ) : null}
    </span>
  );
}

export { AvatarGenerator };
