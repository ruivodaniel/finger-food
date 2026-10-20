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


  // social providers — a provider mounts only when both id and secret are set (CFG2)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_CLIENT_SECRET: z.string().optional(),

  // email delivery (notifications, invitations and the sign-in codes)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(1026),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@localhost"),

  // sms delivery (invitation sms + queued deliveries)
  SMS_DEV_URL: z.url().optional(),
  SMS_FROM: z.string().default("FingerFood"),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_FROM_NUMBER: z.string().optional(),

  // where web-main renders the invitation-accept page
  WEB_APP_URL: z.url().default("http://localhost:5175"),

  // object storage (@libs/storage — avatar/org-logo uploads via the uom
  // module's storage port). Dev defaults target the compose LocalStack.
  AWS_REGION: z.string().default("us-east-1"),
  AWS_BUCKET_NAME: z.string().default("finger-food-local"),
  // Explicit credentials for local dev / e2e; on EKS with IRSA leave unset.
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  // Custom S3 endpoint (LocalStack). Unset in real AWS.
  AWS_ENDPOINT: z.string().optional(),
});

export const Env = EnvSchema.parse(process.env);
