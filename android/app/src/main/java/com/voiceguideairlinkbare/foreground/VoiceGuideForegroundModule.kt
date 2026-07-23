package com.voiceguideairlinkbare.foreground

import android.content.Intent
import android.util.Log
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class VoiceGuideForegroundModule(
    reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    companion object {
        private const val TAG = "VG_FOREGROUND"

        // 👉 App ID di Agora usato dal servizio
        private const val AGORA_APP_ID = "06b6f93df20e403d971de6435bc579d0"
        private const val DEFAULT_TITLE = "VoiceGuide AirLink"
        private const val DEFAULT_MESSAGE = "Tour audio in corso"

        // 👉 Chiave e valori per il ruolo (guida / ospite)
        private const val EXTRA_ROLE = "vg_role"
        private const val ROLE_GUIDE = "guide"
        private const val ROLE_LISTENER = "listener"
    }

    init {
        Log.i(TAG, "VoiceGuideForegroundModule inizializzato (React Native bridge collegato)")
    }

    override fun getName(): String = "VoiceGuideForeground"

    /**
     * Metodo "generico" che avevamo già – lo lascio per compatibilità
     * (non usa Agora, solo avvio servizio con titolo/messaggio custom).
     */
    @ReactMethod
    fun startService(title: String, message: String) {
        Log.i(
            TAG,
            "startService(generico) chiamato da JS | title=\"$title\" message=\"$message\" " +
                    "| thread=${Thread.currentThread().name}"
        )

        val context = reactApplicationContext
        val intent = Intent(context, VoiceGuideForegroundService::class.java).apply {
            putExtra(VoiceGuideForegroundService.EXTRA_TITLE, title.ifEmpty { DEFAULT_TITLE })
            putExtra(
                VoiceGuideForegroundService.EXTRA_MESSAGE,
                message.ifEmpty { DEFAULT_MESSAGE }
            )
            // Nessun ruolo specificato qui: è un uso "generico" del servizio
        }

        try {
            Log.d(TAG, "startService(generico) → avvio ContextCompat.startForegroundService")
            ContextCompat.startForegroundService(context, intent)
            Log.i(TAG, "startService(generico) → richiesto avvio servizio foreground")
        } catch (e: Exception) {
            Log.e(TAG, "Errore avvio servizio (generico)", e)
        }
    }

    /**
     * 🔊 Metodo specifico per la GUIDA con Agora:
     * - Avvia il Foreground Service
     * - Passa AppId, channelName, token, uid
     * - Imposta una notifica "Tour audio in corso"
     * - Imposta ruolo = "guide"
     */
    @ReactMethod
    fun startGuideBroadcast(channelName: String, token: String?) {
        Log.i(
            TAG,
            "startGuideBroadcast() chiamato da JS | channel=\"$channelName\" " +
                    "| tokenNull=${token == null} | thread=${Thread.currentThread().name}"
        )

        if (channelName.isBlank()) {
            Log.e(TAG, "startGuideBroadcast() fallito: channelName è vuoto o nullo")
            return
        }

        val context = reactApplicationContext
        val msg = "Tour attivo: $channelName"

        val intent = Intent(context, VoiceGuideForegroundService::class.java).apply {
            // Notifica
            putExtra(VoiceGuideForegroundService.EXTRA_TITLE, DEFAULT_TITLE)
            putExtra(VoiceGuideForegroundService.EXTRA_MESSAGE, msg)

            // 👉 Parametri Agora
            putExtra(VoiceGuideForegroundService.EXTRA_AGORA_APP_ID, AGORA_APP_ID)
            putExtra(VoiceGuideForegroundService.EXTRA_AGORA_CHANNEL, channelName)
            putExtra(VoiceGuideForegroundService.EXTRA_AGORA_TOKEN, token)
            putExtra(VoiceGuideForegroundService.EXTRA_AGORA_UID, 0)

            // 👉 Ruolo guida
            putExtra(EXTRA_ROLE, ROLE_GUIDE)
        }

        try {
            Log.d(TAG, "startGuideBroadcast() → avvio ContextCompat.startForegroundService (GUIDA)")
            ContextCompat.startForegroundService(context, intent)
            Log.i(
                TAG,
                "startGuideBroadcast() → richiesto avvio servizio foreground GUIDA " +
                        "| channel=\"$channelName\""
            )
        } catch (e: Exception) {
            Log.e(TAG, "Errore avvio broadcast guida", e)
        }
    }

    /**
     * 🎧 Metodo specifico per l’OSPITE (listener) con Agora:
     * - Avvia il Foreground Service
     * - Passa AppId, channelName, token, uid
     * - Imposta una notifica "Ascolto tour in corso"
     * - Imposta ruolo = "listener"
     */
    @ReactMethod
    fun startGuestListening(channelName: String, token: String?) {
        Log.i(
            TAG,
            "startGuestListening() chiamato da JS | channel=\"$channelName\" " +
                    "| tokenNull=${token == null} | thread=${Thread.currentThread().name}"
        )

        if (channelName.isBlank()) {
            Log.e(TAG, "startGuestListening() fallito: channelName è vuoto o nullo")
            return
        }

        val context = reactApplicationContext
        val msg = "Ascolto tour: $channelName"

        val intent = Intent(context, VoiceGuideForegroundService::class.java).apply {
            // Notifica
            putExtra(VoiceGuideForegroundService.EXTRA_TITLE, DEFAULT_TITLE)
            putExtra(VoiceGuideForegroundService.EXTRA_MESSAGE, msg)

            // 👉 Parametri Agora (stessi della guida, ma ruolo diverso)
            putExtra(VoiceGuideForegroundService.EXTRA_AGORA_APP_ID, AGORA_APP_ID)
            putExtra(VoiceGuideForegroundService.EXTRA_AGORA_CHANNEL, channelName)
            putExtra(VoiceGuideForegroundService.EXTRA_AGORA_TOKEN, token)
            putExtra(VoiceGuideForegroundService.EXTRA_AGORA_UID, 0)

            // 👉 Ruolo ospite / listener
            putExtra(EXTRA_ROLE, ROLE_LISTENER)
        }

        try {
            Log.d(TAG, "startGuestListening() → avvio ContextCompat.startForegroundService (OSPITE)")
            ContextCompat.startForegroundService(context, intent)
            Log.i(
                TAG,
                "startGuestListening() → richiesto avvio servizio foreground OSPITE " +
                        "| channel=\"$channelName\""
            )
        } catch (e: Exception) {
            Log.e(TAG, "Errore avvio ascolto ospite", e)
        }
    }

    @ReactMethod
    fun stopService() {
        Log.i(
            TAG,
            "stopService() chiamato da JS | thread=${Thread.currentThread().name}"
        )

        val context = reactApplicationContext

        // 1) STOP deterministico: invia ACTION_STOP al service (entra in onStartCommand)
        try {
            val stopIntent = Intent(context, VoiceGuideForegroundService::class.java).apply {
                action = VoiceGuideForegroundService.ACTION_STOP
            }
            Log.d(TAG, "stopService() → invio ACTION_STOP via startService")
            context.startService(stopIntent)
        } catch (e: Exception) {
            Log.e(TAG, "Errore invio ACTION_STOP", e)
        }

        // 2) Fallback: stopService classico
        try {
            val intent = Intent(context, VoiceGuideForegroundService::class.java)
            val stopped = context.stopService(intent)
            Log.i(TAG, "stopService() fallback → stopService() restituisce=$stopped")
        } catch (e: Exception) {
            Log.e(TAG, "Errore stop servizio (fallback)", e)
        }
    }
}