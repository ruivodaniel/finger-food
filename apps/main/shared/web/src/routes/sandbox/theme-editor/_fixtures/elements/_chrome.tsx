import type { ReactNode } from "react";

/**
 * Tiny chrome helpers shared by every element fixture. Theme-aware — the
 * label uses `element="type--body-extra-small" emphasis="quiet"` so the
 * fixture body inherits the live theme typography (matching the look of
 * the previous handwritten HTML fixtures).
 */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p element="type--body-extra-small" emphasis="quiet">{label}</p>
      <div className="flex gap-3 flex-wrap items-center">{children}</div>
    </div>
  );
}

export function FixtureBody({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-6 p-6">{children}</div>;
}

/**
 * Color swatch keyed to a live CSS custom property. `token` is the var name
 * WITHOUT the leading `--` (e.g. "color-gray-500"); it is rendered both as
 * the swatch fill and as the caption. Pass `css` to override the fill with a
 * raw expression for context-computed values (e.g. smart-bw) that aren't
 * emitted as standalone vars. Swatches reflect the live theme + active mode.
 */
export function Swatch({ token, css }: { token: string; css?: string }) {
  return (
    <div className="flex flex-col gap-1" style={{ width: 76 }}>
      <div
        className="rounded-md h-11"
        style={{
          background: css ?? `var(--${token})`,
          border: "1px solid color-mix(in srgb, var(--foreground) 15%, transparent)",
        }}
      />
      <span className="text-[9px] font-mono break-all leading-tight opacity-60">
        {token}
      </span>
    </div>
  );
}

/**
 * Flush color ramp — swatches butt edge-to-edge with no gap, radius, or
 * border so a derived scale reads as one continuous gradient. Each `token`
 * is a CSS var name without the leading `--`; hover shows the token name.
 */
export function Ramp({ tokens }: { tokens: string[] }) {
  return (
    <div className="flex">
      {tokens.map((t) => (
        <div
          key={t}
          className="h-11"
          style={{ background: `var(--${t})`, width: 28 }}
          title={t}
        />
      ))}
    </div>
  );
}
