import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

export default function AccordionFixture() {
  return (
    <FixtureBody>
      <Row label="single — one item open by default">
        <Instance id="single" initial={{ data: { value: "two" } }}>
          {(x) => (
            <Accordion type="single" collapsible {...x.bind("value", "value", "onValueChange")} style={{ maxWidth: 400, width: "100%" }}>
              <AccordionItem value="one">
                <AccordionTrigger>What is Acme?</AccordionTrigger>
                <AccordionContent>
                  <p element="type--body-small" emphasis="quiet">A collaboration platform connecting teams across your organization.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="two">
                <AccordionTrigger>How do I manage my organization?</AccordionTrigger>
                <AccordionContent>
                  <p element="type--body-small" emphasis="quiet">Settings → Organization to invite members, change roles, and configure access.</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="three">
                <AccordionTrigger>What roles are available?</AccordionTrigger>
                <AccordionContent>
                  <p element="type--body-small" emphasis="quiet">Owner, Admin, Member, and Viewer — assignable per organization.</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
        </Instance>
      </Row>
    </FixtureBody>
  );
}
