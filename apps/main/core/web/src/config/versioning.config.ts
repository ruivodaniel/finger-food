/**
 * versioning web wiring — the app's http client and each versioned entity's presenter, handed to the slice once at
 * startup. Paths use the slice default (/api/client), matching where the app mounts the versioning router.
 */

import { mountVersioningWeb, type VersioningHttp } from "@modules/versioning/web";
import { meteorPresenter } from "@product/implementation-patterns/web";

export function mountVersioning(deps: { http: VersioningHttp }): void {
  mountVersioningWeb({ ...deps, presenters: { meteor: meteorPresenter } });
}
