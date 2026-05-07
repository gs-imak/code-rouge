# Session Context

> **Read this first at the start of every session.**
> Update this file at the end of every session.

---

## Last session (2026-05-07) — **post-demo hardening: kiosk dev-lockout fix**

The 4-May visio passed (no regressions surfaced during the call). Today's session was triggered by a workstation lockout: running `bash tools/scripts/demo-prep.sh` to rehearse a follow-up dry-run booted the assaut Electron app via `pnpm dev`, which applied the full kiosk lock — `kiosk:true` + `fullscreen:true` + globalShortcut grabs of Alt+Tab / Alt+F4 / Ctrl+Esc / Win+L / Win+D / Ctrl+Shift+Esc — to a developer workstation. Every escape key was swallowed including Task Manager; only Ctrl+Alt+Del got the user out, which felt indistinguishable from a system crash and forced a sign-out.

### Root cause (apps/assaut/src/main/index.ts)

The kiosk lock was applied unconditionally regardless of dev / prod mode. The `will-navigate` guard's comment block already claimed "dev is not a kiosk environment" but the BrowserWindow flags and `registerKioskShortcuts()` call disagreed.

### Fix — PR #23 (branch `fix/m1-pre-demo-blockers`), 4 commits

```
8205feb fix: M1 pre-demo blockers (Electron postinstall + bundle + deviceId)   [pre-existing]
c5beed7 fix(assaut): gate kiosk lock on isProduction to prevent dev lockout
570ec97 refactor: address quality-gate review of c5beed7 (drop NODE_ENV co-gate)
3cb17b5 fix(scripts): make demo-prep.sh shellcheck-clean (SC2015 + SC2164)
```

Final state of `isProduction` at apps/assaut/src/main/index.ts:93:
```ts
const isProduction = app.isPackaged
```
`app.isPackaged` is set by Electron at runtime from ASAR / NSIS detection — cannot be spoofed via NODE_ENV. `kiosk`, `fullscreen`, `frame`, `devTools`, and the `registerKioskShortcuts()` call all key off this single gate. Packaged mallette `.exe` builds keep the full triple verrou unchanged. Dev `pnpm dev` boots run as a normal windowed Electron app.

### Side fixes on the same PR
- New `console.log('[assaut] window ready')` emitted from `ready-to-show` so demo-prep.sh has a kiosk-independent boot signal.
- `cleanup()` trap on INT/TERM/EXIT in demo-prep.sh sweeps background `pnpm dev` process trees + stray electron.exe + holders of demo ports 8080/5173/5174. Ctrl-C of the trailing `tail -F` no longer leaves orphan watchers.
- Centralised `cmd && ok || warn` → `try_run` / `try_silent` helpers (avoids shellcheck SC2015).
- `cd "$REPO_ROOT" || { fail; exit 1; }` (avoids SC2164).
- `tools/scripts/demo-prep.sh` is now tracked in the repo (was untracked before).

### CI on PR #23

