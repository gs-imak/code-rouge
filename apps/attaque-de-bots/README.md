# `@code-rouge/attaque-de-bots`

« Attaque de Bots » — the Espace 2 application. Runs on an Android tablet
(10" landscape), in **kiosk mode** via Android Screen Pinning. Built on
React Native (bare TypeScript template, **not** Expo — kiosk requires
native modules).

## Status

Full Android scaffold committed. JS/TS layer + Kotlin native module + the
Gradle tree generated from `npx @react-native-community/cli init` (RN
0.85.2), with applicationId rewritten to `com.coderouge.attaquedebots`
and `KioskPackage` registered in `MainApplication.kt`. `pnpm android`
will build once a connected device or emulator is available — that's
the only remaining gate.

| Layer | Status |
| --- | --- |
| `index.js`, `app.json`, `metro.config.js`, `babel.config.js`, `tsconfig.json` | ✅ committed |
| `src/App.tsx` placeholder UI | ✅ committed |
| `src/kiosk.ts` TS façade for the native module | ✅ committed |
| `android/app/src/main/java/com/coderouge/attaquedebots/KioskModule.kt` + `KioskPackage.kt` | ✅ committed (chantier 04) |
| `android/app/src/main/java/com/coderouge/attaquedebots/MainActivity.kt` + `MainApplication.kt` | ✅ committed (RN-CLI generated, KioskPackage registered) |
| `android/build.gradle`, `android/app/build.gradle`, gradle wrapper, `AndroidManifest.xml` (`screenOrientation="landscape"`), `res/` | ✅ committed |
| Device build (`pnpm android`) | ⏸ needs hardware (tablet or emulator + Android Studio) |

## How the scaffold was generated

```bash
cd /tmp
npx @react-native-community/cli@latest init AttaqueDeBots \
  --version 0.85.2 --skip-install --skip-git-init --pm npm
cp -r AttaqueDeBots/android <repo>/apps/attaque-de-bots/

# Then the post-generation rewrites:
#   - app/build.gradle: namespace + applicationId → com.coderouge.attaquedebots
#   - Move com/attaquedebots/{MainActivity,MainApplication}.kt
#       → com/coderouge/attaquedebots/
#   - Update package decl in those two files
#   - MainApplication.kt: getPackages() now also calls add(KioskPackage())
#   - AndroidManifest.xml: <activity ... android:screenOrientation="landscape">
```

Anyone re-running the scaffold (e.g. for an RN version bump) should
follow the same recipe. The substitutions are mechanical — a future
`tools/scripts/integrate-rn-android.sh` could automate them.

## Local dev (after `android/` exists)

```bash
# Connect a device or start an emulator first:
adb devices

pnpm dev --filter @code-rouge/attaque-de-bots         # Metro server only
pnpm android --filter @code-rouge/attaque-de-bots     # build + install + launch
```

## Kiosk lock — Screen Pinning

`src/kiosk.ts` calls into `KioskModule.kt`, which calls
`Activity.startLockTask()` (Android's lock-task / Screen Pinning API).

- **Production:** the tablet is provisioned device-owner mode by
  Nathanael's hardware team during initial provisioning (`adb shell dpm
  set-device-owner ...`). Lock-task in device-owner mode is **persistent
  and non-dismissable** — the player cannot exit by any combination of
  Home / Recents / Back / swipe / notification shade.
- **Development:** Screen Pinning must be enabled manually in
  Settings → Security → Screen Pinning. The error path in `App.tsx`
  surfaces this when the call fails.

`hardwareBackPress` is intercepted at the root in `App.tsx` (returning
`true` signals to RN that we handled it).

Verify after install:

```bash
adb shell dumpsys activity | grep "Lock Task"
# Expect: mLockTaskModeState=LOCKED  mLockTaskController=...
```

## Performance budget

60 fps on the target tablet. List screens use `FlashList` (not `FlatList`).
`useCallback` / `memo` aggressively on hot props. Animations via
Reanimated 3 once added (chantier 05+).

## Configuration

`assets/config/parcours.json` (the A/B/C/D parcours matrix) and
`assets/config/mailbox.json` (the phishing mailbox — exactly one trap mail)
drive the flow engine (ADR-0001), validated at boot against the schemas in
`@code-rouge/shared-types`. Énigme order, answers (`solution`), and scoring
(`points`) are JSON edits, no recompile. **Never hardcode game content.**

## Network

Only the NUC server's WebSocket (`/ws`) and HTTP (`/health`). No external
HTTP at runtime. The runtime app talks to the NUC at the venue's LAN IP,
which the GM enters once at session start (chantier 05+).
