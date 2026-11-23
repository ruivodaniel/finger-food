import type * as React from "react";
import { defineProps } from "../../../../lib/define-props";

export const BORING_PICTURES = ["marble", "beam", "pixel", "sunset", "ring", "bauhaus"] as const;
/** the kinds of generated picture, named by the library that draws them (boring-avatars keeps its own names). Where each comes from: dicebear (DiceBear), space (Space UI Avatars), morphatar (Morphatar), jdenticon (Jdenticon) */
export const GENERATED_PICTURES = ["dicebear-initials", // initials
  "beam", "dicebear-adventurer", "dicebear-adventurer-neutral", "dicebear-avataaars", "dicebear-avataaars-neutral", "dicebear-big-ears", "dicebear-big-ears-neutral", "dicebear-big-smile", "dicebear-bottts", "dicebear-bottts-neutral", "dicebear-croodles", "dicebear-croodles-neutral", "dicebear-dylan", "dicebear-fun-emoji", "dicebear-lorelei", "dicebear-lorelei-neutral", "dicebear-micah", "dicebear-miniavs", "dicebear-notionists", "dicebear-notionists-neutral", "dicebear-open-peeps", "dicebear-personas", "dicebear-pixel-art", "dicebear-pixel-art-neutral", "dicebear-thumbs", "dicebear-toon-head", "space-pebble", "space-grunge", "space-bored", "space-doodle", "space-squiggle", "space-critter", "space-kendo", "morphatar-organic", // characters
  "pixel", "ring", "bauhaus", "dicebear-identicon", "dicebear-icons", "dicebear-rings", "dicebear-shapes", "space-invader", "morphatar-geometric", "morphatar-pixel", "jdenticon", // geometric
  "marble", "sunset", "dicebear-glass", "space-lumina", "space-triton", // organic
] as const;
export type GeneratedPicture = (typeof GENERATED_PICTURES)[number];

export interface AvatarGeneratorOwnProps {
  /** the id of who or what the picture stands for: the same seed, the same picture */
  seed: string;
  /** the kind of picture; a kind the generator does not know draws marble */
  picture?: GeneratedPicture;
}
export type AvatarGeneratorProps = AvatarGeneratorOwnProps & Omit<React.ComponentProps<"span">, keyof AvatarGeneratorOwnProps | "children">;

export const avatarGeneratorSchema = defineProps<AvatarGeneratorOwnProps>("AvatarGenerator", {
  seed: { kind: "string", doc: "The id of who or what the picture stands for: the same seed, the same picture" },
  picture: { kind: "enum", values: GENERATED_PICTURES, doc: "The kind of generated picture" },
});
