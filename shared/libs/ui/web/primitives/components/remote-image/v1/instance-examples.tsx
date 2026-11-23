import { RemoteImage } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";

const SAMPLE = `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="320" height="200" fill="#5C5FEB"/><circle cx="240" cy="60" r="36" fill="#fff" opacity=".8"/><path d="M0 200 L120 80 L200 150 L260 110 L320 200Z" fill="#0A0A18" opacity=".6"/></svg>')}`;

export default function RemoteImageFixture() {
  return (
    <FixtureBody>
      <Row label="scales: the theme's box per scale, cover by default">
        {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => <RemoteImage key={s} src={SAMPLE} alt="sample" scale={s} />)}
      </Row>
      <Row label="fit: cover (crop) · contain (whole, inside the box) · none (the image's own size)">
        <RemoteImage src={SAMPLE} alt="cover" scale="xl" fit="cover" />
        <RemoteImage src={SAMPLE} alt="contain" scale="xl" fit="contain" />
        <RemoteImage src={SAMPLE} alt="none" fit="none" />
      </Row>
      <Row label="focus: where a crop keeps the image">
        <RemoteImage src={SAMPLE} alt="left" scale="lg" focus="left" />
        <RemoteImage src={SAMPLE} alt="center" scale="lg" focus="center" />
        <RemoteImage src={SAMPLE} alt="right" scale="lg" focus="right" />
      </Row>
      <Row label="a precise box · a width with a ratio">
        <RemoteImage src={SAMPLE} alt="precise" width={200} height={80} />
        <RemoteImage src={SAMPLE} alt="ratio" width={200} ratio="16/9" />
      </Row>
      <Row label="emphasis and states, the theme's look">
        <RemoteImage src={SAMPLE} alt="hero" scale="md" emphasis="hero" />
        <RemoteImage src={SAMPLE} alt="selected" scale="md" state="selected" />
        <RemoteImage src={SAMPLE} alt="disabled" scale="md" state="disabled" />
      </Row>
      <Row label="fallback (no source)">
        <RemoteImage src={null} alt="none" scale="md" fallback={<span element="type--body-small" emphasis="quiet">no image</span>} />
      </Row>
    </FixtureBody>
  );
}
