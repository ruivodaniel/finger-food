// boot: load env → start server
import { serve } from "@hono/node-server";
import { Env } from "@/env";
import { app } from "@/server";
import { logger } from "@/shared/logger";

serve({ fetch: app.fetch, port: Env.PORT }, (info) => {
  logger.info({ port: info.port }, `API listening on port ${info.port}`);
});
