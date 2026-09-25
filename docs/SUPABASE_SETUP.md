# Supabase Database Setup

QRE uses Prisma against Postgres. Supabase should be configured as the Postgres database behind Prisma, not as a browser Supabase SDK.

## Required Environment

Set these in `apps/api/.env` for the running API and in `packages/db/.env` for Prisma commands:

```env
SUPABASE_DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres?sslmode=require"
```

`SUPABASE_DATABASE_URL` is normalized to `DATABASE_URL` by `@qre/db`. If `SUPABASE_DATABASE_URL` is not set, the existing `DATABASE_URL` fallback is used.

Use the pooled URL for application traffic and the direct URL for Prisma migrations. The exact Supabase region host may differ for your project.

## Commands

```powershell
pnpm --filter @qre/db prisma:validate
pnpm --filter @qre/db prisma:status
pnpm --filter @qre/db prisma:deploy
pnpm --filter @qre/api build
```

For a brand-new empty Supabase database, `prisma:deploy` should apply the migration history.

For an existing non-empty Supabase database, do not run deploy blindly. Baseline or reconcile it first with Prisma migration tooling so Prisma does not attempt to recreate existing tables.
