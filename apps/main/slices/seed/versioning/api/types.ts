// Hono context variables the slice's routes read. The app's session middleware sets `user`; the slice needs only its id,
// so it declares the narrowest shape that works and stays independent of the slice that owns sessions.

export interface VersioningContextVariables {
  user: { id: string } | null;
  /** The request's access context, as the app's middleware left it: handed to the entity's owner, never read here. */
  scopedAc?: unknown;
}

export type VersioningEnv = { Variables: VersioningContextVariables };
