# </> PlainCode

**From idea to shipped system.** PlainCode is the spec-driven workspace for building with AI: turn a vague idea into a build-ready Blueprint, then understand, harden, and ship the code your AI agent writes. Powered by a 3-layer AI accuracy pipeline.

Free. No sign-up required.

---

## What It Does

PlainCode walks the whole arc — **Plan → Design → Build → Understand → Harden → Ship** — with one tool per stage:

| Stage | Mode | What it does |
|-------|------|-------------|
| Plan | **Blueprint** | Describe a vague idea — get a build-ready spec plus a ready-to-paste prompt for Codex, Claude, ChatGPT, Cursor, or any AI agent |
| Design | **Polish** | Describe your app or drop a screenshot — get a real *rendered* design (beautiful screens in code), the design system (DESIGN.md + tokens), and prompts that keep your AI on-brand |
| Understand | **Explain** | Paste code, pick your audience, get a structured plain-English explanation |
| Understand | **Document** | Paste a snippet or point at a repo — get README-ready docs with three diagrams, an API reference, and one-click export |
| Understand | **Diff** | Compare two versions of code and understand what changed and why |
| Harden | **Defend** | Point at a GitHub repo — get grilled with 5 adversarial questions, scored 0–100 per answer |
| Ship | **Ship Check** | Run automated checks + a systems stress test on a repo and get a Ship Score |

---

## Features

### Blueprint Mode *(new)*

The pre-code stage: turn a half-formed idea into a precise, build-ready spec for any AI coding agent. Most people don't fail with AI because the model is weak — they fail because they give it incomplete context. Blueprint is the missing layer that fixes that.

**How it works:**
1. Describe what you're trying to build (messy is fine), who it's for, and the problem it solves — paste any extra notes
2. A 3-layer AI pipeline reads the idea, maps what's clear vs. missing, and asks **5 clarifying questions** — the fewest needed to prevent a bad output
3. Answer what you can (blanks are allowed)
4. Get a structured **execution spec**: goal, target user, core promise, MVP features, non-goals, user flow, technical requirements, build tickets, and a validation checklist
5. Copy a **tailored build prompt** for Codex, Claude, ChatGPT, Cursor, or any agent — each framed for that tool

**Export & persistence:**
- **Copy as Markdown** (spec + all five prompt variants) · **Copy link** — a self-contained URL that rehydrates the blueprint
- **Follow-up Q&A** grounded in your blueprint
- **Recent blueprints** — last 5 kept locally so you can reopen them instantly

Built on the same Claude pipeline as every other mode. No new API keys, no database, no sign-up — fully stateless on the server; history and shares live in your browser.

---

### Polish Mode *(new)*

The fix for "AI slop" UI. AI builds functional but generic, obviously-AI interfaces — because, given a vague brief, a model emits the *average* of its training data. Polish turns your app into a real, designed UI and the machine-readable design system that keeps your AI on-brand.

**How it works:**
1. Describe your app (and audience / vibe), and optionally **upload a screenshot** of the current UI — Claude reads it *multimodally* and critiques the specific "this looks AI" tells it can see.
2. It proposes **3 genuinely distinct design directions** (real reference aesthetics, never the default shadcn/violet look).
3. Pick one. Polish generates the **design system** — a distinctive font pairing, a real color system (light + dark, AA-contrast, no pure-gray neutrals), radius/spacing/motion, validated by an anti-slop pass that rejects generic choices.
4. Then it **renders 3 real screens as actual HTML/CSS**, shown in a **live, sandboxed preview** with light/dark + desktop/mobile toggles — not a static mock, real code you can copy and ship.

**Why it beats a design tool for this job:** Figma gives you a *picture* you then rebuild in code — the handoff is where quality dies. Polish outputs real, system-consistent code rendered live: instant, responsive, free, and you **refine by intent** ("make it warmer / denser / more editorial") and the whole design regenerates consistently.

**You get:** the live screens (copy/download HTML), a `DESIGN.md`, paste-ready **design tokens** (Tailwind `@theme` / CSS variables / JSON), and **universal AI prompts** (Codex / Claude / ChatGPT / Cursor) that tell any agent to apply the system and avoid the slop patterns. Generated screens render in a `sandbox` iframe with scripts stripped. Stateless; history and shares live in your browser.

---

### Document Mode *(new)*

Turn any code into polished, README-ready documentation. Paste a snippet **or** point at a whole public GitHub repository.

