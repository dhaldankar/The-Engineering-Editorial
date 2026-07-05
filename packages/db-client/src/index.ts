import { drizzle as drizzleProxy } from "drizzle-orm/postgres-js";
import { drizzle as drizzleDataApi } from "drizzle-orm/aws-data-api/pg";
import { RDSDataClient } from "@aws-sdk/client-rds-data";
import postgres from "postgres";
import * as schema from "./schema";

export type DbConfig =
  | { mode: "proxy"; connectionString: string }
  | { mode: "data-api"; secretArn: string; resourceArn: string; database: string; region: string };

export function createDbClient(config: DbConfig) {
  if (config.mode === "proxy") {
    const client = postgres(config.connectionString, { max: 10 });
    return drizzleProxy(client, { schema });
  } else if (config.mode === "data-api") {
    const client = new RDSDataClient({ region: config.region });
    return drizzleDataApi(client, {
      schema,
      secretArn: config.secretArn,
      resourceArn: config.resourceArn,
      database: config.database,
    });
  }
  throw new Error("Invalid DbConfig mode");
}

export * from "./schema";
export * from "./tenancy";
