/**
 * Message types — the product's registry of what a notification IS, and
 * whether users may silence it.
 *
 * One flag, one consequence: `userPref: false` means the message arrives
 * whatever the recipient prefers (security, account lifecycle); `true` means
 * the queue honours the recipient's `notification_preference` row per channel
 * and writes `suppressed_by_pref` instead of delivering. Templates declare
 * which type they belong to — no preference vocabulary ever reaches a caller.
 *
 * Inert data: configs import this file, never module runtime.
 */

export interface MessageTypeSpec {
  /** May a user opt out of this type, per channel, from their settings? */
  userPref: boolean;
}

export type MessageTypeRegistry = Record<string, MessageTypeSpec>;

/** Identity with inference — the product's registry keeps its literal keys. */
export function defineMessageTypes<T extends MessageTypeRegistry>(spec: T): T {
  return spec;
}

/**
 * Registry invariants. The product config calls this on import, so a misconfig
 * fails at load — dev, CI, and boot alike.
 */
export function validateMessageTypes(registry: MessageTypeRegistry): void {
  const violations: string[] = [];
  const names = Object.keys(registry);

  if (names.length === 0) {
    violations.push("the message-type registry is empty");
  }
  for (const name of names) {
    if (!/^[a-z][a-z0-9_]*$/.test(name)) {
      violations.push(
        `message type "${name}" must be lower_snake_case and start with a letter`,
      );
    }
    if (typeof registry[name]?.userPref !== "boolean") {
      violations.push(`message type "${name}" is missing a boolean userPref`);
    }
  }

  if (violations.length > 0) {
    throw new Error(
      `Invalid notification message types:\n  - ${violations.join("\n  - ")}`,
    );
  }
}