**What you get:**
- **Overview & Purpose** — plain-English summary of what the code does and why it exists
- **API Reference** — auto-extracted signatures with typed parameters, return types, and thrown errors
- **Three visual diagrams** — each showing the code from a different angle, downloadable as SVG and individually regenerable:
  - **Control Flow** (Mermaid `flowchart TD`) — decisions, branches, loops
  - **Sequence** (Mermaid `sequenceDiagram`) — who calls whom across functions and services
  - **Data Flow** (Mermaid `flowchart LR`) — inputs → transformations → outputs
- **Usage Example**, **Edge Cases & Gotchas**, and **Complexity & Performance**
- **Inline annotated source** — hover any block to read what it does
- **Follow-up Q&A** grounded in the generated documentation

**Whole-repo mode** documents an entire project (architecture-level diagrams, the public API surface annotated with file paths) using the same repo fetcher as Defend.

**Export & persistence:**
- **Copy as Markdown** (diagrams embedded as ```` ```mermaid ```` blocks) · **Download `.md`**
- **Copy as Docstrings** (JSDoc / Python / generic) · **Copy Source + Docstrings** (injected into your code)
- **Share Link** — a self-contained URL that rehydrates the full document
- **Recent documents** — last 5 kept locally so you can reopen them instantly
- **Open docs PR** — commit the docs straight back to your repo as a pull request (GitHub OAuth, or a fine-grained token)

Fully stateless on the server; history and shares live in your browser.

---

### Defend Mode *(new)*

Point PlainCode at any public GitHub repository and defend your design decisions under pressure.

**How it works:**
1. Paste a public GitHub repo URL (e.g. `https://github.com/you/your-project`)
2. PlainCode fetches the codebase (up to 30,000 characters of source code)
3. A 3-layer AI pipeline generates **5 adversarial questions** — one per category:
   - **Architecture** — Why did you structure it this way?
   - **Edge Cases** — What happens when X breaks?
   - **Security** — What attack vectors did you leave open?
   - **Scalability** — What falls apart at 10× load?
   - **Alternatives** — Why this approach over the obvious alternative?
4. Answer each question in your own words
5. Claude scores every answer **0–100** with one line of sharp feedback
6. After all 5, get your **Defense Score** (average) and a **3-bullet summary of your weakest spots**

Questions are grounded in your actual code — file names, function names, patterns — not generic prompts. No auth, no storage. Fully stateless.

---

### Explain Mode

Paste code (or upload a file), pick your audience level, and get a structured explanation with:

- **Summary** — What the code does at a glance
- **Breakdown** — Step-by-step walkthrough of key parts
- **Analogy** — A real-world comparison to make it click
- **Data Map** — What goes in, what comes out, what transforms
- **Flow Diagram** — Auto-generated Mermaid.js flowchart of the logic
- **Confidence Score** — A 0–100 accuracy rating from a 3-layer AI check

#### 5 Audience Levels

| Level | Best For |
|-------|----------|
| **ELI5** | Anyone — uses everyday analogies, zero jargon |
| **Non-Technical** | Non-programmers — plain English, real-world comparisons |
| **Business** | PMs & executives — focuses on user impact and business value |
| **Tech Non-Dev** | Data analysts, sysadmins, tech writers — technical vocab, no code syntax |
| **Developer** | Fellow engineers — design patterns, edge cases, complexity analysis |

Changing the audience level automatically re-explains the same code.

---

### Diff Mode

Compare two versions of code side-by-side and get an explanation of **what changed and why it matters**. Perfect for reviewing pull requests.

- Paste "Before" and "After" code
- Get the same structured explanation, focused on the differences
- Supports up to 25,000 characters per side

---

### Follow-Up Q&A

After an explanation is generated, ask follow-up questions in a built-in chat:

- Full context of your code and explanation is preserved
- Conversation history maintained (last 6 exchanges)
- Streamed responses in real-time

---

### 15 Output Languages

Get explanations in: English, Spanish, French, German, Portuguese, Japanese, Chinese (Simplified), Korean, Italian, Russian, Arabic, Hindi, Dutch, Turkish, or Polish.

---

### Privacy Mode

Toggle privacy mode on the explain page to ensure your code is never stored or used for model training. Adds Anthropic's `no-training` header to all API calls.

---

### File Upload

Upload code files directly instead of pasting:

- Drag & drop onto the editor, or click to pick a file
- Supports 16+ extensions: `.js`, `.ts`, `.py`, `.java`, `.rs`, `.go`, `.sql`, `.sh`, `.rb`, `.php`, `.cs`, `.cpp`, `.c`, `.json`, `.md`, `.txt`, and more

---

### Dark Mode

Full light and dark theme support with system detection. Toggle via the moon/sun icon in the navbar.

---

### Keyboard Shortcuts

- **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows/Linux) — Trigger explanation or diff
- **Enter** in Q&A — Send message