Run [25494665422](https://github.com/gs-imak/code-rouge/actions/runs/25494665422) — all 5 jobs green:
- Lint 46s, Typecheck 50s, Test 39s (106/106), Build Windows 3m38s, Build Android 6m28s.

### Awaiting human review

PR #23 is **not merged**. CLAUDE.md immutable rule #1 + memory pause-rule require manual operator review on any kiosk-lock change. CI is fully green; merge is blocked on a human eyeball pass on the diff in `apps/assaut/src/main/index.ts`.

---

## Previous session (2026-05-04) — **M1 100% CODE-COMPLETE**

Every Malt M1 contract item is closed code-side. CI green on `main`. Three follow-up PRs (#16/#17/#18) closed the gaps the original 5 chantiers left open.

### main now has

```
7b02c63 feat(ci): Electron .exe build + artifact upload (M1 deliverable) (#18)
cac733a feat(ci): real APK builds + artifact upload (M1 deliverable) (#17)
95d8754 feat(ui): network diagnostic + Setup admin skeleton (M1 punch list) (#16)
d22306e chore(rn-apps): RN-CLI-generated android/ scaffolds (#15)
776cfdc feat(shared-types): config schemas + placeholder JSONs (chantier 06 prep) (#14)
0d62d75 feat(server): /diag + POST /admin/reset endpoints (#13)
13e098f test: ws-client + db + server integration tests (#12)
cc3661a docs: M1 fully shipped (v0.1.0 tagged) (#11)
ae07739 feat: chantier 04 — kiosk mode (#8)
d415be4 feat: chantier 03 — local NUC server (#6)
35fde9a feat: chantier 02 — CI pipeline (#3)
86e2d91 chore: scaffold monorepo (chantier 01) (#1)
a92df49 chore: initial bundle
```

**Tag: `v0.1.0`** (annotated, pushed). Final M1 main CI run: [25336567351](https://github.com/gs-imak/code-rouge/actions/runs/25336567351) — all 5 jobs green (lint 42s, typecheck 52s, test 40s, build-android 389s, build-windows 232s).

### Malt contract — every item closed

| Contract item | Status | Where it landed |
|---|---|---|
| Monorepo + design system + commit conventions | ✅ | Chantier 01 (PR #1, #2) |
| CI pipeline (lint/typecheck/test/build-android/build-windows) | ✅ | Chantier 02 (PR #3) |
| **Environnement de preview en ligne** (APK + .exe artefacts) | ✅ | PRs #17, #18 — both produce downloadable artefacts on every main push (`code-rouge-apks` + `code-rouge-assaut-exe`, 14-day retention) |
| Serveur Node.js (WS / Zod / SQLite / install script) | ✅ | Chantier 03 (PR #6) + chantier 06 prep (PR #13: `/diag`, `/admin/reset`, `db.resetSession`) |
| Mode kiosque Android (Screen Pinning) | ✅ | Chantier 04 + follow-up (PR #8, #15) |
| Mode kiosque Windows (Electron + désactivation touches) | ✅ | Chantier 04 (PR #8) |
| Persistance + reprise auto sur les 3 plateformes | ✅ | Chantier 05 (PR #10) |
| Squelette Connexion / Setup admin / Diagnostic réseau | ✅ | Chantier 04 + PR #16 (Setup admin on debriefing, diagnostic dot on all 3 apps) |
| Dépôt GitHub avec accès en lecture | 🟡 | Repo private; **add Nathanaël as collaborator** (need his GitHub username) |
| Tag de release `v0.1` | ✅ | `v0.1.0` |
| APK Android installables | ✅ | PR #17, downloadable from CI artefacts |
| Exécutable Windows .exe | ✅ | PR #18, downloadable from CI artefacts |
| Build serveur NUC packagé + scripts | ✅ | `tools/scripts/install-nuc.sh` (chantier 03) |
| Documentation d'architecture initiale | ✅ | `docs/architecture.md` + decision log |

### Remaining gates (none code-side)

- **4-May 14h30 demo with Nathanaël** — scheduled visio; the validation scenario in `docs/m1-plan.md` § Validation runs against the artefacts from the latest main CI
- **Hardware kiosk validation** — needs the Windows mallette PC + an Android tablet (Nathanaël's hardware procurement). The `pnpm dev / pnpm android` flows are documented; nothing code-side blocks them.
- **Add Nathanaël as repo collaborator** — pending his GitHub username

### Chantier 06 prep that's already done

While closing M1 we also landed the wiring chantier 06 will need:

- **PR #13** — server `/diag` + `POST /admin/reset` + `db.resetSession`. The Débriefing Setup admin button calls `/admin/reset`; chantier 06's session lifecycle UI is a thin wrapper over these endpoints.
- **PR #14** — Zod schemas + placeholder JSONs for parcours / mailbox / assaut sequence / game variants in `packages/shared-types/`. When Nathanaël delivers énigme content, it's a JSON edit, not a code change.
- **PR #16** — `serverIp` in GameState (NUC-IP-aware setup admin), `useServerHandshake` hook on debriefing + assaut, diagnostic dot on all three apps. Chantier 06's network-aware UI builds on these.

### What chantier 06 needs from outside

1. **Laura's tokens** (colors / typo / spacing) → `packages/design-system/`
2. **Laura's maquettes** (per-screen designs) → drives the App.tsx rewrites
3. **Nathanaël's content** (parcours.json / mailbox.json / assaut sequence) → drops into `packages/shared-types/configs/` or `apps/<app>/assets/config/`
4. **Hardware** (mallette PC + tablets + GM phone + NUC) → for runtime AC validation

Test count: **91 / 91 passing**. `pnpm audit --audit-level=high` clean.

---

## Currently in progress

- **PR #23** (branch `fix/m1-pre-demo-blockers`) — kiosk dev-lockout fix + demo-prep.sh hardening. CI fully green. Awaiting Georges' eyeball on the kiosk diff per the manual-review pause rule.

---

## Blocked / waiting on Georges or Nathanaël

- **Review and merge PR #23** (Georges) — kiosk-lock change, can't auto-merge.
- Add Nathanaël as a read collaborator on `gs-imak/code-rouge` (GitHub username pending).
- Confirm "build serveur NUC packagé" interpretation matches `install-nuc.sh + git clone` flow (vs. expecting a `.tar.gz`).

## Notes (non-blocking)

- 3 moderate vulnerabilities still in `pnpm audit` (none high). Tar override neutralised the CVE chain that chantier 04 hit.
- The kiosk-status footer in `assaut/App.tsx` is debugging UI — scheduled for deletion after the 4-May validation.
- Vercel session hooks continue to fire on filenames; ignored throughout.

---

## Next concrete task — **merge PR #23, then post-demo cleanup**

1. **Review + merge PR #23** (kiosk-lock dev-mode gate). CI green; needs Georges' manual review per CLAUDE.md rule #1. Squash-merge to main.
2. **Send invoice for M1.** (Visio passed 4-May; PR #23 is hardening, not a contract item.)
3. Capture screenshots into `docs/demo/m1/` (the directory has a `.gitkeep`; PNGs are gitignored by default; use `git add -f` if you want to commit specific captures).
4. Delete the kiosk-status footer in `apps/assaut/src/renderer/src/App.tsx` + the `IpcChannel.KioskStatus` IPC path. **Note:** this was already done in a prior commit (`KioskStatus` is removed from `src/shared/ipc.ts:12`); double-check nothing references the footer before closing the punch list item.
5. Open chantier 06 with a brainstorming session: which design tokens does Laura need from the existing palette? What's the canonical parcours flow Nathanaël wants to ship for the first venue session?

---

## Format for future updates

When you update this file, replace the section bodies above. Keep the
section headers as-is. Be specific:

**Good entry**
```
## Last session (2026-05-04)
- M1 demo passed; Nathanaël signed off. Tag v0.1.0 already shipped;
  invoice drafted, sent.
- Captured 4 PNGs in docs/demo/m1/.
- Found one regression during demo: <specific>
- Chantier 06 brainstorming scheduled for 2026-05-07.
- Next: parcours.json content drop from Nathanaël.
```

**Bad entry**
```
## Last session
- Did some setup. Things are progressing.
```

The bad version is useless next session. Be a future-you who has zero memory
of today.
