package com.voiceguideairlinkbare.foreground

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import android.util.Log
import androidx.core.app.NotificationCompat
import com.voiceguideairlinkbare.R

// 👉 Agora imports
import io.agora.rtc2.ChannelMediaOptions
import io.agora.rtc2.Constants
import io.agora.rtc2.IRtcEngineEventHandler
import io.agora.rtc2.RtcEngine
import io.agora.rtc2.RtcEngineConfig

class VoiceGuideForegroundService : Service() {

    companion object {
        private const val TAG = "VG_FOREGROUND"

        const val CHANNEL_ID = "voiceguide_foreground_channel"
        const val CHANNEL_NAME = "VoiceGuide AirLink"
        const val NOTIFICATION_ID = 42
        const val EXTRA_TITLE = "title"
        const val EXTRA_MESSAGE = "message"

        // 🔊 Extras per Agora
        const val EXTRA_AGORA_APP_ID = "agora_app_id"
        const val EXTRA_AGORA_CHANNEL = "agora_channel"
        const val EXTRA_AGORA_TOKEN = "agora_token"
        const val EXTRA_AGORA_UID = "agora_uid"

        // 🎭 Extras per RUOLO (guida / ospite)
        const val EXTRA_ROLE = "vg_role"
        const val ROLE_GUIDE = "guide"
        const val ROLE_LISTENER = "listener"
    }

    private var rtcEngine: RtcEngine? = null

