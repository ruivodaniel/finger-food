import type * as React from "react";
import { EMPHASIS, STATUS, POSITION, type Emphasis, type Status, type Position } from "../../../../../types/axes";
import { TypographyTypeKeyE } from "../../../../../types/primitives";
import { defineProps } from "../../../../lib/define-props";
import type { AxisName } from "../../../../lib/axes";

// type--<identity>: the typography vocabulary of the markup dictionary (theme typography keys, kebab-cased by the engine).
// It is its own vocabulary, not a row of the elements table, so the schema is written here, not read from ELEMENTS.
const camelToKebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
export const TEXT_TYPES = Object.values(TypographyTypeKeyE).map(camelToKebab) as readonly TextType[];
export type TextType =
  | "heading1" | "heading2" | "heading3" | "heading4"
  | "body-extra-large" | "body-large" | "body" | "body-small" | "body-extra-small"
  | "quote-large" | "quote" | "quote-small"
  | "code"
  | "numbers-extra-large" | "numbers-large" | "numbers" | "numbers-small" | "numbers-extra-small"
  | "link";

export const TEXT_TAGS = ["span", "p", "h1", "h2", "h3", "h4", "strong", "em", "small", "label"] as const;
export type TextTag = (typeof TEXT_TAGS)[number];

export interface TextOwnProps {
  /** the HTML tag; semantics only, never the look */
  as?: TextTag;
  /** the typography identity, rendered as element="type--<type>" */
  type?: TextType;
  emphasis?: Emphasis;
  status?: Status;
  /** product concept the theme may key on */
  concept?: string;
  position?: Position;
  /** one line, ellipsis at the end (structural) */
  truncate?: boolean;
}

export type TextProps = TextOwnProps & Omit<React.ComponentProps<"span">, keyof TextOwnProps | AxisName>;

export const textSchema = defineProps<TextOwnProps>("Text", {
  as: { kind: "enum", values: TEXT_TAGS, default: "span", doc: "HTML tag; semantics only" },
  type: { kind: "enum", values: TEXT_TYPES, default: "body", doc: "Typography identity (type--<type>)" },
  emphasis: { kind: "enum", values: EMPHASIS, doc: "Visual prominence" },
  status: { kind: "enum", values: STATUS, doc: "Semantic condition" },
  concept: { kind: "string", doc: "Product concept the theme may key on" },
  position: { kind: "enum", values: POSITION, doc: "Where it stands in its parent and how much it takes (several words allowed)" },
  truncate: { kind: "boolean", default: false, doc: "One line, ellipsis at the end" },
});
