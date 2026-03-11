import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createGeneration, getGenerationWithSteps, getUserGenerations } from "./db";
import { runGenerationPipeline, resumeGenerationPipeline, cancelGeneration, deleteGeneration, STEPS } from "./skillEngine";
import { runFixPipeline, cancelFixPipeline, FIX_STEPS } from "./fixEngine";
import { z } from "zod";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  skill: router({
    /** Create a new generation and start the pipeline */
    generate: protectedProcedure
      .input(z.object({
        skillName: z.string().min(1).max(256),
        domain: z.string().min(1).max(256),
        features: z.string().min(1),
        scenarios: z.string().optional(),
        extraNotes: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const genId = await createGeneration({
          userId: ctx.user.id,
          skillName: input.skillName,
          domain: input.domain,
          features: input.features,
          scenarios: input.scenarios || null,
          extraNotes: input.extraNotes || null,
        });
        // Run pipeline in background (don't await)
        runGenerationPipeline(genId).catch(err => {
          console.error(`[SkillEngine] Pipeline failed for generation ${genId}:`, err);
        });
        return { id: genId };
      }),

    /** Get generation status with all steps */
    getStatus: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        const gen = await getGenerationWithSteps(input.id);
        if (!gen || gen.userId !== ctx.user.id) return null;
        return gen;
      }),

    /** List user's generation history */
    history: protectedProcedure.query(async ({ ctx }) => {
      return getUserGenerations(ctx.user.id);
    }),

    /** Resume a failed generation from the last failed step */
    resume: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const gen = await getGenerationWithSteps(input.id);
        if (!gen || gen.userId !== ctx.user.id) {
          throw new Error("Generation not found");
        }
        if (gen.status !== "failed" && gen.status !== "completed" && gen.status !== "cancelled") {
          throw new Error("Can only resume failed, completed, or cancelled generations");
        }
        // Run resume in background
        resumeGenerationPipeline(input.id).catch(err => {
          console.error(`[SkillEngine] Resume failed for generation ${input.id}:`, err);
        });
        return { id: input.id };
      }),

    /** Cancel a running generation */
    cancel: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const gen = await getGenerationWithSteps(input.id);
        if (!gen || gen.userId !== ctx.user.id) {
          throw new Error("Generation not found");
        }
        if (gen.status !== "running" && gen.status !== "pending") {
          throw new Error("Can only cancel running or pending generations");
        }
        await cancelGeneration(input.id);
        return { success: true };
      }),

    /** Delete a generation and all its steps */
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const gen = await getGenerationWithSteps(input.id);
        if (!gen || gen.userId !== ctx.user.id) {
          throw new Error("Generation not found");
        }
        await deleteGeneration(input.id);
        return { success: true };
      }),

    /** Get step definitions */
    steps: publicProcedure.query(() => STEPS),

    /** Create a fix generation and start the fix pipeline */
    fix: protectedProcedure
      .input(z.object({
        skillName: z.string().min(1).max(256),
        domain: z.string().min(1).max(256),
        features: z.string().min(1),
        scenarios: z.string().optional(),
        extraNotes: z.string().optional(),
        originalSkillMd: z.string().min(10),
      }))
      .mutation(async ({ ctx, input }) => {
        const genId = await createGeneration({
          userId: ctx.user.id,
          mode: "fix",
          skillName: input.skillName,
          domain: input.domain,
          features: input.features,
          scenarios: input.scenarios || null,
          extraNotes: input.extraNotes || null,
          originalSkillMd: input.originalSkillMd,
        });
        // Run fix pipeline in background
        runFixPipeline(genId).catch(err => {
          console.error(`[FixEngine] Pipeline failed for generation ${genId}:`, err);
        });
        return { id: genId };
      }),

    /** Get fix step definitions */
    fixSteps: publicProcedure.query(() => FIX_STEPS),
  }),
});

export type AppRouter = typeof appRouter;
