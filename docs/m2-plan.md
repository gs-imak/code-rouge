# M2 — Applications joueurs + Débriefing : scope & acceptance

**Follows:** M1 — Socle technique (validated 2026-05-07, tag `v0.1.0`).
**Status:** active.
**Release on validation:** tag `v0.2.0`.

---

## How to use this file

M1 had a day-by-day plan; M2 is feature-driven, so this file is organised as
**vertical slices** (each crosses engine + screens + config + tests) with
explicit **acceptance criteria**. A slice is done when every AC is met and the
workspace is green (`pnpm typecheck && pnpm lint && pnpm test`). This file is
the verifiable definition of "M2 done" — it did not exist during early M2 work
(reconstructed 2026-06-09 from `CHANGELOG.md`, the per-app READMEs, the decision
log, and the merged PRs #24–#34).

`docs/m1-plan.md` is retained unchanged as the validated M1 record.

---

## Goal

Bring the three apps alive from the Figma maquettes (`k0i1WhiVTUIIt4PRgQWjQa`)
on **data-driven engines** — no hardcoded game content (immutable rule #2) —
and deliver the end-of-session **debrief flow**. The wire protocol, kiosk, and
persistence socle from M1 are reused, not rebuilt.

Out of scope for M2 (later milestone): release signing, final raster media
production, on-device hardware provisioning (device-owner), real énigme content
authoring (Nathanaël owns it — M2 ships schema + placeholder).

---

## Slices

### Slice A — Assaut (Electron) : engine + screens

**Goal:** the « Section 13 » app runs its préparation + assault sequence from
`assets/config/sequence.json`, pixel-1:1 with the maquette.

**AC:**
- All 24 maquette screens built, foreground-diff at the AA floor. ✅ (PR #24)
- Pure `assaut-sequence` engine: créate/advance/applyChoice/serialize, clamped
  0–100 « % données récupérées » score, headless unit tests. ✅ (PR #24)
- Live countdown timer per step; full-session persistence (JSON store in
  `userData`) surviving a force-kill; restore on boot. ✅ (PR #29)
- WebSocket consumer: `access-result` → routes to valide/refus; `mg-code` →
  fills the attente-code-MG screen. ✅ (PR #29)
- `sequence.json` carries the GM point-d'accès branch transitions
  (`approved`/`refused`) so the loop is end-to-end. ✅ (M2 gap-closing)

### Slice B — Attaque de Bots (React Native) : flow engine + screens

**Goal:** the orange « Section 13 » tablet app plays the A/B/C/D parcours.

**AC:**
- All 41 maquette screens built, foreground-diff at the AA floor. ✅ (PR #25)
- Pure FSM flow engine (`bots-flow.ts`, ADR-0001) over `parcours.json`
  (A/B/C/D) + `flow-templates.ts`; headless unit tests. ✅ (PR #26)
- Interactive énigme widgets; mailbox with exactly one phishing trap; events
  pushed to the NUC at completion. ✅ (PR #26)
- Maquette gradients (static-PNG fills) + Figma image fills. ✅ (PR #28 / #34)

### Slice C — Débriefing (React Native) : end-of-session aggregator

**Goal:** the GM app aggregates the session and runs the debrief.

**AC:**
- Pulls every team's `event_log` from the NUC (ADR-0002); pure stats engine
  (`src/stats`, unit-tested); "logs missing" for non-responders. ✅ (PR #27)
- GM control of the Assaut point-d'accès / MG-code loop. ✅ (PR #30)
- **GM unlock sign-in** gate before the debrief controls. ✅ (M2 gap-closing)
- **Manual Espace-1 suspect entry** (paper-based clues), persisted. ✅ (M2 gap-closing)
- **Debrief slide model + in-app preview** from stats + suspects; pure-TS slide
  builder, unit-tested. ✅ (M2 gap-closing)
- ⏳ Projector export (WebView → image set) — deferred: needs the GM maquettes
  AND a native build to verify `react-native-webview` + capture. The slide
  builder is the testable core; the projector render is a typed seam.

### Slice D — Server NUC : read-path + relay

**Goal:** the server backs the debrief + the GM↔Assaut loop.

**AC:**
- GM-only log read-path (`teams-request` / `log-request`), rejected for any
  app !== `debriefing`. ✅ (PR #27)
- Relay of the GM access verdict + MG code to the target team's Assaut app. ✅ (PR #27 / earlier)

### Slice E — Design system & docs

**AC:**
- « Section 13 » tokens (blue Assaut + orange Bots), Roboto bundled. ✅
- ADR-0001 (bots FSM) + ADR-0002 (debrief server-pull) recorded. ✅
- CHANGELOG, READMEs, rules, and CLAUDE.md milestone status reflect M2. ✅ (M2 gap-closing)

---

## Blocked on the client (not code — JSON edits / asset drops)

These do **not** block tagging the M2 engineering build; they block a *shippable
game*. Tracked so they are not mistaken for missing engineering.

**Nathanaël / CDC v1.3 (content — `sequence.json` / `parcours.json` edits):**
- Real énigme order, answers (`solution`), and scoring (`points` / per-step
  `dataRecoveredDelta`).
- **Score direction for Assaut** (start 0 ↑ vs start 100 ↓) — still unconfirmed.
- Real assault step list/order, response wording, accueil/subtitle copy.
- Confirm the point-d'accès branch targets shipped as representative defaults.

**Graphiste (raster media — drop into `assets/media/`, see `apps/assaut/assets/MEDIA-TODO.md`):**
- Backgrounds, énigme scene rasters, Choix/mail card photos, assault `.mp4`s.
- Windows app icon (`.ico`) — electron-builder currently falls back to the
  default Electron icon.
- Full-bleed off-aspect background (needs the mallette's native resolution).
- ⚠ **Licensed iStock comps** (`istockphoto-2236870662`, `iStock-1048265360`)
  are bundled for the internal review build only. They **MUST** be swapped for
  owned/licensed rasters before any shipped/sold build (legal exposure).
- Confirm the flagged maquette typo corrections + the énigme widget hit-zones.

**Hardware (on-device runtime validation):**
- APK install + kiosk (Screen Pinning) on the tablet + GM phone.
- `.exe` install + triple verrou on the mallette PC; Electron main-IPC round-trip.
- On-device Roboto text-wrap re-check (closes the harness wrap residual).

**Admin:**
- Add Nathanaël as a read collaborator on `gs-imak/code-rouge` (GitHub username pending).
- Rotate the Figma read token after M2 (it was pasted in chat; lives in `.env`).

---

## Validation — what closes M2

1. `pnpm typecheck && pnpm lint && pnpm test` green; CI green on `main`.
2. Each slice's AC met (engineering-side ticks above).
3. A demo build (APK + `.exe`) installs and runs the happy path on the target
   hardware once available (gated on Nathanaël's procurement).
4. On sign-off: tag `v0.2.0`, update `CHANGELOG.md`, archive this plan's
   throwaway parts; ADRs + CONTEXT.md stay.

Engineering can be "M2 complete (modulo client content + assets + hardware)"
before step 3 — that distinction is the point of separating the blocked list.
