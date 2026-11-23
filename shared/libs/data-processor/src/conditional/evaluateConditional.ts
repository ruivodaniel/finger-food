import type { ConditionalConfig, ConditionalInput, ConditionalOutput } from '../contracts';
/** This module is entirely independent of processing and of any UI/theme. */
export function evaluateConditional(input: ConditionalInput, config: ConditionalConfig): ConditionalOutput {
  for (const rule of config.rules) {
    const {operator, value} = rule.when;
    const a = input.value;
    const bothNumbers = typeof a === 'number' && typeof value === 'number';
    const matches = operator === 'eq' ? a === value
      : operator === 'notEq' ? a !== value
      : bothNumbers && (
        (operator === 'gt' && a > value) || (operator === 'gte' && a >= value) ||
        (operator === 'lt' && a < value) || (operator === 'lte' && a <= value)
      );
    if (matches) return {state: rule.state, matchedRule: rule.id, warnings: []};
  }
  return {state: config.fallback, warnings: []};
}
