package com.voiceguideairlinkbare

import android.app.Application
import android.util.Log
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeHost
import com.facebook.react.ReactPackage
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
import com.facebook.react.defaults.DefaultReactNativeHost
import com.facebook.soloader.SoLoader
import com.facebook.react.soloader.OpenSourceMergedSoMapping
import com.voiceguideairlinkbare.foreground.VoiceGuideForegroundPackage

class MainApplication : Application(), ReactApplication {

    companion object {
        private const val TAG = "VG_FOREGROUND"
    }

    override val reactNativeHost: ReactNativeHost =
        object : DefaultReactNativeHost(this) {

            override fun getPackages(): List<ReactPackage> =
                PackageList(this).packages.apply {
                    // Pacchetto nativo per il servizio in foreground
                    add(VoiceGuideForegroundPackage())
                }

            override fun getJSMainModuleName(): String = "index"

            override fun getUseDeveloperSupport(): Boolean = BuildConfig.DEBUG

            // Flag generati da Gradle (newArchEnabled / hermesEnabled)
            override val isNewArchEnabled: Boolean = BuildConfig.IS_NEW_ARCHITECTURE_ENABLED
            override val isHermesEnabled: Boolean = BuildConfig.IS_HERMES_ENABLED
        }

    override val reactHost: ReactHost
        get() = getDefaultReactHost(this.applicationContext, reactNativeHost)

    override fun onCreate() {
        super.onCreate()
        // Inizializzazione corretta per le librerie native merge-ate (RN 0.76)
        SoLoader.init(this, OpenSourceMergedSoMapping)

        Log.i(
            TAG,
            "MainApplication.onCreate – app avviata, SoLoader.init eseguito"
        )
        // 🔴 Importante: NIENTE chiamata a DefaultNewArchitectureEntryPoint.load()
    }
}
