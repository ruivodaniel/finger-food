/**
 * A meteor edited live, as the app's live editing asks of a kind of document. This slice names no other slice: the core
 * registers it as the kind "meteor". The document is the meteor's fields; a change is one field, by its name; who may
 * read and write is canAccess, and storing is the service's checkpoint write.
 */
import { PRIVATE, type ScopedAcRequestContext } from "@libs/gated-scoped-ac";
import { CreateMeteorSchema } from "../models/meteor.schemas";
import type { MeteorFields, MeteorService } from "../services/meteor.service";

/** One edit of a live meteor: the field it sets, by name. */
export interface MeteorFieldChange {
  opId: string;
  /** ["fields", "<field name>"] */
  path: string[];
  before?: unknown;
  after?: unknown;
}

const FIELDS: readonly (keyof MeteorFields)[] = ["name", "description", "diameterKm", "discoveredAt"];
const fieldOf = (change: MeteorFieldChange) => change.path[0] === "fields" ? FIELDS.find((field) => field === change.path[1]) : undefined;
const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);

export function createMeteorLiveDocument(meteorService: Pick<MeteorService, "canAccess" | "getLiveDocument" | "saveLiveDocument" | "getTitles">) {
  return {
    kind: "meteor",

    access: (scopedAc: unknown, meteorId: string, action: "read" | "write") =>
      scopedAc ? meteorService.canAccess(scopedAc as ScopedAcRequestContext, PRIVATE, meteorId, action) : Promise.resolve(false),

    load: (meteorId: string) => meteorService.getLiveDocument(PRIVATE, meteorId),

    applyChanges(document: MeteorFields, changes: MeteorFieldChange[]): MeteorFields {
      const next = { ...document };
      for (const change of changes) {
        const field = fieldOf(change);
        if (field) Object.assign(next, { [field]: change.after ?? null });
      }
      return next;
    },

    diff(current: MeteorFields, next: MeteorFields, newOpId: () => string): MeteorFieldChange[] {
      return FIELDS.filter((field) => !same(current[field], next[field])).map((field) => ({ opId: newOpId(), path: ["fields", field], before: current[field], after: next[field] }));
    },

    stillHolds(document: MeteorFields, change: MeteorFieldChange): boolean {
      const field = fieldOf(change);
      return field !== undefined && same(document[field], change.before);
    },

    /** What a meteor may not become: the same validation as the form. */
    async findRefusal(_meteorId: string, _current: MeteorFields, next: MeteorFields): Promise<string | null> {
      const checked = CreateMeteorSchema.safeParse(next);
      return checked.success ? null : checked.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    },

    save: (meteorId: string, document: MeteorFields, editorId: string) => meteorService.saveLiveDocument(PRIVATE, meteorId, document, editorId),

    titlesOf: (meteorIds: string[]) => meteorService.getTitles(PRIVATE, meteorIds),
  };
}

export type MeteorLiveDocument = ReturnType<typeof createMeteorLiveDocument>;
