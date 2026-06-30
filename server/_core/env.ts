export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
};

// Session tokens are signed with cookieSecret (HS256). An empty/weak secret on a
// public deployment lets anyone forge a valid session and impersonate any user.
// Fail fast in production; warn loudly in development.
const MIN_SECRET_LENGTH = 32;
if (ENV.cookieSecret.length < MIN_SECRET_LENGTH) {
  const message =
    "JWT_SECRET is missing or shorter than " +
    MIN_SECRET_LENGTH +
    " characters. Session tokens cannot be signed securely.";
  if (ENV.isProduction) {
    throw new Error("[Security] " + message + " Refusing to start.");
  } else {
    console.warn("[Security] " + message + " Set a strong JWT_SECRET before deploying.");
  }
}
