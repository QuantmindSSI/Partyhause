// server/apply-ddl.cjs — one-shot, idempotent schema convergence runner.
//
// WHY THIS EXISTS
//   `prisma db push` cannot run inside the production container (the prisma
//   CLI is not shipped in the runtime image and npx-installing it gets the
//   process OOM-killed), and the Postgres Flexible Server firewall blocks
//   arbitrary developer machines. This script uses the SAME driver the app
//   already ships (pg) and the SAME connection (DATABASE_URL env), so it can
//   be executed inside the running container with a quote-free command:
//
//     az containerapp exec -n <api-app> -g <rg> --command "node server/apply-ddl.cjs"
//
// WHAT IT APPLIES (all idempotent)
//   1. The email-verification columns + unique index on users (matches
//      prisma/schema.prisma exactly; additive, safe on live data).
//   2. server/sql/azure-pg-functions.sql — business-rule functions/triggers
//      (CREATE OR REPLACE + DROP TRIGGER IF EXISTS throughout), including
//      the convert_guest_to_crew and update_event_cost_summary fixes.

'use strict';

const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const DDL = [
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token text',
  'ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires timestamp(3) without time zone',
  'CREATE UNIQUE INDEX IF NOT EXISTS users_verification_token_key ON users(verification_token)',
];

function buildClientConfig() {
  // Prefer discrete POSTGRES_* parts: the Bicep-built DATABASE_URL embeds
  // the raw admin password without URL-encoding, which pg's URL parser
  // rejects ("Invalid URL") whenever the password contains reserved
  // characters. Discrete fields involve no URL parsing at all.
  if (process.env.POSTGRES_HOST) {
    return {
      host: process.env.POSTGRES_HOST,
      port: Number.parseInt(process.env.POSTGRES_PORT || '5432', 10),
      user: process.env.POSTGRES_USER || 'partyadmin',
      password: process.env.POSTGRES_PASSWORD || '',
      database: process.env.POSTGRES_DB || 'partyhause',
      ssl: { rejectUnauthorized: false },
    };
  }
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  return null;
}

async function main() {
  const config = buildClientConfig();
  if (!config) {
    console.error('APPLY_DDL_FAIL: neither POSTGRES_HOST nor DATABASE_URL is set');
    process.exit(1);
  }

  const client = new Client(config);
  await client.connect();
  try {
    for (const sql of DDL) {
      await client.query(sql);
      console.log('DDL_OK:', sql.slice(0, 70));
    }

    const functionsPath = path.join(__dirname, 'sql', 'azure-pg-functions.sql');
    if (fs.existsSync(functionsPath)) {
      const functionsSql = fs.readFileSync(functionsPath, 'utf8');
      await client.query(functionsSql);
      console.log('FUNCTIONS_OK: azure-pg-functions.sql applied');
    } else {
      console.log('FUNCTIONS_SKIP: server/sql/azure-pg-functions.sql not present');
    }

    const check = await client.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND (column_name LIKE 'verification%' OR column_name='email_verified') ORDER BY column_name",
    );
    console.log('VERIFY_COLS:', check.rows.map((r) => r.column_name).join(','));

    if (check.rows.length !== 3) {
      console.error('APPLY_DDL_FAIL: expected 3 columns, found', check.rows.length);
      process.exit(1);
    }
    console.log('APPLY_DDL_DONE');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('APPLY_DDL_FAIL:', err.message);
  process.exit(1);
});
