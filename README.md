# DevMate AI — AI Code Review, Optimization & Conversion

A Next.js 14 (App Router) + TypeScript starter for an AI-powered code tool suite,
built on Groq, Monaco, Tailwind, Framer Motion, and Prisma/Postgres.

**Live at:** _add your Vercel URL here_

## What's actually working right now

- ✅ **Landing page** — full dashboard UI, animated hero, theme switcher (light/dark/system), command palette (`Cmd+K`)
- ✅ **Unified tool navigation** — a persistent animated tab bar (`ToolsNav`) lets you switch between all 4 tools instantly from within any tool, with a smooth sliding highlight and fade transition between pages
- ✅ **AI Code Review** (`/tools/code-review`) — bugs, vulnerabilities, bad practices, severity-ranked issue cards with before/after fixes, one-click "Fix all," and a copy button for the fully-fixed code
- ✅ **AI Code Optimization** (`/tools/code-optimize`) — before/after time & space complexity, full optimized rewrite, categorized list of changes
- ✅ **AI Code Converter** (`/tools/code-convert`) — translate between any two supported languages side-by-side, with translation notes and a copy button for the converted code
- ✅ **Concept Detector** (`/tools/concept-detector`) — every data structure/algorithm/pattern the code demonstrates, as clickable chips that expand into an explanation, complexity, interview importance, related concepts, and common mistakes
- ✅ **Auto Detect language mode** — every language picker (a custom animated `LanguageSelect` dropdown, not a native `<select>`) includes an "Auto Detect" option that resumes live language detection on every keystroke; picking a specific language manually overrides it until you switch back to Auto
- ✅ **Empty-state placeholders** — every editor starts blank with tool-specific placeholder guidance instead of pre-filled example code
- ✅ **Reliable paste handling** — paste is intercepted and inserted as a single raw edit operation, so pasted code (including plain data like arrays of numbers) always comes through exactly as copied, instead of occasionally getting mangled by auto-indent/format-on-paste
- ✅ **Theme-aware color system** — all colors are CSS variables (`globals.css` + `tailwind.config.ts`), so light mode actually renders light surfaces, borders, and badges instead of leftover dark-mode colors
- ✅ All four tools share one shape: Monaco editor → language auto-detection or manual override → streaming call to `/api/*` → parsed JSON → animated results panel
- ✅ Zustand store with `localStorage`-persisted history
- ✅ Prisma schema for `User` / `Analysis` (Postgres)
- 🧱 **Not wired yet**: auth (Auth.js), Redis rate limiting/caching, S3/R2 file upload, PDF/Markdown export, AI chat panel, zip upload, server-side/per-account history

Those remaining items are each a real feature with their own state and edge cases — ask for
any one of them next and it can be wired in following the same pattern the four tools already use.

---

## 1. Install prerequisites

You need **Node.js 20+** and **pnpm** installed on your machine.

```bash
# Check if you have Node — if this fails, install Node 20+ from nodejs.org first
node -v

# Install pnpm (package manager) if you don't have it
npm install -g pnpm
```

## 2. Unzip and install dependencies

```bash
cd devmate-ai
pnpm install
```

This downloads every package listed in `package.json` (Next.js, React, Tailwind,
Framer Motion, Monaco, Prisma, etc.) into a local `node_modules` folder.
Nothing else to download manually — `pnpm install` is the only "package download" step.

## 3. Set up your environment variables

```bash
cp .env.example .env
```

Then open `.env` and fill in:

| Variable | Where to get it | Required to run the Code Review tool? |
|---|---|---|
| `GROQ_API_KEY` | https://console.groq.com/keys — free, no credit card | **Yes** |
| `GROQ_MODEL` | defaults to `llama-3.3-70b-versatile` — fine as-is | No |
| `DATABASE_URL` | a free Postgres instance from [Neon](https://neon.tech) or [Supabase](https://supabase.com) | No (only for saving history server-side / auth) |
| `NEXTAUTH_SECRET` | run `openssl rand -base64 32` | No (only once you wire up auth) |
| `UPSTASH_REDIS_REST_URL` / `TOKEN` | free tier at [Upstash](https://upstash.com) | No (only for rate limiting/caching) |
| `R2_*` | Cloudflare R2 or any S3-compatible bucket | No (only for file upload feature) |

**Minimum to try the app right now: just `GROQ_API_KEY`.**

## 4. Run it

```bash
pnpm dev
```

Open **http://localhost:3000**. Click "Start reviewing," press `Cmd+K` to jump to any tool,
or use the tab bar at the top of any tool page to switch instantly between them.
Paste code, hit "Run review," watch it stream in.

## 5. (Optional) Set up the database

Only needed once you wire up auth / server-side history persistence.

```bash
pnpm db:push      # creates the User and Analysis tables in your Postgres DB
pnpm db:studio    # opens a GUI to browse the DB in your browser
```

---

## Folder structure — what everything is