#!/usr/bin/env bash
# Build debug APKs for Attaque de Bots and Débriefing via the per-app
# Gradle wrapper.
#
# Pre-requisites (CI installs them in the build-android job):
#   - JDK 17 (Temurin)
#   - Android SDK platform-tools + platforms;android-36 + build-tools;36.0.0
#   - pnpm install --frozen-lockfile already ran (so workspace node_modules
#     is populated; the React Native gradle plugin reads
#     ../../node_modules/react-native from each app's android/ dir, which
#     resolves to the workspace root under our pnpm hoisted layout).
#
# Outputs:
#   apps/attaque-de-bots/android/app/build/outputs/apk/debug/app-debug.apk
#   apps/debriefing/android/app/build/outputs/apk/debug/app-debug.apk
#
# CI uploads both as the `code-rouge-apks` artifact (14-day retention).

set -euo pipefail

# `pnpm build:android` is invoked from the workspace root, so paths here
# are root-relative.
APPS=(attaque-de-bots debriefing)

for app in "${APPS[@]}"; do
  android_dir="apps/${app}/android"
  if [[ ! -x "${android_dir}/gradlew" ]]; then
    printf '✗ %s: gradlew missing or not executable at %s\n' "${app}" "${android_dir}/gradlew" >&2
    exit 1
  fi

  # Generate the debug keystore if missing. Android Studio creates this
  # automatically on first build of a fresh checkout, but bare CI / fresh
  # `git clone` doesn't have AS. The keystore is intentionally NOT tracked
  # in git (release signing is a separate keystore managed off-repo per
  # docs/architecture.md § Signing). Standard Android debug keystore
  # parameters — alias `androiddebugkey`, password `android`, 10000-day
  # validity. Anyone holding this key can sign DEBUG-builds only.
  keystore="${android_dir}/app/debug.keystore"
  if [[ ! -f "${keystore}" ]]; then
    printf 'Generating debug keystore for %s\n' "${app}"
    keytool -genkeypair -noprompt \
      -keystore "${keystore}" \
      -storepass android \
      -keypass android \
      -alias androiddebugkey \
      -keyalg RSA -keysize 2048 -validity 10000 \
      -dname 'CN=Android Debug,O=Android,C=US'
  fi

  printf '\n=== Building %s ===\n' "${app}"
  ( cd "${android_dir}" && ./gradlew --no-daemon --console=plain assembleDebug )
done

printf '\nDone. APKs:\n'
for app in "${APPS[@]}"; do
  apk="apps/${app}/android/app/build/outputs/apk/debug/app-debug.apk"
  if [[ -f "${apk}" ]]; then
    size=$(stat -c%s "${apk}" 2>/dev/null || stat -f%z "${apk}")
    printf '  %s (%s bytes)\n' "${apk}" "${size}"
  else
    printf '  ✗ MISSING: %s\n' "${apk}" >&2
    exit 1
  fi
done
