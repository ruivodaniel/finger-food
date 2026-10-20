// Module query-key catalog — one place, so invalidation never drifts.

export const queryKeys = {
  inbox: ["notifications", "inbox"] as const,
  preferences: ["notifications", "preferences"] as const,
};
