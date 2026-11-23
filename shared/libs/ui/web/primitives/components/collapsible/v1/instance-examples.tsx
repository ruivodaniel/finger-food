import { Collapsible, CollapsibleTrigger, CollapsibleContent, Button } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

export default function CollapsibleFixture() {
  return (
    <FixtureBody>
      <Row label="basic">
        <Instance id="open" initial={{ data: { open: true } }}>
          {(x) => (
            <Collapsible {...x.bind("open", "open", "onOpenChange")}>
              <CollapsibleTrigger asChild>
                <Button scale="sm">Toggle</Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p>This section is open by default. Click the button above to collapse it.</p>
              </CollapsibleContent>
            </Collapsible>
          )}
        </Instance>
        <Instance id="closed" initial={{ data: { open: false } }}>
          {(x) => (
            <Collapsible {...x.bind("open", "open", "onOpenChange")}>
              <CollapsibleTrigger asChild>
                <Button scale="sm">Toggle</Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p>This section is closed by default. Click the button above to expand it.</p>
              </CollapsibleContent>
            </Collapsible>
          )}
        </Instance>
      </Row>
    </FixtureBody>
  );
}
