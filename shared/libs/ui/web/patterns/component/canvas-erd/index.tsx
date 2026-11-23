import { Canvas, erd, type CanvasDocument, type CanvasNode } from "@libs/knowledge/hosts/canvas";
import { erdNode, type ErdNode } from "@libs/knowledge/previewer-editors/erd-node/v1";
import { fromDrizzlePg } from "@libs/erd-schema";
import * as user from "../../../../../../../apps/main/slices/seed/user-organization-mgmt/api/models/user.model";
import * as legal from "../../../../../../../apps/main/slices/seed/user-organization-mgmt/api/models/legal.model";
import * as consent from "../../../../../../../apps/main/slices/seed/user-organization-mgmt/api/models/consent-record.model";
import * as organization from "../../../../../../../apps/main/slices/seed/user-organization-mgmt/api/models/organization.model";
import * as membership from "../../../../../../../apps/main/slices/seed/user-organization-mgmt/api/models/membership.model";
import * as invitation from "../../../../../../../apps/main/slices/seed/user-organization-mgmt/api/models/invitation.model";
import { Stack } from "@libs/web-layouts";
import { Instance, instances } from "../../../lib/instance";

/** Pattern: knowledge — the ERD canvas: the canvas host (v3) with the ERD template and the erd-node registration, over the tables the erd-schema adapter reads from the product's Drizzle models. One node per table; the lines are the foreign keys, derived from the fields at
 *  runtime, never stored. The template: select and pan only, no snapping, no guides; every ERD node lit in spotlight, no handles, no context bar. The consumer keeps only positions. */
const ID = "canvas-erd";
/** the product's own models, read by the erd-schema adapter: no file in between */
const UOM = fromDrizzlePg({ ...user, ...legal, ...consent, ...organization, ...membership, ...invitation }).tables;
const AT: Record<string, { x: number; y: number }> = { user_profile: { x: 455, y: -115 }, user_contacts: { x: 269, y: 40 }, user: { x: 476, y: 36 }, member: { x: 642, y: 8 }, organization: { x: 787, y: 44 }, invitation: { x: 638, y: 91 }, consent_record: { x: 441, y: 151 }, legal_document: { x: 438, y: 254 } };
const doc = (layout: string): CanvasDocument => ({
  id: ID, template: "erd", groups: [], edges: [],
  nodes: UOM.map((t): CanvasNode<ErdNode> => ({ id: t.name, kind: "erd_node", x: AT[t.name]?.x ?? 0, y: AT[t.name]?.y ?? 0, layout, data: t })),
});

/** the measure of the previewer's container around each fixture */
export const measure = "xl";

export default function CanvasErdFixture() {
  return (
    <Instance id={ID} initial={{ data: { document: doc("simplified") } }}>
      {(x) => (
        <Stack dir="col" scale="sm">
          <span element="type--body-small" emphasis="quiet">User & organization management, as the product's models generate it. Click a table: it lights with its keys and the rest dims. Drag: no snapping, no guides. The store tab holds only the document the canvas reports; the lines are not in it.</span>
          <div style={{ height: 620 }}>
            <Canvas document={x.data.document as CanvasDocument} template={erd} registrations={[erdNode]} mode="edit" onChange={(d) => instances.patch(ID, "data", { document: d })} viewLock="unlocked" />
          </div>
        </Stack>
      )}
    </Instance>
  );
}
