// ── EXCEPTIONS ───────────────────────────────────────────────────
// The uses of a style or a raw element that are allowed in the library's code, each with what it allows and the reason.
// There are none: the inline style rule (`no-inline-style`, rule-set.ts) replaced the categories E1 to E7.
// A new exception needs Daniel's ruling and a new entry here: nobody else adds one.
// Code names one by its id in a comment where it is used (`/* E1 */`).
export type MarkupException = { id: string; name: string; scope: string; allows: string; reason: string };
export const EXCEPTIONS: MarkupException[] = [];

export const CRITERIA: string[] = [
  "A colour the user chose is data, not a look: the value of a colour picker, a palette the user fills, the colour of a column, a tag, a shape. It is given as a custom property (`--name`) and the class or the theme reads it. A colour that is one of a fixed set (a kind, a status, the theme's primary) is never data: the markup names the kind and the theme gives the colour.",
  "An inline style declares custom properties only (`style={{ \"--depth\": n }}`), each one a value that only the render knows: a measure, a count, a position, a colour taken from the data. The class or the theme reads it with var().",
  "An inline style never declares a property. Markup decides the arrangement (direction, order, what holds what, where it is placed): in the library's code, with classes. The theme decides the look: gap, padding, size, colour, border, radius, shadow, motion, cursor.",
  "A style that is not an object written in the element (a variable, a spread) cannot be read, so it is an error.",
  "A class is the library's own code; a pattern writes none. A raw element is the primitive's own, listed by name in primitives.ts.",
  "A pattern has no exceptions. It passes properties and writes only library components.",
];
