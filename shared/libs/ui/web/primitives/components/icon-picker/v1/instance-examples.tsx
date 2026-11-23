import { IconPicker, libraryIcons, type IconLibrary, type IconRef } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

/** a subset of the library: the icons a nav entry may take */
const NAV: IconLibrary = { id: "nav", name: "navigation", icons: libraryIcons(["home", "users", "settings", "mail", "file", "folder", "search", "info"]) };
/** another library altogether: a consumer's own glyphs, drawn its own way */
const MARKS: IconLibrary = { id: "marks", name: "marks", icons: ["●", "■", "▲", "◆", "★", "✚"].map((g) => ({ name: g, keywords: ["mark", "shape"], render: ({ size }) => <span style={{ fontSize: size ?? 16, lineHeight: 1 }}>{g}</span> })) };

/** one icon picker: its config (scale, status, disabled) and its data (the chosen icon) live in the instance; a pick writes to it */
function One({ id, initial, libraries, search, placeholder, scale, status, disabled }: { id: string; initial: IconRef | null; libraries?: IconLibrary[]; search?: boolean; placeholder?: string; scale?: string; status?: string; disabled?: boolean }) {
  return (
    <Instance id={id} initial={{ config: { scale, status, disabled }, data: { value: initial } }}>
      {(x) => <IconPicker libraries={libraries} search={search} placeholder={placeholder} scale={x.config.scale} status={x.config.status} disabled={x.config.disabled} {...x.bind("value")} />}
    </Instance>
  );
}

export default function IconPickerFixture() {
  return (
    <FixtureBody>
      <Row label="the library's own registry, whole (default) — with search">
        <One id="registry" initial={{ library: "library", name: "home" }} />
      </Row>
      <Row label="a subset of the library — no search">
        <One id="subset" libraries={[NAV]} search={false} initial={{ library: "nav", name: "home" }} />
      </Row>
      <Row label="two libraries — the subset and a consumer's own glyphs">
        <One id="two-libraries" libraries={[NAV, MARKS]} initial={{ library: "marks", name: "★" }} />
      </Row>
      <Row label="status · disabled">
        <One id="status-error" libraries={[NAV]} status="error" initial={{ library: "nav", name: "mail" }} />
        <One id="state-disabled" libraries={[NAV]} disabled initial={{ library: "nav", name: "mail" }} />
        <One id="state-disabled-empty" libraries={[NAV]} disabled placeholder="no icon" initial={null} />
      </Row>
      <Row label="scale">
        <One id="scale-sm" scale="sm" libraries={[NAV]} initial={{ library: "nav", name: "home" }} />
        <One id="scale-md" scale="md" libraries={[NAV]} initial={{ library: "nav", name: "home" }} />
        <One id="scale-lg" scale="lg" libraries={[NAV]} initial={{ library: "nav", name: "home" }} />
      </Row>
    </FixtureBody>
  );
}
