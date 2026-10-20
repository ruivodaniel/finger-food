/**
 * SMS-Dev transport — the local/e2e SMS driver (inbox UI at :4000).
 *
 * Same contract as Twilio: an unreachable dev server is a returned failure,
 * so a delivery row records `failed` instead of quietly claiming a send.
 */

import type { SmsTransport, TransportResult } from "../../shared/types";
import type { ModuleLogger } from "../shared/module-errors";
import { maskPhone } from "./mask-phone";

export interface SmsDevTransportConfig {
  baseUrl: string;
  /** Sender label shown in the SMS-Dev inbox. */
  from: string;
  logger: ModuleLogger;
}

export function createSmsDevTransport(
  config: SmsDevTransportConfig,
): SmsTransport {
  return {
    async send(message): Promise<TransportResult> {
      try {
        const response = await fetch(`${config.baseUrl}/v1/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            from: config.from,
            to: message.to,
            body: message.body,
          }),
        });

        if (!response.ok) {
          const detail = await response.text().catch(() => "unknown error");
          config.logger.warn("SMS-Dev send failed", {
            status: response.status,
            detail,
            label: message.label,
          });
          return { ok: false, errorCode: `sms_dev_http_${response.status}` };
        }

        config.logger.info("SMS sent via SMS-Dev", {
          to: maskPhone(message.to),
          label: message.label,
        });
        return { ok: true };
      } catch (error) {
        config.logger.warn("SMS-Dev not reachable", {
          error,
          label: message.label,
        });
        return { ok: false, errorCode: "sms_dev_unreachable" };
      }
    },
  };
}
