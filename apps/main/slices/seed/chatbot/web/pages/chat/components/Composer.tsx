/**
 * Composer — the message input. Enter sends, Shift + Enter adds a line;
 * locked while an answer is being written. The microphone dictates: what is
 * said (English) is transcribed in the browser and added to the draft, not
 * sent. Dictation's messages are the microphone's tooltip, shown on their own
 * while recording, transcribing and after a failure.
 */

import { useState } from "react";
import { Stack } from "@libs/web-layouts";
import { Button, Textarea, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@libs/web-components";

import { MESSAGE_MAX_LENGTH } from "../../../../shared/types";
import { appendDictation } from "../helpers/dictation-draft";
import { dictationButton } from "../helpers/dictation-tooltip";
import { useDictation } from "../hooks/use-dictation";

export interface ComposerProps {
  disabled: boolean;
  onSend: (content: string) => void;
}

export function Composer({ disabled, onSend }: ComposerProps) {
  const [draft, setDraft] = useState("");
  const dictation = useDictation((text) => setDraft((current) => appendDictation(current, text, MESSAGE_MAX_LENGTH)));
  const dictating = dictation.state.kind === "recording" || dictation.state.kind === "transcribing";
  const canSend = !disabled && !dictating && draft.trim() !== "";
  const mic = dictationButton(dictation.state, dictation.model, disabled);
  const [hovered, setHovered] = useState(false);

  const send = () => {
    if (!canSend) return;
    onSend(draft.trim());
    setDraft("");
  };

  return (
    <form
      data-testid="chat-composer-form"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <Stack dir="col" scale="xs">
        <Stack dir="row" scale="sm" align="end">
          <Stack dir="col" size="fill">
            <Textarea
              data-testid="chat-composer-input"
              value={draft}
              onChange={setDraft}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder="Ask about your organizations and their members"
              disabled={disabled}
              maxLength={MESSAGE_MAX_LENGTH}
              autoSize
              minRows={1}
              maxRows={6}
            />
          </Stack>
          {dictation.available && (
            <TooltipProvider>
              <Tooltip open={mic.open || hovered} onOpenChange={setHovered}>
                {/* the wrapper takes the hover: a disabled button does not, and its tooltip says why it is disabled */}
                <TooltipTrigger asChild>
                  <span className="inline-flex" data-testid="chat-composer-dictate">
                    <Button
                      data-testid="chat-composer-dictate-btn"
                      type="button"
                      emphasis="secondary"
                      buttonType="icon"
                      startIcon={dictation.state.kind === "recording" ? "stop" : "mic"}
                      aria-label={dictation.state.kind === "recording" ? "Stop dictating" : "Dictate"}
                      aria-pressed={dictation.state.kind === "recording"}
                      aria-description={mic.text}
                      loading={dictation.state.kind === "transcribing"}
                      disabled={mic.disabled}
                      onClick={dictation.toggle}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent
                  data-testid="chat-composer-dictate-tooltip"
                  status={dictation.state.kind === "failed" || dictation.state.kind === "refused" ? "error" : undefined}
                >
                  {mic.text}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            data-testid="chat-composer-send-btn"
            type="submit"
            emphasis="primary"
            buttonType="icon-text"
            startIcon="send"
            disabled={!canSend}
          >
            Send
          </Button>
        </Stack>
        <span element="type--body-extra-small" emphasis="quiet">
          {disabled
            ? "The assistant is answering. You can write again when it is done."
            : "Enter sends. Shift + Enter adds a line. Answers use only the data you have access to."}
        </span>
      </Stack>
    </form>
  );
}
