/**
 * LiveMeteorForm — a meteor's fields, edited live with whoever else has it open: everyone's changes show as they arrive,
 * a field being edited by someone else says who, and a locked meteor is read-only. Nothing to submit: what is typed is
 * sent as it is typed, and the server stores it.
 *
 * Reads the live-meteor store; everything else (opening it while on screen, each change) goes through meteorsService.
 */
import * as React from "react";
import { Badge, Input, Label, Textarea } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { HeldBy, HeldToast, PresenceBar } from "@modules/collaboration/web";
import { meteorsService } from "../../../services/application/meteors.service";
import type { MeteorFields } from "../../../shared/helpers/meteor-fields";
import { emptyLiveMeteor, useLiveMeteorStore } from "../../../store/live-meteor.store";

const LABELS: Record<keyof MeteorFields, string> = { name: "Name", description: "Description", diameterKm: "Diameter (km)", discoveredAt: "Discovered" };

export function LiveMeteorForm({ meteorId }: { meteorId: string }): React.ReactElement | null {
  React.useEffect(() => meteorsService.liveMeteor.open(meteorId), [meteorId]);
  const live = useLiveMeteorStore((store) => store.byId[meteorId] ?? emptyLiveMeteor);
  if (live.state === "failed") return <span element="type--body-small" data-testid="live-meteor-failed">{live.message ?? "This meteor can't be edited right now."}</span>;
  if (!live.fields) return null;
  const document = live.fields;
  const locked = live.lockedBy !== null;
  const set = (field: keyof MeteorFields, value: string) => meteorsService.liveMeteor.change(meteorId, { ...document, [field]: field === "name" ? value : value || null });
  const editing = (field: keyof MeteorFields) => ({
    disabled: locked || Boolean(live.heldBy[field]),
    onFocus: () => meteorsService.liveMeteor.editStart(meteorId, field),
    onBlur: () => meteorsService.liveMeteor.editEnd(meteorId, field),
  });
  /** The field's label, and who is editing it when it isn't you. */
  const label = (field: keyof MeteorFields, htmlFor: string) => {
    const holder = live.heldBy[field];
    return (
      <Stack dir="row" justify="between" align="center" className="w-full">
        <Label htmlFor={htmlFor}>{LABELS[field]}</Label>
        {holder && <HeldBy name={holder.name} image={holder.image} testId={`meteor-${field}-held`} />}
      </Stack>
    );
  };
  return (
    <Stack dir="col" scale="lg" data-testid="live-meteor-form">
      <Stack dir="row" justify="between" align="center">
        <PresenceBar members={live.members} />
        {locked && <Badge emphasis="quiet" status="warning" data-testid="live-meteor-locked">Locked by {live.lockedBy}: read-only</Badge>}
      </Stack>
      <Stack dir="col" scale="xs">
        {label("name", "meteor-name")}
        <Input id="meteor-name" data-testid="meteor-name" value={document.name} onChange={(value) => set("name", value)} {...editing("name")} />
      </Stack>
      <Stack dir="col" scale="xs">
        {label("description", "meteor-description")}
        <Textarea id="meteor-description" data-testid="meteor-description" value={document.description ?? ""} onChange={(value) => set("description", value)} {...editing("description")} />
      </Stack>
      <Stack dir="col" scale="xs">
        {label("diameterKm", "meteor-diameter")}
        <Input id="meteor-diameter" data-testid="meteor-diameter" type="number" step="any" value={document.diameterKm ?? ""} onChange={(value) => set("diameterKm", value)} {...editing("diameterKm")} />
      </Stack>
      <Stack dir="col" scale="xs">
        {label("discoveredAt", "meteor-discovered")}
        <Input id="meteor-discovered" data-testid="meteor-discovered" type="date" value={document.discoveredAt ?? ""} onChange={(value) => set("discoveredAt", value)} {...editing("discoveredAt")} />
      </Stack>
      {live.heldToast && <HeldToast text={live.heldToast} />}
    </Stack>
  );
}
