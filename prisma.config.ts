// Prisma 7 configuration file.
// In Prisma 7, the database connection URL is no longer specified in the
// schema's datasource block. Instead, it is configured here and passed via
// the DATABASE_URL environment variable.
//
// See: https://pris.ly/d/prisma7-client-config

import { defineConfig } from "@prisma/config";

export default defineConfig({
  // Path to the Prisma schema file
  schema: "./prisma/schema.prisma",

  // Datasource URL for Migrate and introspection commands.
  // The DATABASE_URL env var must be set, e.g.:
  //   postgresql://user:password@host:5432/dbname
  // We use process.env directly (rather than the env() helper) so that
  // `prisma validate` works without a DATABASE_URL being set.
  datasource: {
    url: process.env.DATABASE_URL ?? "",
  },

  // Migrations configuration
  migrations: {
    path: "./prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
});
