import type * as React from "react";
import { EMPHASIS, STATUS, POSITION, type Emphasis, type Status, type Position } from "../../../../../types/axes";
import { defineProps } from "../../../../lib/define-props";
import type { AxisName } from "../../../../lib/axes";
import { TEXT_TYPES, type TextType } from "../../text/v1/types";

export interface LinkOwnProps {
  /** the typography identity, rendered as element="type--<type>"; `link` is a theme typography key */
  type?: TextType;
  emphasis?: Emphasis;
  status?: Status;
  /** product concept the theme may key on */
  concept?: string;
  position?: Position;
}

// An <a>. Anchor props spread through (href, target, rel, onClick…), so a router's link props can be spread onto it; the router is never imported here.
export type LinkProps = LinkOwnProps & Omit<React.ComponentProps<"a">, keyof LinkOwnProps | AxisName>;

export const linkSchema = defineProps<LinkOwnProps>("Link", {
  type: { kind: "enum", values: TEXT_TYPES, default: "link", doc: "Typography identity (type--<type>)" },
  emphasis: { kind: "enum", values: EMPHASIS, doc: "Visual prominence" },
  status: { kind: "enum", values: STATUS, doc: "Semantic condition" },
  concept: { kind: "string", doc: "Product concept the theme may key on" },
  position: { kind: "enum", values: POSITION, doc: "Where it stands in its parent and how much it takes (several words allowed)" },
});
