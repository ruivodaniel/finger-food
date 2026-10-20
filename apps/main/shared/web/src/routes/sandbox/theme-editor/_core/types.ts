import type { ReactNode } from "react";

export type NavCategory =
  | "primitives"
  | "families"
  | "elements"
  | "contextual"
  | "layouts"
  | "rules";

export type NavSelection = {
  category: NavCategory;
  path: string[];
};

export type OnChange = (path: string[], value: unknown) => void;

export type RenderColorFn = (props: {
  value: unknown;
  inherited?: unknown;
  onChange: (v: unknown) => void;
}) => ReactNode;
