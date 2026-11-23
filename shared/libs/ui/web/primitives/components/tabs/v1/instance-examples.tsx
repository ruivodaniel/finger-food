import { Tabs, TabsList, TabsTrigger } from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

export default function TabsFixture() {
  return (
    <FixtureBody>
      <Row label="default — All / Active / Inactive / Disabled">
        <Instance id="default" initial={{ data: { value: "all" } }}>
          {(x) => (
            <Tabs {...x.bind("value", "value", "onValueChange")}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                <TabsTrigger value="disabled" disabled>Disabled</TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </Instance>
      </Row>
    </FixtureBody>
  );
}
