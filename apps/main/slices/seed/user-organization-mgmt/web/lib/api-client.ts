/**
 * Module API client — typed fetch wrappers for the module's own endpoints.
 * Lives in the module so removing the module breaks consumers loudly at
 * compile time. Credentials always included (cookie sessions). Base paths
 * are injected — the same client serves test (-v2) and final mounts.
 */

import type { AuthConfigView } from "../../shared/types/flows";
import type {
  ConsentRecordView,
  InvitationPublicView,
  InvitationView,
  MyInvitationView,
  LegalDocumentView,
  MemberListView,
  MembershipView,
  OrganizationDirectoryListView,
  OrganizationView,
  PendingConsentGroupView,
  SecurityStatusView,
  SessionView,
  UserView,
} from "../../shared/types/domain";
import { ACTIVE_ORG_HEADER } from "../../shared/types/domain";
import type {
  UpdateUserPreferencesInput,
  UserPreferencesView,
} from "../../shared/types/preferences";
import type { Obligation } from "../../shared/auth-config/resolver";
import { summarizeObligations } from "./obligations";
import { getActiveOrgId } from "./active-org";
import type { UserOrgMgmtWebConfig } from "../types";

/** Query string for list endpoints — undefined values dropped. */
function listQueryString(
  query: Record<string, string | number | undefined>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  return params.toString();
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface SessionResponse {
  user: UserView | null;
  session: SessionView | null;
}

/**
 * Every credential proof signs the caller in. 2FA is the GATE's demand: a
 * TOTP-enrolled member is 428-blocked at AAL1 and steps up on the live
 * session (/me/security/step-up), like any other obligation.
 */
export type LoginResponse = UserView;

/**
 * Registration always answers "code sent" — nothing exists until
 * `registerVerify` proves the delivered code, which births the account with
 * its address verified (and its password set, when the config collects one).
 */
export type RegisterResponse = { codeSent: true; flowId: string };

/** What `registerVerify` answers: the account is born and signed in. */
export type RegisterVerifyResponse = { user: UserView };

export type GateCheckResponse =
  | { status: "clear" }
  | { obligations: Obligation[] };

export interface UserOrgMgmtApiClient {
  // auth surface
  getAuthConfig(query: {
    intent: "registration" | "authentication" | "recovery";
    identifier?: string;
  }): Promise<AuthConfigView>;
  /**
   * Start a registration: the form's data is policy-checked and a code is
   * delivered. Nothing exists yet — the whole form (password included) stays
   * in client state and rides `registerVerify`, the request that births the
   * account.
   */
  register(body: {
    identifierType: string;
    identifierValue: string;
    password?: string;
    name?: string;
    consents?: Array<{ type: string; accepted: boolean }>;
    invitationId?: string;
  }): Promise<RegisterResponse>;
  registerVerify(body: {
    flowId: string;
    identifierType: string;
    identifierValue: string;
    code: string;
    name?: string;
    password?: string;
    consents?: Array<{ type: string; accepted: boolean }>;
    invitationId?: string;
  }): Promise<RegisterVerifyResponse>;
  loginPassword(body: {
    identifierType: string;
    identifierValue: string;
    password: string;
  }): Promise<LoginResponse>;
  loginCodeStart(body: {
    identifierType: string;
    identifierValue: string;
  }): Promise<{ flowId: string }>;
  loginCodeComplete(body: {
    flowId: string;
    identifierType: string;
    identifierValue: string;
    code: string;
  }): Promise<LoginResponse>;
  recoveryStart(body: {
    identifierType: string;
    identifierValue: string;
  }): Promise<{ flowId: string }>;
  /** Proving the code signs the caller in — it IS a credential proof. */
  recoveryComplete(body: {
    flowId: string;
    identifierType: string;
    identifierValue: string;
    code: string;
  }): Promise<UserView>;
  /** Signed-in: sets the password and revokes EVERY session, this one included. */
  recoveryFinish(body: {
    newPassword: string;
    identifierType?: string;
  }): Promise<void>;
  getSession(): Promise<SessionResponse>;
  logout(): Promise<void>;

  // domain surface
  getMe(): Promise<UserView>;
  updateProfile(body: {
    name?: string;
    image?: string;
    data?: Record<string, unknown>;
  }): Promise<UserView>;
  presignAvatarUpload(body: {
    contentType: string;
  }): Promise<{ uploadUrl: string; publicUrl: string }>;
  getMyPreferences(): Promise<UserPreferencesView>;
  updateMyPreferences(
    patch: UpdateUserPreferencesInput,
  ): Promise<UserPreferencesView>;
  addIdentifier(body: {
    type: "email" | "phone";
    value: string;
  }): Promise<{ verificationFlowId: string }>;
  verifyIdentifier(body: {
    flowId: string;
    code: string;
    type: "email" | "phone";
    value: string;
  }): Promise<UserView>;
  removeIdentifier(body: {
    type: "email" | "phone";
    value: string;
  }): Promise<UserView>;
  // legal — consent surface
  getCurrentLegalDocument(
    type: string,
    orgTypeId?: string,
  ): Promise<LegalDocumentView>;
  getLegalDocument(id: string): Promise<LegalDocumentView>;
  getPendingConsents(): Promise<PendingConsentGroupView[]>;
  getConsentHistory(): Promise<ConsentRecordView[]>;
  submitConsent(body: {
    orgTypeId: string | null;
    decisions: Array<{ type: string; accepted: boolean }>;
  }): Promise<void>;
  // legal — authoring surface (/legal-admin, gate-visible)
  getLegalAuthoringCatalog(): Promise<
    Array<{ orgTypeId: string | null; label: string; types: string[] }>
  >;
  listLegalDocumentVersions(
    type: string,
    orgTypeId: string | null,
  ): Promise<LegalDocumentView[]>;
  saveLegalDraft(body: {
    type: string;
    orgTypeId: string | null;
    title: string;
    contentHtml: string;
  }): Promise<LegalDocumentView>;
  publishLegalDocument(id: string): Promise<LegalDocumentView>;
  gateCheck(): Promise<GateCheckResponse>;

  // security (2FA)
  getSecurityStatus(): Promise<SecurityStatusView>;
  enrollTotp(): Promise<{
    flowId: string;
    totpSecret: string;
    qrDataUrl: string;
  }>;
  confirmTotp(body: {
    flowId: string;
    code: string;
  }): Promise<{ backupCodes: string[] }>;
  regenerateBackupCodes(): Promise<{ backupCodes: string[] }>;
  securityStepUp(body: {
    code: string;
    method: "totp" | "backup_code";
  }): Promise<void>;
  disableTotp(): Promise<void>;
  revokeOtherSessions(): Promise<void>;

  // organizations
  listMemberships(): Promise<MembershipView[]>;
  getCreatableOrganizationTypes(): Promise<Array<{ id: string; label: string }>>;
  createOrganization(body: {
    type: string;
    name: string;
    consents?: Array<{ type: string; accepted: boolean }>;
  }): Promise<OrganizationView>;
  // Org-scoped reads/writes name their target org in the URL
  // (`/organizations/:orgId/…` — never "current"); the server answers from
  // the active org's context, so a non-active org shows only what that
  // context's grants reach.
  getOrganization(orgId: string): Promise<OrganizationView>;
  updateOrganization(
    orgId: string,
    patch: {
      name?: string;
      logo?: string | null;
    },
  ): Promise<OrganizationView>;
  presignOrgLogoUpload(
    orgId: string,
    body: {
      contentType: string;
    },
  ): Promise<{ uploadUrl: string; publicUrl: string }>;
  listOrganizationsDirectory(query: {
    search?: string;
    type?: string;
    status?: string;
    page?: number;
    pageSize?: number;
  }): Promise<OrganizationDirectoryListView>;
  /** Self-removal from ANY of the caller's orgs (not just the active one). */
  leaveOrganization(orgId: string, selfUserId: string): Promise<void>;
  getOrganizationTypes(): Promise<Array<{ id: string; label: string }>>;
  listMembers(
    orgId: string,
    query: {
      search?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<MemberListView>;
  updateMemberRoles(
    orgId: string,
    userId: string,
    roles: string[],
  ): Promise<void>;
  removeMember(orgId: string, userId: string): Promise<void>;

  // invitations (of the named org)
  listOrgInvitations(orgId: string): Promise<InvitationView[]>;
  createInvitation(
    orgId: string,
    body: {
      email?: string;
      phone?: string;
      roles: string[];
    },
  ): Promise<InvitationView>;
  revokeInvitation(orgId: string, invitationId: string): Promise<void>;
  listMyInvitations(): Promise<MyInvitationView[]>;
  acceptInvitation(
    id: string,
    consents?: Array<{ type: string; accepted: boolean }>,
  ): Promise<void>;
  rejectInvitation(id: string): Promise<void>;
  getPublicInvitation(id: string): Promise<InvitationPublicView>;
}

/**
 * A human-readable message from an error body. The api answers
 * `{ error: "…" }`; a zod validation failure answers `{ error: ZodError }` —
 * an OBJECT, which must never reach a screen as "[object Object]".
 */
function errorMessageOf(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  for (const key of ["message", "error"] as const) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
      const issues = (value as { issues?: Array<{ message?: string; path?: Array<string | number> }> }).issues;
      if (Array.isArray(issues) && issues.length > 0) {
        return issues
          .map((i) => [i.path?.join("."), i.message].filter(Boolean).join(": "))
          .join("; ");
      }
    }
  }
  return null;
}

export interface ApiClientHooks {
  onGateBlocked?: (obligations: Obligation[]) => void;
}

export function createApiClient(
  config: UserOrgMgmtWebConfig,
  hooks?: ApiClientHooks,
): UserOrgMgmtApiClient {
  const authBase = `${config.apiBaseUrl}${config.authPath ?? "/api/auth"}`;
  const clientBase = `${config.apiBaseUrl}${config.clientPath ?? "/api/client"}`;

  async function request<T>(url: string, init?: RequestInit): Promise<T> {
    // Every request carries the client-store's active org — the CONTEXT the
    // server builds the caller's access bag from. Which org a call acts ON
    // travels in its URL; the two are never mixed.
    const activeOrgId = getActiveOrgId();
    const response = await fetch(url, {
      credentials: "include",
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(activeOrgId ? { [ACTIVE_ORG_HEADER]: activeOrgId } : {}),
      },
      ...init,
    });
    const text = await response.text();
    const body = text ? safeJson(text) : undefined;
    if (!response.ok) {
      const obligations = (body as { obligations?: Obligation[] })?.obligations;
      // A 428 is the gate's structured "you still owe X" — summarize the
      // obligations into a message a person can act on (the caller can also
      // read them off ApiError.body to route to a resolve screen).
      if (response.status === 428 && obligations) {
        hooks?.onGateBlocked?.(obligations);
      }
      const message =
        response.status === 428 && obligations
          ? summarizeObligations(obligations)
          : response.status >= 500
            ? "Something went wrong — please try again."
            : (errorMessageOf(body) ??
              "Something went wrong — please try again.");
      throw new ApiError(response.status, message, body);
    }
    return body as T;
  }

  /** One org's endpoint — the target org is a path segment, never "current". */
  const orgUrl = (orgId: string, rest = "") =>
    `${clientBase}/organizations/${encodeURIComponent(orgId)}${rest}`;

  const post = <T>(url: string, body?: unknown) =>
    request<T>(url, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    });

  return {
    getAuthConfig: (query) =>
      request(
        `${authBase}/config?intent=${query.intent}${
          query.identifier ? `&identifier=${query.identifier}` : ""
        }`,
      ),
    register: (body) => post(`${authBase}/register`, body),
    registerVerify: (body) => post(`${authBase}/register/verify`, body),
    loginPassword: (body) => post(`${authBase}/login`, body),
    loginCodeStart: (body) => post(`${authBase}/login/code/start`, body),
    loginCodeComplete: (body) => post(`${authBase}/login/code/complete`, body),
    recoveryStart: (body) => post(`${authBase}/recovery/start`, body),
    recoveryComplete: (body) => post(`${authBase}/recovery/complete`, body),
    recoveryFinish: (body) => post(`${authBase}/recovery/finish`, body),
    getSession: () => request(`${authBase}/session`),
    logout: () => post(`${authBase}/logout`),

    getMe: () => request(`${clientBase}/me`),
    updateProfile: (body) =>
      request(`${clientBase}/me/profile`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    presignAvatarUpload: (body) =>
      post(`${clientBase}/me/profile/avatar-upload`, body),
    getMyPreferences: () => request(`${clientBase}/me/preferences`),
    updateMyPreferences: (patch) =>
      request(`${clientBase}/me/preferences`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    addIdentifier: (body) => post(`${clientBase}/me/identifiers`, body),
    verifyIdentifier: (body) =>
      post(`${clientBase}/me/identifiers/verify`, body),
    removeIdentifier: (body) =>
      request(`${clientBase}/me/identifiers`, {
        method: "DELETE",
        body: JSON.stringify(body),
      }),
    getCurrentLegalDocument: (type, orgTypeId) =>
      request(
        `${clientBase}/legal/documents/current?type=${type}${
          orgTypeId ? `&orgTypeId=${encodeURIComponent(orgTypeId)}` : ""
        }`,
      ),
    getLegalDocument: (id) =>
      request(`${clientBase}/legal/documents/${encodeURIComponent(id)}`),
    getPendingConsents: () => request(`${clientBase}/legal/consent/pending`),
    getConsentHistory: () => request(`${clientBase}/legal/consent/history`),
    submitConsent: (body) =>
      post(`${clientBase}/legal/consent`, body).then(() => undefined),
    getLegalAuthoringCatalog: () => request(`${clientBase}/legal-admin/catalog`),
    listLegalDocumentVersions: (type, orgTypeId) =>
      request(
        `${clientBase}/legal-admin/documents?type=${type}${
          orgTypeId ? `&orgTypeId=${encodeURIComponent(orgTypeId)}` : ""
        }`,
      ),
    saveLegalDraft: (body) =>
      request(`${clientBase}/legal-admin/documents/draft`, {
        method: "PUT",
        body: JSON.stringify(body),
      }),
    publishLegalDocument: (id) =>
      post(`${clientBase}/legal-admin/documents/${encodeURIComponent(id)}/publish`),
    gateCheck: async () => {
      const response = await fetch(`${clientBase}/gate/check`, {
        credentials: "include",
      });
      if (response.status === 428) return response.json();
      if (!response.ok) {
        throw new ApiError(response.status, response.statusText);
      }
      return response.json();
    },

    getSecurityStatus: () => request(`${clientBase}/me/security`),
    enrollTotp: () => post(`${clientBase}/me/security/totp/enroll`),
    confirmTotp: (body) =>
      post(`${clientBase}/me/security/totp/confirm`, body),
    regenerateBackupCodes: () =>
      post(`${clientBase}/me/security/backup-codes`),
    securityStepUp: (body) => post(`${clientBase}/me/security/step-up`, body),
    disableTotp: () => post(`${clientBase}/me/security/totp/disable`),
    revokeOtherSessions: () =>
      post(`${clientBase}/me/security/sessions/revoke-others`),

    listMemberships: () => request(`${clientBase}/me/memberships`),
    getCreatableOrganizationTypes: () =>
      request(`${clientBase}/me/creatable-organization-types`),
    createOrganization: (body) => post(`${clientBase}/organizations`, body),
    getOrganization: (orgId) => request(orgUrl(orgId)),
    updateOrganization: (orgId, patch) =>
      request(orgUrl(orgId), {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    presignOrgLogoUpload: (orgId, body) =>
      post(orgUrl(orgId, "/logo-upload"), body),
    listOrganizationsDirectory: (query) =>
      request(`${clientBase}/organizations?${listQueryString(query)}`),
    getOrganizationTypes: () => request(`${clientBase}/organizations/types`),
    leaveOrganization: (orgId, selfUserId) =>
      request(orgUrl(orgId, `/members/${selfUserId}`), {
        method: "DELETE",
      }).then(() => undefined),
    listMembers: (orgId, query) =>
      request(orgUrl(orgId, `/members?${listQueryString(query)}`)),
    updateMemberRoles: (orgId, userId, roles) =>
      request(orgUrl(orgId, `/members/${userId}`), {
        method: "PATCH",
        body: JSON.stringify({ roles }),
      }).then(() => undefined),
    removeMember: (orgId, userId) =>
      request(orgUrl(orgId, `/members/${userId}`), {
        method: "DELETE",
      }).then(() => undefined),

    listOrgInvitations: (orgId) => request(orgUrl(orgId, "/invitations")),
    createInvitation: (orgId, body) =>
      post(orgUrl(orgId, "/invitations"), body),
    revokeInvitation: (orgId, invitationId) =>
      post(orgUrl(orgId, `/invitations/${invitationId}/revoke`)).then(
        () => undefined,
      ),
    listMyInvitations: () => request(`${clientBase}/me/invitations`),
    acceptInvitation: (id, consents) =>
      post(`${clientBase}/me/invitations/${id}/accept`, { consents }).then(
        () => undefined,
      ),
    rejectInvitation: (id) =>
      post(`${clientBase}/me/invitations/${id}/reject`).then(() => undefined),
    getPublicInvitation: (id) => request(`${clientBase}/invitations/${id}`),
  };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
