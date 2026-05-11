# `@code-rouge/debriefing`

« Débriefing » — the **Game Master companion app**. Runs on an Android
smartphone (portrait), **not a player device**. Used at end-of-session to
aggregate the two player apps' logs and project debrief slides.

## Status

Full Android scaffold committed (RN-CLI generated, applicationId
rewritten to `com.coderouge.debriefing`, `KioskPackage` registered in
`MainApplication.kt`, `AndroidManifest.xml` orientation
`screenOrientation="portrait"`). See
[apps/attaque-de-bots/README.md](../attaque-de-bots/README.md#how-the-scaffold-was-generated)
for the generation recipe.

| Layer | Status |
| --- | --- |
| `index.js`, `app.json`, `metro.config.js`, `babel.config.js`, `tsconfig.json` | ✅ committed |
| `src/App.tsx` placeholder UI | ✅ committed |
| `src/kiosk.ts` TS façade | ✅ committed |
| `KioskModule.kt` + `KioskPackage.kt` (`com.coderouge.debriefing`) | ✅ committed |
| `MainActivity.kt` + `MainApplication.kt` (`com.coderouge.debriefing`) | ✅ committed (RN-CLI generated) |
| Generated Android scaffold (build.gradle, gradle wrapper, manifest, res/) | ✅ committed |
| Device build (`pnpm android`) | ⏸ needs hardware (smartphone or emulator + Android Studio) |

## Role

End-of-session aggregator. When the GM ends a session:

1. Discovers all teams' apps on the LAN (via the NUC server registry).
2. Pulls each team's full `event_log` over WebSocket.
3. Lets the GM enter manually-identified suspects from Espace 1
   (paper-based clues).
4. Computes per-team and global stats.
5. Generates slides (HTML rendered in `WebView`, captured to images for
   the vidéoprojecteur).

M1 ships the placeholder screen, kiosk lock, persistence, and the network
diagnostic dot. The debrief aggregation flow above (slide generation, log
collection, stats) is part of M2.

## Kiosk mode

Less aggressive than the player apps but still required — push
notifications during a debrief are unprofessional. Screen Pinning via the
same `Kiosk` native module. The GM holds the device-owner unlock code
and uses it to exit between sessions.

`hardwareBackPress` is intercepted at the root.

## Connection retries

If a player app is offline at debrief time, retry 3× with 2s backoff, then
mark "logs missing" in the slide and move on. **Don't block the GM.**
Implementation lands with the M2 debrief flow.

## Stats logic

`src/stats/` will hold pure functions, fully unit-tested — this is the
highest-leverage area for unit tests in the project. Implementation lands
with the M2 debrief flow.

## No real-time concerns

This app runs in-between sessions. No 60 fps target, no animations beyond
simple fades. Optimise for clarity and the GM's speed.
