import Foundation
import AgoraRtcKit

/// Equivalente iOS di VoiceGuideForegroundModule.kt + VoiceGuideForegroundService.kt (Android).
/// Su iOS non esiste il concetto di "foreground service": l'audio in background è
/// gestito da UIBackgroundModes (audio) + dall'AVAudioSession che l'SDK Agora imposta
/// da solo al join del canale, quindi qui serve solo l'init/join/leave del motore Agora.
@objc(VoiceGuideForeground)
class VoiceGuideForeground: NSObject {

    private static let TAG = "VG_FOREGROUND"

    // 👉 App ID di Agora (stesso usato su Android)
    private static let AGORA_APP_ID = "06b6f93df20e403d971de6435bc579d0"

    // 👉 Ruoli (guida / ospite)
    private static let ROLE_GUIDE = "guide"
    private static let ROLE_LISTENER = "listener"

    private var rtcEngine: AgoraRtcEngineKit?

    @objc func startService(_ title: String, message: String) {
        NSLog("[\(Self.TAG)] startService(generico) chiamato da JS | title=\"\(title)\" message=\"\(message)\"")
        // Nessuna azione su iOS: uso "generico" storico, non avvia Agora.
    }

    @objc func startGuideBroadcast(_ channelName: String, token: String?) {
        NSLog("[\(Self.TAG)] startGuideBroadcast() chiamato da JS | channel=\"\(channelName)\" tokenNull=\(token == nil)")

        guard !channelName.isEmpty else {
            NSLog("[\(Self.TAG)] startGuideBroadcast() fallito: channelName è vuoto")
            return
        }

        startAgora(channelName: channelName, token: token, role: Self.ROLE_GUIDE)
    }

    @objc func startGuestListening(_ channelName: String, token: String?) {
        NSLog("[\(Self.TAG)] startGuestListening() chiamato da JS | channel=\"\(channelName)\" tokenNull=\(token == nil)")

        guard !channelName.isEmpty else {
            NSLog("[\(Self.TAG)] startGuestListening() fallito: channelName è vuoto")
            return
        }

        startAgora(channelName: channelName, token: token, role: Self.ROLE_LISTENER)
    }

    @objc func stopService() {
        NSLog("[\(Self.TAG)] stopService() chiamato da JS")
        hardCleanup(reason: "stopService")
    }

    // MARK: - Agora: init + join

    private func initAgora() {
        guard rtcEngine == nil else {
            NSLog("[\(Self.TAG)] initAgora() chiamato ma rtcEngine esiste già, skip init")
            return
        }

        let config = AgoraRtcEngineConfig()
        config.appId = Self.AGORA_APP_ID

        let engine = AgoraRtcEngineKit.sharedEngine(with: config, delegate: self)

        // Solo audio, profilo live broadcasting
        engine.setChannelProfile(.liveBroadcasting)

        // 🎧 Profilo voce (non musica), come su Android
        engine.setAudioProfile(.speechStandard)
        engine.setAudioScenario(.default)

        engine.enableAudio()

        rtcEngine = engine
        NSLog("[\(Self.TAG)] Agora engine initialized (SPEECH_STANDARD + SCENARIO_DEFAULT) con appId=\(Self.AGORA_APP_ID)")
    }

    private func startAgora(channelName: String, token: String?, role: String) {
        initAgora()

        guard let engine = rtcEngine else {
            NSLog("[\(Self.TAG)] rtcEngine nullo dopo init, skip joinChannel")
            return
        }

        let clientRole: AgoraClientRole = (role == Self.ROLE_LISTENER) ? .audience : .broadcaster
        engine.setClientRole(clientRole)
        NSLog("[\(Self.TAG)] ClientRole impostato a: \(clientRole.rawValue) (ruolo=\(role))")

        let options = AgoraRtcChannelMediaOptions()
        options.channelProfile = .liveBroadcasting
        options.clientRoleType = clientRole
        options.autoSubscribeAudio = true
        options.autoSubscribeVideo = false
        options.publishMicrophoneTrack = role != Self.ROLE_LISTENER
        options.publishCameraTrack = false

        let result = engine.joinChannel(
            byToken: token,
            channelId: channelName,
            uid: 0,
            mediaOptions: options,
            joinSuccess: nil
        )
        NSLog("[\(Self.TAG)] joinChannel() result = \(result) (0 = OK), ruolo=\(role) channel=\"\(channelName)\"")
    }

    private func hardCleanup(reason: String) {
        NSLog("[\(Self.TAG)] HARD_CLEANUP_START reason=\(reason) engineNull=\(rtcEngine == nil)")

        rtcEngine?.leaveChannel(nil)
        AgoraRtcEngineKit.destroy()
        rtcEngine = nil

        NSLog("[\(Self.TAG)] HARD_CLEANUP_END reason=\(reason)")
    }
}

// MARK: - AgoraRtcEngineDelegate (solo log, come il rtcEventHandler Android)

extension VoiceGuideForeground: AgoraRtcEngineDelegate {

    func rtcEngine(_ engine: AgoraRtcEngineKit, didJoinChannel channel: String, withUid uid: UInt, elapsed: Int) {
        NSLog("[\(Self.TAG)] Agora didJoinChannel: channel=\(channel) uid=\(uid) elapsed=\(elapsed)")
    }

    func rtcEngine(_ engine: AgoraRtcEngineKit, didJoinedOfUid uid: UInt, elapsed: Int) {
        NSLog("[\(Self.TAG)] Agora didJoinedOfUid: remote uid=\(uid) elapsed=\(elapsed)")
    }

    func rtcEngine(_ engine: AgoraRtcEngineKit, didOfflineOfUid uid: UInt, reason: AgoraUserOfflineReason) {
        NSLog("[\(Self.TAG)] Agora didOfflineOfUid: remote uid=\(uid) reason=\(reason.rawValue)")
    }

    func rtcEngine(_ engine: AgoraRtcEngineKit, didOccurError errorCode: AgoraErrorCode) {
        NSLog("[\(Self.TAG)] Agora didOccurError: code=\(errorCode.rawValue)")
    }
}
