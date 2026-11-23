// The registry of presenters: per entity, how a row is shown. The app injects them at mount; the slice names no entity.
import type { Presenter } from "./types";

const presenters = new Map<string, Presenter>();

export function registerPresenter(entity: string, presenter: Presenter): void {
  presenters.set(entity, presenter);
}

/** The entity's presenter, or the default: titled by its name, title or id. */
export function presenterOf(entity: string): Presenter {
  return presenters.get(entity) ?? { title: (row) => String(row.name ?? row.title ?? row.id ?? "") };
}
