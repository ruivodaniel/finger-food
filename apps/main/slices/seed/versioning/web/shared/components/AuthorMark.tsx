// Who made a version: an agent marked, and who it acted for.
import { Avatar, AvatarFallback } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { VersionAuthor } from "../../../shared/types";
import { initialsOf } from "../helpers/format";

const markOf = (author: VersionAuthor) => (author.type === "agent" ? "AI" : author.type === "deterministic" ? "⚙" : initialsOf(author.name ?? author.id));

export function AuthorMark({ author }: { author: VersionAuthor }) {
  return (
    <Stack dir="row" scale="xs" align="center">
      <Avatar scale="xs"><AvatarFallback>{markOf(author)}</AvatarFallback></Avatar>
      <span element="type--body-small">{author.name ?? author.id}{author.instructedBy ? ` for ${author.instructedByName ?? author.instructedBy}` : ""}</span>
    </Stack>
  );
}
