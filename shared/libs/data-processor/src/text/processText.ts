import type { TextConfig, TextInput, TextOutput } from '../contracts';
function graphemes(value: string, locale: string): string[] {
  return [...new Intl.Segmenter(locale, {granularity: 'grapheme'}).segment(value)].map(x => x.segment);
}
/** Masking is presentation-only. Never send secrets to a client expecting this to protect them. */
export function processText(input: TextInput, config: TextConfig): TextOutput {
  const locale = config.locale ?? 'en-US';
  const source = input.value;
  const op = config.operation;
  const chars = graphemes(source, locale);
  let value = source;
  switch (op.kind) {
    case 'none': break;
    case 'case':
      value = op.value === 'upper' ? source.toLocaleUpperCase(locale)
        : op.value === 'lower' ? source.toLocaleLowerCase(locale)
        : source.replace(/\p{L}+/gu, word => word.charAt(0).toLocaleUpperCase(locale) + word.slice(1).toLocaleLowerCase(locale));
      break;
    case 'initials':
      value = source.trim().split(/\s+/u).slice(0, op.maxWords).filter(Boolean)
        .map(word => graphemes(word, locale)[0]?.toLocaleUpperCase(locale) ?? '').join('');
      break;
    case 'mask': {
      const start = Math.max(0, Math.floor(op.keepStart));
      const end = Math.max(0, Math.floor(op.keepEnd));
      const obscured = Math.max(0, chars.length - start - end);
      value = chars.slice(0, start).join('') + (op.maskCharacter ?? '•').repeat(obscured) + (obscured ? chars.slice(chars.length - end).join('') : chars.slice(start).join(''));
      break;
    }
    case 'truncate': {
      const width = Math.max(0, Math.floor(op.maxCharacters));
      const dots = op.ellipsis ?? '…';
      const budget = Math.max(0, width - graphemes(dots, locale).length);
      if (chars.length <= width) break;
      const head = Math.ceil(budget / 2), tail = Math.floor(budget / 2);
      value = op.placement === 'end' ? chars.slice(0, budget).join('') + dots
        : op.placement === 'start' ? dots + chars.slice(-budget).join('')
        : chars.slice(0, head).join('') + dots + chars.slice(chars.length - tail).join('');
      break;
    }
  }
  return {value, warnings: []};
}
