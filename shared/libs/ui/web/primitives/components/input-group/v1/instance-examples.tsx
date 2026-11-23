import { Input, InputGroup, InputGroupAddon, InputGroupText, Button } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

/** one input inside a group: its config (scale, status) and its data (value) live in the instance; typing writes to it */
const One = ({ id, scale, status, placeholder }: { id: string; scale?: string; status?: string; placeholder: string }) => (
  <Instance id={id} initial={{ config: { scale, status }, data: { value: "" } }}>
    {(x) => <Input scale={x.config.scale} status={x.config.status} placeholder={placeholder} {...x.bind("value")} />}
  </Instance>
);

export default function InputGroupFixture() {
  return (
    <FixtureBody>
      <Row label="text addon left">
        <div style={{ maxWidth: 320, width: "100%" }}>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>https://</InputGroupText>
            </InputGroupAddon>
            <One id="addon-left" placeholder="example.com" />
          </InputGroup>
        </div>
      </Row>

      <Row label="text addon right">
        <div style={{ maxWidth: 320, width: "100%" }}>
          <InputGroup>
            <One id="addon-right" placeholder="yoursite" />
            <InputGroupAddon>
              <InputGroupText>.com</InputGroupText>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </Row>

      <Row label="button addon">
        <div style={{ maxWidth: 320, width: "100%" }}>
          <InputGroup>
            <One id="addon-button" placeholder="Search..." />
            <InputGroupAddon>
              <Button scale="sm">Go</Button>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </Row>

      <Row label="scale">
        <div className="flex flex-col gap-2" style={{ maxWidth: 320 }}>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>SM</InputGroupText>
            </InputGroupAddon>
            <One id="scale-sm" scale="sm" placeholder="Small" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>MD</InputGroupText>
            </InputGroupAddon>
            <One id="scale-md" scale="md" placeholder="Medium" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>LG</InputGroupText>
            </InputGroupAddon>
            <One id="scale-lg" scale="lg" placeholder="Large" />
          </InputGroup>
        </div>
      </Row>

      <Row label="status">
        <div className="flex flex-col gap-2" style={{ maxWidth: 320 }}>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>@</InputGroupText>
            </InputGroupAddon>
            <One id="status-error" scale="md" status="error" placeholder="Error" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>@</InputGroupText>
            </InputGroupAddon>
            <One id="status-warning" scale="md" status="warning" placeholder="Warning" />
          </InputGroup>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>@</InputGroupText>
            </InputGroupAddon>
            <One id="status-success" scale="md" status="success" placeholder="Success" />
          </InputGroup>
        </div>
      </Row>
    </FixtureBody>
  );
}
