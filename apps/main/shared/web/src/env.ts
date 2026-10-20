import { z } from "zod";

const optionalUrl = z.preprocess((value) => (value === "" ? undefined : value), z.string().url().optional());
const optionalString = z.preprocess((value) => (value === "" ? undefined : value), z.string().optional());

const faroSampleRateDefaults: Record<string, number> = {
  production: 0.1,
  stage: 0.25,
  staging: 0.25,
  develop: 1,
  development: 1,
};

function inferPushEnvironment(apiUrl: string): "sandbox" | "production" {
  const { hostname } = new URL(apiUrl);
  const isLocalHost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname.endsWith(".local");

  return isLocalHost ? "sandbox" : "production";
}

const EnvSchema = z.object({
  VITE_API_URL: z.string().nonempty("VITE_API_URL is required").url({
    message: "Invalid API URL, e.g. 'http://localhost:3000 or https://api.example.com'",
  }),
  VITE_VAPID_PUBLIC_KEY: z.string().optional(),
  VITE_PUSH_ENVIRONMENT: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.enum(["sandbox", "production"]).optional(),
  ),
  VITE_OBSERVABILITY_ENABLED: z
    .enum(["true", "false"])
    .optional()
    .default("false")
    .transform((value) => value === "true"),
  VITE_FARO_URL: optionalUrl,
  VITE_FARO_SESSION_SAMPLE_RATE: z.coerce.number().min(0).max(1).optional(),
  VITE_APP_NAME: z.string().optional().default("prowd-web"),
  VITE_APP_VERSION: optionalString.default("local"),
  VITE_APP_ENVIRONMENT: z
    .string()
    .optional()
    .default(import.meta.env.MODE),
}).transform((env) => ({
  ...env,
  VITE_PUSH_ENVIRONMENT:
    env.VITE_PUSH_ENVIRONMENT ?? inferPushEnvironment(env.VITE_API_URL),
  VITE_FARO_SESSION_SAMPLE_RATE:
    env.VITE_FARO_SESSION_SAMPLE_RATE ?? faroSampleRateDefaults[env.VITE_APP_ENVIRONMENT] ?? 1,
}));

export const Env: z.infer<typeof EnvSchema> = EnvSchema.parse(import.meta.env);

export const API_BASE = `${Env.VITE_API_URL.replace(/\/+$/, "")}/api/client`;
