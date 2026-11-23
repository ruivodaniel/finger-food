import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  Button,
} from "@libs/web-components";
import { FixtureBody, Row } from "../../../../lib/_chrome";
import { Instance } from "../../../../lib/instance";

export default function DropdownMenuFixture() {
  return (
    <FixtureBody>
      <Row label="basic">
        <Instance id="basic" initial={{ data: { open: false } }}>
          {(x) => (
            <DropdownMenu {...x.bind("open", "open", "onOpenChange")}>
              <DropdownMenuTrigger asChild>
                <Button emphasis="secondary">Open menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuGroup>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem>Billing</DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">
                  Delete account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </Instance>
      </Row>

      <Row label="with checkbox items">
        <Instance id="checkboxes" initial={{ data: { open: false, profile: false, settings: true, billing: false } }}>
          {(x) => (
            <DropdownMenu {...x.bind("open", "open", "onOpenChange")}>
              <DropdownMenuTrigger asChild>
                <Button emphasis="secondary">View options</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem {...x.bind("profile", "checked", "onCheckedChange")}>
                  Profile
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem {...x.bind("settings", "checked", "onCheckedChange")}>
                  Settings
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem {...x.bind("billing", "checked", "onCheckedChange")}>
                  Billing
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </Instance>
      </Row>

      <Row label="with radio items">
        <Instance id="plan" initial={{ data: { open: false, plan: "pro" } }}>
          {(x) => (
            <DropdownMenu {...x.bind("open", "open", "onOpenChange")}>
              <DropdownMenuTrigger asChild>
                <Button emphasis="secondary">Select plan</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Subscription plan</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuRadioGroup {...x.bind("plan", "value", "onValueChange")}>
                  <DropdownMenuRadioItem value="free">Free</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="pro">Pro</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="enterprise">
                    Enterprise
                  </DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </Instance>
      </Row>
    </FixtureBody>
  );
}
