/**
 * The app's email and SMS instances, built once from `Env`.
 *
 * The module defines the ports and ships the drivers; each process picks which
 * driver its environment means. Two consumers share these instances: the
 * notifications mount (queued deliveries) and the transactional sends that
 * deliberately bypass the queue — the Kratos courier's auth codes and invitation
 * delivery, both addressed to someone who may not have an account yet.
 */

import {
  createSmsDevTransport,
  createSmtpEmailTransport,
  createTwilioSmsTransport,
} from "@modules/notifications/api";
import type {
  EmailMessage,
  NotificationTransports,
  SmsMessage,
} from "@modules/notifications/shared";
import { Env } from "@/env";
import { logger } from "@/shared/logger";

/** ModuleLogger is (message, meta?) — pino is (meta, message). */
const moduleLogger = {
  info: (message: string, meta?: Record<string, unknown>) =>
    logger.info(meta ?? {}, message),
  warn: (message: string, meta?: Record<string, unknown>) =>
    logger.warn(meta ?? {}, message),
  error: (message: string, meta?: Record<string, unknown>) =>
    logger.error(meta ?? {}, message),
};

export const notificationTransports: NotificationTransports = {
  email: createSmtpEmailTransport({
    host: Env.SMTP_HOST,
    port: Env.SMTP_PORT,
    from: Env.EMAIL_FROM,
    logger: moduleLogger,
  }),
  sms: Env.SMS_DEV_URL
    ? createSmsDevTransport({
        baseUrl: Env.SMS_DEV_URL,
        from: Env.SMS_FROM,
        logger: moduleLogger,
      })
    : createTwilioSmsTransport({
        accountSid: Env.TWILIO_ACCOUNT_SID,
        authToken: Env.TWILIO_AUTH_TOKEN,
        fromNumber: Env.TWILIO_FROM_NUMBER,
        logger: moduleLogger,
      }),
};

/**
 * Send now, outside the queue. A transactional message has no delivery row to
 * record its outcome on, so a returned failure becomes a log line here — the
 * one place that knows nothing downstream is tracking it.
 */
export async function sendTransactionalEmail(
  message: EmailMessage,
  label: string,
): Promise<void> {
  const result = await notificationTransports.email.send(message);
  if (!result.ok) {
    logger.warn(
      { to: message.to, label, errorCode: result.errorCode },
      "transactional email not delivered",
    );
  }
}

export async function sendTransactionalSms(
  message: SmsMessage,
): Promise<void> {
  const result = await notificationTransports.sms.send(message);
  if (!result.ok) {
    logger.warn(
      { label: message.label, errorCode: result.errorCode },
      "transactional SMS not delivered",
    );
  }
}
