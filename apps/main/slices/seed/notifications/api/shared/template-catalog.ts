/**
 * The mounted catalog — the product's templates and message types, indexed by
 * (channel, name) so a delivery row written months ago still renders.
 *
 * Built once at mount and validated there, so a catalog a stored row can't
 * resolve is a boot failure, not a runtime surprise.
 */

import type {
  AnyTemplateRef,
  EmailTemplateRef,
  InAppTemplateRef,
  MessageTypeRegistry,
  MessageTypeSpec,
  NotificationChannel,
  SmsTemplateRef,
} from "../../shared";
import { templateKey, validateMessageTypes, validateTemplates } from "../../shared";
import type { ModuleErrors } from "./module-errors";

export interface TemplateCatalog {
  find(channel: NotificationChannel, name: string): AnyTemplateRef | null;
  /** A row whose template left the catalog is a wiring bug, not a 404. */
  require(channel: NotificationChannel, name: string): AnyTemplateRef;
  requireEmail(name: string): EmailTemplateRef;
  requireSms(name: string): SmsTemplateRef;
  requireInApp(name: string): InAppTemplateRef;
  /** The template's message-type rule; unknown types are rejected at mount. */
  specFor(messageType: string): MessageTypeSpec | null;
  /** The whole registry — what the preferences screen renders a row per. */
  types(): Array<{ name: string; spec: MessageTypeSpec }>;
}

export interface CreateTemplateCatalogOptions {
  templates: readonly AnyTemplateRef[];
  messageTypes: MessageTypeRegistry;
  errors: ModuleErrors;
}

export function createTemplateCatalog(
  options: CreateTemplateCatalogOptions,
): TemplateCatalog {
  validateMessageTypes(options.messageTypes);
  validateTemplates(options.templates, options.messageTypes);

  const byKey = new Map<string, AnyTemplateRef>();
  for (const template of options.templates) {
    byKey.set(templateKey(template.channel, template.name), template);
  }

  const require_ = (channel: NotificationChannel, name: string) => {
    const template = byKey.get(templateKey(channel, name));
    if (!template) {
      throw options.errors.internalError(
        `no ${channel} template named "${name}" in the catalog`,
      );
    }
    return template;
  };

  return {
    find: (channel, name) => byKey.get(templateKey(channel, name)) ?? null,
    require: require_,
    requireEmail: (name) => require_("email", name) as EmailTemplateRef,
    requireSms: (name) => require_("sms", name) as SmsTemplateRef,
    requireInApp: (name) => require_("in_app", name) as InAppTemplateRef,
    specFor: (messageType) => options.messageTypes[messageType] ?? null,
    types: () =>
      Object.entries(options.messageTypes).map(([name, spec]) => ({
        name,
        spec,
      })),
  };
}
