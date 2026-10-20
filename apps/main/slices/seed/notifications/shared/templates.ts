/**
 * Templates — the product's copy, one record per channel.
 *
 * A template declares the message type it belongs to and the args it needs;
 * bodies interpolate `{{token}}` placeholders. `args` is a spec record (the
 * catalog pattern — a runtime object with the type derived from it, no zod in
 * configs), so `ArgsOf<typeof template>` makes the caller's data a compile
 * check against the copy.
 *
 * The render helpers are pure: no io, no db. Wiring may import them to render
 * an identifier-addressed transactional message (an invitation goes to an
 * address, not to an account) straight into a transport, so copy stays
 * centralized even for sends that never become delivery rows.
 *
 * Inert data: configs import this file, never module runtime.
 */

import type { MessageTypeRegistry } from "./message-types";
import type { NotificationChannel } from "./types";

/** Args are strings — the delivery row stores rendered copy, not a document. */
export type ArgSpec = Record<string, "string">;
export type ArgsFromSpec<S extends ArgSpec> = { [K in keyof S]: string };

/** The declared args of a template, as the caller must supply them. */
export type ArgsOf<T> = T extends { args: infer S extends ArgSpec }
  ? ArgsFromSpec<S>
  : never;

interface TemplateBase<S extends ArgSpec> {
  /** Stable identity — stored on every delivery row it produces. */
  name: string;
  /** A key of the product's message-type registry. */
  type: string;
  args: S;
}

export interface EmailTemplateRef<S extends ArgSpec = ArgSpec>
  extends TemplateBase<S> {
  channel: "email";
  subject: string;
  text: string;
  html: string;
}

export interface SmsTemplateRef<S extends ArgSpec = ArgSpec>
  extends TemplateBase<S> {
  channel: "sms";
  body: string;
}

export interface InAppTemplateRef<S extends ArgSpec = ArgSpec>
  extends TemplateBase<S> {
  channel: "in_app";
  title: string;
  body: string;
}

export type AnyTemplateRef =
  | EmailTemplateRef
  | SmsTemplateRef
  | InAppTemplateRef;

export function defineEmailTemplate<S extends ArgSpec>(
  spec: Omit<EmailTemplateRef<S>, "channel">,
): EmailTemplateRef<S> {
  return { ...spec, channel: "email" };
}

export function defineSmsTemplate<S extends ArgSpec>(
  spec: Omit<SmsTemplateRef<S>, "channel">,
): SmsTemplateRef<S> {
  return { ...spec, channel: "sms" };
}

export function defineInAppTemplate<S extends ArgSpec>(
  spec: Omit<InAppTemplateRef<S>, "channel">,
): InAppTemplateRef<S> {
  return { ...spec, channel: "in_app" };
}

// ── rendering ───────────────────────────────────────────────────────────────

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

/** Placeholders a body references, in first-seen order. */
export function placeholdersIn(body: string): string[] {
  const found: string[] = [];
  for (const match of body.matchAll(PLACEHOLDER)) {
    const token = match[1]!;
    if (!found.includes(token)) found.push(token);
  }
  return found;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Interpolate `{{token}}` from args. An html body escapes every interpolated
 * value — the copy is trusted, the args are not.
 */
function interpolate(
  body: string,
  args: Record<string, string>,
  mode: "text" | "html",
): string {
  return body.replace(PLACEHOLDER, (_whole, token: string) => {
    const value = args[token];
    if (value === undefined) return "";
    return mode === "html" ? escapeHtml(value) : value;
  });
}

export function renderEmailTemplate<S extends ArgSpec>(
  template: EmailTemplateRef<S>,
  args: ArgsFromSpec<S>,
): { subject: string; text: string; html: string } {
  const values = args as Record<string, string>;
  return {
    subject: interpolate(template.subject, values, "text"),
    text: interpolate(template.text, values, "text"),
    html: interpolate(template.html, values, "html"),
  };
}

export function renderSmsTemplate<S extends ArgSpec>(
  template: SmsTemplateRef<S>,
  args: ArgsFromSpec<S>,
): { body: string } {
  return { body: interpolate(template.body, args as Record<string, string>, "text") };
}

export function renderInAppTemplate<S extends ArgSpec>(
  template: InAppTemplateRef<S>,
  args: ArgsFromSpec<S>,
): { title: string; body: string } {
  const values = args as Record<string, string>;
  return {
    title: interpolate(template.title, values, "text"),
    body: interpolate(template.body, values, "text"),
  };
}

// ── validation ──────────────────────────────────────────────────────────────

/** Every body a channel renders — what placeholder closure is checked over. */
function bodiesOf(template: AnyTemplateRef): string[] {
  switch (template.channel) {
    case "email":
      return [template.subject, template.text, template.html];
    case "sms":
      return [template.body];
    case "in_app":
      return [template.title, template.body];
  }
}

/**
 * Catalog invariants, checked at config load and again at mount:
 * placeholder ↔ arg closure per channel, a declared message type that exists,
 * and one template per (channel, name).
 */
export function validateTemplates(
  templates: readonly AnyTemplateRef[],
  messageTypes: MessageTypeRegistry,
): void {
  const violations: string[] = [];
  const seen = new Set<string>();

  for (const template of templates) {
    const label = `${template.channel} template "${template.name}"`;
    const key = `${template.channel}:${template.name}`;
    if (seen.has(key)) violations.push(`${label} is declared twice`);
    seen.add(key);

    if (!messageTypes[template.type]) {
      violations.push(
        `${label} declares message type "${template.type}", which is not in the registry`,
      );
    }

    const declared = Object.keys(template.args);
    const used = new Set(bodiesOf(template).flatMap(placeholdersIn));
    for (const token of used) {
      if (!declared.includes(token)) {
        violations.push(`${label} uses {{${token}}}, which is not a declared arg`);
      }
    }
    for (const arg of declared) {
      if (!used.has(arg)) {
        violations.push(`${label} declares arg "${arg}", which no body uses`);
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `Invalid notification templates:\n  - ${violations.join("\n  - ")}`,
    );
  }
}

/** The catalog key a delivery row is resolved by. */
export function templateKey(
  channel: NotificationChannel,
  name: string,
): string {
  return `${channel}:${name}`;
}
