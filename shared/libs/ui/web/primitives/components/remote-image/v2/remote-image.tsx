/**
 * RemoteImage — the image element of the media family: a box (element="media--image") the theme frames, sizes by scale,
 * tints and filters, with the picture inside it. The source is an opaque identifier resolved to a URL by an injected async
 * `resolver`; without one, `src` is the final URL. Caching is the caller's: wrap react-query or any cache in the resolver.
 *
 * The box: the theme's size for the scale, or a precise width and height, or, with fit none, the image's own size. How the
 * picture meets the box is `fit` (cover crops, contain shows it whole), `focus` is where a crop keeps it, `ratio` holds the
 * box's shape while nothing else sets its height. Every look (frame, fill, tint, filters, the loading state) is the theme's.
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
  width,
  height,
  emphasis,
  state,
  scale = "md",
  position,
  concept,
  className,
  style,
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

  // the box is the theme's: its frame, fill, size per scale. The component only sets what the instance asked: a precise size beats the scale;
  // with fit none the box is the image's size; the ratio only holds without a height
  const own: React.CSSProperties = { ...style };
  if (width != null) own.width = width;
  if (height != null) own.height = height;
  if (fit === "none") { own.width = width ?? "fit-content"; own.height = height ?? "fit-content"; }
  else if (ratio && height == null) own.aspectRatio = ratio;

  // the picture is the component's, never the theme's: pinned to the box's four edges, no padding or rule of the theme can move it;
  // how it meets the box (fit) and where a crop keeps it (focus) are the instance's, with the theme's media defaults behind them
  const picture: React.CSSProperties = fit === "none"
    ? { display: "block", width: "auto", height: "auto", maxWidth: "none" }
    : { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: fit ?? "var(--media-object-fit, cover)" as React.CSSProperties["objectFit"], objectPosition: fit === "contain" ? "center" : (focus ?? "var(--media-object-position, center)") };

  const shown = loading ? "loading" : state;
  return (
    <div
      element="media--image"
      {...axisAttrs({ emphasis, scale, concept, state: shown, position })}
      className={cn("relative shrink-0 overflow-hidden", (loading || !resolvedSrc) && "flex items-center justify-center text-center", className, positionClasses(position))}
      style={own}
      {...boxProps}
    >
      {loading || !resolvedSrc ? fallback : <img src={resolvedSrc} alt={alt} style={picture} />}
    </div>
  );
}
