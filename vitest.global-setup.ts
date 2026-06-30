import "dotenv/config";
import { spawnSync } from "node:child_process";
import mysql from "mysql2/promise";

/** Derive an isolated test database URL by suffixing the schema name with _test. */
export function toTestDatabaseUrl(url: string): string {
  const u = new URL(url);
  const dbName = u.pathname.replace(/^\//, "") || "skillforge";
  if (dbName.endsWith("_test")) return url;
  u.pathname = "/" + dbName + "_test";
  return u.toString();
}

/**
 * Vitest global setup: create the isolated test database (if missing) and push
 * the current Drizzle schema into it, so the suite never touches the dev DB.
 */
export default async function setup() {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    console.warn("[test] DATABASE_URL not set — skipping test DB provisioning");
    return;
  }

  const testUrl = toTestDatabaseUrl(baseUrl);
  const testDbName = new URL(testUrl).pathname.replace(/^\//, "");

  // Create the test schema using a server-level connection (no db selected).
  const admin = new URL(baseUrl);
  admin.pathname = "/";
  const conn = await mysql.createConnection(admin.toString());
  await conn.query("CREATE DATABASE IF NOT EXISTS \`" + testDbName + "\` CHARACTER SET utf8mb4");
  await conn.end();

  // Push the schema into the test DB via drizzle-kit (reads DATABASE_URL).
  const res = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["drizzle-kit", "push", "--force"],
    { env: { ...process.env, DATABASE_URL: testUrl }, encoding: "utf8", shell: true }
  );
  if (res.status !== 0) {
    throw new Error("drizzle-kit push failed for test DB:\n" + (res.stderr || res.stdout));
  }
}
