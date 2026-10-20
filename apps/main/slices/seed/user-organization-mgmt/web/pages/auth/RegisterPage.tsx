/**
 * RegisterPage — one screen, two moments: the form, then the code.
 *
 * Everything the config asks for at registration is collected at once
 * (identifier, credential, name, consent — all sourced from `GET /auth/config`,
 * never invented client-side). Submitting the form delivers a code and creates
 * NOTHING — every answer, the password included, stays in this component's
 * state and rides the verify request, the one that births the account with its
 * address verified and its password set. A refresh mid-code simply means
 * redoing the form: nothing exists server-side to leak or resume.
 *
 * A heading block (the title over the moment's intro), the identifier choice
 * as a row of Buttons, the form a Stack of labelled fields — the password
 * policy's feedback as the field's error message — under one filling primary;
 * errors as an Alert; the code moment's resend / edit links and the footer
 * link as rows. No inline styles.
 */

import * as React from "react";
import { Button, Input, Label, PhoneInput } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { COUNTRY_ROWS } from "@libs/value-types";
import { useQuery } from "@tanstack/react-query";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useInvalidateSession } from "../../hooks/use-session";
import { queryKeys } from "../../lib/query-keys";
import { ApiError } from "../../lib/api-client";
import { ConsentCheckboxes } from "../../components/register/ConsentCheckboxes";
import { passwordPolicyProblems } from "../../../shared/auth-config/password-policy";
import { StatusAlert } from "../../components/StatusAlert";

const messageOf = (e: unknown) =>
  e instanceof ApiError ? e.message : "something went wrong";

/** An identifier's human name: its tab's label and its field's. */
const identifierLabel = (id: string) =>
  id === "phone" ? "Phone" : id === "email" ? "Email" : id;

export interface RegisterPageProps {
  loginPath?: string;
  homePath?: string;
  invitationId?: string;
  /** The signed-in accept page — register-and-join lands there to accept. */
  acceptInvitationPath?: string;
}

