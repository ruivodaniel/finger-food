/**
 * RemoteImage — the image element of the media family: a box (element="media--image") the theme frames, sizes by scale,
 * tints and filters, with the picture inside it. The source is an opaque identifier resolved to a URL by an injected async
 * `resolver`; without one, `src` is the final URL. Caching is the caller's: wrap react-query or any cache in the resolver.
 *
 * The box and its measures are the theme's (its size for the scale, or for a concept). How the picture meets the box is `fit`:
 * cover crops, contain shows it whole, height keeps its shape at the box's height with the width following (a logo), none makes
 * the box the image's own size. `focus` is where a crop keeps it, `ratio` holds the box's shape while the theme gives no height.
 * No inline style but the two values only the render knows, as custom properties. Every look is the theme's.
 */

import * as React from "react";
import { cn } from "../../../../lib/utils";
import { axisAttrs } from "../../../../lib/axes";
import { positionClasses } from "../../../../lib/position";
import type { RemoteImageProps } from "./types";

export function RemoteImage({
  src,
  resolver,
  fallback = null,
  alt = "",
  fit,
  focus,
  ratio,
  emphasis,
  state,
  scale = "md",
  position,
  concept,
  className,
  ...boxProps
}: RemoteImageProps) {
  const [resolvedSrc, setResolvedSrc] = React.useState<string | null | undefined>(
    src && !resolver ? src : null,
  );
  const [loading, setLoading] = React.useState(Boolean(src && resolver));

  React.useEffect(() => {
    if (!src) {
      setResolvedSrc(null);
      setLoading(false);
      return;
    }
    if (!resolver) {
      setResolvedSrc(src);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void resolver(src).then(
      (url) => {
        if (cancelled) return;
        setResolvedSrc(url ?? null);
        setLoading(false);
      },
      () => {
        if (cancelled) return;
        setResolvedSrc(null);
        setLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [src, resolver]);

  // the box is the theme's; the picture is the component's, never the theme's. A value only the render knows travels as a custom property
  const picture =
    fit === "none" ? "block h-auto w-auto max-w-none"
    : fit === "height" ? "block h-full w-auto max-w-none"
    : cn("absolute inset-0 h-full w-full", fit === "contain" ? "object-contain" : fit === "cover" ? "object-cover" : "[object-fit:var(--media-object-fit,cover)]", focus && fit !== "contain" && "[object-position:var(--focus)]");
  const box = fit === "none" ? "h-fit w-fit" : ratio ? "[aspect-ratio:var(--ratio)]" : undefined;

  const shown = loading ? "loading" : state;
  return (
    <div
      element="media--image"
      {...axisAttrs({ emphasis, scale, concept, state: shown, position })}
      className={cn("relative shrink-0 overflow-hidden", box, (loading || !resolvedSrc) && "flex items-center justify-center text-center", className, positionClasses(position))}
      style={{ "--ratio": ratio, "--focus": focus } as React.CSSProperties}
      {...boxProps}
    >
      {loading || !resolvedSrc ? fallback : <img src={resolvedSrc} alt={alt} className={picture} />}
    </div>
  );
}
