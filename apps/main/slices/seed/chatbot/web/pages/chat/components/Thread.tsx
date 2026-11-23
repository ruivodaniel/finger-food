/**
 * Thread — a chat's messages, the user's on the right and the assistant's on
 * the left, and while an answer is being written, its live status. A failed
 * answer offers Ask again. Older messages load as the thread scrolls to its
 * top; the newest stays in view as messages arrive.
 */

import { useEffect, useRef } from "react";
import { Container, Stack } from "@libs/web-layouts";
import { Button, Icon, Tile } from "@libs/web-components";

import type { ChatMessage } from "../../../../shared/types";
import { parseAnswer, type Span } from "../helpers/answer-text";
import { liveText, type LiveState } from "../../../shared/helpers/live";
import { useWhenVisible } from "../../../shared/hooks/use-when-visible";

export interface ThreadProps {
  /** Oldest first. */
  messages: ChatMessage[];
  /** The answer being written; null when none is. */
  live: LiveState | null;
  hasOlder: boolean;
  loadOlder: () => void;
  /** Asks a question again, after its answer failed. */
  onRetry: (question: string) => void;
  retryDisabled: boolean;
}

export function Thread({ messages, live, hasOlder, loadOlder, onRetry, retryDisabled }: ThreadProps) {
  const topRef = useWhenVisible(loadOlder, hasOlder);
  const endRef = useRef<HTMLDivElement>(null);

  // Keep the newest message (or the live status) in view as the thread grows at its end.
  const newestId = messages.at(-1)?.id;
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [newestId, live?.kind]);

  return (
    <Stack dir="col" scale="lg" data-testid="chat-thread">
      <div ref={topRef} />

      {messages.map((message) => {
        const isUser = message.role === "user";
        return (
          <Container key={message.id} scale="sm" align={isUser ? "right" : "left"}>
            <Stack dir="col" scale="2xs" align={isUser ? "end" : "start"}>
              <span element="type--body-extra-small" emphasis="quiet">
                {isUser ? "You" : "Assistant"}
              </span>

              {message.status === "error" ? (
                <Tile status="error" data-testid={`chat-message-${message.id}-error`}>
                  <Stack dir="col" scale="md">
                    <Stack dir="row" scale="sm" align="center">
                      <Icon name="warning" scale="sm" />
                      <p element="type--body">{message.content}</p>
                    </Stack>
                    {message.question && (
                      <Stack dir="row">
                        <Button
                          data-testid={`chat-message-${message.id}-retry-btn`}
                          buttonType="icon-text"
                          startIcon="refresh"
                          emphasis="secondary"
                          scale="sm"
                          disabled={retryDisabled}
                          onClick={() => onRetry(message.question!.content)}
                        >
                          Ask again
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </Tile>
              ) : (
                <Tile emphasis={isUser ? "quiet" : undefined} data-testid={`chat-message-${message.id}-card`}>
                  {isUser ? <UserText text={message.content} /> : <AnswerText text={message.content} />}
                </Tile>
              )}
            </Stack>
          </Container>
        );
      })}

      {live && (
        <Stack dir="col" scale="2xs" align="start">
          <span element="type--body-extra-small" emphasis="quiet">
            Assistant
          </span>
          <Stack dir="row" scale="sm" align="center">
            <Icon name="loading" scale="sm" />
            <span element="type--body-small" emphasis="quiet" data-testid="chat-live-status">
              {liveText(live)}
            </span>
          </Stack>
        </Stack>
      )}

      <div ref={endRef} />
    </Stack>
  );
}

/** The user's message as they wrote it, a paragraph per line. */
function UserText({ text }: { text: string }) {
  return (
    <Stack dir="col" scale="xs">
      {text.split("\n").map((line, i) => (
        <p key={i} element="type--body">
          {line}
        </p>
      ))}
    </Stack>
  );
}

/** An answer as paragraphs and lists, with bold spans. */
function AnswerText({ text }: { text: string }) {
  return (
    <Stack dir="col" scale="xs">
      {parseAnswer(text).map((block, i) =>
        block.kind === "paragraph" ? (
          <p key={i} element="type--body">
            <Spans spans={block.spans} />
          </p>
        ) : (
          <AnswerList key={i} ordered={block.ordered} items={block.items} />
        ),
      )}
    </Stack>
  );
}

function AnswerList({ ordered, items }: { ordered: boolean; items: Span[][] }) {
  const List = ordered ? "ol" : "ul";
  return (
    <List element="type--body" className={ordered ? "list-decimal pl-5" : "list-disc pl-5"}>
      {items.map((item, i) => (
        <li key={i}>
          <Spans spans={item} />
        </li>
      ))}
    </List>
  );
}

function Spans({ spans }: { spans: Span[] }) {
  return (
    <>
      {spans.map((span, i) => (span.bold ? <strong key={i}>{span.text}</strong> : <span key={i}>{span.text}</span>))}
    </>
  );
}