---

## How the 3-Layer AI Pipeline Works

Every feature in PlainCode runs through a 3-layer pipeline to ensure accuracy:

```
┌─────────────────────────────────────────────┐
│  Layer 1: Intent Analysis (Claude Haiku)    │
│  → Detects language, purpose, complexity    │
│  → Grounds the explanation / questions      │
├─────────────────────────────────────────────┤
│  Layer 2: Generation (Claude Sonnet)        │
│  → Explains code / generates questions      │
│  → Streams in real-time via SSE             │
├─────────────────────────────────────────────┤
│  Layer 3: Adversarial Validation (Haiku)    │
│  → Checks output against the source         │
│  → Identifies and auto-corrects errors      │
│  → Adjusts confidence score                 │
└─────────────────────────────────────────────┘
```

In Explain mode, Layer 3 validates the explanation and triggers an automatic revision loop if errors are found. In Defend mode, Layer 3 validates that the generated questions are specific to your codebase — not generic.

---

## Tech Stack

- **Framework:** Next.js 14 / React 18 / TypeScript
- **Styling:** Tailwind CSS v4
- **Code Editor:** CodeMirror 6
- **Diagrams:** Mermaid.js
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`, `claude-haiku-4-5-20251001`)
- **Validation:** Zod
- **UI Primitives:** Radix UI
- **Theming:** next-themes

---

## Getting Started

### Prerequisites

- Node.js >= 22.12.0
- An Anthropic API key from [console.anthropic.com](https://console.anthropic.com/)
- *(Optional)* A GitHub personal access token — raises rate limits for Defend Mode

### Setup

```bash
# Clone the repository
git clone https://github.com/your-org/PlainCode.git
cd PlainCode

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required — get yours at console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-...

# Optional — increases GitHub API rate limit for Defend / Document repo fetches
# A read-only personal access token is sufficient
GITHUB_TOKEN=ghp_...

# Optional — enables "Open docs PR" via GitHub OAuth in Document mode.
# Register an OAuth App (https://github.com/settings/developers) with callback
# <your-origin>/api/github/callback. Without these, users can still open a docs
# PR by pasting a fine-grained token (Contents + Pull requests: write).
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

```bash
# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```bash
npm run build
npm start
```

The app uses Next.js standalone output mode for containerized deployments (Railway, Docker, etc.).

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/blueprint/analyze` | Analyze a vague idea and generate 5 clarifying questions |
| `POST` | `/api/blueprint/compile` | Compile the idea + answers into a spec and universal prompts |
| `POST` | `/api/polish/analyze` | Critique a UI (text + optional screenshot) and propose 3 design directions |
| `POST` | `/api/polish/compile` | Compile the chosen direction into a design system + tokens + prompts |
| `POST` | `/api/polish/render` | Render real screens as HTML for the design system |
| `POST` | `/api/explain` | Explain a code snippet (SSE stream) |
| `POST` | `/api/explain-diff` | Explain changes between two code versions (SSE stream) |
| `POST` | `/api/document` | Generate full documentation — 12 sections incl. 3 diagrams (SSE stream) |
| `POST` | `/api/document/diagram` | Regenerate a single diagram (`FLOWCHART` / `SEQUENCE` / `DATAFLOW`) |
| `POST` | `/api/document/commit` | Open a PR that writes the generated docs into a repo |
| `POST` | `/api/qa` | Ask a follow-up question (SSE stream) |
| `POST` | `/api/fetch-repo` | Fetch source files from a public GitHub repo |
| `POST` | `/api/defend` | Generate 5 adversarial questions for a codebase |
| `POST` | `/api/defend-score` | Score a single answer 0–100 with feedback |
| `POST` | `/api/defend-summary` | Generate Defense Score + weak-spot summary |
| `GET`  | `/api/github/status` | Whether GitHub OAuth is configured and the caller is connected |
| `GET`  | `/api/github/auth` | Begin the GitHub OAuth flow (for "Open docs PR") |
| `GET`  | `/api/github/callback` | OAuth callback — exchanges the code for a token |
| `POST` | `/api/github/logout` | Clear the stored GitHub token |
| `GET`  | `/api/health` | Health check |

All streaming endpoints return Server-Sent Events with JSON payloads; the rest return standard JSON. All LLM/external-cost endpoints are rate-limited per IP.

---

## Testing

```bash
npm test          # run the Vitest suite once
npm run test:watch
```

---

## License

Proprietary. All rights reserved.
