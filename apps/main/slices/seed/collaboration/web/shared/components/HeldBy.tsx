// Who is editing an item someone else can't touch now: their avatar and name, beside the item's label.
import { Badge } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { UserAvatar } from "@modules/user-organization-mgmt/web";

export function HeldBy({ name, image, testId }: { name: string; image: string | null; testId?: string }) {
  return (
    <Badge emphasis="quiet" status="info" data-testid={testId ?? "held-by"}>
      <Stack dir="row" scale="xs" align="center">
        <UserAvatar name={name} image={image} scale="xs" />
        <span>{name} is editing</span>
      </Stack>
    </Badge>
  );
}
