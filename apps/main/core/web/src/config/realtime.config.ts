/**
 * The app's one real-time connection to the API: handed to each slice at mount (`coreRealtime.realtime`), opened and closed
 * by the root as the signed-in user changes.
 */

import { Env } from "@/env";
import { createAppRealtime } from "@/services/api/realtime";

export const coreRealtime = createAppRealtime(Env.VITE_API_URL);
