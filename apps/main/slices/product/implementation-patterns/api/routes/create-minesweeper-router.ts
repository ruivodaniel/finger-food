/**
 * Minesweeper router factory. Public: a test needs no session.
 *   POST /implementation-patterns/minesweeper/boards                    a new board (201)
 *   GET  /implementation-patterns/minesweeper/boards/:boardId           the board and every cell that is not hidden
 *   POST /implementation-patterns/minesweeper/boards/:boardId/clicks    a click; answers with what changed
 */

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { BOARD_SIZES } from "../../shared/minesweeper.types";
import type { MinesweeperService } from "../services/minesweeper.service";
import type { ImplementationPatternsEnv } from "../types";

const CreateBoardSchema = z.object({ size: z.union(BOARD_SIZES.map((s) => z.literal(s))) });
const ClickSchema = z.object({ i: z.number().int().min(0), action: z.enum(["reveal", "flag"]) });

export function createMinesweeperRouter({ minesweeperService }: { minesweeperService: MinesweeperService }): Hono<ImplementationPatternsEnv> {
  const router = new Hono<ImplementationPatternsEnv>();

  router.post("/implementation-patterns/minesweeper/boards", zValidator("json", CreateBoardSchema), (c) => {
    return c.json(minesweeperService.create(c.req.valid("json").size), 201);
  });

  router.get("/implementation-patterns/minesweeper/boards/:boardId", (c) => {
    return c.json(minesweeperService.get(c.req.param("boardId")));
  });

  router.post("/implementation-patterns/minesweeper/boards/:boardId/clicks", zValidator("json", ClickSchema), (c) => {
    return c.json(minesweeperService.click(c.req.param("boardId"), c.req.valid("json")));
  });

  return router;
}
