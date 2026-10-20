/**
 * LegalVersionList — a scope's version history: draft on top, published
 * versions linking to their immutable public view.
 *
 * A List: each version a row — a file Tile · the title (the link, for a
 * published one) with its version Badge over "Published <date>" or "Draft".
 * The current published version is the row `state="selected"`.
 */

import * as React from "react";
import {
  Badge,
  Icon,
  List,
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemIcon,
  ListItemTitle,
  Tile,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { LegalDocumentView } from "../../../shared/types/domain";
import { legalDocumentHref } from "../../lib/legal-doc-paths";

export interface LegalVersionListProps {
  versions: LegalDocumentView[];
}

export function LegalVersionList({
  versions,
}: LegalVersionListProps): React.ReactElement | null {
  if (versions.length === 0) return null;
  // The current version: the first published one, the same rule the editor
  // uses for `published`.
  const currentId = versions.find((v) => v.publishedAt !== null)?.id ?? null;
  return (
    <Stack dir="col" gap={8} data-testid="legal-version-list">
      <span element="type--body-small" emphasis="quiet">
        Versions
      </span>
      <List position="fill">
        {versions.map((v) => {
          const isPublished = v.publishedAt !== null;
          return (
            <ListItem
              key={v.id}
              state={v.id === currentId ? "selected" : undefined}
             
            >
              <ListItemIcon>
                <Tile emphasis="quiet">
                  <Icon name={isPublished ? "fileText" : "edit"} size="sm" />
                </Tile>
              </ListItemIcon>
              <ListItemContent>
                <Stack dir="col" gap={2}>
                  <Stack dir="row" align="baseline" gap={8}>
                    <ListItemTitle>
                      {isPublished ? (
                        <a
                          href={legalDocumentHref(v.type, { docId: v.id })}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {v.title}
                        </a>
                      ) : (
                        v.title
                      )}
                    </ListItemTitle>
                    <Badge
                      emphasis="quiet"
                      scale="xs"
                      status={isPublished ? "success" : "warning"}
                    >
                      v{v.version}
                    </Badge>
                  </Stack>
                  <ListItemDescription>
                    {isPublished
                      ? `Published ${new Date(v.publishedAt as string).toLocaleDateString()}`
                      : "Draft"}
                  </ListItemDescription>
                </Stack>
              </ListItemContent>
            </ListItem>
          );
        })}
      </List>
    </Stack>
  );
}
