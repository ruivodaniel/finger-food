import type { ThemeSpacing } from "../../../../../../../../../../shared/libs/ui/types";
import type { OnChange } from "../../_core/types";
import { Section } from "../shared/Section";
import { Row } from "../shared/Row";
import { NumberField } from "../shared/NumberField";

type Props = {
  data: ThemeSpacing;
  inherited?: Partial<ThemeSpacing>;
  onChange: OnChange;
};

// ── Engine truth ────────────────────────────────────────────────
// Mirrors `processSpacing` in shared/libs/ui/web/theme-engine/process-primitives.ts.
// Keep this in lockstep with that function — every token below is emitted as
// a `--spacing-{token}` CSS variable computed from `unit` (in rem).
const SPACING_MULTIPLIERS = [
  { token: "none", x: 0 },
  { token: "xxs",  x: 0.125 },
  { token: "xs",   x: 0.25 },
  { token: "sm",   x: 0.5 },
  { token: "md",   x: 1 },     // md ≡ unit
  { token: "lg",   x: 1.5 },
  { token: "xl",   x: 2 },
  { token: "xxl",  x: 3 },     // largest typed value (replaces internal 2xl)
] as const;

// `SpacingToken` in shared/libs/ui/types/primitives.ts now declares all 8 values.
// Kept as a Set for parity with the existing rendering (no orphans currently).
const TYPED_TOKENS = new Set(["none", "xxs", "xs", "sm", "md", "lg", "xl", "xxl"]);

export function SpacingEditor({ data, inherited, onChange }: Props) {
  const unit = data.unit ?? inherited?.unit ?? 1;

  return (
    <div className="flex flex-col">
      <Section title="SPACING">
        <Row label="unit">
          <NumberField
            value={data.unit}
            inherited={inherited?.unit}
            onChange={(v) => onChange(["unit"], v)}
            step={0.125}
            min={0}
            unit="rem"
          />
        </Row>
        <div className="text-[9px] text-zinc-400 leading-snug pl-3 pt-0.5">
          All spacing tokens derive from this. md ≡ unit.
        </div>
      </Section>

      <Section title="DERIVED">
        {SPACING_MULTIPLIERS.map(({ token, x }) => {
          const rem = unit * x;
          const px = rem * 16; // for visual bar only — assumes 16px root
          const orphan = !TYPED_TOKENS.has(token);
          return (
            <div key={token} className="flex items-center gap-1.5 h-[22px]">
              <span
                className={`w-[44px] shrink-0 text-[10px] ${
                  orphan ? "text-zinc-300 italic" : "text-zinc-500"
                }`}
                title={orphan ? "Engine emits this but it's not in SpacingToken type — not selectable" : undefined}
              >
                {token}{orphan ? "*" : ""}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono w-[64px] shrink-0">
                {rem === 0 ? "0" : `${trim(rem)}rem`}
              </span>
              <div
                className="h-2 bg-blue-300 rounded-sm"
                style={{ width: `${Math.min(px, 120)}px` }}
                title={`${trim(rem)}rem ≈ ${trim(px)}px @16px root`}
              />
            </div>
          );
        })}
      </Section>
    </div>
  );
}

// Strip trailing zeros so 1.5rem renders as "1.5" not "1.5000000001".
function trim(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(4)));
}
