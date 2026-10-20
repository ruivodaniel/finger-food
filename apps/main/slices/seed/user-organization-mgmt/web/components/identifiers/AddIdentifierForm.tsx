/**
 * AddIdentifierForm — attach another login identifier: enter the address,
 * then prove the code the provider delivers to it. The form resets after each
 * success, so the next address can follow; Cancel backs out of the code step.
 * Caps (3 emails, 2 phones) are enforced server-side and surface as errors.
 * The type toggle offers only the identifiers the auth config resolves — a
 * product without phone sign-in never shows a phone option here.
 *
 * Stacks of Label + control, errors as an Alert, no inline styles. Shared by
 * the account settings page and the /resolve wizard (IdentifierResolution).
 */

import * as React from "react";
import { Button, Input, Label, PhoneInput } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { COUNTRY_ROWS } from "@libs/value-types";
import { useQuery } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { ApiError } from "../../lib/api-client";
import { queryKeys } from "../../lib/query-keys";
import { StatusAlert } from "../StatusAlert";

const KNOWN_TYPES = ["email", "phone"] as const;
type IdentifierType = (typeof KNOWN_TYPES)[number];

export interface AddIdentifierFormProps {
  onChanged: () => void | Promise<void>;
}

export function AddIdentifierForm({ onChanged }: AddIdentifierFormProps): React.ReactElement {
  const { client } = useUserOrgMgmtContext();
  const { data: authConfig } = useQuery({
    queryKey: queryKeys.authConfig("authentication"),
    queryFn: () => client.getAuthConfig({ intent: "authentication" }),
  });
  const types = React.useMemo<IdentifierType[]>(() => {
    const offered = KNOWN_TYPES.filter((t) => (authConfig?.identifiers ?? []).includes(t));
    // Until the config answers, offer the identifier every product has.
    return offered.length > 0 ? offered : ["email"];
  }, [authConfig]);

  const [picked, setPicked] = React.useState<IdentifierType | null>(null);
  const type: IdentifierType = picked && types.includes(picked) ? picked : (types[0] ?? "email");
  const [value, setValue] = React.useState("");
  const [verificationFlowId, setVerificationFlowId] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const run = async (action: () => Promise<void>) => {
    setSubmitting(true);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (verificationFlowId) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void run(async () => {
            await client.verifyIdentifier({ flowId: verificationFlowId, code, type, value });
            setVerificationFlowId(null);
            setValue("");
            setCode("");
            await onChanged();
          });
        }}
      >
        <Stack dir="col" gap={16}>
          <span element="type--body-small" emphasis="quiet">
            Enter the code we sent to {value}.
          </span>
          <Stack dir="col" gap={6}>
            <Label htmlFor="identifiers-verify-input">Code</Label>
            <Input
              id="identifiers-verify-input"
              data-testid="identifiers-verify-input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6-digit code"
              autoFocus
            />
          </Stack>
          <Stack dir="row" justify="end" gap={8}>
            <Button
              type="button"
              data-testid="identifiers-verify-cancel"
              emphasis="quiet"
              onClick={() => {
                setVerificationFlowId(null);
                setCode("");
              }}
            >
              Cancel
            </Button>
            <Button
              data-testid="identifiers-verify-submit"
              type="submit"
              disabled={submitting || code.length === 0}
            >
              Verify
            </Button>
          </Stack>
          {error && (
            <StatusAlert status="error" testId="identifiers-error">{error}</StatusAlert>
          )}
        </Stack>
      </form>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          const started = await client.addIdentifier({ type, value });
          setVerificationFlowId(started.verificationFlowId);
          await onChanged();
        });
      }}
    >
      <Stack dir="col" gap={16}>
        {types.length > 1 && (
          <Stack dir="row" gap={8}>
            {types.map((t) => (
              <Button
                key={t}
                type="button"
                data-testid={`identifiers-add-type-${t}`}
                emphasis={t === type ? "primary" : "secondary"}
                scale="sm"
                onClick={() => {
                  setPicked(t);
                  setValue("");
                }}
              >
                {t === "phone" ? "Phone" : "Email"}
              </Button>
            ))}
          </Stack>
        )}
        <Stack dir="col" gap={6}>
          <Label htmlFor="identifiers-add-input">
            {type === "phone" ? "Phone number" : "Email address"}
          </Label>
          {type === "phone" ? (
            <PhoneInput
              data-testid="identifiers-add-input"
              value={value}
              onChange={setValue}
              countryOptions={[...COUNTRY_ROWS]}
            />
          ) : (
            <Input
              id="identifiers-add-input"
              data-testid="identifiers-add-input"
              type="email"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="you@example.com"
            />
          )}
        </Stack>
        <Stack dir="row" justify="end">
          <Button
            data-testid="identifiers-add-submit"
            type="submit"
            disabled={submitting || value.length === 0}
          >
            {type === "phone" ? "Add phone number" : "Add email"}
          </Button>
        </Stack>
        {error && (
          <StatusAlert status="error" testId="identifiers-error">{error}</StatusAlert>
        )}
      </Stack>
    </form>
  );
}
