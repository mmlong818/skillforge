// Load environment variables from .env so tests that touch the DB or auth
// pick up DATABASE_URL / JWT_SECRET, matching how the server runs.
import "dotenv/config";
import { toTestDatabaseUrl } from "./vitest.global-setup";

// Never run tests against the real dev database — redirect to an isolated
// <db>_test schema (created/migrated by global setup) so test rows don't
// pollute the app's History.
if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = toTestDatabaseUrl(process.env.DATABASE_URL);
}

// Tests exercise the pipeline's bookkeeping (ids, steps, cancel/delete), not
// LLM output. Disable every LLM provider so the background pipeline fails fast
// instead of calling the real Claude CLI / API — keeps tests quick, offline,
// and free of quota usage.
delete process.env.CLAUDE_CLI;
delete process.env.ANTHROPIC_API_KEY;
delete process.env.BUILT_IN_FORGE_API_KEY;
delete process.env.BUILT_IN_FORGE_API_URL;
