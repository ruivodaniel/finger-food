// Test env defaults — mirrors src/env.ts, the only place env is read.
// Nothing else belongs here: a var the zod schema does not declare is a var
// the app cannot consume.
const testEnvDefaults: Record<string, string> = {
  NODE_ENV: "test",
  PORT: "3000",
  DATABASE_URL: "postgres://test:test@localhost:5432/test",
  ALLOWED_ORIGINS: "http://localhost:5175,http://localhost:3001",
};

for (const [key, value] of Object.entries(testEnvDefaults)) {
  process.env[key] = value;
}
