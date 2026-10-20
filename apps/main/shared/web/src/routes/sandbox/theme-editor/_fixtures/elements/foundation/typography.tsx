import { FixtureBody, Row } from "../_chrome";

/**
 * Typography fixture. No React component exists — typography is applied
 * via `element="type--..."` attribute on any tag. This fixture shows the
 * full type scale so the theme can be calibrated against real copy.
 */
export default function TypographyFixture() {
  return (
    <FixtureBody>
      <Row label="headings">
        <div className="flex flex-col gap-3 w-full">
          <p element="type--heading1">Heading 1 — The quick brown fox</p>
          <p element="type--heading2">Heading 2 — The quick brown fox</p>
          <p element="type--heading3">Heading 3 — The quick brown fox</p>
          <p element="type--heading4">Heading 4 — The quick brown fox</p>
        </div>
      </Row>

      <Row label="body sizes">
        <div className="flex flex-col gap-3 w-full">
          <p element="type--body-extra-large">Body Extra Large — The quick brown fox jumps over the lazy dog</p>
          <p element="type--body-large">Body Large — The quick brown fox jumps over the lazy dog</p>
          <p element="type--body">Body — The quick brown fox jumps over the lazy dog</p>
          <p element="type--body-small">Body Small — The quick brown fox jumps over the lazy dog</p>
          <p element="type--body-extra-small">Body Extra Small — The quick brown fox jumps over the lazy dog</p>
        </div>
      </Row>

      <Row label="emphasis">
        <div className="flex flex-col gap-2 w-full">
          <p element="type--body">Default — The quick brown fox jumps over the lazy dog</p>
          <p element="type--body" emphasis="quiet">Quiet — The quick brown fox jumps over the lazy dog</p>
        </div>
      </Row>

      <Row label="numbers">
        <div className="flex flex-col gap-2 w-full">
          <p element="type--numbers-extra-large">1234567890</p>
          <p element="type--numbers-large">1234567890</p>
          <p element="type--numbers">1234567890</p>
          <p element="type--numbers-small">1234567890</p>
          <p element="type--numbers-extra-small">1234567890</p>
        </div>
      </Row>

      <Row label="quote / code / link">
        <div className="flex flex-col gap-2 w-full">
          <p element="type--quote-large">"Quote Large — calm clarity over loud certainty."</p>
          <p element="type--quote">"Quote — calm clarity over loud certainty."</p>
          <p element="type--quote-small">"Quote Small — calm clarity over loud certainty."</p>
          <code element="type--code">const inline = "code snippet";</code>
          <a href="#" element="type--link">A link to somewhere</a>
        </div>
      </Row>
    </FixtureBody>
  );
}
