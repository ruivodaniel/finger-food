/** PatternsPage — /implementation-patterns: the implementation patterns, each one a small working case to read and copy. */

import * as React from "react";
import { Button, Card, Content, Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { mounted } from "../../services/application/mount";

const PATTERNS = [
  { path: "meteors", title: "Meteors", shows: "The default data flow, with no store: a list with search and pages, a detail, new, edit and history. Local state in the components, fetched data from the query cache through the application service." },
  { path: "minesweeper", title: "Massive minesweeper", shows: "The slice store, the exception: a component bound to its own state is drawn again only when that state changes, whatever the size of the board. Also the pattern for virtual scrolling." },
] as const;

export function PatternsPage({ patternsPath }: { patternsPath: string }): React.ReactElement {
  const { router } = mounted();
  return (
    <Stack dir="col" scale="lg" data-testid="patterns-page" className="w-full max-w-4xl">
      {PATTERNS.map((pattern) => (
        <Card key={pattern.path}><Content>
          <Stack dir="col" scale="md">
            <Text type="body">{pattern.title}</Text>
            <Text type="body-small" emphasis="quiet">{pattern.shows}</Text>
            <Stack dir="row"><Button scale="sm" data-testid={`open-${pattern.path}`} onClick={() => void router?.navigate({ to: `${patternsPath}/${pattern.path}` })}>Open</Button></Stack>
          </Stack>
        </Content></Card>
      ))}
    </Stack>
  );
}
