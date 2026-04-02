import { describe, it, expect } from "vitest";
import { vi } from "vitest";
import { createGeneration, getGenerationWithSteps } from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `test${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("skill.quickRegenerate", () => {
  it("should create new generation with same parameters from existing generation", async () => {
    const userId = 1;
    const { ctx } = createAuthContext(userId);
    const caller = appRouter.createCaller(ctx);

    // Create original generation
    const originalGenId = await createGeneration({
      userId,
      skillName: "Test Skill",
      domain: "Testing",
      features: "Feature 1, Feature 2",
      scenarios: "Scenario 1",
      extraNotes: "Some notes",
    });

    expect(originalGenId).toBeGreaterThan(0);

    // Get the original generation
    const originalGen = await getGenerationWithSteps(originalGenId);
    expect(originalGen).toBeDefined();
    expect(originalGen?.skillName).toBe("Test Skill");
    expect(originalGen?.domain).toBe("Testing");
    expect(originalGen?.features).toBe("Feature 1, Feature 2");
    expect(originalGen?.scenarios).toBe("Scenario 1");
    expect(originalGen?.extraNotes).toBe("Some notes");

    // Call quickRegenerate
    const result = await caller.skill.quickRegenerate({ id: originalGenId });
    expect(result.id).toBeGreaterThan(0);
    expect(result.id).not.toBe(originalGenId);

    // Verify new generation has same parameters
    const newGen = await getGenerationWithSteps(result.id);
    expect(newGen).toBeDefined();
    expect(newGen?.skillName).toBe(originalGen?.skillName);
    expect(newGen?.domain).toBe(originalGen?.domain);
    expect(newGen?.features).toBe(originalGen?.features);
    expect(newGen?.scenarios).toBe(originalGen?.scenarios);
    expect(newGen?.extraNotes).toBe(originalGen?.extraNotes);
    expect(newGen?.userId).toBe(userId);
  });

  it("should reject quickRegenerate for non-existent generation", async () => {
    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.skill.quickRegenerate({ id: 99999 })
    ).rejects.toThrow("not found");
  });

  it("should reject quickRegenerate for other user's generation", async () => {
    // Create generation for user 1
    const genId = await createGeneration({
      userId: 1,
      skillName: "User 1 Skill",
      domain: "Testing",
      features: "Feature 1",
    });

    // Try to regenerate as user 2
    const { ctx } = createAuthContext(2);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.skill.quickRegenerate({ id: genId })
    ).rejects.toThrow("not found");
  });

  it("requires authentication", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {
        clearCookie: vi.fn(),
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.skill.quickRegenerate({ id: 1 })
    ).rejects.toThrow();
  });
});
