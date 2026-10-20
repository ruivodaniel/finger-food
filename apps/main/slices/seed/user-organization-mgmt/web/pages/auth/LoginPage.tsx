/**
 * LoginPage — config-driven login.
 *
 * Offers the identifiers the server resolves for `intent: authentication`
 * and, per chosen identifier, the resolved factor: password form or OTP
 * code (start → code entry). Self-sufficient: reads adapters from provider
 * context, navigates to the `intention` search param (or "/") on success.
 *
 * A heading block (the title over the moment's intro), the identifier choice
 * as a row of Buttons, each form a Stack of labelled fields under one filling
 * primary, errors as an Alert, the footer links as a row. No inline styles.
 */

import * as React from "react";
import { Button, Input, Label, PhoneInput } from "@libs/web-components";
import { Stack } from "@libs/web-layouts";
import { COUNTRY_ROWS } from "@libs/value-types";
import { useUserOrgMgmtContext } from "../../providers/UserOrgMgmtProvider";
import { useInvalidateSession } from "../../hooks/use-session";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../lib/query-keys";
import { ApiError } from "../../lib/api-client";
import {
  navigateToPath,
  sanitizeInAppPath,
} from "../../lib/navigate-to-path";
import { StatusAlert } from "../../components/StatusAlert";

export interface LoginPageProps {
  /** Where to go after login (guard-set). */
  intention?: string;
  /** Path of the register page in the hosting app (link target). */
  registerPath?: string;
  /** Path of the recovery page in the hosting app (link target). */
  recoveryPath?: string;
  /** The app's signed-in home — landing when no intention is set. */
  homePath?: string;
}

/** An identifier's human name: its tab's label and its field's. */
const identifierLabel = (id: string) =>
  id === "phone" ? "Phone" : id === "email" ? "Email" : id;

