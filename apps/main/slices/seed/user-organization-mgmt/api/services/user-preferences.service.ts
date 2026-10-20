/**
 * User-preferences service — the caller's own preferences.
 *
 * Owns `user_preferences`. WHO may read/write the row is the AC engine
 * (`manage_own_preferences` / `create_own_preferences`: own row only); WHAT
 * may change is the product's policy, injected at mount (`preferences`): a
 * field that isn't userOverridable can't be set, "follow the system" only
 * where the product allows system binding, and a value must be supported —
 * the policy's list, or any value the value-types lib accepts for "all".
 *
 * The view is effective: the user's choices over the policy's defaults —
 * also when the policy narrowed after a choice was stored.
 */

import type { Ac } from "@libs/gated-scoped-ac";
import { COUNTRIES, CURRENCIES, isLocale, isTimezone } from "@libs/value-types";
import type { ScopedAcRequestContext } from "../shared/scoped-ac";
import type { ModuleErrors } from "../shared/module-errors";
import type { UomUserPreferencesSelect } from "../models/user-preferences.model";
import type {
  PreferencesPatch,
  UserPreferencesRepository,
} from "../repositories/user-preferences.repository";
import type {
  BoundPreferenceField,
  PreferenceField,
  PreferenceSource,
  PreferencesPolicy,
  UpdateUserPreferencesInput,
  UserPreferencesView,
  ValuePreferenceField,
} from "../../shared/types/preferences";

export interface UserPreferencesServiceDeps {
  userPreferencesRepo: UserPreferencesRepository;
  /** The config-bound engine (AC37: injected, never constructed here). */
  engine: Pick<Ac, "resolveRead" | "resolveUpdate" | "allowUpdate">;
  /** The product's preferences policy (injected at mount). */
  policy: PreferencesPolicy;
  errors: ModuleErrors;
}

const BOUND_FIELDS: BoundPreferenceField[] = ["locale", "timezone"];
const VALUE_FIELDS: ValuePreferenceField[] = ["currency", "country"];

/** Any value the value-types lib accepts for the field (the "all" universe). */
const VALID: Record<PreferenceField, (value: string) => boolean> = {
  locale: isLocale,
  timezone: isTimezone,
  currency: (value) => (CURRENCIES as readonly string[]).includes(value),
  country: (value) => (COUNTRIES as readonly string[]).includes(value),
};

export class UserPreferencesService {
  private readonly deps: UserPreferencesServiceDeps;

  constructor(deps: UserPreferencesServiceDeps) {
    this.deps = deps;
  }

  /** Is `value` allowed for `field` under the policy? */
  private isSupported(field: PreferenceField, value: string): boolean {
    const { supported } = this.deps.policy[field];
    return supported === "all" ? VALID[field](value) : supported.includes(value);
  }

  /** The effective view of a stored row (or of no row). */
  effective(row: UomUserPreferencesSelect | null): UserPreferencesView {
    const bound = (
      field: BoundPreferenceField,
      source: PreferenceSource | null | undefined,
      value: string | null | undefined,
    ) => {
      const policy = this.deps.policy[field];
      const fallback = { source: "explicit" as const, value: policy.default };
      if (!policy.userOverridable) return fallback;
      const chosen = source ?? (policy.allowSystemBinding ? "system" : "explicit");
      if (chosen === "system") {
        return policy.allowSystemBinding
          ? { source: "system" as const, value: null }
          : fallback;
      }
      return value && this.isSupported(field, value)
        ? { source: "explicit" as const, value }
        : fallback;
    };
    const plain = (field: ValuePreferenceField, value: string | null | undefined) => {
      const policy = this.deps.policy[field];
      return policy.userOverridable && value && this.isSupported(field, value)
        ? value
        : policy.default;
    };
    return {
      locale: bound("locale", row?.localeSource, row?.localeValue),
      timezone: bound("timezone", row?.timezoneSource, row?.timezoneValue),
      currency: plain("currency", row?.currencyValue),
      country: plain("country", row?.countryValue),
    };
  }

  /** The policy's verdict on a write: the columns to set, or a 400. */
  private toPatch(input: UpdateUserPreferencesInput): PreferencesPatch {
    const { errors, policy } = this.deps;
    const patch: PreferencesPatch = {};
    for (const field of BOUND_FIELDS) {
      const choice = input[field];
      if (!choice) continue;
      if (!policy[field].userOverridable) {
        throw errors.badRequest(`${field} is set by the product`);
      }
      if (choice.source === "system") {
        if (!policy[field].allowSystemBinding) {
          throw errors.badRequest(`${field} can't follow the system`);
        }
      } else if (!this.isSupported(field, choice.value)) {
        throw errors.badRequest(`${field} "${choice.value}" isn't supported`);
      }
      patch[`${field}Source`] = choice.source;
      patch[`${field}Value`] = choice.source === "explicit" ? choice.value : null;
    }
    for (const field of VALUE_FIELDS) {
      const value = input[field];
      if (value === undefined) continue;
      if (!policy[field].userOverridable) {
        throw errors.badRequest(`${field} is set by the product`);
      }
      if (value !== null && !this.isSupported(field, value)) {
        throw errors.badRequest(`${field} "${value}" isn't supported`);
      }
      patch[`${field}Value`] = value;
    }
    return patch;
  }

  async getOwn(
    ac: ScopedAcRequestContext,
    userId: string,
  ): Promise<UserPreferencesView> {
    const scope = this.deps.engine.resolveRead(ac.permissions, "user_preferences", ac.bag);
    return this.effective(
      await this.deps.userPreferencesRepo.findByUserIdScoped(userId, scope, ac.gateDb),
    );
  }

  async updateOwn(
    ac: ScopedAcRequestContext,
    userId: string,
    input: UpdateUserPreferencesInput,
  ): Promise<UserPreferencesView> {
    const { engine, errors, userPreferencesRepo: repo } = this.deps;
    const patch = this.toPatch(input);
    const verdict = engine.allowUpdate(ac.permissions, "user_preferences", patch, ac.bag);
    if (!verdict.allow) {
      throw errors.forbidden(verdict.reason ?? "cannot update preferences");
    }
    const readScope = engine.resolveRead(ac.permissions, "user_preferences", ac.bag);
    const existing = await repo.findByUserIdScoped(userId, readScope, ac.gateDb);
    // The first save creates the row — always the caller's own (the id comes
    // from the session, never the request); later saves update it.
    const row = existing
      ? await repo.updateScoped(
          userId,
          patch,
          engine.resolveUpdate(ac.permissions, "user_preferences", ac.bag),
          ac.gateDb,
        )
      : await repo.createScoped(userId, patch, ac.permissions, ac.gateDb);
    // null ⇒ the gate refused the write.
    if (!row) throw errors.forbidden("cannot update preferences");
    return this.effective(row);
  }
}
