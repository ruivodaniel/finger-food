/**
 * MeteorForm — the form for the new page and the edit page. Validation is the
 * wire contract's: a name is required; the rest is optional.
 */

import * as React from "react";
import { Button, Input, Label, Textarea } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { CreateMeteorInput } from "../../../shared/types";

export interface MeteorFormProps {
  initial?: CreateMeteorInput;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
  onSubmit: (input: CreateMeteorInput) => void;
  onCancel: () => void;
}

export function MeteorForm({ initial, submitLabel, submitting, error, onSubmit, onCancel }: MeteorFormProps): React.ReactElement {
  const [name, setName] = React.useState(initial?.name ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [diameterKm, setDiameterKm] = React.useState(initial?.diameterKm ?? "");
  const [discoveredAt, setDiscoveredAt] = React.useState(initial?.discoveredAt ?? "");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
      diameterKm: diameterKm.trim() || null,
      discoveredAt: discoveredAt.trim() || null,
    });
  };

  return (
    <form data-testid="meteor-form" onSubmit={submit}>
      <Stack dir="col" scale="lg">
        <Stack dir="col" scale="xs">
          <Label htmlFor="meteor-name">Name</Label>
          <Input id="meteor-name" data-testid="meteor-name" value={name} onChange={(value) => setName(value)} required />
        </Stack>
        <Stack dir="col" scale="xs">
          <Label htmlFor="meteor-description">Description</Label>
          <Textarea id="meteor-description" data-testid="meteor-description" value={description} onChange={(value) => setDescription(value)} />
        </Stack>
        <Stack dir="col" scale="xs">
          <Label htmlFor="meteor-diameter">Diameter (km)</Label>
          <Input id="meteor-diameter" data-testid="meteor-diameter" type="number" step="any" value={diameterKm} onChange={(value) => setDiameterKm(value)} />
        </Stack>
        <Stack dir="col" scale="xs">
          <Label htmlFor="meteor-discovered">Discovered</Label>
          <Input id="meteor-discovered" data-testid="meteor-discovered" type="date" value={discoveredAt} onChange={(value) => setDiscoveredAt(value)} />
        </Stack>
        {error && <span element="type--body-small" data-testid="meteor-form-error">{error}</span>}
        <Stack dir="row" scale="sm" justify="end">
          <Button type="button" emphasis="secondary" onClick={onCancel} data-testid="meteor-cancel-btn">Cancel</Button>
          <Button type="submit" disabled={submitting || !name.trim()} data-testid="meteor-submit-btn">{submitLabel}</Button>
        </Stack>
      </Stack>
    </form>
  );
}
