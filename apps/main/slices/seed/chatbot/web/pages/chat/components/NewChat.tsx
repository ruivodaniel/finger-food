/**
 * NewChat — the empty state of a chat with no message yet, with questions the
 * user can start from.
 */

import { Stack } from "@libs/web-layouts";
import { Button, EmptyState, Icon } from "@libs/web-components";

const QUESTIONS = [
  { id: "members", text: "Who are the members of my organization?" },
  { id: "access", text: "Which organizations do I have access to?" },
  { id: "largest", text: "What's the largest company I have access to?" },
];

export interface NewChatProps {
  /** The active organization's name; null without one. */
  organizationName: string | null;
  disabled: boolean;
  onAsk: (question: string) => void;
}

export function NewChat({ organizationName, disabled, onAsk }: NewChatProps) {
  const description = organizationName
    ? `Answers are about ${organizationName} and the organizations you have access to, from data you are allowed to see.`
    : "Answers are about the organizations you have access to, from data you are allowed to see.";

  return (
    <EmptyState
      data-testid="new-chat-empty"
      emphasis="quiet"
      icon={<Icon name="bot" scale="xl" />}
      title="Ask about your organizations"
      description={description}
      action={
        <Stack dir="col" scale="sm" align="center">
          {QUESTIONS.map((question) => (
            <Button
              key={question.id}
              data-testid={`new-chat-question-${question.id}-btn`}
              emphasis="secondary"
              disabled={disabled}
              onClick={() => onAsk(question.text)}
            >
              {question.text}
            </Button>
          ))}
        </Stack>
      }
    />
  );
}
