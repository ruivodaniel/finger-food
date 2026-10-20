/**
 * ForgotPasswordPage — prove ownership of a registered address (email or
 * phone, per the config's recovery context) via a delivered code. UNIFORM
 * for every account (nothing about the account's credentials is ever
 * disclosed). Proving the code signs the caller in; the page then hands over
 * to /reset-password, where the new password is set on that session.
 *
 * A heading block (the title over the stage's intro), the identifier choice
 * as a row of Buttons, each stage's form a Stack of labelled fields under one
 * filling primary, errors as an Alert, the footer link as a row. No inline
 * styles.
 */

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Input, Label, PhoneInput } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { COUNTRY_ROWS } from "@libs/value-types";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useInvalidateSession } from "../../hooks/use-session";
import { queryKeys } from "../../lib/query-keys";
import { ApiError } from "../../lib/api-client";
import { StatusAlert } from "../../components/StatusAlert";

export interface ForgotPasswordPageProps {
  loginPath?: string;
  /** Where the signed-in caller sets the new password. */
  resetPasswordPath?: string;
}

type Stage = "identifier" | "code";

/** An identifier's human name: its tab's label and its field's. */
const identifierLabel = (id: string) =>
  id === "phone" ? "Phone" : id === "email" ? "Email" : id;

export function ForgotPasswordPage({
  loginPath = "/login",
  resetPasswordPath = "/reset-password",
}: ForgotPasswordPageProps): React.ReactElement {
  const { client, router } = useUserOrgMgmtContext();
  const invalidateSession = useInvalidateSession();

  const [stage, setStage] = React.useState<Stage>("identifier");
  const [identifierType, setIdentifierType] = React.useState<string | null>(
    null,
  );
  const [identifierValue, setIdentifierValue] = React.useState("");
  const [flowId, setFlowId] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const { data: recoveryConfig } = useQuery({
    queryKey: queryKeys.authConfig("recovery"),
    queryFn: () => client.getAuthConfig({ intent: "recovery" }),
  });
  const identifiers = React.useMemo(
    () => recoveryConfig?.identifiers ?? [],
    [recoveryConfig],
  );
  const activeIdentifier = identifierType ?? identifiers[0] ?? "email";

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

  return (
    <Stack dir="col" gap={20} data-testid="recovery-page">
      <Stack dir="col" gap={4}>
        <h1 element="type--heading2">Forgot your password?</h1>
        <span element="type--body-small" emphasis="quiet">
          {stage === "identifier"
            ? "No problem — we'll send you a code to get you back in."
            : `If that account exists, we sent a code to ${identifierValue}.`}
        </span>
      </Stack>

      {stage === "identifier" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const started = await client.recoveryStart({
                identifierType: activeIdentifier,
                identifierValue,
              });
              setFlowId(started.flowId);
              setStage("code");
            });
          }}
        >
          <Stack dir="col" gap={16}>
            {identifiers.length > 1 && (
              <Stack dir="row" gap={8} role="tablist">
                {identifiers.map((id) => (
                  <Button
                    key={id}
                    type="button"
                    data-testid={`recovery-identifier-${id}`}
                    emphasis={id === activeIdentifier ? "primary" : "secondary"}
                    onClick={() => {
                      setIdentifierType(id);
                      setIdentifierValue("");
                    }}
                  >
                    {identifierLabel(id)}
                  </Button>
                ))}
              </Stack>
            )}
            <Stack dir="col" gap={6}>
              <Label htmlFor="recovery-identifier">
                {identifierLabel(activeIdentifier)}
              </Label>
              {activeIdentifier === "phone" ? (
                <PhoneInput
                  id="recovery-identifier"
                  data-testid="recovery-identifier-input"
                  value={identifierValue}
                  onChange={setIdentifierValue}
                  countryOptions={[...COUNTRY_ROWS]}
                />
              ) : (
                <Input
                  id="recovery-identifier"
                  data-testid="recovery-identifier-input"
                  value={identifierValue}
                  onChange={(e) => setIdentifierValue(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="username"
                />
              )}
            </Stack>
            <Button
              data-testid="recovery-start-submit"
              type="submit"
              fill
              disabled={submitting || identifierValue.length === 0}
            >
              Send recovery code
            </Button>
          </Stack>
        </form>
      )}

      {stage === "code" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              // proving the code signs the caller in — /reset-password acts
              // on that session
              await client.recoveryComplete({
                flowId: flowId!,
                identifierType: activeIdentifier,
                identifierValue,
                code,
              });
              await invalidateSession();
              await router?.navigate({ to: resetPasswordPath });
            });
          }}
        >
          <Stack dir="col" gap={16}>
            <Stack dir="col" gap={6}>
              <Label htmlFor="recovery-code">Code</Label>
              <Input
                id="recovery-code"
                data-testid="recovery-code-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                autoFocus
              />
            </Stack>
            <Button
              data-testid="recovery-code-submit"
              type="submit"
              fill
              disabled={submitting || code.length === 0}
            >
              Verify code
            </Button>
          </Stack>
        </form>
      )}

      {error && (
        <StatusAlert status="error" testId="recovery-error">{error}</StatusAlert>
      )}

      <Stack dir="row" justify="center">
        <span element="type--body-small">
          <a
            element="type--link"
            data-testid="recovery-to-login"
            href={loginPath}
            onClick={(e) => {
              e.preventDefault();
              void router?.navigate({ to: loginPath });
            }}
          >
            Back to sign in
          </a>
        </span>
      </Stack>
    </Stack>
  );
}
