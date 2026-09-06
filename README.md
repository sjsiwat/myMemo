# Little Johny (Memo+)

> A personal digital workspace — tasks, notes, expenses, calendar, and daily review in one place, with a LINE secretary in your pocket.

**Live:** [memo.siwat.me](https://memo.siwat.me) &nbsp;|&nbsp; **Stack:** React · Vite · Tailwind · Supabase · LINE Login · Cloudflare Workers

---

## What it is

Little Johny started as a local-only productivity PWA and has grown into a **LINE-first personal workspace**. Sign in with your LINE account, and your tasks, notes, and expenses sync to the cloud (Supabase) — usable from the web app or by chatting with the LINE bot. No email/password to remember; your LINE account *is* your account.

- **Guest mode** — try everything instantly; data is ephemeral (not persisted)
- **Logged in (LINE)** — LocalStorage for instant writes + debounced sync to Supabase

---

## Features

| Module | Highlights |
|---|---|
| **Dashboard** | Task summary, recent notes, expense overview, quick actions |
| **Tasks** | **Kanban** board (todo / in progress / review / done) · Priority · Due dates · Labels · Drag-and-drop |
| **Notes** | Freeform notes with tags — create, edit, and sync from web or LINE |
| **Calendar** | Month view of tasks and due dates |
| **Review** | Daily / weekly summaries — tasks done, overdue, notes, spending |
| **Expenses** | Categorized spending records with summaries |
| **Johny Buddy** 🐱 | Animated mascot — one looping cat; the speech bubble reacts to time of day, typing, and sync status, and it settles to a still frame when asleep or when `prefers-reduced-motion` is set |
| **Cloud Sync** | Supabase-backed, offline-first with sync status indicator, safe deletes, empty-state wipe protection |
| **PWA** | Installable, offline cache via service worker, custom icons + manifest |
| **UI** | Warm neutral surfaces, one muted purple accent, light + dark from a single token set (see `src/styles/globals.css`) · Quick-action chips under the capture box · Fully responsive |

---

## Architecture

```
                    ┌─────────────────────────────┐
                    │   memo.siwat.me             │
                    │   Cloudflare Worker         │
                    │  (server/worker.js + assets)│
                    └──────┬──────────────┬───────┘
                           │              │
              /api/auth/line-callback   everything else
                           │              │
                     LINE Login      React SPA (web_dist/)
                     OAuth 2.1       landing + workspace
                           │         routes in one bundle
                           ▼              │
                    ┌─────────────┐       │ anon key + RLS
                    │  Supabase   │◄──────┘
                    │ Auth + DB   │
                    └──────▲──────┘
                           │ service role key
                    ┌──────┴──────┐
                    │ LINE Bot    │  (separate repo: johny-line-bot)
                    │ CF Worker   │
                    └─────────────┘
```

### Auth flow (LINE Login)

```
1. User clicks "Login with LINE" → redirected to LINE OAuth
2. LINE redirects back to /api/auth/line-callback (Cloudflare Worker)
3. Worker exchanges code → LINE profile → finds/creates Supabase user
   (deterministic email: line_<userId>@memo.internal)
4. Worker generates a Supabase magic link → browser lands back signed in
```

### Storage layer (`src/lib/storage.js`)

- **Guest:** ephemeral — nothing persisted
- **Logged in:** every save writes LocalStorage immediately, then syncs to Supabase after a 1.5s debounce
- Deletes hit Supabase immediately (no lost deletions on refresh)
- Demo/display-only items are stripped before syncing
- Never wipes cloud data when local state is empty (safety guard)

### Data model (Supabase)

| Table | Columns (key ones) |
|---|---|
| `tasks` | title, priority, due, status, labels, target_value / target_unit / progress_value |
| `notes` | title, body, tags |
| `expenses` | title, amount, category, date |
| `line_users` | line_user_id ↔ user_id mapping, display_name, picture_url, **plan** (`free` / `pro`) |

All tables protected by RLS (web) and filtered by `user_id` (bot, service role). Migrations live in `supabase/migrations/`.

---

## Project Structure

One app, one `package.json`, one build. The landing page and the workspace are
routes in the same React Router tree.

```
little-johny/
├── index.html               # Vite entry — fonts, PWA meta, #root
├── src/
│   ├── main.jsx             # React root + service worker registration
│   ├── App.jsx              # Routes; the app half is lazy-loaded
│   ├── routes/
│   │   ├── landing/         # /  /about  /signup   + LandingLayout
│   │   ├── app/             # /dashboard /tasks /notes /expenses /calendar /review
│   │   │                    #   + AppLayout (auth gate, sidebar, topbar)
│   │   └── NotFound.jsx
│   ├── components/
│   │   ├── landing/         # hero, nav, capabilities, process, footer, …
│   │   ├── shared/          # Sidebar, Topbar, Modal, Toast, QuickActions, Mascot, AuthGate
│   │   └── tasks|notes|expenses|calendar|dashboard|review/
│   ├── lib/                 # store (zustand), storage, auth, actions, format, …
│   └── styles/globals.css   # Tailwind layers + editor and theme styles
├── public/                  # icons, mascot (animated webp + still), manifest, sw.js
├── server/
│   ├── worker.js            # Cloudflare Worker: LINE callback + static assets
│   ├── headers              # Security headers → copied to web_dist/_headers
│   └── .env.example         # Worker secrets + optional client build vars
├── wrangler.toml            # Worker config (johnyos) — must stay at the root
│                            #   so Cloudflare Workers Builds can find it
├── supabase/migrations/     # 001_v2 … 004_task_progress
├── scripts/deploy.sh        # manual deploy; pushing to main deploys too
├── docs/                    # DESIGN.md, PRODUCT.md — both local-only (gitignored)
└── web_dist/                # Build output — gitignored, rebuilt every deploy
```

---

## Local Development

```bash
git clone <repository-url>
cd little-johny
npm install
npm run dev                     # → http://localhost:3000
```

`src/lib/supabaseClient.js` falls back to the public Supabase URL and anon key,
so login works without any local env file. To point the build at a different
project, put `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` /
`VITE_LINE_CHANNEL_ID` in a root `.env.local` — see `server/.env.example`.

The Worker's own secrets (`LINE_CHANNEL_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`)
are set with `npx wrangler secret put <NAME>`.

---

## Deployment

```bash
./scripts/deploy.sh
```

Builds into `web_dist/`, copies the security headers in, and runs
`wrangler deploy`. The Worker (`johnyos`) serves the static bundle and handles
`/api/auth/line-callback`; unknown paths fall through to `index.html` so React
Router can route them.

---

## LINE Bot Integration

> Repository: `johny-line-bot` — Cloudflare Workers + Hono

### Architecture: LINE ↔ Supabase

```
LINE User A ──LINE Login──► Supabase Auth (uuid-A)
LINE User B ──LINE Login──► Supabase Auth (uuid-B)
                                    │
                          line_users table
              ┌───────────────┬──────────┬──────┐
              │ line_user_id  │ user_id  │ plan │
              ├───────────────┼──────────┼──────┤
              │ Uaaa…         │ uuid-A   │ free │
              │ Ubbb…         │ uuid-B   │ pro  │
              └───────────────┴──────────┴──────┘
```

**ข้อมูลแยกกันโดย `user_id` — ไม่มีทางปนกัน**

- LINE bot กรองทุก query ด้วย `?user_id=eq.<uuid>` (service role key)
- Web app ป้องกันด้วย Supabase RLS policy (JWT)
- 1 LINE account ↔ 1 Supabase account เท่านั้น
- เชื่อมบัญชีอัตโนมัติผ่าน **LINE Login** บนเว็บ (ไม่ต้องกรอกรหัส 6 หลักแล้ว)

### LINE Bot Commands

| คำสั่ง | ผล |
|---|---|
| `+งาน [ชื่องาน]` | เพิ่มงานใหม่ลง Supabase |
| `งานค้าง` / `งานเสร็จ` | ดูสถานะงาน |
| `จ่าย [ชื่อ] [จำนวน]` | บันทึกรายจ่าย (auto-detect หมวด) |
| `รายจ่าย` / `รายจ่ายเดือนนี้` | ดูสรุปรายจ่าย |
| `บันทึก [ข้อความ]` | บันทึกโน้ต |
| `โน้ต` | ดูโน้ตทั้งหมด |
| `คำสั่ง` | แสดงรายการคำสั่งทั้งหมด |

### Stack

```
LINE Messaging API → Cloudflare Worker (Hono) → Supabase REST API
                                │
                         Cloudflare KV
                    (link codes + unlinked notes)
```

---

## Roadmap

### Phase 2 — Cloud & Integrations ✅ (mostly done)
- ✅ **Cloud sync** via Supabase (LINE Login auth + multi-device)
- ✅ **LINE Secretary** — create tasks, log expenses, take notes via LINE
- ✅ **User plans** — free / pro tiers (`line_users.plan`)
- 🔜 **AI assistant** — daily planning, task prioritization, expense analysis

### Phase 3 — Scale
- OCR receipt scanning
- Advanced analytics
- Mobile app
- Multi-user / SaaS

---

## Development Notes

- Understand existing code before editing — avoid unnecessary rewrites
- `src/lib/storage.js` is the only place that touches persistence; keep data shape backward-compatible
- Design consistency matters — `docs/DESIGN.md` is the source of truth before touching any UI
- Guest mode must stay fully functional (ephemeral, no cloud writes)
- AI agents read `AGENTS.md` (design rules) before touching UI

---

## License

Personal project — all rights reserved.

---

## Version History

Three generations, June–August 2026. Each rewrite was triggered by a specific
kind of pain, not by wanting newer tools — the notes below record what actually
hurt, so the same trap is easier to spot next time.

### v1 — Vanilla JS PWA · 21 Jun – 12 Jul 2026

**Stack:** hand-written HTML + CSS + JavaScript, no framework, no build step.
Static files served directly; a Cloudflare Worker was added later only for the
LINE OAuth callback.

Everything real about the product was proven here: Supabase sync, LINE Login,
guest mode, Kanban, Calendar with Thai holidays, the mascot, the PWA shell.
Shipping needed no toolchain at all — edit a file, push, done.

**What went wrong**

- **Three files ate the whole app.** By the end: `app.js` **2,306 lines / 98 KB**,
  `styles.css` **4,607 lines / 116 KB**, `index.html` **631 lines / 40 KB**. Every
  screen lived in the same global scope and the same stylesheet. Changing one view
  meant reading all of it first.
- **Cache-busting was manual and constant.** Because filenames never changed, the
  service worker and browser kept serving stale code. The log is full of it:
  `Bump SW cache to v5`, `Bump JS query strings to v10`, `bump cache v6/v11`,
  `Bump script version to v12` — four commits whose only job was making the browser
  notice a deploy.
- **Light and dark were two separate designs.** `Design v5: Premium Dark Workspace`
  → `Unify light mode with dark v5` → `Add light mode: warm cream workspace` →
  `Extend light mode: inputs, chips, kanban, modals, FAB, toast, calendar`. Every
  new component had to be styled twice, and the second pass was always late.
- **No component boundaries** meant no safe refactor. The only way to change shared
  behavior was find-and-replace across a 4,600-line stylesheet.

### v2 — Two Next.js apps · 12 Jul – 28 Aug 2026

**Stack:** Next.js + React + TypeScript, split into `site/` (landing, 26 files) and
`dashboard/` (the workspace, 72 files). Two `package.json` files, two builds.

This solved v1's real problem: components, scoped styles, and content-hashed
filenames that ended the cache-busting commits for good. TypeScript caught the
data-shape mistakes that had caused sync bugs. The rich Notes editor (TipTap,
clipboard image paste, resizable images) was only practical with a component tree.

**What went wrong**

- **Two apps, one domain, glued by hand.** `deploy.sh` built only `dashboard/`,
  then `rsync`-ed it over `web_dist/` with `--exclude index.html` so it wouldn't
  clobber the landing page — which had to be built separately, by hand, and was
  easy to forget.
- **No `--delete` on that rsync**, so dead output accumulated in git forever:
  **105 committed build files**, including 15 orphaned chunks and four stale build
  directories that nothing served.
- **Two of everything.** Two dependency trees (~1.1 GB of `node_modules`), two
  Tailwind configs to keep in sync, two upgrade paths.
- **Server rendering was never used.** 30 of 49 files were already `"use client"`;
  only four were true server components, and those were empty shells. The project was
  paying Next.js's complexity budget for a framework feature it never called.

### v3 — One Vite + React app · 28 Aug 2026 → today

**Stack:** React 19 + Vite 6 + React Router 7 + Tailwind 3, **plain JavaScript**.
One `package.json`, one build, one output. Landing and workspace are routes in the
same tree. Deployed as Cloudflare Workers static assets with SPA fallback.

**The migration in numbers**

| | v2 | v3 |
|---|---|---|
| Apps / builds / output dirs | 2 | **1** |
| Tracked files | 400+ | **94** (65 in `src/`) |
| Committed build output | 105 files | **0** (gitignored) |
| `node_modules` on disk | ~1.1 GB | **144 MB** |
| Repo size (excl. `node_modules`, `.git`) | ~120 MB | **5.1 MB** |
| `dark:` color utilities | 230 | **0** |

The cutover itself was `441 files changed, +2,255 / −130,536` — almost entirely
deletion, because the two app generations before it were still sitting in the repo.

**What got better**

- **The rsync hack is gone.** One `npm run build` produces the whole site;
  `scripts/deploy.sh` is now four lines.
- **Light and dark are finally one design system.** Colors are CSS custom properties
  in `src/styles/globals.css`, mapped through Tailwind as
  `rgb(var(--c-accent) / <alpha-value>)`. Components name a token; the token's value
  swaps under them. Adding a `dark:` class is now a regression, not a chore.
- **Plain JavaScript matches how the project is actually maintained** — one person,
  no CI, no type-check gate. TypeScript's value here was mostly at the storage layer,
  and that shape is now pinned by a single module (`src/lib/storage.js`) instead.
- **Deep links and security headers actually work.** `_headers` had never been served
  in v1 or v2 — it sat at the repo root while Workers Assets reads from the asset
  directory. Production served **zero** security headers until v3 moved it to
  `server/headers` and had the deploy script copy it in.

**What was traded away**

- **Static HTML per route is gone.** v2 pre-rendered `/`, `/about`, `/signup`;
  v3 serves one `index.html` and routes client-side. For a personal project behind a
  login this costs little, but it is a real SEO regression — if the landing page ever
  needs to rank, that decision has to be revisited (pre-rendering, or moving the
  landing page back to static output).
- **Compile-time type safety is gone.** Mistakes that TypeScript used to catch now
  surface at runtime. Worth remembering before growing the data model again.

**Verdict:** yes, better — but the win came from *deleting two generations of dead
code and unifying the design into tokens*, not from Vite being faster than Next.js.
v1's real lesson was that a product can be proven without a framework; v2's was that
a framework is worth adopting for component boundaries and content hashing, but only
one app's worth of it.
