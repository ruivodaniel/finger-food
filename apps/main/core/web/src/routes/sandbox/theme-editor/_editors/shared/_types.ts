// Shared type aliases used across molecule editors.

import type { ReactNode } from "react";

export type OnChange = (path: string[], value: unknown) => void;

export type EditorProps<T extends object = Record<string, unknown>> = {
  data: Partial<T>;
  inherited?: Partial<T>;
  onChange: OnChange;
};

export type RenderColorFn = (props: {
  value: unknown;
  inherited: unknown;
  onChange: (v: unknown) => void;
}) => ReactNode;

export type RenderShadowLayersFn = (props: {
  layers: unknown[];
  path: string[];
  onChange: OnChange;
}) => ReactNode;

// Helpers for safe object walking when the data shape is partial / dynamic.

export const get = (obj: unknown, key: string): unknown =>
  obj && typeof obj === "object" ? (obj as Record<string, unknown>)[key] : undefined;

export const getObj = (obj: unknown, key: string): Record<string, unknown> => {
  const v = get(obj, key);
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
};

export const str = (v: unknown): string | undefined =>
  v != null ? String(v) : undefined;

export const num = (v: unknown): number | undefined =>
  typeof v === "number" ? v : v != null ? Number(v) : undefined;

/** Wrap an OnChange to prepend a fixed path prefix. */
export const withPrefix = (onChange: OnChange, prefix: string[]): OnChange =>
  (path, value) => onChange([...prefix, ...path], value);
