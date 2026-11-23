// Two texts, word by word: what stayed, what was added, what was removed. v37's text diff: the longest common run of words.
export interface WordChange {
  value: string;
  type: "unchanged" | "added" | "removed";
}

const wordsOf = (text: string) => text.split(/(\s+)/).filter(Boolean);

export function diffWords(from: string, to: string): WordChange[] {
  const fromWords = wordsOf(from), toWords = wordsOf(to);
  const longestFrom: number[][] = Array.from({ length: fromWords.length + 1 }, () => new Array<number>(toWords.length + 1).fill(0));
  for (let i = fromWords.length - 1; i >= 0; i--) {
    for (let j = toWords.length - 1; j >= 0; j--) {
      longestFrom[i]![j] = fromWords[i] === toWords[j] ? longestFrom[i + 1]![j + 1]! + 1 : Math.max(longestFrom[i + 1]![j]!, longestFrom[i]![j + 1]!);
    }
  }
  const changes: WordChange[] = [];
  let i = 0, j = 0;
  while (i < fromWords.length && j < toWords.length) {
    if (fromWords[i] === toWords[j]) {
      changes.push({ value: fromWords[i]!, type: "unchanged" });
      i += 1;
      j += 1;
    } else if (longestFrom[i + 1]![j]! >= longestFrom[i]![j + 1]!) {
      changes.push({ value: fromWords[i]!, type: "removed" });
      i += 1;
    } else {
      changes.push({ value: toWords[j]!, type: "added" });
      j += 1;
    }
  }
  for (; i < fromWords.length; i++) changes.push({ value: fromWords[i]!, type: "removed" });
  for (; j < toWords.length; j++) changes.push({ value: toWords[j]!, type: "added" });
  return changes;
}
