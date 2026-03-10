import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { createGeneration, getGenerationWithSteps, getUserGenerations } from "./db";
import { runGenerationPipeline, STEPS } from "./skillEngine";
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

    /** Get step definitions */
    steps: publicProcedure.query(() => STEPS),
  }),
});

export type AppRouter = typeof appRouter;
