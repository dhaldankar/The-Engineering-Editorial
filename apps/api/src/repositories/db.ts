import { createDbClient, DbConfig } from "@engineering-editorial/db-client";
import { env } from "../config/env.js";

const dbConfig: DbConfig = {
  mode: "proxy",
  connectionString: env.DATABASE_URL,
};

export const db = createDbClient(dbConfig);
