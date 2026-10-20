/**
 * Gate service — evaluates the config's standing obligations for a caller.
 *
 * Two context families feed it:
 *
 *   MEMBERSHIP — one context per org type, plus one per held role. Everything
 *   a matching rule demands stands, session facts included. An obligation the
 *   caller can't satisfy yet (a verified email they don't have) is a real
 *   instruction: go add one.
 *
 *   REGISTRATION INVARIANTS — re-checks what registration was supposed to
 *   establish (a flow only enforces while it runs). Two filters keep it
 *   honest: PERSISTENT requirements only (a session-proof rule made standing
 *   would pin every session to the registration method), and OWNED identifier
 *   types only ("verified email" means "if you have one, it's verified" — a
 *   phone-only account owes nothing about email).
 *
 * Both families fold in the caller's org types, so `notWhen` carve-outs
 * (e.g. system_admin's consent exemption) keep holding.
 */

import { PRIVATE, type Private } from "@libs/gated-scoped-ac";
import {
  REQUIREMENTS,
  type AuthAndRegistrationConfig,
  type EvalContext,
  type IdentifierName,
  type LegalConsentItem,
  type OrgLifecycleEntry,
  type Requirement,
} from "../../shared/auth-config/types";
import {
  obligationKey,
  resolveIdentifiers,
  resolveObligations,
  type Obligation,
} from "../../shared/auth-config/resolver";
import type { GateCheckResult } from "../../shared/types/gate";
import type {
  MembershipFacts,
  PendingConsentGroupView,
} from "../../shared/types/domain";
import { orgTypeLabel } from "../shared/org-lifecycle";
import {
  identifierTypeOf,
  type IdentityProviderPort,
  type IdentitySnapshot,
  type SessionSnapshot,
} from "../identity/identity-provider.port";
import type { LegalDocumentService } from "./legal-document.service";
import type { ConsentRecordService } from "./consent-record.service";
import type { UserService } from "./user.service";
import type { ModuleLogger } from "../shared/module-errors";

export type { MembershipFacts };

export interface GateSubject {
  userId: string;
  identityId: string;
  session: SessionSnapshot;
  memberships?: MembershipFacts[];
}

export interface GateServiceDeps {
  authConfig: AuthAndRegistrationConfig;
  orgConfig: OrgLifecycleEntry[];
  port: IdentityProviderPort;
  userService: Pick<UserService, "getProfile">;
  legalDocumentService: Pick<LegalDocumentService, "itemsWithDocuments">;
  consentRecordService: Pick<ConsentRecordService, "consentSatisfied">;
  logger: ModuleLogger;
}

/** Provider session-method names per factor method (gate's session layer). */
const FACTOR_SESSION_METHODS: Record<string, string[]> = {
  password: ["password"],
  otp: ["code"],
  link: ["code", "link_recovery", "magic_link"],
  totp: ["totp"],
};

/** Requirements whose facts outlive the session — the ones an account carries. */
const PERSISTENT_REQUIREMENTS: ReadonlySet<Requirement> = new Set(
  REQUIREMENTS.filter((r) => r.layer === "persistent").map((r) => r.name),
);

/**
 * The order unmet obligations are reported — and so resolved, one at a time,
 * on /resolve: legal consent first, from every scope, since a caller agrees
 * to the terms before anything else is asked of them; everything else keeps
 * the order it was collected in.
 */
function consentFirst(obligations: Obligation[]): Obligation[] {
  const isConsent = (o: Obligation) => o.require === "legal_consent_granted";
  return [...obligations.filter(isConsent), ...obligations.filter((o) => !isConsent(o))];
}

export class GateService {
  constructor(private readonly deps: GateServiceDeps) {}

  /** AC42: private. Reached both by the private `/gate/check` route (threaded
   * normally) and by the gate middleware's 428 enforcement — one method
   * serving both, so the middleware passes `PRIVATE` directly rather than the
   * signature being split (doc rule 5's last sentence). Nothing further to
   * thread: `collect`/`isMet` are the token-less evaluator internals. */
  async evaluate(
    visibility: Private,
    subject: GateSubject,
  ): Promise<GateCheckResult> {
    void visibility;
    // One provider read per evaluation, shared by context-building and the
    // per-obligation checks below.
    const identity = memoize(() => this.deps.port.getIdentity(subject.identityId));

    const obligations = await this.collect(subject, identity);
    if (obligations.length === 0) return { status: "clear" };


    const unmet: Obligation[] = [];
    const reported = new Set<string>();
    for (const { obligation, orgType } of obligations) {
      if (reported.has(obligationKey(obligation))) continue;
      if (!(await this.isMet(subject, identity, obligation, orgType))) {
        reported.add(obligationKey(obligation));
        unmet.push(obligation);
      }
    }
    return unmet.length === 0
      ? { status: "clear" }
      : { status: "blocked", obligations: consentFirst(unmet) };
  }

  /**
   * Unmet consent obligations, grouped by scope, paired with their current
   * documents — the re-consent screen's input. No published document = dropped.
   */
  async pendingConsents(
    visibility: Private,
    subject: GateSubject,
  ): Promise<PendingConsentGroupView[]> {
    const identity = memoize(() =>
      this.deps.port.getIdentity(subject.identityId),
    );
    const collected = await this.collect(subject, identity);

    const byScope = new Map<string | null, LegalConsentItem[]>();
    for (const { obligation, orgType } of collected) {
      if (obligation.require !== "legal_consent_granted") continue;
      if (!obligation.consent) continue;
      if (await this.isMet(subject, identity, obligation, orgType)) continue;
      const items = byScope.get(orgType) ?? [];
      for (const item of obligation.consent) {
        if (!items.some((i) => i.type === item.type)) items.push(item);
      }
      byScope.set(orgType, items);
    }

    const out: PendingConsentGroupView[] = [];
    for (const [orgTypeId, items] of byScope) {
      const paired = (
        await this.deps.legalDocumentService.itemsWithDocuments(
          visibility, // Private assignable where itemsWithDocuments demands Public
          items,
          orgTypeId,
        )
      ).filter((item) => item.document !== null);
      if (paired.length === 0) continue;
      out.push({
        orgTypeId,
        label:
          orgTypeId === null
            ? "Platform"
            : orgTypeLabel(this.deps.orgConfig, orgTypeId),
        items: paired,
      });
    }
    return out;
  }

