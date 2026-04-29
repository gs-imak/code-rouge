import { NativeModules } from 'react-native'

// See apps/attaque-de-bots/src/kiosk.ts for the design rationale. The
// debriefing app is the GM's companion — kiosk mode is still required so
// the phone doesn't surface notifications during a session, but the GM
// has the device-owner unlock code (chantier 05+) to exit between
// sessions.

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
