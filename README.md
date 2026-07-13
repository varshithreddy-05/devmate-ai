# DevMate AI — AI Code Review, Optimization & Conversion

A Next.js 14 (App Router) + TypeScript starter for an AI-powered code tool suite,
built on Groq, Monaco, Tailwind, Framer Motion, and Prisma/Postgres.

## What's actually working right now

- ✅ **Landing page** — full dashboard UI, animated hero, theme switcher (light/dark/system), command palette (`Cmd+K`)
- ✅ **AI Code Review** (`/tools/code-review`) — bugs, vulnerabilities, bad practices, severity-ranked issue cards with before/after fixes
- ✅ **AI Code Optimization** (`/tools/code-optimize`) — before/after time & space complexity, full optimized rewrite, categorized list of changes
- ✅ **AI Code Converter** (`/tools/code-convert`) — translate between any two supported languages side-by-side, with translation notes
- ✅ **Concept Detector** (`/tools/concept-detector`) — every data structure/algorithm/pattern the code demonstrates, as clickable chips that expand into an explanation, complexity, interview importance, related concepts, and common mistakes
- ✅ All four tools share one shape: Monaco editor → auto language detection → streaming call to `/api/*` → parsed JSON → animated results panel
- ✅ Zustand store with `localStorage`-persisted history
- ✅ Prisma schema for `User` / `Analysis` (Postgres)
- 🧱 **Not wired yet**: auth (Auth.js), Redis rate limiting/caching, S3/R2 file upload, PDF/Markdown export, AI chat panel, zip upload

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
cd ai-code-suite
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

Open **http://localhost:3000**. Click "Start reviewing" or press `Cmd+K` → "AI Code Review".
Paste code, hit "Run review", watch it stream in.

## 5. (Optional) Set up the database

Only needed once you wire up auth / server-side history persistence.

```bash
pnpm db:push      # creates the User and Analysis tables in your Postgres DB
pnpm db:studio    # opens a GUI to browse the DB in your browser
```

---

## Folder structure — what everything is

```
ai-code-suite/
├── prisma/
│   └── schema.prisma          # DB schema: User, Analysis tables. Edit this, then `pnpm db:push`.
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root HTML shell: fonts, theme provider, toast notifications
│   │   ├── page.tsx            # Landing / dashboard page
│   │   ├── globals.css         # Base styles, CSS variables, scrollbar/selection styling
│   │   ├── api/
│   │   │   ├── analyze/route.ts    # Code Review — streaming call to Groq
│   │   │   ├── optimize/route.ts   # Code Optimization — streaming call to Groq
│   │   │   ├── convert/route.ts    # Code Converter — streaming call to Groq
│   │   │   └── concepts/route.ts   # Concept Detector — streaming call to Groq
│   │   └── tools/
│   │       ├── code-review/page.tsx      # ✅ live
│   │       ├── code-optimize/page.tsx    # ✅ live
│   │       ├── code-convert/page.tsx     # ✅ live
│   │       └── concept-detector/page.tsx # ✅ live
│   ├── components/
│   │   ├── CodeEditor.tsx      # Monaco editor wrapper (theme-aware, shared by every tool)
│   │   ├── CommandPalette.tsx  # Cmd+K quick-jump menu
│   │   ├── DiffHero.tsx        # Animated diff block on the landing page
│   │   ├── ThemeProvider.tsx   # Wraps next-themes
│   │   └── ThemeToggle.tsx     # Light/dark/system pill switcher
│   ├── lib/
│   │   ├── gemini.ts           # Groq client (fetch-based), streaming helper, retry-with-backoff
│   │   └── detectLanguage.ts   # Fast client-side language auto-detection heuristic
│   └── store/
│       └── useAppStore.ts      # Zustand store: current code, language, history (persisted)
├── .env.example                 # Copy to `.env` and fill in — see step 3 above
├── package.json                 # Dependency list + npm scripts
├── tailwind.config.ts            # Design tokens: colors, fonts, animations
└── next.config.mjs
```

## Adding a fifth tool

All four tools follow one shape: a page with two `CodeEditor`s (or one + a results panel),
a `fetch()` to an `/api/*` route that streams a JSON-only response from `src/lib/gemini.ts`'s
`streamGemini()`, and a results panel that parses that JSON once the stream closes. Duplicate
whichever existing route + page is closest to what you're building (e.g. `code-review` for
another analysis tool, `code-convert` for another transform tool) and change the `SYSTEM_PROMPT`
and result shape.

## Deploying

This is a standard Next.js app — push to GitHub and import into [Vercel](https://vercel.com).
Add the same environment variables from `.env` in the Vercel project settings. Neon/Supabase
Postgres both work out of the box with Vercel's serverless functions.

## Notes on the tech choices

- **Model provider**: switched from Gemini to **Groq** (`llama-3.3-70b-versatile`) — a genuine
  permanent free tier with no billing/credit-card requirement, unlike Gemini's current API access
  model. `src/lib/gemini.ts` is now a thin fetch wrapper around Groq's OpenAI-compatible endpoint
  (kept the filename/function name so nothing else in the app had to change). Swap to a different
  OpenAI-compatible provider (OpenRouter, Cerebras, etc.) by editing that one file — every route
  just calls `streamGemini(prompt, systemInstruction)`.
- **Streaming**: each `/api/*` route streams raw text chunks; the client accumulates them and
  parses the final JSON once the stream closes (structured JSON can't be meaningfully
  partially-parsed, so the loading state shows a skeleton instead of progressively-rendered cards).
- **Rate limiting / caching / prompt-injection protection / file storage / auth** are called out
  in `.env.example` and the schema but intentionally not wired up — they're config-heavy and
  specific to which provider you pick. Ask for any one of them next and it can be wired in fully.
