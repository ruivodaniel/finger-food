/**
 * Session cookie — one place decides the cookie's name and attributes.
 *
 * The value is the provider session token, HttpOnly. The provider is the single
 * source of truth for whether it names a live session; a value it doesn't
 * recognize is simply not a session, never an error.
 */

import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

export interface SessionCookieConfig {
  name: string;
  domain?: string;
  secure: boolean;
  /** Cookie lifetime mirror; the provider's session expiry stays authoritative. */
  maxAgeSeconds: number;
}

export const DEFAULT_SESSION_COOKIE: SessionCookieConfig = {
  name: "uom_session",
  secure: false,
  maxAgeSeconds: 7 * 24 * 60 * 60,
};

export function readSessionCookie(
  c: Context,
  config: SessionCookieConfig,
): string | undefined {
  return getCookie(c, config.name);
}

export function writeSessionCookie(
  c: Context,
  config: SessionCookieConfig,
  sessionToken: string,
): void {
  setCookie(c, config.name, sessionToken, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    secure: config.secure,
    ...(config.domain ? { domain: config.domain } : {}),
    maxAge: config.maxAgeSeconds,
  });
}

export function clearSessionCookie(
  c: Context,
  config: SessionCookieConfig,
): void {
  deleteCookie(c, config.name, {
    path: "/",
    ...(config.domain ? { domain: config.domain } : {}),
  });
}
