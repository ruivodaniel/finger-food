/**
 * Atomic Seed Script: Flush Redis — no-op.
 *
 * The API has no redis consumer right now (the redis-backed sign-in rate
 * limiter retired with the old shell; rate limiting returns later on
 * authMount.rateLimitPaths). The engine still calls FLUSH_REDIS between
 * runs, so this stub keeps the contract and always succeeds.
 *
 * Input:  none
 * Output: { success: true }
 */

console.log(JSON.stringify({ success: true }));
process.exit(0);
