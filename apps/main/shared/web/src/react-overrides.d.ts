/**
 * App-level React JSX augmentations.
 *
 * - element/emphasis/...: markup dictionary attributes consumed by @libs/web-components
 * - layout/width/align: layout system attributes consumed by @libs/web-layouts
 */
import "react";

declare module "react" {
  interface HTMLAttributes<T> {
    element?: string;
    emphasis?: string;
    status?: string;
    scale?: string;
    state?: string;
    fill?: string;
    concept?: string;
    layout?: string;
    width?: string;
    align?: string;
  }
}
