// =============================================================================
// Rule matcher — pure subsequence match between a `theme.rules[]` entry's
// chain and the DOM ancestry collected by inspectChain.
//
// A rule matches the inspected chain when its segments appear, in order, as
// a subsequence of the DOM ancestry walked root-first. Concept on a rule
// segment is required to equal the DOM node's concept; rule segments
// without a concept match regardless of the DOM concept.
// =============================================================================

import type {
  ThemeRule,
  ChainSegment,
} from "../../../../../../../../../shared/libs/ui/types";
import type { ChainRow } from "./inspectChain";

export type MatchedRule = {
  ruleIndex: number;
  /** Index in the leaf-first `chain` where the rule's last segment matched. */
  endsAtRowIndex: number;
};

function matches(seg: ChainSegment, row: ChainRow): boolean {
  if (seg.key !== row.key) return false;
  // Rule segment with no concept matches any concept on the DOM node.
  if (!seg.concept) return true;
  return seg.concept === row.concept;
}

/**
 * Try to match `rule.chain` (root-first) against `ancestry` (root-first).
 * Returns the ancestry index of the rule's final segment match, or null.
 */
function findMatchAncIdx(
  rule: ThemeRule,
  ancestry: ChainRow[],
): number | null {
  let ancIdx = 0;
  let lastMatch = -1;
  for (const seg of rule.chain) {
    let found = false;
    while (ancIdx < ancestry.length) {
      const row = ancestry[ancIdx]!;
      ancIdx++;
      if (matches(seg, row)) {
        lastMatch = ancIdx - 1;
        found = true;
        break;
      }
    }
    if (!found) return null;
  }
  return lastMatch >= 0 ? lastMatch : null;
}

/**
 * Match all rules against the inspect chain. Returns the rules whose chain
 * is a subsequence of the DOM ancestry, paired with the chain row their
 * last segment matched (so the UI can render each match under its target).
 */
export function matchRulesAgainstChain(
  rules: readonly ThemeRule[],
  chain: ChainRow[],
): MatchedRule[] {
  const ancestry = [...chain].reverse(); // root-first
  const out: MatchedRule[] = [];
  for (let i = 0; i < rules.length; i++) {
    const ancIdx = findMatchAncIdx(rules[i]!, ancestry);
    if (ancIdx == null) continue;
    // Translate root-first ancestry index to leaf-first chain index.
    const chainIdx = chain.length - 1 - ancIdx;
    out.push({ ruleIndex: i, endsAtRowIndex: chainIdx });
  }
  return out;
}

/**
 * Compare two chains for byte-exact equality. Used to detect when a
 * `Rule+` pre-fill would create a duplicate of an existing rule.
 */
export function chainsEqual(
  a: readonly ChainSegment[],
  b: readonly ChainSegment[],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.key !== b[i]!.key) return false;
    if ((a[i]!.concept ?? "") !== (b[i]!.concept ?? "")) return false;
  }
  return true;
}
