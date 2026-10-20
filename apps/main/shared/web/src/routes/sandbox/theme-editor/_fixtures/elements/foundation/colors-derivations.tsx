import { FixtureBody, Ramp, Row, Swatch } from "../_chrome";

/**
 * Color Derivations fixture. The computed color layer — everything the engine
 * derives per color mode from the background/foreground anchors and the
 * derivation amounts (gray ramps, brand light/dark/gray ramps, status
 * light/dark, smart-bw). Switch color mode in the editor to watch the whole
 * grid recompute.
 *
 * Each swatch is keyed to the emitted CSS var; smart-bw / tint are
 * context-computed (not standalone vars) so they pass an explicit `css`.
 */

// Derived gray ramp steps emitted by the engine (note: no 350; 150/250 exist).
const GRAY_STEPS = [
  "50", "100", "150", "200", "250", "300", "400",
  "500", "600", "700", "800", "900", "950",
] as const;

const BRAND = ["1", "2", "3", "4"] as const;
const STATUS = ["success", "info", "warning", "error"] as const;

export default function ColorDerivationsFixture() {
  return (
    <FixtureBody>
      <Row label="anchors (per mode)">
        <Swatch token="background" />
        <Swatch token="foreground" />
      </Row>

      <Row label="gray scale (foreground → background mix)">
        <Ramp tokens={GRAY_STEPS.map((s) => `color-gray-${s}`)} />
      </Row>

      <Row label="gray pure (mode-independent anchors)">
        <Ramp tokens={GRAY_STEPS.map((s) => `color-gray-pure-${s}`)} />
      </Row>

      {BRAND.map((b) => (
        <Row key={b} label={`brand-${b} — light · dark · gray ramp`}>
          <Swatch token={`color-brand-${b}`} />
          <Swatch token={`color-brand-${b}-light`} />
          <Swatch token={`color-brand-${b}-dark`} />
          <Ramp tokens={GRAY_STEPS.map((s) => `color-brand-${b}-gray-${s}`)} />
        </Row>
      ))}

      {STATUS.map((s) => (
        <Row key={s} label={`status-${s} — base · light · dark`}>
          <Swatch token={`color-status-${s}`} />
          <Swatch token={`color-status-${s}-light`} />
          <Swatch token={`color-status-${s}-dark`} />
        </Row>
      ))}

      <Row label="smart / context-computed">
        <Swatch
          token="smart-bw"
          css="hsl(from var(--background) 0 0 calc((l - 74) * -100))"
        />
        <Swatch token="tint" css="var(--tint, transparent)" />
      </Row>
    </FixtureBody>
  );
}
