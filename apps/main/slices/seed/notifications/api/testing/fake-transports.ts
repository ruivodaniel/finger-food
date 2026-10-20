/**
 * Transport and outbox doubles. The transports record what they were asked to
 * send and can be told to fail; the capture outbox holds enqueued work so a
 * test can decide when — or whether — delivery runs.
 */

import type {
  DeliveryHandle,
  DeliveryOutbox,
  DeliveryOutboxItem,
  EmailMessage,
  EmailTransport,
  SmsMessage,
  SmsTransport,
  TransportResult,
} from "../../shared/types";

export interface FakeEmailTransport extends EmailTransport {
  sent: EmailMessage[];
  /** Set to make the next and every following send fail. */
  failWith: string | null;
}

export function createFakeEmailTransport(): FakeEmailTransport {
  const transport: FakeEmailTransport = {
    sent: [],
    failWith: null,
    async send(message): Promise<TransportResult> {
      if (transport.failWith) {
        return { ok: false, errorCode: transport.failWith };
      }
      transport.sent.push(message);
      return { ok: true, providerMessageId: `fake_${transport.sent.length}` };
    },
  };
  return transport;
}

export interface FakeSmsTransport extends SmsTransport {
  sent: SmsMessage[];
  failWith: string | null;
}

export function createFakeSmsTransport(): FakeSmsTransport {
  const transport: FakeSmsTransport = {
    sent: [],
    failWith: null,
    async send(message): Promise<TransportResult> {
      if (transport.failWith) {
        return { ok: false, errorCode: transport.failWith };
      }
      transport.sent.push(message);
      return { ok: true, providerMessageId: `fake_${transport.sent.length}` };
    },
  };
  return transport;
}

export interface CaptureDeliveryOutbox extends DeliveryOutbox {
  /** Items handed over inside the queue's transaction. */
  enqueued: DeliveryOutboxItem[];
  /** Handles the queue nudged after commit. */
  nudged: DeliveryHandle[];
  /** Set to make `nudge` throw — the queue must swallow and log it. */
  nudgeFails: boolean;
}

export function createCaptureDeliveryOutbox(): CaptureDeliveryOutbox {
  const outbox: CaptureDeliveryOutbox = {
    enqueued: [],
    nudged: [],
    nudgeFails: false,
    async enqueue(_tx, items): Promise<DeliveryHandle[]> {
      outbox.enqueued.push(...items);
      return items.map((item) => ({ deliveryId: item.deliveryId }));
    },
    async nudge(handles): Promise<void> {
      if (outbox.nudgeFails) throw new Error("nudge failed");
      outbox.nudged.push(...handles);
    },
  };
  return outbox;
}
