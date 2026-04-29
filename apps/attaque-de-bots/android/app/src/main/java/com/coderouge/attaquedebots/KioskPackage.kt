package com.coderouge.attaquedebots

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

/**
 * Registered in `MainApplication.kt` via `getPackages()`:
 *
 *     override fun getPackages(): List<ReactPackage> = PackageList(this).packages.apply {
 *       add(KioskPackage())
 *     }
 *
 * (Or via autolinking once `react-native config` discovers it — see
 * `react-native.config.js` if added.)
 */
class KioskPackage : ReactPackage {

  override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
    return listOf(KioskModule(reactContext))
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    return emptyList()
  }
}
