## Summary

<!-- 1-3 bullets describing what this PR does and why. -->

-

## Type of change

<!-- Tick all that apply. -->

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `refactor` — code restructure, no behaviour change
- [ ] `docs` — documentation only
- [ ] `chore` — tooling, dependencies, CI
- [ ] `test` — tests only
- [ ] `perf` — performance improvement

## Affected scope

<!-- Tick all that apply. Touching a load-bearing item requires manual review. -->

- [ ] `apps/attaque-de-bots`
- [ ] `apps/assaut`
- [ ] `apps/debriefing`
- [ ] `apps/server-nuc`
- [ ] `packages/design-system`
- [ ] `packages/shared-types`
- [ ] `packages/shared-utils`
- [ ] CI / tooling
- [ ] Documentation only

## Load-bearing change checklist

<!-- Tick if this PR touches any item below. These require manual review per
docs/CONTRIBUTING.md § Load-bearing rules. -->

- [ ] Kiosk lock (Electron flags, globalShortcut, Screen Pinning)
- [ ] Persistence model (electron-store, AsyncStorage, SQLite schema)
- [ ] WebSocket protocol (`packages/shared-types/src/messages.ts`)
- [ ] Data-driven config schema (`packages/shared-types/configs/*`)
- [ ] NUC deployment (`tools/scripts/install-nuc.sh`)
- [ ] None of the above

## Verification

<!-- How was this change verified locally? -->

- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green
- [ ] `pnpm test` green (note the number of tests passing: ___/___)
- [ ] Manual smoke test described below

<!-- Manual smoke test description: -->

## Screenshots / recordings

<!-- For UI changes — drop screenshots or short clips here. Skip for backend / infra. -->

## Related issues

<!-- Closes #123, refs #456, etc. -->
