/**
 * mountImplementationPatternsApi — the slice's single assembly point: repositories → services →
 * one router from the app's inputs. Two patterns live here: the meteors and the minesweeper. The app mounts what it receives.
 */

import { DrizzleMeteorRepository } from "./repositories/meteor.repository";
import { MeteorService } from "./services/meteor.service";
import { Hono } from "hono";
import { InMemoryBoardRepository } from "./repositories/board.repository";
import { createMeteorRouter } from "./routes/create-meteor-router";
import { createMinesweeperRouter } from "./routes/create-minesweeper-router";
import { MinesweeperService } from "./services/minesweeper.service";
import type { ImplementationPatternsEnv } from "./types";
import type { MountImplementationPatternsApiOptions, MountImplementationPatternsApiResult } from "./mount-types";
import { createMeteorLiveDocument } from "./shared/meteor-live-document";

export function mountImplementationPatternsApi(options: MountImplementationPatternsApiOptions): MountImplementationPatternsApiResult {
  const meteorRepo = new DrizzleMeteorRepository({ db: options.gatedDb.ungated() });
  const meteorService = new MeteorService({
    meteorRepo,
    engine: options.engine,
    gatedDb: options.gatedDb,
    isLocked: options.isLocked,
    writeAs: (userId) => options.gatedDb.ungatedAs(userId),
    createId: options.createId,
    credits: options.credits,
    errors: options.errors,
    logger: options.logger,
  });
  // the minesweeper stores nothing: its boards live in this process's memory
  const minesweeperService = new MinesweeperService({ boards: new InMemoryBoardRepository(), createId: options.createId, errors: options.errors });
  const router = new Hono<ImplementationPatternsEnv>()
    .route("/", createMeteorRouter({ meteorService, errors: options.errors }))
    .route("/", createMinesweeperRouter({ minesweeperService }));
  return { router, services: { meteor: meteorService, minesweeper: minesweeperService }, live: createMeteorLiveDocument(meteorService) };
}
