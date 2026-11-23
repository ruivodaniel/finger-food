import type * as React from "react";
import type * as AvatarPrimitive from "@radix-ui/react-avatar";
import { type Scale } from "../../../../../types/axes";
import type { ElementProps } from "../../../../../types/elements";
import { defineProps } from "../../../../lib/define-props";
import type { AxisName } from "../../../../lib/axes";
import { axesSchema } from "../../../../lib/axes-schema";

/** Avatar takes scale from the global axes. Named alias kept for consumers. */
export type AvatarScale = Scale;

export interface AvatarOwnProps extends ElementProps<"avatar"> {

}

export type AvatarProps = AvatarOwnProps & Omit<React.ComponentProps<typeof AvatarPrimitive.Root>, keyof AvatarOwnProps | AxisName>;
export type AvatarImageProps = React.ComponentProps<typeof AvatarPrimitive.Image>;
export type AvatarFallbackProps = React.ComponentProps<typeof AvatarPrimitive.Fallback> & {
  /** the id of who the avatar stands for: what a generated picture is drawn from */
  seed?: string;
  /** what this one avatar shows, whatever the theme says: a kind of generated picture, or the initials */
  picture?: AvatarPicture;
};

export const avatarSchema = defineProps<AvatarOwnProps>("Avatar", {
  ...axesSchema("avatar"),

});

// the parts: the image (src) and the fallback (its content)
export const avatarImageSchema = defineProps<{ src?: string }>("AvatarImage", { src: { kind: "string", doc: "The image URL" } });
import { GENERATED_PICTURES } from "../../avatar-generator";
/** what an avatar shows with no image: its initials, or a generated picture of a kind (the generator's list) */
export const AVATAR_PICTURES = ["initials", ...GENERATED_PICTURES] as const;
export type AvatarPicture = (typeof AVATAR_PICTURES)[number];
export const avatarFallbackSchema = defineProps<{ seed?: string; picture?: AvatarPicture }>("AvatarFallback", {
  picture: { kind: "enum", values: AVATAR_PICTURES, doc: "What this one avatar shows, whatever the theme says" }, seed: { kind: "string", doc: "The id of who the avatar stands for. With it, the fallback draws a picture from it" } });
