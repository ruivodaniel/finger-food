/**
 * The module's own avatars: what it renders when the app injects none.
 * The app's UserAvatar and OrganizationAvatar replace them (same props).
 */
import type * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { initialsOf } from "../lib/initials";
import type { AvatarComponentProps } from "../types";

function DefaultAvatar({
  name,
  image,
  scale = "md",
  showName,
  detail,
  imageOnly,
  testId,
  detailTestId,
}: AvatarComponentProps): React.ReactElement {
  const avatar = (
    <Avatar scale={scale} data-testid={testId}>
      {image && <AvatarImage src={image} alt="" />}
      {!imageOnly && <AvatarFallback>{initialsOf(name)}</AvatarFallback>}
    </Avatar>
  );
  if (!showName && !detail) return avatar;
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
      </Stack>
    </Stack>
  );
}

export const DefaultUserAvatar = DefaultAvatar;
export const DefaultOrganizationAvatar = DefaultAvatar;
