# `@code-rouge/debriefing`

« Débriefing » — the **Game Master companion app**. Runs on an Android
smartphone (portrait), **not a player device**. Used at end-of-session to
aggregate the two player apps' logs and project debrief slides.

## Status — chantier 04 scaffold

Same scaffold pattern as `@code-rouge/attaque-de-bots`. The `android/`
Gradle scaffold is **not** committed yet — generate via
`npx @react-native-community/cli` and merge once. See
[apps/attaque-de-bots/README.md](../attaque-de-bots/README.md#bootstrapping-android)
for the exact incantation; substitute `Debriefing` for `AttaqueDeBots` and
`com.coderouge.debriefing` for the applicationId.

| Layer | Status |
| --- | --- |
| `index.js`, `app.json`, `metro.config.js`, `babel.config.js`, `tsconfig.json` | ✅ committed |
| `src/App.tsx` placeholder UI | ✅ committed |
| `src/kiosk.ts` TS façade | ✅ committed |
| `KioskModule.kt` + `KioskPackage.kt` (`com.coderouge.debriefing`) | ✅ committed |
| Generated Android scaffold (build.gradle, gradle wrapper, MainActivity, …) | ⛔ generate via RN CLI |

## Role

End-of-session aggregator. When the GM ends a session:

1. Discovers all teams' apps on the LAN (via the NUC server registry).
2. Pulls each team's full `event_log` over WebSocket.
3. Lets the GM enter manually-identified suspects from Espace 1
   (paper-based clues).
4. Computes per-team and global stats.
5. Generates slides (HTML rendered in `WebView`, captured to images for
   the vidéoprojecteur).

All of the above ships in chantier 05; chantier 04 lands only the placeholder
screen + kiosk lock.

## Kiosk mode

Less aggressive than the player apps but still required — push
notifications during a debrief are unprofessional. Screen Pinning via the
same `Kiosk` native module. The GM holds the device-owner unlock code
(chantier 05+) and uses it to exit between sessions.

`hardwareBackPress` is intercepted at the root.

## Connection retries

If a player app is offline at debrief time, retry 3× with 2s backoff, then
mark "logs missing" in the slide and move on. **Don't block the GM.**
Lands chantier 05+.

## Stats logic

`src/stats/` (chantier 05+). Pure functions, fully unit-tested. This is
the highest-leverage area for unit tests in the project — Nathanael will
demo it to clients.

## No real-time concerns

This app runs in-between sessions. No 60 fps target, no animations beyond
simple fades. Optimise for clarity and the GM's speed.
