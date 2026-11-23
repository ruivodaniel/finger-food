/**
 * Mount types — the options an app supplies and the surface it receives.
 */

import type { Hono } from "hono";
import type { Ac, GatedDbFactory, SchemaTables } from "@libs/gated-scoped-ac";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { MeteorService } from "./services/meteor.service";
import type { MinesweeperService } from "./services/minesweeper.service";
import type { MeteorCredits } from "./shared/credits-port";
import type { MeteorLiveDocument } from "./shared/meteor-live-document";
import type { ModuleErrors, ModuleLogger } from "./shared/module-errors";
import type { ImplementationPatternsEnv } from "./types";

export interface MountImplementationPatternsApiOptions {
  /** Id factory for rows. */
  createId: () => string;
  /** The app's scoped-AC engine, config-bound; the slice only calls it. */
  engine: Ac;
  /** The app's gated-db factory: bag -> a bag-bound handle, for every gated
   * read and write. A create binds one to a bag that carries the request body,
   * so a payload rule can read it. Its `ungated()` is the db the reads no rule
   * covers run on (the public door, a page): the slice's tables flow in via
   * ./models. */
  gatedDb: GatedDbFactory<SchemaTables, NodePgDatabase<Record<string, unknown>>> & {
    /** The ungated db, writing on behalf of a user: where a live meteor's checkpoint, which has no request behind it, is
     * stored. */
    ungatedAs(userId: string): NodePgDatabase<Record<string, unknown>>;
  };
  /** Whether a meteor is locked: a locked meteor isn't changed, published or deleted (409). The app's locks answer. */
  isLocked: (meteorId: string) => Promise<boolean>;
  /** Creating a meteor spends these; without it meteors are free. */
  credits?: MeteorCredits;
  errors: ModuleErrors;
  logger: ModuleLogger;
}

export interface MountImplementationPatternsApiResult {
  /** Mount inside the app's /api/client router, behind its session + scoped-AC chain. */
  router: Hono<ImplementationPatternsEnv>;
  /** Server-side handles for non-HTTP callers. */
  services: { meteor: MeteorService; minesweeper: MinesweeperService };
  /** A meteor as a document edited live: what the app registers as the collaborative kind "meteor". */
  live: MeteorLiveDocument;
}
