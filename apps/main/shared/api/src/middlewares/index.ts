// app-owned middleware + ordering. Ordering is composed in server.ts /
// routes/client.ts; module middleware (session/gate) is provided by the mount
// and applied there. Empty of app middleware for now — rate limiting arrives
// later on userOrg.authMount.rateLimitPaths (/api/auth/login,
// /api/auth/register). Present per SCF1 (layer folder — scaffolding never
// changes shape).
