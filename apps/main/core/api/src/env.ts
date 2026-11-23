// typed env (zod), the only place env is read
import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  // core
  NODE_ENV: z
    .enum(["test", "development", "staging", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  LOG_LEVEL: z.string().optional(),
  LOG_FORMAT: z.enum(["json", "pretty"]).optional(),

  // db
  DATABASE_URL: z.url(),

  // queue — inline runs deliveries in-process after commit; redis rides the
  // workflow-intent outbox, run in-process (src/wiring/intent-runner.ts)
  // inline: deliveries run in-process right after commit. outbox: the
  // workflow_intent row is written in the mutation's transaction and run in
  // this process after commit; the orchestrator's schedule reconciles.
  QUEUE_MODE: z.enum(["inline", "outbox"]).default("inline"),
  WORKFLOW_INTENT_CONCURRENCY: z.coerce.number().int().min(1).default(10),
  // the service JWT the orchestrator presents on /api/m2m (HS256, shared)
  SERVICE_JWT_SECRET: z.string().min(16).optional(),

  // chatbot — main starts chat runs on the orchestrator and listens to the open
  // API's chat events. MAIN_PRIVATE_KEY is main's Ed25519 private key (PKCS#8
  // PEM; "\n" may be written escaped): it signs the delegation a run carries and
  // main's token for the open API. Each chat link stays off until it is set.
  ORCHESTRATOR_URL: z.url().optional(),
  OPEN_API_URL: z.url().optional(),
  MAIN_PRIVATE_KEY: z
    .string()
    .optional()
    .transform((value) => value?.replace(/\\n/g, "\n")),

  // cors
  ALLOWED_ORIGINS: z
    .string()
    .transform((value) =>
      value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  CORS_ORIGIN_PATTERN: z
    .string()
    .optional()
    .transform((value) => (value ? new RegExp(value) : undefined)),

  // kratos (the uom module's identity provider; defaults match its compose fragment)
  KRATOS_PUBLIC_URL: z.url().default("http://localhost:4433"),
  KRATOS_ADMIN_URL: z.url().default("http://localhost:4434"),
  // must match the X-Courier-Secret header in the module's kratos.yml courier config
  KRATOS_COURIER_SMS_SECRET: z.string().default("dev-courier-secret"),

  // social providers — a provider mounts only when both id and secret are set (CFG2)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),

  // email delivery (notifications + invitations — kratos sends its own codes
  // over SMTP directly)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(1025),
  EMAIL_FROM: z.string().default("noreply@localhost"),

  // sms delivery (kratos courier webhook + invitation sms + queued deliveries)
  SMS_DEV_URL: z.url().optional(),
  SMS_FROM: z.string().default("Prowd"),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  // where web-main renders the invitation-accept page (and the billing pages
  // Stripe sends the browser back to)
  WEB_APP_URL: z.url().default("http://localhost:5174"),

  // stripe (the payment slice) — the provider mounts only when the secret key
  // is set; the platform webhook secret is then required, the connect one is
  // optional until the marketplace runs. Price ids: `stripePriceIds` below.
  STRIPE_SECRET_KEY: z.string().regex(/^(sk|rk)_/).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  STRIPE_CONNECT_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),

  // object storage (@libs/storage — avatar/org-logo uploads via the uom
  // module's storage port). Dev defaults target the compose LocalStack.
  AWS_REGION: z.string().default("us-east-1"),
  AWS_BUCKET_NAME: z.string().default("prowd-local"),
  // Explicit credentials for local dev / e2e; on EKS with IRSA leave unset.
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  // Custom S3 endpoint (LocalStack). Unset in real AWS.
  AWS_ENDPOINT: z.string().optional(),
}).refine((env) => !env.STRIPE_SECRET_KEY || !!env.STRIPE_WEBHOOK_SECRET, {
  message: "STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is set",
  path: ["STRIPE_WEBHOOK_SECRET"],
});

export const Env = EnvSchema.parse(process.env);

/**
 * `STRIPE_PRICE_<KEY>` → Stripe price id, one per catalog plan or bundle key
 * (`STRIPE_PRICE_STARTER=price_…` reads as `{ starter: "price_…" }`). Read
 * here because this file is the only place env is read; the payment mount
 * refuses to boot with Stripe on and a key without a price.
 */
export const stripePriceIds: Record<string, string> = Object.fromEntries(
  Object.entries(process.env).flatMap(([name, value]) =>
    name.startsWith("STRIPE_PRICE_") && value
      ? [[name.slice("STRIPE_PRICE_".length).toLowerCase(), value]]
      : [],
  ),
);
