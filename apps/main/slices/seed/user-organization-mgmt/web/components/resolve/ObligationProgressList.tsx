/**
 * ObligationProgressList — the wizard's step list. Shows every obligation
 * seen this visit: cleared ones checked off, the current one highlighted,
 * the rest upcoming. Labels only — resolution happens in the mounted
 * resolver below the list, never through links.
 *
 * "Done" is client-local: the gate never reports satisfied obligations, so
 * the list remembers what it has seen (by obligation key) and marks entries
 * done once they stop being unmet.
 *
 * A section under its heading: a Progress bar of done-over-seen, then a
 * List — each step a row whose status (success) or state (selected · the
 * current one; disabled · upcoming) is the step's, a quiet Tile with the
 * step's mark as the icon cell. No inline styles.
 */

import * as React from "react";
import {
  Icon,
  List,
  ListItem,
  ListItemContent,
  ListItemIcon,
  ListItemTitle,
  Progress,
  Tile,
} from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import {
  obligationKey,
  type Obligation,
} from "../../../shared/auth-config/resolver";
import { describeObligation } from "../../lib/obligations";

export function ObligationProgressList({
  obligations,
}: {
  obligations: Obligation[];
}): React.ReactElement | null {
  const seen = React.useRef(new Map<string, string>());
  for (const o of obligations) {
    const key = obligationKey(o);
    if (!seen.current.has(key))
      seen.current.set(key, describeObligation(o).label);
  }

  if (seen.current.size === 0) return null;

  const unmet = new Set(obligations.map(obligationKey));
  const currentKey = obligations.length > 0 ? obligationKey(obligations[0]) : null;
  const entries = [...seen.current.entries()];
  const doneCount = entries.filter(([key]) => !unmet.has(key)).length;

  return (
    <Stack dir="col" gap={12}>
      <Stack dir="row" align="center" justify="between" gap={12}>
        <h2 element="type--heading4">Your progress</h2>
        <span element="type--body-small" emphasis="quiet">
          {doneCount} of {entries.length} done
        </span>
      </Stack>
      <Progress value={doneCount} max={entries.length} />
      <List data-testid="resolve-progress" position="fill">
        {entries.map(([key, label]) => {
          const done = !unmet.has(key);
          const current = key === currentKey;
          return (
            <ListItem
              key={key}
              data-testid={
                done
                  ? "resolve-step-done"
                  : current
                    ? "resolve-step-current"
                    : "resolve-step-upcoming"
              }
              status={done ? "success" : undefined}
              state={current ? "selected" : done ? undefined : "disabled"}
             
            >
              <ListItemIcon>
                <Tile emphasis="quiet">
                  <span element="type--body-small" status={done ? "success" : undefined}>
                    <Icon name={done ? "check" : current ? "arrowRight" : "circle"} size="sm" />
                  </span>
                </Tile>
              </ListItemIcon>
              <ListItemContent>
                <ListItemTitle>{label}</ListItemTitle>
              </ListItemContent>
            </ListItem>
          );
        })}
      </List>
    </Stack>
  );
}
