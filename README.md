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

## Deployment (Cloudflare Workers)

This app deploys to Cloudflare Workers via [OpenNext](https://opennext.js.org/cloudflare), with Prisma talking to a Cloudflare D1 database instead of a local SQLite file.

One-time setup, from this project's directory, logged into the right Cloudflare account:

```bash
npx wrangler login
npx wrangler d1 create encrypted-mind-journal
# copy the printed database_id into wrangler.jsonc's d1_databases[0].database_id
npx wrangler d1 migrations apply encrypted-mind-journal --remote
npx wrangler secret put SESSION_SECRET
```

Then connect the GitHub repo in the Cloudflare dashboard (Workers & Pages → Create → Workers → connect to Git), and make sure the project's **Build command** is:

```
npx opennextjs-cloudflare build
```

(not the default `npm run build` — that only runs plain `next build`, which doesn't produce the Worker bundle.) The **Deploy command** stays `npx wrangler deploy`.

Local scripts:

- `npm run dev` — regular Next.js dev server
- `npm run preview` — build + run the Workers bundle locally via Wrangler
- `npm run deploy` — build + deploy straight from the CLI (alternative to Git-based deploys)
- `npm run cf-typegen` — regenerate `cloudflare-env.d.ts` after changing `wrangler.jsonc` bindings

Note: `@opennextjs/aws`'s bundler relies on filesystem symlinks, which plain Windows blocks unless Developer Mode is enabled — building locally on Windows may fail at the bundling step even though `next build`/type-checking succeed. Cloudflare's own build infrastructure (Linux) is unaffected.
