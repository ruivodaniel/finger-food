import { Env } from "@/env";
import { faro, getWebInstrumentations, initializeFaro, type Faro, type TransportItem } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";
import { scrubTelemetryValue } from "./scrub";

let initialized = false;

export function initFaro(): Faro | null {
  if (initialized || !Env.VITE_OBSERVABILITY_ENABLED || !Env.VITE_FARO_URL) return null;

  initialized = true;

  const apiOrigin = new URL(Env.VITE_API_URL).origin;

  return initializeFaro({
    url: Env.VITE_FARO_URL,
    app: {
      name: Env.VITE_APP_NAME,
      version: Env.VITE_APP_VERSION,
      environment: Env.VITE_APP_ENVIRONMENT,
    },
    instrumentations: [
      ...getWebInstrumentations({ captureConsole: false }),
      new TracingInstrumentation({
        instrumentationOptions: {
          propagateTraceHeaderCorsUrls: [
            new RegExp(`^${apiOrigin.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`),
          ],
        },
      }),
    ],
    beforeSend: (item: TransportItem) => scrubTelemetryValue(item) as TransportItem,
    sessionTracking: {
      enabled: true,
      persistent: false,
      samplingRate: Env.VITE_FARO_SESSION_SAMPLE_RATE,
    },
  });
}

export function captureFrontendError(error: Error): void {
  if (!initialized) return;
  faro.api.pushError(error);
}
