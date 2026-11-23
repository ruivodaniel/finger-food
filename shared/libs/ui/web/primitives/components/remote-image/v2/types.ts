import type * as React from "react";
import type { ElementProps } from "../../../../../types/elements";
import { defineProps } from "../../../../lib/define-props";
import type { AxisName } from "../../../../lib/axes";
import { axesSchema } from "../../../../lib/axes-schema";

/** how the image meets its box: cover crops to the box, contain shows it whole inside the box, none makes the box the image's own size. Unset: the theme's (media.objectFit) */
export type ImageFit = "cover" | "contain" | "none";

export interface RemoteImageOwnProps extends ElementProps<"image"> {
  /** Opaque source identifier (S3 key, IPFS CID, signed-URL path…) or a final URL when no resolver is given */
  src?: string | null;
  /** When provided, called with src to produce the final URL. */
  resolver?: (src: string) => Promise<string | null | undefined>;
  /** Rendered while resolving, or when the resolved URL is null/undefined. */
  fallback?: React.ReactNode;
  /** Alternative text of the image. */
  alt?: string;
  fit?: ImageFit;
  /** Where a crop keeps the image, as CSS object-position: "center", "top", "20% 80%". Only with cover. Unset: the theme's */
  focus?: string;
  /** The box's aspect ratio, "16/9", "1/1": only holds when nothing else sets its height, never with fit none */
  ratio?: string;
  /** A precise box, beating the scale: a CSS length */
  width?: string | number;
  height?: string | number;
}

export type RemoteImageProps = RemoteImageOwnProps & Omit<React.ComponentProps<"div">, keyof RemoteImageOwnProps | AxisName>;

export const remoteImageSchema = defineProps<RemoteImageOwnProps>("RemoteImage", {
  ...axesSchema("image"),
  src: { kind: "string", doc: "Source id, or the final URL when there is no resolver" },
  resolver: { kind: "function", doc: "src → final URL (async)" },
  fallback: { kind: "node", doc: "Shown while resolving or when nothing resolves" },
  alt: { kind: "string", doc: "Alternative text" },
  fit: { kind: "enum", values: ["cover", "contain", "none"], doc: "cover crops to the box, contain shows the whole image in it, none makes the box the image's size; unset: the theme's" },
  focus: { kind: "string", doc: "Where a crop keeps the image (object-position); only with cover" },
  ratio: { kind: "string", doc: "The box's aspect ratio, when nothing else sets its height; never with fit none" },
  width: { kind: "other", doc: "A precise width, beating the scale" },
  height: { kind: "other", doc: "A precise height, beating the scale" },
});
