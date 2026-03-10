import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, customType } from "drizzle-orm/mysql-core";

/** Custom mediumtext type for large content (up to 16MB) */
const mediumtext = customType<{ data: string; driverData: string }>({
  dataType() {
    return "mediumtext";
  },
});

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/** Skill generation tasks */
export const skillGenerations = mysqlTable("skill_generations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** User input fields */
  skillName: varchar("skillName", { length: 256 }).notNull(),
  domain: varchar("domain", { length: 256 }).notNull(),
  features: text("features").notNull(),
  scenarios: text("scenarios"),
  extraNotes: text("extraNotes"),
  /** Generation status */
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  currentStep: int("currentStep").default(0).notNull(),
  /** Final assembled result (JSON: { files: [{path, content}] }) */
  result: json("result"),
  errorMessage: mediumtext("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type SkillGeneration = typeof skillGenerations.$inferSelect;
export type InsertSkillGeneration = typeof skillGenerations.$inferInsert;

/** Individual step outputs within a generation */
export const generationSteps = mysqlTable("generation_steps", {
  id: int("id").autoincrement().primaryKey(),
  generationId: int("generationId").notNull(),
  stepNumber: int("stepNumber").notNull(),
  stepName: varchar("stepName", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["pending", "running", "completed", "failed"]).default("pending").notNull(),
  /** LLM output for this step */
  output: mediumtext("output"),
  /** Brief summary of the output */
  summary: varchar("summary", { length: 512 }),
  errorMessage: mediumtext("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GenerationStep = typeof generationSteps.$inferSelect;
export type InsertGenerationStep = typeof generationSteps.$inferInsert;