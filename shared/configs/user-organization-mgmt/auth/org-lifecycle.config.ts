/**
 * Org lifecycle config — how each org type is created and joined. One
 * canonical entry shape (see OrgLifecycleEntry in
 * @modules/user-organization-mgmt/shared). Validated on import.
 */

import {
  validateOrgLifecycle,
  type OrgLifecycleEntry,
} from "@modules/user-organization-mgmt/shared";

export const ORG_TYPE_IDS = [
  "system_admin",
  "platform_admin",
  "company",
  "musical_project",
] as const;
export type ProductOrgTypeId = (typeof ORG_TYPE_IDS)[number];

export const organizationCreationAndJoining: OrgLifecycleEntry[] = [
  {
    orgType: "system_admin",
    label: "System Admin",
    isSingleInstance: true, // there can be only one
    creation: { actor: "developer" }, // provisioned by the seed script, never user-created
    join: {
      invitation: {
        allow: true,
        confirmation: "explicit", // invited user must explicitly accept
        strictEmailMatch: true, // one of the user's identifiers must exactly match the invitation
        strictPhoneMatch: true,
      },
      spontaneous: { allow: false },
      legalConsent: [
        { type: "termsAndConditions", shown: true, consent: true },
        { type: "privacyPolicy", shown: true, consent: true },
      ],
    },
    teams: { allow: false },
  },
  {
    orgType: "platform_admin",
    label: "Platform Admin",
    isSingleInstance: true, // there can be only one
    creation: {
      actor: "user",
      ownership: {
        mode: ["creator", "invited"], // the creator owns it, or an invited user becomes owner
        membershipOwnerRole: "platform_owner",
        legalConsent: [
          { type: "termsAndConditions", shown: true, consent: true },
          { type: "privacyPolicy", shown: true, consent: true },
        ],
      },
    },
    join: {
      invitation: {
        allow: true,
        confirmation: "explicit",
        strictEmailMatch: true,
        strictPhoneMatch: true,
      },
      spontaneous: { allow: false },
      legalConsent: [
        { type: "termsAndConditions", shown: true, consent: true },
        { type: "privacyPolicy", shown: true, consent: true },
      ],
    },
    teams: { allow: false },
  },
  {
    orgType: "company",
    label: "Company",
    isSingleInstance: false, // there can be many
    creation: {
      actor: "user",
      ownership: {
        mode: ["creator"], // only the creator owns it
        membershipOwnerRole: "company_owner",
        legalConsent: [
          {
            type: "termsAndConditions",
            shown: true,
            consent: true,
            mandatory: true,
          },
          {
            type: "privacyPolicy",
            shown: true,
            consent: true,
            mandatory: true,
          },
        ],
      },
    },
    join: {
      invitation: {
        allow: true,
        confirmation: "explicit",
        strictEmailMatch: false, // any owned identifier of the invitation's type suffices
        strictPhoneMatch: false,
        expiresInSeconds: 48 * 60 * 60, // pending invitations stay acceptable for 2 days
      },
      spontaneous: { allow: false },
      legalConsent: [
        {
          type: "termsAndConditions",
          shown: true,
          consent: true,
          mandatory: true,
        },
        { type: "privacyPolicy", shown: true, consent: true, mandatory: true },
      ],
    },
    teams: { allow: false }, // teams come later
  },
  {
    orgType: "musical_project",
    label: "Musical Project",
    isSingleInstance: false, // any user may found any number of them
    creation: {
      actor: "user",
      ownership: {
        mode: ["creator"], // only the creator owns it
        membershipOwnerRole: "musical_project_owner",
        legalConsent: [
          {
            type: "termsAndConditions",
            shown: true,
            consent: true,
            mandatory: true,
          },
          {
            type: "privacyPolicy",
            shown: true,
            consent: true,
            mandatory: true,
          },
        ],
      },
    },
    join: {
      invitation: {
        allow: true,
        confirmation: "explicit",
        strictEmailMatch: false, // any owned identifier of the invitation's type suffices
        strictPhoneMatch: false,
        expiresInSeconds: 48 * 60 * 60, // pending invitations stay acceptable for 2 days
      },
      spontaneous: { allow: false },
      legalConsent: [
        {
          type: "termsAndConditions",
          shown: true,
          consent: true,
          mandatory: true,
        },
        { type: "privacyPolicy", shown: true, consent: true, mandatory: true },
      ],
    },
    teams: { allow: false }, // teams come later
  },
];

// Runs on import — a misconfigured entry fails loudly at load time.
validateOrgLifecycle(organizationCreationAndJoining);
