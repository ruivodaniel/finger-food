import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  Button,
  Input,
} from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

export default function PopoverFixture() {
  return (
    <FixtureBody>
      <Row label="basic">
        <Instance id="basic" initial={{ data: { open: false } }}>
          {(x) => (
            <Popover {...x.bind("open", "open", "onOpenChange")}>
              <PopoverTrigger asChild>
                <Button emphasis="secondary">Open popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>Popover title</PopoverTitle>
                  <PopoverDescription>
                    This is a basic popover with a title and some descriptive text
                    inside.
                  </PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
          )}
        </Instance>
      </Row>

      <Row label="form-like">
        <Instance id="form" initial={{ data: { open: false } }}>
          {(x) => (
            <Popover {...x.bind("open", "open", "onOpenChange")}>
              <PopoverTrigger asChild>
                <Button emphasis="secondary">Open form popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>Quick edit</PopoverTitle>
                  <PopoverDescription>
                    Update the value below and press enter to save.
                  </PopoverDescription>
                </PopoverHeader>
                <Instance id="form-value" initial={{ config: { scale: "md", placeholder: "Enter a value..." }, data: { value: "" } }}>
                  {(input) => <Input scale={input.config.scale} placeholder={input.config.placeholder} {...input.bind("value")} />}
                </Instance>
              </PopoverContent>
            </Popover>
          )}
        </Instance>
      </Row>
    </FixtureBody>
  );
}