export function RegisterPage({
  loginPath = "/login",
  homePath = "/",
  invitationId,
  acceptInvitationPath = "/my/invitations/accept",
}: RegisterPageProps): React.ReactElement {
  const { client, router } = useUserOrgMgmtContext();
  const invalidateSession = useInvalidateSession();

  const [identifierType, setIdentifierType] = React.useState<string | null>(
    null,
  );
  const [identifierValue, setIdentifierValue] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [decisions, setDecisions] = React.useState<Record<string, boolean>>({});

  /** Set while the delivered code is what stands between form and account. */
  const [pendingFlowId, setPendingFlowId] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const { data: authConfig } = useQuery({
    queryKey: queryKeys.authConfig("registration"),
    queryFn: () => client.getAuthConfig({ intent: "registration" }),
  });
  const identifiers = React.useMemo(
    () => authConfig?.identifiers ?? [],
    [authConfig],
  );
  const activeIdentifier = identifierType ?? identifiers[0] ?? null;

  // The config for THIS identifier decides the credential and what else to ask.
  const { data: identifierConfig } = useQuery({
    queryKey: queryKeys.authConfig("registration", activeIdentifier ?? ""),
    queryFn: () =>
      client.getAuthConfig({
        intent: "registration",
        identifier: activeIdentifier ?? undefined,
      }),
    enabled: !!activeIdentifier,
  });
  const usesPassword = identifierConfig?.factors.includes("password") ?? false;
  const consentItems = identifierConfig?.consent ?? [];
  const wantsName = identifierConfig?.profileFields.includes("name") ?? false;

  // Live feedback with the SAME shared check the auth service enforces pre-birth —
  // a password this accepts is a password the birth accepts.
  const passwordProblems =
    usesPassword && password.length > 0
      ? passwordPolicyProblems(
          identifierConfig?.passwordPolicy ?? undefined,
          password,
        )
      : [];

  // Everything the config demands must be answered before the one request goes
  // out — the server refuses anyway; this keeps the button honest.
  const mandatoryConsented = consentItems.every(
    (item) => !item.mandatory || (decisions[item.type] ?? false),
  );
  const canSubmit =
    identifierValue.length > 0 &&
    (!usesPassword || (password.length > 0 && passwordProblems.length === 0)) &&
    (!wantsName || name.trim().length > 0) &&
    mandatoryConsented;

  const answers = () => ({
    ...(wantsName && name ? { name } : {}),
    ...(consentItems.length > 0
      ? {
          consents: consentItems.map((item) => ({
            type: item.type,
            accepted: decisions[item.type] ?? false,
          })),
        }
      : {}),
    ...(invitationId ? { invitationId } : {}),
  });

  const finish = async () => {
    await invalidateSession();
    // register-and-join: back to the invitation, signed in, to accept it
    await router?.navigate(
      invitationId
        ? { to: acceptInvitationPath, search: { id: invitationId } }
        : { to: homePath },
    );
  };

  /** Deliver (or re-deliver) the code from the form held in state. */
  const submit = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!activeIdentifier) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await client.register({
        identifierType: activeIdentifier,
        identifierValue,
        ...(usesPassword ? { password } : {}),
        ...answers(),
      });
      setPendingFlowId(result.flowId); // proving the code creates the account
      setCode("");
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setSubmitting(false);
    }
  };

  /** The birth request: code + name + consents + password, together. */
  const submitPendingCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!pendingFlowId || !activeIdentifier) return;
    setSubmitting(true);
    setError(null);
    try {
      await client.registerVerify({
        flowId: pendingFlowId,
        identifierType: activeIdentifier,
        identifierValue,
        code,
        ...(usesPassword ? { password } : {}),
        ...answers(),
      });
      await finish();
    } catch (e) {
      setError(messageOf(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack dir="col" gap={20} data-testid="register-page">
      <Stack dir="col" gap={4}>
        <h1 element="type--heading2">Create your account</h1>
        {pendingFlowId ? (
          <span
            element="type--body-small"
            emphasis="quiet"
            data-testid="register-verify-hint"
          >
            Enter the code we sent to {identifierValue}.
          </span>
        ) : (
          <span element="type--body-small" emphasis="quiet">
            Enter your details. We'll send you a code to confirm them.
          </span>
        )}
      </Stack>

      {pendingFlowId ? (
        <form onSubmit={submitPendingCode}>
          <Stack dir="col" gap={16}>
            <Stack dir="col" gap={6}>
              <Label htmlFor="register-code">Code</Label>
              <Input
                id="register-code"
                data-testid="register-code-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                autoFocus
              />
            </Stack>
            <Button
              data-testid="register-code-submit"
              type="submit"
              fill
              disabled={submitting || code.length === 0}
            >
              Verify
            </Button>
            <Stack dir="row" justify="between" gap={12}>
              {/* No account exists yet — a fresh code just restarts the flow
                  from the form still held in state. */}
              <span element="type--body-small">
                <a
                  element="type--link"
                  data-testid="register-code-resend"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!submitting) void submit();
                  }}
                >
                  Resend code
                </a>
              </span>
              <span element="type--body-small">
                <a
                  element="type--link"
                  data-testid="register-code-back"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPendingFlowId(null);
                    setCode("");
                    setError(null);
                  }}
                >
                  Edit my details
                </a>
              </span>
            </Stack>
          </Stack>
        </form>
      ) : (
        <form onSubmit={submit}>
          <Stack dir="col" gap={16}>
            {identifiers.length > 1 && (
              <Stack dir="row" gap={8} role="tablist">
                {identifiers.map((id) => (
                  <Button
                    key={id}
                    // inside the <form>, an untyped button IS a submit button —
                    // switching tabs must never fire the registration request
                    type="button"
                    data-testid={`register-identifier-${id}`}
                    emphasis={id === activeIdentifier ? "primary" : "secondary"}
                    onClick={() => {
                      setIdentifierType(id);
                      setIdentifierValue("");
                      setPassword("");
                      setError(null);
                    }}
                  >
                    {identifierLabel(id)}
                  </Button>
                ))}
              </Stack>
            )}

            <Stack dir="col" gap={6}>
              <Label htmlFor="register-identifier">
                {identifierLabel(activeIdentifier ?? "email")}
              </Label>
              {activeIdentifier === "phone" ? (
                <PhoneInput
                  id="register-identifier"
                  data-testid="register-identifier-input"
                  value={identifierValue}
                  onChange={setIdentifierValue}
                  countryOptions={[...COUNTRY_ROWS]}
                />
              ) : (
                <Input
                  id="register-identifier"
                  data-testid="register-identifier-input"
                  type="email"
                  value={identifierValue}
                  onChange={(e) => setIdentifierValue(e.target.value)}
                  placeholder="you@example.com"
                />
              )}
            </Stack>

            {usesPassword && (
              <Stack dir="col" gap={6}>
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  data-testid="register-password-input"
                  type="password"
                  status={passwordProblems.length > 0 ? "error" : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                />
                {passwordProblems.length > 0 && (
                  <span
                    element="type--body-small"
                    status="error"
                    data-testid="register-password-hint"
                  >
                    Password needs {passwordProblems.join(", ")}.
                  </span>
                )}
              </Stack>
            )}

            {wantsName && (
              <Stack dir="col" gap={6}>
                <Label htmlFor="register-name">Name</Label>
                <Input
                  id="register-name"
                  data-testid="register-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="your name"
                />
              </Stack>
            )}

            {consentItems.length > 0 && (
              <ConsentCheckboxes
                items={consentItems}
                decisions={decisions}
                onDecisionChange={(type, accepted) =>
                  setDecisions((d) => ({ ...d, [type]: accepted }))
                }
              />
            )}

            <Button
              data-testid="register-submit"
              type="submit"
              fill
              disabled={submitting || !canSubmit}
            >
              Create account
            </Button>
          </Stack>
        </form>
      )}

      {error && (
        <StatusAlert status="error" testId="register-error">{error}</StatusAlert>
      )}

      <Stack dir="row" justify="center">
        <span element="type--body-small">
          <a
            element="type--link"
            data-testid="register-to-login"
            href={loginPath}
            onClick={(e) => {
              e.preventDefault();
              void router?.navigate({ to: loginPath });
            }}
          >
            Already have an account? Sign in
          </a>
        </span>
      </Stack>
    </Stack>
  );
}
