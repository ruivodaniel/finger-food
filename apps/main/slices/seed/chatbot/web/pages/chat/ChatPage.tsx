/**
 * ChatPage — one chat, or a new one. The thread scrolls in the page and the
 * composer stays at its bottom. The app's chat layout gives the page its Main
 * region (beside the chat list); the page fills it with the scrolling content
 * and the footer.
 */

import { Container, MainBody, MainContent, MainFooter, Stack } from "@libs/web-layouts";
import { Alert, AlertDescription, EmptyState, Icon } from "@libs/web-components";

import { mounted } from "../../services/application/mount";
import { Composer } from "./components/Composer";
import { NewChat } from "./components/NewChat";
import { Thread } from "./components/Thread";
import { useChat } from "./hooks/use-chat";

const noOrganization = (): string | null => null;

export interface ChatPageProps {
  /** The chat to open; none for a new chat. */
  chatId?: string;
}

export function ChatPage({ chatId }: ChatPageProps) {
  const useActiveOrganizationName = mounted().useActiveOrganizationName ?? noOrganization;
  const activeOrganizationName = useActiveOrganizationName();
  const { chat, notFound, messages, hasOlder, loadOlder, live, send, sending, error } = useChat(chatId);

  if (chatId && notFound) {
    return (
      <MainContent>
        <MainBody>
          <Container>
            <EmptyState
              data-testid="chat-not-found"
              emphasis="quiet"
              icon={<Icon name="accessDenied" />}
              title="Chat not found"
              description="This chat doesn't exist, or it isn't yours."
            />
          </Container>
        </MainBody>
      </MainContent>
    );
  }

  const busy = sending || !!live;

  return (
    <>
      <MainContent>
        <MainBody>
          <Container>
            {!chatId ? (
              <Stack dir="col" scale="xl" size="fill" data-testid="chat-page">
                <NewChat organizationName={activeOrganizationName} disabled={sending} onAsk={send} />
              </Stack>
            ) : (
              chat && (
                <Stack dir="col" scale="xl" size="fill" data-testid="chat-thread-page">
                  <h2 element="type--heading3">{chat.title}</h2>
                  <Thread
                    messages={messages}
                    live={live}
                    hasOlder={hasOlder}
                    loadOlder={loadOlder}
                    onRetry={send}
                    retryDisabled={busy}
                  />
                </Stack>
              )
            )}
          </Container>
        </MainBody>
      </MainContent>

      <MainFooter>
        <Container>
          <Stack dir="col" scale="sm">
            {error && (
              <Alert status="error" data-testid={chatId ? "chat-send-error" : "chat-start-error"}>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Composer disabled={busy} onSend={send} />
          </Stack>
        </Container>
      </MainFooter>
    </>
  );
}
