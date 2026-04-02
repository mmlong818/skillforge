import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: "test-user-open-id",
    email: "test@example.com",
    name: "Test User",
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

function createPublicContext(): { ctx: TrpcContext } {
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

  return { ctx };
}

describe("skill.steps", () => {
  it("returns the 7 step definitions", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const steps = await caller.skill.steps();

    expect(steps).toHaveLength(7);
    expect(steps[0]).toMatchObject({ number: 1, name: "需求深度挖掘" });
    expect(steps[6]).toMatchObject({ number: 7, name: "最终组装与交付" });
  });
});

describe("skill.generate", () => {
  it("requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.skill.generate({
        skillName: "test-skill",
        domain: "测试领域",
        features: "测试功能",
      })
    ).rejects.toThrow();
  });

  it("validates input - skillName required", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.skill.generate({
        skillName: "",
        domain: "测试领域",
        features: "测试功能",
      })
    ).rejects.toThrow();
  });

  it("validates input - domain required", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.skill.generate({
        skillName: "test-skill",
        domain: "",
        features: "测试功能",
      })
    ).rejects.toThrow();
  });

  it("validates input - features required", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.skill.generate({
        skillName: "test-skill",
        domain: "测试领域",
        features: "",
      })
    ).rejects.toThrow();
  });

  it("creates a generation and returns an id", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.skill.generate({
      skillName: "test-skill",
      domain: "测试领域",
      features: "核心功能描述",
      scenarios: "使用场景",
      extraNotes: "补充说明",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
    expect(result.id).toBeGreaterThan(0);
  });
});

describe("skill.history", () => {
  it("requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.skill.history()).rejects.toThrow();
  });

  it("returns an array for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const history = await caller.skill.history();
    expect(Array.isArray(history)).toBe(true);
  });
});

describe("skill.getStatus", () => {
  it("requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.skill.getStatus({ id: 1 })).rejects.toThrow();
  });

  it("returns null for non-existent generation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.skill.getStatus({ id: 999999 });
    expect(result).toBeNull();
  });

  it("returns generation with steps after creation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a generation first
    const { id } = await caller.skill.generate({
      skillName: "status-test-skill",
      domain: "测试",
      features: "测试功能",
    });

    // Wait a bit for the background process to create step records
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const status = await caller.skill.getStatus({ id });
    expect(status).not.toBeNull();
    expect(status!.skillName).toBe("status-test-skill");
    expect(status!.steps).toBeDefined();
    expect(status!.steps.length).toBe(7);
  });
});

describe("skill.cancel", () => {
  it("requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.skill.cancel({ id: 1 })).rejects.toThrow();
  });

  it("rejects cancelling non-existent generation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.skill.cancel({ id: 999999 })).rejects.toThrow("Generation not found");
  });

  it("cancels a running generation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a generation (it starts running in background)
    const { id } = await caller.skill.generate({
      skillName: "cancel-test-skill",
      domain: "测试",
      features: "测试功能",
    });

    // Wait for it to start running
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const result = await caller.skill.cancel({ id });
    expect(result).toEqual({ success: true });

    // Verify it's cancelled
    const status = await caller.skill.getStatus({ id });
    expect(status?.status).toBe("cancelled");
  });
});

describe("skill.delete", () => {
  it("requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.skill.delete({ id: 1 })).rejects.toThrow();
  });

  it("rejects deleting non-existent generation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.skill.delete({ id: 999999 })).rejects.toThrow("Generation not found");
  });

  it("deletes a generation and its steps", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a generation
    const { id } = await caller.skill.generate({
      skillName: "delete-test-skill",
      domain: "测试",
      features: "测试功能",
    });

    // Wait for background process to create steps
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Delete it
    const result = await caller.skill.delete({ id });
    expect(result).toEqual({ success: true });

    // Verify it's gone
    const status = await caller.skill.getStatus({ id });
    expect(status).toBeNull();
  });
});
