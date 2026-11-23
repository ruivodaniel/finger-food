// ── A TREE OF CODE ───────────────────────────────────────────────
// What a .tsx file is read into by parse-code.ts. The rules on it are data (rule-set.ts), applied by the tree processor of the check system.

/** `raw`: an HTML element, not a component. `excepted`: the exception a comment names at this node (E1 … E7) */
/** `origin`: what the component is imported from, as the file writes it (a package, an alias, a file beside it); none when the file defines it itself. `values`: the properties given a text, with it */
export type Tree = { component: string; raw: boolean; origin?: string; props: string[]; values?: Record<string, string>; line: number; children: Tree[]; /** how many things it holds: an expression can give many, so it counts two */ weight: number; excepted?: string };
