AGENTS.md — LeadFlow AI

## Project
Multi-tenant SaaS for small agencies: lead management + AI assistant. Built in phases.

## Stack (do not change without asking)
Next.js App Router + TypeScript strict + Tailwind + shadcn/ui · PostgreSQL (Neon) + Prisma ·
Auth.js v5 (Phase 1) · Zod · Groq API server-side only (Phase 4) · Recharts · dnd-kit · Vercel.

## Hard rules
- TENANCY: every DB query MUST be scoped by organizationId. Every server action must call
  requireAuth() first. Never derive tenant or user identity from client input.
- VALIDATION: every mutating server action validates input with Zod before touching the DB.
- SECRETS: env vars only, server-side only. Never log secrets. Never use NEXT_PUBLIC_ for keys.
- AI: server actions only. Treat model output as untrusted — re-validate with Zod. Output null
  for anything not explicitly stated in the inquiry. Nothing is ever sent automatically.
- UX STATES: every async surface gets loading, empty, error, and success states.
- SCOPE: build ONLY the current phase. No extra features, pages, or dependencies.
- CODE: TypeScript strict, no any, no dead code, no TODO stubs. Server components by default.
- GIT: small, descriptive commits per logical unit. Never commit .env.

## Current phase
Phase 0 — Foundation (scaffold, schema, health check, deploy-ready).
