export const config = {
  jwtSecret: process.env.JWT_SECRET || "your-secret-key",
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "",
};
