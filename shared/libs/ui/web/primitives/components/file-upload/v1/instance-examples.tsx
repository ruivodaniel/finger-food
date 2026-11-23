import { FileUpload } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

/** one file field: its config (scale, status, disabled) and its data (the picked file) live in the instance; a pick writes to it */
const One = ({ id, scale, status, disabled = false, multiple, accept }: { id: string; scale?: string; status?: string; disabled?: boolean; multiple?: boolean; accept?: string }) => (
  <Instance id={id} initial={{ config: { scale, status, disabled }, data: { value: null } }}>
    {(x) => <FileUpload scale={x.config.scale} status={x.config.status} disabled={x.config.disabled} multiple={multiple} accept={accept} {...x.bind("value")} />}
  </Instance>
);

export default function FileUploadFixture() {
  return (
    <FixtureBody>
      <Row label="scale">
        <One id="scale-sm" scale="sm" />
        <One id="scale-md" scale="md" />
        <One id="scale-lg" scale="lg" />
      </Row>

      <Row label="status">
        <One id="status-error" scale="md" status="error" />
        <One id="status-warning" scale="md" status="warning" />
        <One id="status-success" scale="md" status="success" />
      </Row>

      <Row label="disabled">
        <One id="state-disabled" scale="md" disabled />
      </Row>

      <Row label="images only">
        <One id="images-only" scale="md" multiple accept="image/*" />
      </Row>
    </FixtureBody>
  );
}
