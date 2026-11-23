import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

export default function HoverCardFixture() {
  return (
    <FixtureBody>
      <Row label="user card">
        <Instance id="alice" initial={{ data: { open: false } }}>
          {(x) => (
            <HoverCard {...x.bind("open", "open", "onOpenChange")}>
              <HoverCardTrigger asChild>
                <span className="underline cursor-pointer">@alice</span>
              </HoverCardTrigger>
              <HoverCardContent>
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    AL
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-sm">Alice Lambert</span>
                    <span element="type--body-small" className="text-muted-foreground">
                      Test User. Passionate about connecting families
                      with the right support.
                    </span>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </Instance>
      </Row>

      <Row label="link preview">
        <Instance id="bob" initial={{ data: { open: false } }}>
          {(x) => (
            <HoverCard {...x.bind("open", "open", "onOpenChange")}>
              <HoverCardTrigger asChild>
                <span className="underline cursor-pointer">@bob</span>
              </HoverCardTrigger>
              <HoverCardContent>
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-sm font-medium">
                    BM
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold text-sm">Bob Martinez</span>
                    <span element="type--body-small" className="text-muted-foreground">
                      Home health aide with 10+ years of experience in customer support
                      and rehabilitation support.
                    </span>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </Instance>
      </Row>
    </FixtureBody>
  );
}
