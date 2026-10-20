// Hono context variables the module's routes read. The app's session
// middleware sets `user`; notifications only ever needs its id, so the module
// declares the narrowest shape that works and stays independent of whichever
// module owns sessions.

export interface NotificationsContextVariables {
  user: { id: string } | null;
}

export type NotificationsEnv = { Variables: NotificationsContextVariables };