    // Handler minimo solo per log (puoi arricchirlo in futuro)
    private val rtcEventHandler = object : IRtcEngineEventHandler() {
        override fun onJoinChannelSuccess(channel: String?, uid: Int, elapsed: Int) {
            Log.i(TAG, "Agora onJoinChannelSuccess: channel=$channel uid=$uid elapsed=$elapsed")
        }

        override fun onUserJoined(uid: Int, elapsed: Int) {
            Log.i(TAG, "Agora onUserJoined: remote uid=$uid elapsed=$elapsed")
        }

        override fun onUserOffline(uid: Int, reason: Int) {
            Log.i(TAG, "Agora onUserOffline: remote uid=$uid reason=$reason")
        }

        override fun onError(err: Int) {
            Log.e(TAG, "Agora onError: code=$err")
        }
    }

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "VoiceGuideForegroundService.onCreate()")
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(
            TAG,
            "onStartCommand() | startId=$startId flags=$flags intent=$intent " +
                    "| thread=${Thread.currentThread().name}"
        )

        // 🔥 Fake MIC USE per soddisfare Android 14 (tipo foreground microphone)
        try {
            val sampleRate = 8000
            val bufferSize = android.media.AudioRecord.getMinBufferSize(
                sampleRate,
                android.media.AudioFormat.CHANNEL_IN_MONO,
                android.media.AudioFormat.ENCODING_PCM_16BIT
            )
            val recorder = android.media.AudioRecord(
                android.media.MediaRecorder.AudioSource.MIC,
                sampleRate,
                android.media.AudioFormat.CHANNEL_IN_MONO,
                android.media.AudioFormat.ENCODING_PCM_16BIT,
                bufferSize
            )
            recorder.startRecording()
            recorder.read(ByteArray(bufferSize), 0, bufferSize)
            recorder.stop()
            recorder.release()
            Log.d(TAG, "Fake MIC check OK (Android 14 foreground requirement)")
        } catch (e: Exception) {
            Log.e(TAG, "Fake MIC check failed", e)
        }

        val title = intent?.getStringExtra(EXTRA_TITLE) ?: "VoiceGuide AirLink"
        val message = intent?.getStringExtra(EXTRA_MESSAGE)
            ?: "Servizio attivo in background"

        // 🎭 Leggiamo il ruolo richiesto (default: guida)
        val role = intent?.getStringExtra(EXTRA_ROLE) ?: ROLE_GUIDE
        Log.i(TAG, "Ruolo richiesto per il servizio: $role")

        val notificationIntent =
            Intent(this, Class.forName("com.voiceguideairlinkbare.MainActivity"))

        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            notificationIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val builder = NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(message)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setContentIntent(pendingIntent)
            .setForegroundServiceBehavior(
                NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE
            )

        val notification = builder.build()

        Log.i(TAG, "startForeground() → NOTIFICATION_ID=$NOTIFICATION_ID")
        startForeground(NOTIFICATION_ID, notification)

        // 🔊 AVVIO AGORA con ruolo specifico (guida / ospite)
        startAgoraFromIntent(intent, role)

        return START_STICKY
    }

    override fun onDestroy() {
        Log.i(TAG, "onDestroy() chiamato – cleanup Agora e stopForeground")

        // 🔊 Cleanup Agora
        try {
            rtcEngine?.leaveChannel()
            Log.d(TAG, "Agora leaveChannel() chiamato")
            RtcEngine.destroy()
            rtcEngine = null
            Log.i(TAG, "Agora engine destroyed")
        } catch (e: Exception) {
            Log.e(TAG, "Error destroying Agora engine", e)
        }

        try {
            stopForeground(STOP_FOREGROUND_REMOVE)
            Log.d(TAG, "stopForeground(STOP_FOREGROUND_REMOVE) eseguito")
        } catch (e: Exception) {
            Log.e(TAG, "Errore stopForeground", e)
        }

        super.onDestroy()
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            val existing = manager.getNotificationChannel(CHANNEL_ID)
            if (existing == null) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_DEFAULT
                )
                channel.description = "Notifiche del servizio VoiceGuide AirLink"
                manager.createNotificationChannel(channel)
                Log.d(TAG, "NotificationChannel creato")
            } else {
                Log.d(TAG, "NotificationChannel già esistente")
            }
        } else {
            Log.d(TAG, "Nessun NotificationChannel richiesto (SDK < 26)")
        }
    }

    // ---------------------------------------------------------
    // 🔊 BLOCCO AGORA: init + join channel
    // ---------------------------------------------------------

    private fun initAgora(appId: String) {
        if (rtcEngine != null) {
            Log.d(TAG, "initAgora() chiamato ma rtcEngine esiste già, skip init")
            return
        }

        try {
            val config = RtcEngineConfig().apply {
                mContext = applicationContext
                mAppId = appId
                mEventHandler = rtcEventHandler
            }

            rtcEngine = RtcEngine.create(config)

            rtcEngine?.apply {
                // Solo audio, profilo live broadcasting
                setChannelProfile(Constants.CHANNEL_PROFILE_LIVE_BROADCASTING)

                // 🎧 Profilo audio alta qualità + scenario di base (compatibile)
                setAudioProfile(Constants.AUDIO_PROFILE_MUSIC_HIGH_QUALITY)
                setAudioScenario(Constants.AUDIO_SCENARIO_DEFAULT)

                enableAudio()
            }

            Log.i(
                TAG,
                "Agora engine initialized (MUSIC_HIGH_QUALITY + SCENARIO_DEFAULT) con appId=$appId"
            )
        } catch (e: Exception) {
            Log.e(TAG, "Errore init Agora", e)
        }
    }

    private fun startAgoraFromIntent(intent: Intent?, role: String) {
        if (intent == null) {
            Log.e(TAG, "startAgoraFromIntent() fallito: intent nullo, niente Agora")
            return
        }

        val appId = intent.getStringExtra(EXTRA_AGORA_APP_ID)
        val channelName = intent.getStringExtra(EXTRA_AGORA_CHANNEL)
        val token = intent.getStringExtra(EXTRA_AGORA_TOKEN)
        val uid = intent.getIntExtra(EXTRA_AGORA_UID, 0)

        Log.i(
            TAG,
            "startAgoraFromIntent() | appIdNull=${appId == null} " +
                    "channel=\"$channelName\" tokenNull=${token == null} uid=$uid ruolo=$role"
        )

        if (appId.isNullOrEmpty() || channelName.isNullOrEmpty()) {
            Log.e(TAG, "AppId o channelName mancanti, skip Agora")
            return
        }

        initAgora(appId)

        val engine = rtcEngine ?: run {
            Log.e(TAG, "rtcEngine nullo dopo init, skip joinChannel")
            return
        }

        // 🎭 Impostiamo il ruolo sul motore
        val clientRole = if (role == ROLE_LISTENER) {
            Constants.CLIENT_ROLE_AUDIENCE
        } else {
            Constants.CLIENT_ROLE_BROADCASTER
        }
        engine.setClientRole(clientRole)
        Log.i(TAG, "ClientRole impostato a: $clientRole (ruolo=$role)")

        // 🎛 Opzioni di canale specifiche per ruolo
        val options = ChannelMediaOptions().apply {
            channelProfile = Constants.CHANNEL_PROFILE_LIVE_BROADCASTING
            clientRoleType = clientRole

            autoSubscribeAudio = true
            autoSubscribeVideo = false

            publishMicrophoneTrack = role != ROLE_LISTENER
            publishCameraTrack = false
        }

        val res = engine.joinChannel(token, channelName, uid, options)
        Log.i(
            TAG,
            "joinChannel() result = $res (0 = OK), ruolo=$role channel=\"$channelName\""
        )
    }
}
