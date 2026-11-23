/**
 * The one store: it only mounts each slice's store module — loading what they
 * persisted before the first render.
 */

import { rehydrateActiveOrganization } from "@modules/user-organization-mgmt/web";

export function mountStore(): void {
  rehydrateActiveOrganization();
}
