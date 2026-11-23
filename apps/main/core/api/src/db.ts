// pg pool + drizzle client (schema from models/index). Once-only init at src/
// root (SCF10). Only repos and mounts import it.
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { Env } from "@/env";
import * as schema from "@/models";

const pool = new Pool({ connectionString: Env.DATABASE_URL });

export const db = drizzle(pool, { schema });

/** Ends the pool (scripts/seeds). The pool itself stays private. */
export const closeDb = () => pool.end();
