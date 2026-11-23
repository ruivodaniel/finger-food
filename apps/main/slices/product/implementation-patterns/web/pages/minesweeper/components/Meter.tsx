/** The readings of the last answer: what the API changed, how many cells were drawn again, and how long it took. */

import * as React from "react";
import { Text } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { getReading, subscribeToReading } from "../helpers/meter";

export function Meter(): React.ReactElement {
  const reading = React.useSyncExternalStore(subscribeToReading, getReading, getReading);
  if (!reading) return <Text type="body-small" emphasis="quiet">Click a cell. The readings of each answer show here.</Text>;
  return (
    <Stack dir="row" scale="xl" wrap data-testid="minesweeper-meter">
      <Text type="body-small">cells the API changed: {reading.changed}</Text>
      <Text type="body-small">cells drawn again: {reading.drawn}</Text>
      <Text type="body-small">request: {reading.requestMs} ms</Text>
      <Text type="body-small">answer to paint: {reading.paintMs} ms</Text>
    </Stack>
  );
}
