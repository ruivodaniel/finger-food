import { FixtureBody, Row, Swatch } from "../_chrome";

/**
 * Color Primitives fixture. The hand-authored color layer — the raw tokens
 * a theme declares directly (no derivation). Mirrors the cockpit's primitives
 * palette so the theme can be eyeballed against the live engine output.
 *
 * Each swatch is keyed to the CSS var the engine emits, so the grid always
 * reflects the active theme + color mode.
 */

const BRAND = ["1", "2", "3", "4"] as const;
const STATUS = ["success", "info", "warning", "error"] as const;
const FLAT = [
  "red", "orange", "yellow", "lime", "green", "mint",
  "turquoise", "blue", "violet", "purple", "pink",
] as const;
const SEMANTIC = ["primary", "secondary", "accent", "muted"] as const;

export default function ColorPrimitivesFixture() {
  return (
    <FixtureBody>
      <Row label="main">
        <Swatch token="color-main-white" />
        <Swatch token="color-main-black" />
      </Row>

      <Row label="brand">
        {BRAND.map((b) => (
          <Swatch key={b} token={`color-brand-${b}`} />
        ))}
      </Row>

      <Row label="status">
        {STATUS.map((s) => (
          <Swatch key={s} token={`color-status-${s}`} />
        ))}
      </Row>

      <Row label="flat accent colors">
        {FLAT.map((f) => (
          <Swatch key={f} token={`color-flat-${f}`} />
        ))}
      </Row>

      <Row label="semantic tokens">
        {SEMANTIC.map((t) => (
          <Swatch key={t} token={t} />
        ))}
      </Row>
    </FixtureBody>
  );
}
