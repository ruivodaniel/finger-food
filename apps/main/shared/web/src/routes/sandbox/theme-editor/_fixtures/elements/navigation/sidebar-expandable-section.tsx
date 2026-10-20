import { SidebarExpandableSection } from "@libs/web-components";
import { FixtureBody, Row } from "../_chrome";

export default function SidebarExpandableSectionFixture() {
  return (
    <FixtureBody>
      <Row label="collapsed / expanded">
        <div style={{ width: 240, border: "1px solid #e4e4e7", borderRadius: 8, padding: 8 }}>
          <SidebarExpandableSection title="Documents" iconName="folder" defaultOpen>
            <div style={{ padding: "4px 0" }}>
              <p element="type--body-small">Resume.pdf</p>
              <p element="type--body-small">Cover letter.docx</p>
            </div>
          </SidebarExpandableSection>
          <SidebarExpandableSection title="Images" iconName="image" defaultOpen={false}>
            <div style={{ padding: "4px 0" }}>
              <p element="type--body-small">avatar.png</p>
              <p element="type--body-small">banner.jpg</p>
            </div>
          </SidebarExpandableSection>
        </div>
      </Row>
    </FixtureBody>
  );
}
