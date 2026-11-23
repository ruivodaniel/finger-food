// The note sticker: what a sticker on a whiteboard carries. Brought from entity-previewers/canvas/types.ts (CanvasNote).
/** a note's colour: a theme token (the default palette is the soft content colours) or a colour the person typed, kept as typed */
export type CanvasNote = { id: string; title?: string; text: string; color?: string };
/** the note a new sticker starts with: the theme's soft yellow */
export const NOTE_DEFAULT = "var(--color-content-yellow-soft)";
/** the CSS of a note's colour: a token name (brand-1, content-red-soft…) becomes its variable, anything else is used as it is. Nothing is converted. */
export const noteColorCss = (c: string | undefined): string => (!c ? NOTE_DEFAULT : /^(main|brand|status|gray|content|custom)-/.test(c) ? `var(--color-${c})` : c);
