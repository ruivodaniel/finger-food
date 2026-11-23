/**
 * MeteorDetail — the meteor's fields, read-only. One detail for both detail
 * pages; the page puts the controls around it.
 */

import * as React from "react";
import { Badge } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import type { MeteorStatus } from "../../../shared/types";

export interface MeteorDetailProps {
  meteor: { name: string; description: string | null; diameterKm: string | null; discoveredAt: string | null; status?: MeteorStatus };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack dir="col" scale="3xs">
      <span element="type--body-small" emphasis="quiet">{label}</span>
      <span element="type--body">{children}</span>
    </Stack>
  );
}

export function MeteorDetail({ meteor }: MeteorDetailProps): React.ReactElement {
  return (
    <Stack dir="col" scale="lg" data-testid="meteor-detail">
      <Stack dir="row" scale="md" align="center">
        <h2 element="type--heading3">{meteor.name}</h2>
        {meteor.status && <Badge emphasis="quiet" status={meteor.status === "published" ? "success" : "neutral"}>{meteor.status}</Badge>}
      </Stack>
      <Field label="Description">{meteor.description ?? "—"}</Field>
      <Field label="Diameter (km)">{meteor.diameterKm ?? "—"}</Field>
      <Field label="Discovered">{meteor.discoveredAt ?? "—"}</Field>
    </Stack>
  );
}
