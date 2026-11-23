/**
 * chatbot web wiring — the app's http client, query client, real-time connection and router, and
 * the active organization's name (from user-organization-mgmt, which owns the
 * active organization), and where dictation's speech model is served from,
 * handed to the slice once at startup. Paths use the
 * slice default (/api/client), matching where the app mounts the chatbot router.
 */

import { mountChatbotWeb, type ChatbotHttp, type ChatbotRealtime } from "@modules/chatbot/web";
import { WHISPER_MODEL_BASE_URL } from "@/env";
import { useOrganization } from "@modules/user-organization-mgmt/web";
import type { QueryClient } from "@tanstack/react-query";
import type { AnyRouter } from "@tanstack/react-router";

export function mountChatbot(deps: { http: ChatbotHttp; queryClient: QueryClient; router: AnyRouter; realtime: ChatbotRealtime }): void {
  mountChatbotWeb({
    http: deps.http,
    queryClient: deps.queryClient,
    realtime: deps.realtime,
    router: {
      navigate: async (opts) => {
        await deps.router.navigate(opts as never);
      },
    },
    useActiveOrganizationName: () => useOrganization("current")?.name ?? null,
    dictation: WHISPER_MODEL_BASE_URL ? { modelBaseUrl: WHISPER_MODEL_BASE_URL } : undefined,
  });
}
