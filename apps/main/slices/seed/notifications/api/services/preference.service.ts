/**
 * Preference service — the recipient's own switchboard, and the module's one
 * authority on whether a message may be delivered.
 *
 * A message type with `userPref: false` is not negotiable: the queue skips the
 * lookup entirely and the settings screen renders the row read-only. For every
 * other type the absence of a row means "on" — users opt OUT, never in.
 */

import type {
  NotificationChannel,
  NotificationPreferenceView,
  PreferenceSnapshot,
} from "../../shared/types";
import { NOTIFICATION_CHANNELS } from "../../shared/types";
import type { SetPreferenceInput } from "../models/notification.schemas";
import type { PreferenceRepository } from "../repositories/preference.repository";
import type { ModuleErrors } from "../shared/module-errors";
import type { TemplateCatalog } from "../shared/template-catalog";

/** The rule that applied, and where it came from — what the audit records. */
export type PreferenceRule = Omit<PreferenceSnapshot, "messageType" | "channel">;

const POLICY_RULE: PreferenceRule = { enabled: true, source: "policy" };
const DEFAULT_RULE: PreferenceRule = { enabled: true, source: "default" };

export interface PreferenceServiceDeps {
  preferenceRepo: PreferenceRepository;
  catalog: TemplateCatalog;
  errors: ModuleErrors;
}

export class PreferenceService {
  constructor(private readonly deps: PreferenceServiceDeps) {}

  /** Every type × channel switch, with the pinned ones marked read-only. */
  async list(userId: string): Promise<NotificationPreferenceView[]> {
    const rows = await this.deps.preferenceRepo.findAllByUserId(userId);
    const enabledOf = new Map(
      rows.map((row) => [`${row.messageType}:${row.channel}`, row.enabled]),
    );
    return this.deps.catalog.types().flatMap(({ name, spec }) =>
      NOTIFICATION_CHANNELS.map((channel) => ({
        messageType: name,
        channel,
        enabled: spec.userPref
          ? (enabledOf.get(`${name}:${channel}`) ?? true)
          : true,
        editable: spec.userPref,
      })),
    );
  }

  async set(
    userId: string,
    input: SetPreferenceInput,
  ): Promise<NotificationPreferenceView[]> {
    const spec = this.deps.catalog.specFor(input.messageType);
    if (!spec) {
      throw this.deps.errors.badRequest(
        `unknown message type "${input.messageType}"`,
      );
    }
    if (!spec.userPref) {
      throw this.deps.errors.badRequest(
        `"${input.messageType}" messages can't be turned off`,
      );
    }
    await this.deps.preferenceRepo.upsert({ ...input, userId });
    return this.list(userId);
  }

  // ── narrow accessors (the queue and the delivery path read through these) ──

  /** One batched read for a whole queue call, whatever the fan-out. */
  async rulesFor(input: {
    userIds: string[];
    messageType: string;
    channel: NotificationChannel;
  }): Promise<Map<string, PreferenceRule>> {
    const rules = new Map<string, PreferenceRule>();
    if (!this.isPreferable(input.messageType)) {
      for (const userId of input.userIds) rules.set(userId, POLICY_RULE);
      return rules;
    }
    const rows = await this.deps.preferenceRepo.findAllByUserIds(
      input.userIds,
      input.messageType,
    );
    for (const userId of input.userIds) rules.set(userId, DEFAULT_RULE);
    for (const row of rows) {
      if (row.channel !== input.channel) continue;
      rules.set(row.userId, { enabled: row.enabled, source: "user" });
    }
    return rules;
  }

  /** The delivery-time re-check — a user who opted out after queueing wins. */
  async ruleFor(input: {
    userId: string;
    messageType: string;
    channel: NotificationChannel;
  }): Promise<PreferenceRule> {
    if (!this.isPreferable(input.messageType)) return POLICY_RULE;
    const row = await this.deps.preferenceRepo.findOne(
      input.userId,
      input.messageType,
      input.channel,
    );
    return row ? { enabled: row.enabled, source: "user" } : DEFAULT_RULE;
  }

  private isPreferable(messageType: string): boolean {
    return this.deps.catalog.specFor(messageType)?.userPref === true;
  }
}
