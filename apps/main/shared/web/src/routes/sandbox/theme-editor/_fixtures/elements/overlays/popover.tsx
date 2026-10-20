import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  Button,
} from "@libs/web-components";
import { FixtureBody, Row } from "../_chrome";

export default function PopoverFixture() {
  return (
    <FixtureBody>
      <Row label="basic">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open popover</Button>
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
      </Row>

      <Row label="form-like">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">Open form popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Quick edit</PopoverTitle>
              <PopoverDescription>
                Update the value below and press enter to save.
              </PopoverDescription>
            </PopoverHeader>
            <input
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Enter a value..."
            />
          </PopoverContent>
        </Popover>
      </Row>
    </FixtureBody>
  );
}
