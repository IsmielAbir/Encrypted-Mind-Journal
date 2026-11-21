# Encrypted Mind Journal

A full-stack journaling app built with Next.js and Prisma/SQLite. Users can register, write journal entries (optionally encrypted client-side), keep quick notes, and get short reflections on an entry from a AI model.

## Features

- Email/password auth with signed, HTTP-only session cookies (`src/lib/session.ts`)
- Journal entries with optional per-entry encryption (passphrase never stored)
- Quick notes
- AI-assisted advice on a journal entry.
- User profile (display name, avatar emoji, bio, preferred support style)

## Project structure

- `src/app` — routes (App Router): `login`, `register`, `dashboard`, `journal`, `notes`, `profile`, `advice`, and `api/*` route handlers
- `src/lib` — auth/session, Prisma client (Cloudflare D1 via `@prisma/adapter-d1`), AI
- `src/components` — shared UI (nav bar, advice box, etc.)
- `prisma/schema.prisma` — data model (User, Entry, Note)

## Deployment

Live on Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare), with Prisma reading/writing a Cloudflare D1 database (`wrangler.jsonc`) instead of a local SQLite file. Build command: `npx opennextjs-cloudflare build`. Deploy command: `npx wrangler deploy`.