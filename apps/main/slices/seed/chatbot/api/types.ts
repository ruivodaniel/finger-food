// Hono context variables the module's routes read. The app's session middleware
// sets `user` and its scoped access middleware sets `scopedAc`; the chatbot only
// needs the user's id, the active organization and the roles, so it declares
// the narrowest shape that works and stays independent of the module that owns
// sessions.

export interface ChatbotContextVariables {
  user: { id: string } | null;
  scopedAc?: {
    bag: { session: { organization: { id: string } | null } };
    roles: string[];
  };
}

export type ChatbotEnv = { Variables: ChatbotContextVariables };
