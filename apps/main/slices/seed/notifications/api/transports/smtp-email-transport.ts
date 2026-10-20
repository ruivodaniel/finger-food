/**
 * SMTP email transport — maildev in dev, a real relay elsewhere.
 *
 * A factory over config, not env: two processes send mail (the api for
 * transactional messages, the worker for queued deliveries) and each builds
 * this from its own environment. Unconfigured is a first-class state — it
 * warns and returns `not_configured` rather than pretending to have sent.
 */

import nodemailer from "nodemailer";
import type {
  EmailTransport,
  TransportResult,
} from "../../shared/types";
import type { ModuleLogger } from "../shared/module-errors";

export interface SmtpEmailTransportConfig {
  host?: string;
  port?: number;
  /** Envelope sender for every message this transport sends. */
  from: string;
  /** TLS off for maildev; on for a real relay. */
  secure?: boolean;
  logger: ModuleLogger;
}

export function createSmtpEmailTransport(
  config: SmtpEmailTransportConfig,
): EmailTransport {
  if (!config.host) {
    return {
      async send(message): Promise<TransportResult> {
        config.logger.warn("email transport not configured; message not sent", {
          to: message.to,
          subject: message.subject,
        });
        return { ok: false, errorCode: "not_configured" };
      },
    };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure ?? false,
    ignoreTLS: !config.secure,
  });

  return {
    async send(message): Promise<TransportResult> {
      try {
        const sent = await transporter.sendMail({
          from: config.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
          html: message.html,
        });
        config.logger.info("email sent via SMTP", {
          to: message.to,
          subject: message.subject,
        });
        return { ok: true, providerMessageId: sent.messageId };
      } catch (error) {
        config.logger.error("SMTP send failed", {
          to: message.to,
          subject: message.subject,
          error,
        });
        return { ok: false, errorCode: "smtp_send_failed" };
      }
    },
  };
}
