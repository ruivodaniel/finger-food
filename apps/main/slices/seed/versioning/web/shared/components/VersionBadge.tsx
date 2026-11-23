// The version on show in one line. A warning when it isn't main's head.
import { Badge } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { VersionView } from "../../../shared/types";
import { formatMoment } from "../helpers/format";
import { AuthorMark } from "./AuthorMark";

export function VersionBadge({ version }: { version: VersionView }) {
  const isMainHead = version.isHead && version.branch === "main";
  return (
    <Stack dir="row" scale="sm" align="center" wrap data-testid="version-badge">
      <Badge scale="xs" status="info" emphasis="secondary">{version.label}</Badge>
      {isMainHead ? null : <Badge scale="xs" status="warning">old version</Badge>}
      <AuthorMark author={version.author} />
      <span element="type--body-small" emphasis="quiet">{formatMoment(version.at)}</span>
    </Stack>
  );
}
