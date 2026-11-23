// boot: load env → start server → open main's one connection to the open API's events
import { serve } from "@hono/node-server";
import { Env } from "@/env";
import { chatbot } from "@/mounts";
import { app } from "@/server";
import { logger } from "@/shared/logger";
import { subscribeToChatEvents } from "@/wiring/chatbot/open-api-events";
import { connectToOpenApiEvents } from "@/wiring/open-api/events";

serve({ fetch: app.fetch, port: Env.PORT }, (info) => {
  logger.info({ port: info.port }, `API listening on port ${info.port}`);
});

if (Env.OPEN_API_URL && Env.MAIN_PRIVATE_KEY) {
  // A slice that needs the open API's events subscribes here, and catches up in onReconnect.
  const openApiEvents = connectToOpenApiEvents({
    onReconnect: () => {
      chatbot.streamHub.resync().catch((err) => logger.error({ err }, "chat resync failed"));
    },
  });
  subscribeToChatEvents(openApiEvents, chatbot.streamHub);
} else {
  logger.info("OPEN_API_URL or MAIN_PRIVATE_KEY not set: chat answers will not reach the browser");
}
