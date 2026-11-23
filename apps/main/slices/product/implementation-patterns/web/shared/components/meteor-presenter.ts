/**
 * How the versioning slice shows a meteor's versions: its title, the fields a
 * version's changes are named by. The core registers it under "meteor".
 */

import type { Presenter } from "@modules/versioning/web";

export const meteorPresenter: Presenter = {
  title: (row) => String(row.name ?? "Meteor"),
  fields: [
    { key: "name", label: "Name" },
    { key: "description", label: "Description" },
    { key: "diameterKm", label: "Diameter (km)" },
    { key: "discoveredAt", label: "Discovered" },
    { key: "status", label: "Status" },
  ],
};
