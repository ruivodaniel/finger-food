import { Canvas, erd, type CanvasDocument, type CanvasNode } from "@libs/knowledge/hosts/canvas";
import { erdNode, type ErdNode } from "@libs/knowledge/previewer-editors/erd-node/v1";
import { fromDbml } from "@libs/erd-schema";
import { Stack } from "@libs/web-layouts";
import { Instance, instances } from "../../../lib/instance";

/** Pattern: knowledge — the ERD canvas over a DBML text: the same canvas, template and node as canvas-erd, the tables read by the erd-schema DBML adapter instead of the Drizzle one.
 *  The text below is user & organization management as its generator wrote it; a designed schema is read the same way. */
const ID = "canvas-erd-dbml";
const DBML = `enum consent_context {
  registration
  gate
}

enum invitation_status {
  pending
  accepted
  rejected
  revoked
}

enum legal_document_type {
  termsAndConditions
  privacyPolicy
  marketing
}

table consent_record {
  id text [pk, not null]
  user_id text [not null]
  legal_document_id text [not null]
  legal_document_type legal_document_type [not null]
  legal_document_version integer [not null]
  org_type_id text
  context consent_context [not null]
  consented_at timestamp [not null]
  ip_address text
  user_agent text

  indexes {
    (user_id, legal_document_type) [name: 'consent_record_user_type_idx']
  }
}

table invitation {
  id text [pk, not null]
  organization_id text [not null]
  email text
  phone text
  roles text[] [not null]
  status invitation_status [not null, default: 'pending']
  inviter_id text [not null]
  invited_user_id text
  expires_at timestamp [not null]
  created_at timestamp [not null]
  updated_at timestamp [not null]

  indexes {
    organization_id [name: 'invitation_org_idx']
    email [name: 'invitation_email_idx']
    phone [name: 'invitation_phone_idx']
  }
}

table legal_document {
  id text [pk, not null]
  type legal_document_type [not null]
  org_type_id text
  version integer [not null]
  title text [not null]
  content_html text [not null]
  published_at timestamp
  created_at timestamp [not null]

  indexes {
    (type, org_type_id, version) [name: 'legal_document_type_scope_version_idx', unique]
  }
}

table member {
  id text [pk, not null]
  organization_id text [not null]
  user_id text [not null]
  roles text[] [not null]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    (organization_id, user_id) [name: 'member_org_user_idx', unique]
    user_id [name: 'member_user_idx']
  }
}

table organization {
  id text [pk, not null]
  type text [not null]
  name text [not null]
  logo text
  metadata jsonb [not null, default: \`{}\`]
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp

  indexes {
    type [name: 'organization_type_idx']
  }
}

table user {
  id text [pk, not null]
  identity_id text [not null, unique]
  status text [not null, default: 'active']
  created_at timestamp [not null]
  updated_at timestamp [not null]
  deleted_at timestamp
}

table user_contacts {
  id text [pk, not null]
  user_id text [not null]
  contact jsonb [not null]
  is_default boolean [not null, default: false]
  created_at timestamp [not null]

  indexes {
    user_id [name: 'user_contacts_user_idx']
  }
}

table user_profile {
  user_id text [pk, not null]
  name text
  image text
  data jsonb [not null, default: \`{}\`]
  updated_at timestamp [not null]
}

ref consent_record_user_id_user_id_fk: consent_record.user_id > user.id [delete: cascade, update: no action]

ref consent_record_legal_document_id_legal_document_id_fk: consent_record.legal_document_id > legal_document.id [delete: no action, update: no action]

ref invitation_organization_id_organization_id_fk: invitation.organization_id > organization.id [delete: cascade, update: no action]

ref invitation_inviter_id_user_id_fk: invitation.inviter_id > user.id [delete: no action, update: no action]

ref member_organization_id_organization_id_fk: member.organization_id > organization.id [delete: cascade, update: no action]

ref member_user_id_user_id_fk: member.user_id > user.id [delete: cascade, update: no action]

ref user_contacts_user_id_user_id_fk: user_contacts.user_id > user.id [delete: cascade, update: no action]

ref user_profile_user_id_user_id_fk: user_profile.user_id > user.id [delete: cascade, update: no action]`;
const TABLES = fromDbml(DBML, { source: "generated" }).tables;
const AT: Record<string, { x: number; y: number }> = { user_profile: { x: 455, y: -115 }, user_contacts: { x: 269, y: 40 }, user: { x: 476, y: 36 }, member: { x: 642, y: 8 }, organization: { x: 787, y: 44 }, invitation: { x: 638, y: 91 }, consent_record: { x: 441, y: 151 }, legal_document: { x: 438, y: 254 } };
const doc = (layout: string): CanvasDocument => ({
  id: ID, template: "erd", groups: [], edges: [],
  nodes: TABLES.map((t, i): CanvasNode<ErdNode> => ({ id: t.name, kind: "erd_node", x: AT[t.name]?.x ?? i * 220, y: AT[t.name]?.y ?? 400, layout, data: t })),
});

/** the measure of the previewer's container around each fixture */
export const measure = "xl";

export default function CanvasErdDbmlFixture() {
  return (
    <Instance id={ID} initial={{ data: { document: doc("simplified") } }}>
      {(x) => (
        <Stack dir="col" scale="sm">
          <span element="type--body-small" emphasis="quiet">The same tables, read from DBML text by the erd-schema adapter. The lines are the refs of the text, derived at runtime.</span>
          <div style={{ height: 620 }}>
            <Canvas document={x.data.document as CanvasDocument} template={erd} registrations={[erdNode]} mode="edit" onChange={(d) => instances.patch(ID, "data", { document: d })} viewLock="unlocked" />
          </div>
        </Stack>
      )}
    </Instance>
  );
}