export function LoginPage({
  intention,
  registerPath = "/register",
  recoveryPath = "/forgot-password",
  homePath = "/",
}: LoginPageProps): React.ReactElement {
  const { client, router } = useUserOrgMgmtContext();
  const invalidateSession = useInvalidateSession();

  const [identifierType, setIdentifierType] = React.useState<string | null>(
    null,
  );
  const [identifierValue, setIdentifierValue] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [codeFlowId, setCodeFlowId] = React.useState<string | null>(null);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const { data: authConfig } = useQuery({
    queryKey: queryKeys.authConfig("authentication"),
    queryFn: () => client.getAuthConfig({ intent: "authentication" }),
  });
  const identifiers = React.useMemo(
    () => authConfig?.identifiers ?? [],
    [authConfig],
  );
  const activeIdentifier = identifierType ?? identifiers[0] ?? null;

  const { data: identifierConfig } = useQuery({
    queryKey: queryKeys.authConfig("authentication", activeIdentifier ?? ""),
    queryFn: () =>
      client.getAuthConfig({
        intent: "authentication",
        identifier: activeIdentifier ?? undefined,
      }),
    enabled: !!activeIdentifier,
  });
  const factors = identifierConfig?.factors ?? [];
  const hasPassword = factors.includes("password");
  const hasOtp = factors.some((f) => f.startsWith("otp"));
  // When both are offered, password is the default and OTP an explicit choice
  const [preferCode, setPreferCode] = React.useState(false);
  const usesPassword = hasPassword && !preferCode;

  const finish = React.useCallback(async () => {
    await invalidateSession();
    // navigateToPath splits any query string off the intention — a bare
    // navigate({ to }) would swallow it (e.g. /resolve?intention=…).
    await navigateToPath(router, sanitizeInAppPath(intention) ?? homePath);
  }, [intention, homePath, invalidateSession, router]);

  const fail = (e: unknown) =>
    setError(e instanceof ApiError ? e.message : "something went wrong");

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeIdentifier) return;
    setSubmitting(true);
    setError(null);
    try {
      await client.loginPassword({
        identifierType: activeIdentifier,
        identifierValue,
        password,
      });
      // 2FA-demanding members land at AAL1 and the gate routes them to the
      // step-up resolve screen — login itself is done.
      await finish();
    } catch (e) {
      fail(e);
    } finally {
      setSubmitting(false);
    }
  };

  const startCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!activeIdentifier) return;
    setSubmitting(true);
    setError(null);
    try {
      const { flowId } = await client.loginCodeStart({
        identifierType: activeIdentifier,
        identifierValue,
      });
      setCodeFlowId(flowId);
    } catch (e) {
      fail(e);
    } finally {
      setSubmitting(false);
    }
  };

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!codeFlowId) return;
    setSubmitting(true);
    setError(null);
    try {
      await client.loginCodeComplete({
        flowId: codeFlowId,
        identifierType: activeIdentifier!,
        identifierValue,
        code,
      });
      await finish();
    } catch (e) {
      fail(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack dir="col" gap={20} data-testid="login-page">
      <Stack dir="col" gap={4}>
        <h1 element="type--heading2">Welcome back</h1>
        <span element="type--body-small" emphasis="quiet">
          {codeFlowId
            ? `Enter the code we sent to ${identifierValue}.`
            : "Sign in to continue."}
        </span>
      </Stack>

      {identifiers.length > 1 && (
        <Stack dir="row" gap={8} role="tablist">
          {identifiers.map((id) => (
            <Button
              key={id}
              data-testid={`login-identifier-${id}`}
              emphasis={id === activeIdentifier ? "primary" : "secondary"}
              onClick={() => {
                setIdentifierType(id);
                setIdentifierValue("");
                setCodeFlowId(null);
                setPreferCode(false);
                setError(null);
              }}
            >
              {identifierLabel(id)}
            </Button>
          ))}
        </Stack>
      )}

      {codeFlowId ? (
        <form onSubmit={submitCode}>
          <Stack dir="col" gap={16}>
            <Stack dir="col" gap={6}>
              <Label htmlFor="login-code">Code</Label>
              <Input
                id="login-code"
                data-testid="login-code-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6-digit code"
                autoFocus
              />
            </Stack>
            <Button
              data-testid="login-code-submit"
              type="submit"
              fill
              disabled={submitting || code.length === 0}
            >
              Verify
            </Button>
          </Stack>
        </form>
      ) : (
        <form onSubmit={usesPassword ? submitPassword : startCode}>
          <Stack dir="col" gap={16}>
            <Stack dir="col" gap={6}>
              <Label htmlFor="login-identifier">
                {identifierLabel(activeIdentifier ?? "email")}
              </Label>
              {activeIdentifier === "phone" ? (
                <PhoneInput
                  id="login-identifier"
                  data-testid="login-identifier-input"
                  value={identifierValue}
                  onChange={setIdentifierValue}
                  countryOptions={[...COUNTRY_ROWS]}
                />
              ) : (
                <Input
                  id="login-identifier"
                  data-testid="login-identifier-input"
                  value={identifierValue}
                  onChange={(e) => setIdentifierValue(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="username"
                />
              )}
            </Stack>
            {usesPassword && (
              <Stack dir="col" gap={6}>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  data-testid="login-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  autoComplete="current-password"
                />
              </Stack>
            )}
            <Button
              data-testid="login-submit"
              type="submit"
              fill
              disabled={submitting || identifierValue.length === 0}
            >
              {usesPassword ? "Sign in" : "Send code"}
            </Button>
            {hasPassword && hasOtp && (
              <Stack dir="row" justify="center">
                <span element="type--body-small">
                  <a
                    element="type--link"
                    data-testid="login-factor-toggle"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPreferCode((v) => !v);
                      setPassword("");
                      setError(null);
                    }}
                  >
                    {usesPassword
                      ? "Send me a sign-in code instead"
                      : "Use your password instead"}
                  </a>
                </span>
              </Stack>
            )}
          </Stack>
        </form>
      )}

      {error && (
        <StatusAlert status="error" testId="login-error">{error}</StatusAlert>
      )}

      <Stack dir="row" justify="between" gap={12}>
        <span element="type--body-small">
          <a
            element="type--link"
            data-testid="login-to-recovery"
            href={recoveryPath}
            onClick={(e) => {
              e.preventDefault();
              void router?.navigate({ to: recoveryPath });
            }}
          >
            Forgot your password?
          </a>
        </span>
        <span element="type--body-small">
          <a
            element="type--link"
            data-testid="login-to-register"
            href={registerPath}
            onClick={(e) => {
              e.preventDefault();
              void router?.navigate({ to: registerPath });
            }}
          >
            Create an account
          </a>
        </span>
      </Stack>
    </Stack>
  );
}
