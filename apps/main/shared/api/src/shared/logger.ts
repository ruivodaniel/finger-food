// pino
import { pino } from "pino";
import { Env } from "@/env";

export const logger = pino({
  level: Env.LOG_LEVEL ?? "info",
  ...(Env.LOG_FORMAT === "pretty"
    ? { transport: { target: "pino-pretty" } }
    : {}),
});
