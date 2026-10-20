/**
 * NamedAvatar — an avatar with what a product may show beside it. Every part is a
 * property, so one component serves a table cell, a list row, a menu and a header:
 *
 *   image / initials   the image when there is one, else the initials (imageOnly: no initials)
 *   scale              xs · sm · md · lg
 *   showName           the name beside the avatar
 *   detail             a second line under the name (a contact, a type, a role)
 *   presence           online · offline, for products that let users see it
 *   roles              the roles as badges under the name
 *
 * UserAvatar and OrganizationAvatar are this component for each subject.
 */
import { Avatar, AvatarFallback, AvatarImage, Badge } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { initialsOf } from "@/lib/initials";

export interface NamedAvatarProps {
  name: string;
  image?: string | null;
  scale?: "xs" | "sm" | "md" | "lg";
  showName?: boolean;
  detail?: string;
  presence?: "online" | "offline";
  imageOnly?: boolean;
  roles?: string[];
  /** data-testid of the avatar, and of the second line */
  testId?: string;
  detailTestId?: string;
}

export function NamedAvatar({
  name,
  image,
  scale = "md",
  showName,
  detail,
  presence,
  imageOnly,
  roles,
  testId,
  detailTestId,
}: NamedAvatarProps) {
  const avatar = (
    <Avatar
      scale={scale}
      status={presence === "online" ? "success" : presence === "offline" ? "neutral" : undefined}
      data-testid={testId}
    >
      {image && <AvatarImage src={image} alt="" />}
      {!imageOnly && <AvatarFallback>{initialsOf(name)}</AvatarFallback>}
    </Avatar>
  );
  const hasRoles = !!roles?.length;
  if (!showName && !detail && !hasRoles) return avatar;
  const large = scale === "lg";
  return (
    <Stack dir="row" align="center" gap={large ? 12 : 10}>
      {avatar}
      <Stack dir="col" gap={2} size="fill">
        {showName && <span element={large ? "type--heading4" : "type--body"}>{name}</span>}
        {detail && (
          <span
            element={large ? "type--body-small" : "type--body-extra-small"}
            emphasis="quiet"
            data-testid={detailTestId}
          >
            {detail}
          </span>
        )}
        {hasRoles && (
          <Stack dir="row" gap={4} wrap>
            {roles!.map((role) => (
              <Badge key={role} emphasis="quiet" scale="sm">
                {role}
              </Badge>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
}
