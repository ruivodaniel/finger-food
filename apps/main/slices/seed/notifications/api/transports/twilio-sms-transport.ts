/**
 * Twilio SMS transport — the production SMS driver.
 *
 * A factory over config, not env, for the same reason as the SMTP one: the api
 * and the worker each build it from their own environment. Logs carry a masked
 * number and the caller's label, never the message body.
 */

import type { SmsTransport, TransportResult } from "../../shared/types";
import type { ModuleLogger } from "../shared/module-errors";
import { maskPhone } from "./mask-phone";

export interface TwilioSmsTransportConfig {
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  logger: ModuleLogger;
}

export function createTwilioSmsTransport(
  config: TwilioSmsTransportConfig,
): SmsTransport {
  const { accountSid, authToken, fromNumber } = config;
  if (!accountSid || !authToken || !fromNumber) {
    return {
      async send(message): Promise<TransportResult> {
        config.logger.warn("SMS not configured; message not sent", {
          to: maskPhone(message.to),
          label: message.label,
        });
        return { ok: false, errorCode: "not_configured" };
      },
    };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  return {
    async send(message): Promise<TransportResult> {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: fromNumber,
            To: message.to,
            Body: message.body,
          }),
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => "unknown error");
          config.logger.error("Twilio SMS failed", {
            status: response.status,
            detail,
            label: message.label,
          });
          return { ok: false, errorCode: `twilio_http_${response.status}` };
        }

        const body = (await response.json().catch(() => ({}))) as {
          sid?: string;
        };
        config.logger.info("SMS sent via Twilio", {
          to: maskPhone(message.to),
          label: message.label,
        });
        return { ok: true, providerMessageId: body.sid };
      } catch (error) {
        config.logger.error("Twilio SMS error", {
          error,
          label: message.label,
        });
        return { ok: false, errorCode: "twilio_unreachable" };
      }
    },
  };
}
