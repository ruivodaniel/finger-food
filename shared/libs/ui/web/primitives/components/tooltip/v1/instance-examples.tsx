import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Button,
} from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

/** one tooltip: its config (side) and its data (open) live in the instance; hovering writes to it */
const One = ({ id, side, label }: { id: string; side: "top" | "right" | "bottom" | "left"; label: string }) => (
  <Instance id={id} initial={{ config: { side }, data: { open: false } }}>
    {(x) => (
      <Tooltip {...x.bind("open", "open", "onOpenChange")}>
        <TooltipTrigger asChild>
          <Button emphasis="secondary" scale="sm">
            {label}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={x.config.side}>
          Tooltip on {label.toLowerCase()}
        </TooltipContent>
      </Tooltip>
    )}
  </Instance>
);

export default function TooltipFixture() {
  return (
    <FixtureBody>
      <TooltipProvider>
        <Row label="sides">
          <div className="flex items-center gap-6">
            <One id="side-top" side="top" label="Top" />
            <One id="side-right" side="right" label="Right" />
            <One id="side-bottom" side="bottom" label="Bottom" />
            <One id="side-left" side="left" label="Left" />
          </div>
        </Row>

        <Row label="with button">
          <Instance id="with-button" initial={{ data: { open: false } }}>
            {(x) => (
              <Tooltip {...x.bind("open", "open", "onOpenChange")}>
                <TooltipTrigger asChild>
                  <Button>Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>
                  This tooltip appears above the button
                </TooltipContent>
              </Tooltip>
            )}
          </Instance>
        </Row>
      </TooltipProvider>
    </FixtureBody>
  );
}
