import { NativeModules } from 'react-native'

// Thin TS façade over the Kotlin KioskModule. Both RN apps ship the same
// native module under their respective Android packages
// (com.coderouge.attaquedebots / com.coderouge.debriefing).
//
// The module wraps Android's `ActivityManager.startLockTask()` (Screen
// Pinning). In production the device is provisioned in **device-owner**
// mode by Nathanael's hardware team, which makes the pinning persistent
// and not user-dismissable. In development without device-owner, the user
// must grant Screen Pinning manually in Settings → Security → Screen
// Pinning before this call succeeds.

interface KioskNativeModule {
  startLockTask(): Promise<boolean>
  stopLockTask(): Promise<boolean>
}

const native = NativeModules['Kiosk'] as KioskNativeModule | undefined

export const isKioskAvailable: boolean = native !== undefined

export class KioskNotAvailableError extends Error {
  override readonly name = 'KioskNotAvailableError'
}

export async function startScreenPinning(): Promise<void> {
  if (native === undefined) {
    throw new KioskNotAvailableError(
      'Kiosk native module not linked — verify android/app/src/main/java/.../KioskPackage.kt is registered in MainApplication.kt',
    )
  }
  await native.startLockTask()
}

export async function stopScreenPinning(): Promise<void> {
  if (native === undefined) {
    throw new KioskNotAvailableError('Kiosk native module not linked')
  }
  await native.stopLockTask()
}
