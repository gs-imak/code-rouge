# `@code-rouge/attaque-de-bots`

« Attaque de Bots » — the Espace 2 application. Runs on an Android tablet
(10" landscape), in **kiosk mode** via Android Screen Pinning. Built on
React Native (bare TypeScript template, **not** Expo — kiosk requires
native modules).

## Status — chantier 04 scaffold

This package ships the JavaScript / TypeScript layer plus the Kotlin source
for the `Kiosk` native module. The full `android/` Gradle scaffold (build
files, gradle wrapper, MainActivity / MainApplication, resources) is
**not** committed yet — it must be generated once via the React Native
CLI before the app can build. See "Bootstrapping `android/`" below.

| Layer | Status |
| --- | --- |
| `index.js`, `app.json`, `metro.config.js`, `babel.config.js`, `tsconfig.json` | ✅ committed |
| `src/App.tsx` placeholder UI | ✅ committed |
| `src/kiosk.ts` TS façade for the native module | ✅ committed |
| `android/app/src/main/java/com/coderouge/attaquedebots/KioskModule.kt` + `KioskPackage.kt` | ✅ committed |
| `android/build.gradle`, `android/app/build.gradle`, `gradle/wrapper`, `MainActivity.kt`, `MainApplication.kt`, `AndroidManifest.xml`, `res/` | ⛔ generate via `npx @react-native-community/cli init` (see below) |

## Bootstrapping `android/`

On the first device-build session, generate the missing Android scaffold:

```bash
# In a scratch dir, NOT inside the monorepo:
cd /tmp
npx @react-native-community/cli@latest init AttaqueDeBots \
  --version 0.85 \
  --skip-install

# Copy the generated android/ tree into this package, MINUS the bits we
# already have (KioskModule.kt, KioskPackage.kt, package configs):
cp -r AttaqueDeBots/android C:/Users/33769/CodeRouge/apps/attaque-de-bots/

# Adjust applicationId / namespace in android/app/build.gradle to
# `com.coderouge.attaquedebots` (the CLI defaults to `com.attaquedebots`).
# The Kotlin sources we ship live under that package — they will not
# compile if the namespace doesn't match.

# Register the kiosk package in android/app/src/main/java/.../MainApplication.kt:
#   override fun getPackages(): List<ReactPackage> = PackageList(this).packages.apply {
#     add(com.coderouge.attaquedebots.KioskPackage())
#   }

# In android/app/src/main/AndroidManifest.xml, declare LOCK_TASK and the
# screen orientation:
#   <activity ... android:screenOrientation="landscape" android:launchMode="singleTop" />
#   The LOCK_TASK permission isn't user-grantable; device-owner mode
#   substitutes for it in production.

# From the workspace root:
pnpm install
pnpm android --filter @code-rouge/attaque-de-bots
```

Once the generated scaffold is integrated, this README's status table flips
to ✅ across the board. **Commit the generated files in a separate PR**
labelled `chantier 04 follow-up — Android scaffold` so the monorepo's
chantier-04 PR stays focused on the kiosk integration code.

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

`assets/config/parcours.json` (matrix A/B/C/D, lands chantier 05+),
`assets/config/mailbox.json` (phishing mailbox, also chantier 05+). Schemas
will live in `@code-rouge/shared-types`. **Never hardcode game content** —
data-driven from JSON validated at boot.

## Network

Only the NUC server's WebSocket (`/ws`) and HTTP (`/health`). No external
HTTP at runtime. The runtime app talks to the NUC at the venue's LAN IP,
which the GM enters once at session start (chantier 05+).
