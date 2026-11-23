// A meteor's fields as a live document: one change per field that differs, by its name, and applying changes back.

export interface MeteorFields {
  name: string;
  description: string | null;
  diameterKm: string | null;
  discoveredAt: string | null;
}

export interface FieldChange {
  opId: string;
  path: string[];
  before?: unknown;
  after?: unknown;
}

export const METEOR_FIELDS: readonly (keyof MeteorFields)[] = ["name", "description", "diameterKm", "discoveredAt"];

const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function diffMeteorFields(current: MeteorFields, next: MeteorFields, newOpId: () => string): FieldChange[] {
  return METEOR_FIELDS.filter((field) => !same(current[field], next[field])).map((field) => ({ opId: newOpId(), path: ["fields", field], before: current[field], after: next[field] }));
}

export function applyMeteorFields(document: MeteorFields, changes: FieldChange[]): MeteorFields {
  const next = { ...document };
  for (const change of changes) {
    const field = METEOR_FIELDS.find((name) => change.path[0] === "fields" && change.path[1] === name);
    if (field) Object.assign(next, { [field]: change.after ?? null });
  }
  return next;
}
