// A button of the canvas's bars: the library's Toggle, so the theme draws it (shape, border, colours, pressed state). `on` is the pressed state; the picture is its child.
// Everything else it is given (ref, onClick, aria-*, data-*) goes through to the Toggle, so a Popover or a Tooltip trigger can wrap it with `asChild`.
import { Toggle } from "@libs/web-components";

type Rest = Omit<React.ComponentProps<"button">, "children" | "emphasis" | "scale" | "color">;
export function ToolButton({ on = false, label, testid, children, scale = "sm", ...rest }: { on?: boolean; label: string; testid?: string; children: React.ReactNode; scale?: "xs" | "sm" | "md" } & Rest) {
  return <Toggle emphasis="tertiary" scale={scale} pressed={on} aria-label={label} title={label} data-testid={testid} {...(rest as object)}>{children}</Toggle>;
}
