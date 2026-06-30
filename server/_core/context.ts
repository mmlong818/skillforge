import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

const LOCAL_DEV_USER: User = {
  id: 1,
  openId: "local-dev",
  name: "Local Dev",
  email: "dev@local",
  loginMethod: "local",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // LOCAL_DEV grants an unauthenticated admin session — only ever honor it
  // outside production, so a stray LOCAL_DEV=true can never become a backdoor
  // on a real deployment.
  if (process.env.LOCAL_DEV === "true") {
    if (process.env.NODE_ENV === "production") {
      console.warn("[Security] LOCAL_DEV=true ignored in production; enforcing real authentication.");
    } else {
      return { req: opts.req, res: opts.res, user: LOCAL_DEV_USER };
    }
  }

  let user: User | null = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    user = null;
  }

  return { req: opts.req, res: opts.res, user };
}
