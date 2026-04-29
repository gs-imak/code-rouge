# BOOTSTRAP — Read this first, then proceed

This file is your day-1 launch checklist. Execute these steps **in order**,
asking the human (Georges) for confirmation at each gate.

---

## Step 0 — Verify environment

Run:

```bash
node --version          # expect v22.x.x — if older, ask Georges to install Node 22 LTS
pnpm --version          # expect v9+ — if missing: npm install -g pnpm
gh --version            # GitHub CLI — if missing, instructions below
git --version
```

If `gh` is missing on macOS:
```bash
brew install gh
gh auth login           # follow the browser flow
```

If `gh` is missing on Windows:
```bash
winget install --id GitHub.cli
gh auth login
```

**STOP.** Confirm with Georges that all four commands succeed before proceeding.

---

## Step 1 — Get the GitHub username

Ask Georges: **"What's your GitHub username?"**

Save the answer. You'll use it for repo creation in Step 3.

---

## Step 2 — Read the project context

Read in this order:

1. `CLAUDE.md` — project memory, conventions, immutable rules
2. `docs/architecture.md` — technical decisions, monorepo layout, protocols
3. `docs/m1-plan.md` — the active milestone, ordered chantiers, acceptance criteria
4. `docs/glossary.md` — vocabulary (skim — reference back when needed)

After reading, summarize back to Georges:

- What the project is (1 sentence)
- The four apps and their platforms
- The five chantiers of M1 in order
- What "kiosk mode" means in this project's context
- The validation criterion for M1

This is a sanity check — make sure you've internalized the context before
writing a single line of code.

---

## Step 3 — Create the GitHub repo

Run:

```bash
gh repo create <github-username>/code-rouge \
  --private \
  --description "« Code Rouge » — Applications joueurs E2/E3 + débriefing pour The Game" \
  --source=. \
  --remote=origin
```

Then:

```bash
git add .
git commit -m "chore: initial bundle (CLAUDE.md, docs, rules)"
git branch -M main
git push -u origin main
```

**STOP.** Confirm with Georges that the repo is visible on GitHub before proceeding.

---

## Step 4 — Plan Mode for Chantier 01

Open Plan Mode. Generate a step-by-step plan to execute **Chantier 01 only**
from `docs/m1-plan.md` (initialize the monorepo, structure, design-system
skeleton, conventions). Do **not** start Chantier 02 in the same plan.

Acceptance criteria for Chantier 01 (excerpt — see m1-plan.md for full):

- `pnpm install` runs clean from a fresh clone
- `pnpm typecheck` passes (zero errors)
- The four `apps/*` and three `packages/*` exist as workspace members
- Root `tsconfig.base.json`, `.eslintrc.cjs`, `.prettierrc`, `turbo.json` are
  in place and inheritable
- A first commit is pushed: `chore: scaffold monorepo`
- README.md exists with one-paragraph project intro and `pnpm install` instructions

Present the plan to Georges. **Wait for explicit approval.** Then execute.

---

## Step 5 — End of session: update CONTEXT.md

When Georges signals end-of-session, update `CONTEXT.md` per the template
already present in the file. Be specific (file paths, function names,
branches). This is what you'll read first next session.

---

## What NOT to do on day 1

- Do not scaffold all five chantiers at once. One chantier per plan.
- Do not run `pnpm dev` for an app that doesn't exist yet — Chantier 01 only
  creates the **structure**, not running apps. App scaffolding starts at
  Chantier 03 / 04 depending on the package.
- Do not install React Native, Electron, or any heavy deps in Step 4. Those
  belong to Chantiers 03+ and 04+.
- Do not commit `node_modules/`, `.env`, or any APK / exe.
- Do not edit `CLAUDE.md` or `docs/m1-plan.md` without asking Georges first —
  they're the source of truth.

---

After Step 5, you're done with the bootstrap. From session 2 onward, the
flow is: read `CONTEXT.md` → pick the next task from `docs/m1-plan.md`
→ Plan Mode → execute → update `CONTEXT.md`.
