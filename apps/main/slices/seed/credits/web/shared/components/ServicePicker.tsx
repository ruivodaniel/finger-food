/**
 * ServicePicker — what credits can be spent on: everything, or a list of the
 * catalog's services. Nothing ticked is everything.
 */

import * as React from "react";
import { Checkbox } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { mounted } from "../../services/application/mount";

export interface ServicePickerProps {
  /** null: everything */
  value: string[] | null;
  onChange: (value: string[] | null) => void;
  testId: string;
}

export function ServicePicker({ value, onChange, testId }: ServicePickerProps): React.ReactElement {
  const { catalog } = mounted();
  const chosen = value ?? [];
  const toggle = (key: string, on: boolean) => {
    const next = on ? [...chosen, key] : chosen.filter((k) => k !== key);
    onChange(next.length ? next : null);
  };
  return (
    <Stack dir="col" scale="xs" data-testid={testId}>
      <span element="type--body-small" emphasis="quiet">
        Tick none for everything.
      </span>
      {catalog.services.map((s) => (
        <Stack key={s.key} dir="row" scale="sm" align="center">
          <Checkbox checked={chosen.includes(s.key)} onCheckedChange={(on) => toggle(s.key, on === true)} data-testid={`${testId}-${s.key}`} />
          <span element="type--body-small">{s.name}</span>
        </Stack>
      ))}
    </Stack>
  );
}
