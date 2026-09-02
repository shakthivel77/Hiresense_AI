# Hiresense_AI — Database Baseline

This directory manages database schema migrations, seed data, and PostgreSQL documentation for Supabase.

## Directories

- `migrations/` — Version-controlled SQL migration scripts (e.g. `001_initial_schema.sql`).
- `seeds/` — Initial seed datasets for roadmaps, domains, sample assessment question pools, and resource metadata.

## Rules

- PostgreSQL database managed through Supabase is the application's authoritative source of truth.
- Database credentials and service-role secrets MUST NEVER be exposed to the browser.
- All migrations must be idempotent or version-controlled.
