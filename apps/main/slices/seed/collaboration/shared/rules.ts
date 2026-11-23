/**
 * Collaboration rules: what an item of a document declares about who may do what while someone is editing. One editor per item
 * is the engine's own rule, always on; these go beyond it. They name no host: an item is whatever a document is made of, an
 * operation is a word its host chooses, and the host answers the questions about its own structure.
 */
import type { DocumentChange } from "./types";

export type RuleScope = "self" | "descendants";

/** While [whileEditing] is being edited, nobody else may do [blocks] on [target]. Scopes are relative to the declaring item. */
export interface CollaborationRule {
  whileEditing: RuleScope;
  blocks: string[];
  target: RuleScope;
}

/** What a host answers so that its documents can have rules. */
export interface DocumentRules<TDocument> {
  /** What a change does, and to which item. Nothing: no rule applies, as with a new item. */
  operationOf(change: DocumentChange): { itemId: string; operation: string } | null;
  itemTypeOf(document: TDocument, itemId: string): string | null;
  /** What an item of this type declares. */
  rulesOf(itemType: string): CollaborationRule[];
  parentOf(document: TDocument, itemId: string): string | null;
}

/** An item another client is editing, and who. */
export interface ItemLease {
  itemId: string;
  holder: string;
}

export interface Conflict {
  holder: string;
  why: string;
}

export interface ConflictQuestion<TDocument> {
  document: TDocument;
  rules: DocumentRules<TDocument>;
  itemId: string;
  operation: string;
  /** held by other clients */
  leases: ItemLease[];
}

function ancestorsOf<TDocument>(document: TDocument, rules: DocumentRules<TDocument>, itemId: string): string[] {
  const ancestors: string[] = [];
  let parent = rules.parentOf(document, itemId);
  while (parent && !ancestors.includes(parent)) {
    ancestors.push(parent);
    parent = rules.parentOf(document, parent);
  }
  return ancestors;
}

function findLeaseIn<TDocument>({ document, rules, leases }: ConflictQuestion<TDocument>, ownerId: string, scope: RuleScope): ItemLease | undefined {
  if (scope === "self") return leases.find((lease) => lease.itemId === ownerId);
  return leases.find((lease) => ancestorsOf(document, rules, lease.itemId).includes(ownerId));
}

/** Does a rule refuse this operation? The item's own rules on itself, then every ancestor's rules on its descendants. */
export function findConflict<TDocument>(question: ConflictQuestion<TDocument>): Conflict | null {
  const { document, rules, itemId, operation } = question;
  const applying = (ownerType: string, target: RuleScope) => rules.rulesOf(ownerType).filter((rule) => rule.target === target && rule.blocks.includes(operation));

  const itemType = rules.itemTypeOf(document, itemId);
  if (itemType) {
    for (const rule of applying(itemType, "self")) {
      const lease = findLeaseIn(question, itemId, rule.whileEditing);
      if (lease) return { holder: lease.holder, why: rule.whileEditing === "self" ? "editing this" : `editing inside this ${itemType}` };
    }
  }
  for (const ancestorId of ancestorsOf(document, rules, itemId)) {
    const ancestorType = rules.itemTypeOf(document, ancestorId);
    if (!ancestorType) continue;
    for (const rule of applying(ancestorType, "descendants")) {
      const lease = findLeaseIn(question, ancestorId, rule.whileEditing);
      if (lease) return { holder: lease.holder, why: rule.whileEditing === "self" ? `editing the ${ancestorType} this is in` : `editing inside the ${ancestorType} this is in` };
    }
  }
  return null;
}
