/**
 * Where dictated text goes: after what is already in the draft, separated by
 * a space (or kept on its own line when the draft ends with one), and cut at
 * the message's length limit. Nothing is sent: the user reads it first.
 */

export function appendDictation(draft: string, dictated: string, maxLength: number): string {
  const text = dictated.trim();
  if (!text) return draft;
  const joiner = draft === "" || /\s$/.test(draft) ? "" : " ";
  return `${draft}${joiner}${text}`.slice(0, maxLength);
}
