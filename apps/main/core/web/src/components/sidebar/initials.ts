/** Avatar-fallback initials: first + last word initials, or the first two characters. */
export function initialsOf(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return label.trim().slice(0, 2).toUpperCase() || "?";
}