  /** Union obligations across every context that applies to the caller, deduped. */
  private async collect(
    subject: GateSubject,
    identity: () => Promise<IdentitySnapshot>,
  ): Promise<Array<{ obligation: Obligation; orgType: string | null }>> {
    const memberships = subject.memberships ?? [];
    const seen = new Set<string>();
    const out: Array<{ obligation: Obligation; orgType: string | null }> = [];

    const add = (obligation: Obligation, orgType: string | null) => {
      const key = `${orgType ?? "-"}:${obligationKey(obligation)}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ obligation, orgType });
    };

    const owned: IdentifierName[] = (await identity()).addresses.map((a) =>
      identifierTypeOf(a.via),
    );

    // ── Membership contexts — everything a member's orgs demand, unfiltered ──
    for (const membership of memberships) {
      const contexts: EvalContext[] = [
        { membershipOrgType: membership.orgType },
        ...membership.roles.map((role) => ({
          membershipOrgType: membership.orgType,
          membershipRole: role,
        })),
      ];
      for (const ctx of contexts) {
        for (const obligation of resolveObligations(this.deps.authConfig, ctx)) {
          add(obligation, membership.orgType);
        }
        // Identifiers invariant: every membership context keeps at least one
        // USABLE identifier type (any-of). Holding only excluded types fails;
        // an empty `usable` is a config problem, not an obligation.
        const usable = resolveIdentifiers(this.deps.authConfig, ctx);
        if (usable.length > 0 && !usable.some((t) => owned.includes(t))) {
          add(
            { require: "identifier_present", identityTypes: usable },
            membership.orgType,
          );
        }
      }
    }

    // ── Registration invariants — persistent outcomes, for owned identifiers ──
    // Landed at the PLATFORM scope (null): a republished platform document
    // re-gates every consent-bound caller. Org-typed documents are the
    // membership lens's job above.
    for (const { ctx } of registrationContexts(memberships, owned)) {
      for (const obligation of resolveObligations(this.deps.authConfig, ctx)) {
        if (!PERSISTENT_REQUIREMENTS.has(obligation.require)) continue;
        if (
          obligation.identityTypes &&
          !obligation.identityTypes.some((t) => owned.includes(t))
        )
          continue;
        add(obligation, null);
      }
    }

    return out;
  }

  private async isMet(
    subject: GateSubject,
    identity: () => Promise<IdentitySnapshot>,
    obligation: Obligation,
    orgType: string | null,
  ): Promise<boolean> {
    switch (obligation.require) {
      case "identifier_present":
      case "identifier_verified": {
        if (!obligation.identityTypes) return true;
        const accepted = obligation.identityTypes;
        const addresses = (await identity()).addresses.filter((a) =>
          accepted.includes(identifierTypeOf(a.via)),
        );
        if (addresses.length === 0) return false;
        // Any verified address of an accepted type satisfies it — slots are
        // plural, and the obligation itself is any-of.
        return obligation.require === "identifier_present"
          ? true
          : addresses.some((a) => a.verified);
      }

      case "factor_session_verified": {
        if (!obligation.factorMethod) return true;
        const accepted = FACTOR_SESSION_METHODS[obligation.factorMethod] ?? [
          obligation.factorMethod,
        ];
        return subject.session.methods.some((m) =>
          accepted.includes(m.method),
        );
      }

      case "profile_data_provided": {
        if (!obligation.dataField) return true;
        // Exempt evaluator internal (rule 5) — mints the safe default; never
        // reached by a public flow.
        const profile = await this.deps.userService.getProfile(
          PRIVATE,
          subject.userId,
        );
        if (!profile) return false;
        if (obligation.dataField === "name") return !!profile.name;
        if (obligation.dataField === "image") return !!profile.image;
        const value = profile.data[obligation.dataField];
        return value !== undefined && value !== null && value !== "";
      }

      case "legal_consent_granted": {
        if (!obligation.consent) return true;
        return this.deps.consentRecordService.consentSatisfied(
          subject.userId,
          obligation.consent,
          orgType,
        );
      }

      default:
        this.deps.logger.warn("unknown gate requirement — treated as met", {
          requirement: obligation.require,
        });
        return true;
    }
  }
}

/**
 * Registration contexts to re-check: bare intent + one per owned identifier
 * type, each folded with the caller's org types so `notWhen` carve-outs apply.
 */
function registrationContexts(
  memberships: MembershipFacts[],
  owned: IdentifierName[],
): Array<{ ctx: EvalContext }> {
  const orgTypes: Array<string | null> = memberships.length
    ? [...new Set(memberships.map((m) => m.orgType))]
    : [null];

  const out: Array<{ ctx: EvalContext }> = [];
  for (const orgType of orgTypes) {
    const base: EvalContext = { intent: "registration" };
    if (orgType) base.membershipOrgType = orgType;
    out.push({ ctx: base });
    for (const identifier of new Set(owned)) {
      out.push({ ctx: { ...base, identifier } });
    }
  }
  return out;
}

/** Call-once thunk — the wrapped promise is produced at most once. */
function memoize<T>(load: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => (pending ??= load());
}
