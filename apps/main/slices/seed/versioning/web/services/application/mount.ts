// What the app hands the slice at mount: the http client and each entity's presenter. The slice's one wiring point.
import { registerPresenter } from "../../shared/components/presenters";
import type { Presenter } from "../../shared/components/types";
import { configureHttp, type VersioningHttp } from "../api/http";

export type { VersioningHttp } from "../api/http";

export interface MountVersioningWebOptions {
  http: VersioningHttp;
  /** Where the app mounts the slice's router (default /api/client). */
  clientPath?: string;
  /** By entity key: how each versioned entity's row is shown. */
  presenters: Record<string, Presenter>;
}

/** Wires the slice's services to the app. Call once, before the first render. */
export function mountVersioningWeb({ http, clientPath, presenters }: MountVersioningWebOptions): void {
  configureHttp(http, clientPath);
  for (const [entity, presenter] of Object.entries(presenters)) registerPresenter(entity, presenter);
}
