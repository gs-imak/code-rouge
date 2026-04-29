package com.coderouge.attaquedebots

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Native bridge to Android's lock-task (Screen Pinning) API.
 *
 * In production the tablet is provisioned device-owner via ADB during
 * initial setup — `dpm set-device-owner com.coderouge.attaquedebots/...
 * .DeviceAdminReceiver`. Once device-owner, lock-task can be started
 * without user prompt and is non-dismissable.
 *
 * In development, Screen Pinning must be enabled by the user in
 * Settings → Security → Screen Pinning, and the user can dismiss it.
 * The `SecurityException` path below covers "not granted yet."
 */
class KioskModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = NAME

  @ReactMethod
  fun startLockTask(promise: Promise) {
    val activity = currentActivity
    if (activity == null) {
      promise.reject(ERR_NO_ACTIVITY, "currentActivity is null")
      return
    }
    activity.runOnUiThread {
      try {
        activity.startLockTask()
        promise.resolve(true)
      } catch (e: SecurityException) {
        promise.reject(
          ERR_LOCK_TASK_NOT_PERMITTED,
          "Screen Pinning is not granted. Enable it in Settings → Security → Screen Pinning, " +
            "or provision the device in device-owner mode.",
          e,
        )
      } catch (e: Exception) {
        promise.reject(ERR_LOCK_TASK_FAILED, e.message ?: e.javaClass.simpleName, e)
      }
    }
  }

  @ReactMethod
  fun stopLockTask(promise: Promise) {
    val activity = currentActivity
    if (activity == null) {
      promise.reject(ERR_NO_ACTIVITY, "currentActivity is null")
      return
    }
    activity.runOnUiThread {
      try {
        activity.stopLockTask()
        promise.resolve(true)
      } catch (e: Exception) {
        promise.reject(ERR_STOP_LOCK_FAILED, e.message ?: e.javaClass.simpleName, e)
      }
    }
  }

  companion object {
    const val NAME = "Kiosk"
    private const val ERR_NO_ACTIVITY = "NO_ACTIVITY"
    private const val ERR_LOCK_TASK_NOT_PERMITTED = "LOCK_TASK_NOT_PERMITTED"
    private const val ERR_LOCK_TASK_FAILED = "LOCK_TASK_FAILED"
    private const val ERR_STOP_LOCK_FAILED = "STOP_LOCK_FAILED"
  }
}
