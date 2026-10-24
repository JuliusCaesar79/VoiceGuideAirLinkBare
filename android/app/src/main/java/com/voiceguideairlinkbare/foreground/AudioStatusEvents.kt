package com.voiceguideairlinkbare.foreground

/**
 * Ponte tra il Foreground Service (dove gira Agora) e il modulo React Native.
 *
 * Il servizio non ha accesso al contesto React: pubblica qui gli eventi audio
 * (stato connessione, qualità rete, ritardo) e il modulo, se presente, li
 * inoltra a JS come evento "VGAudioStatus". Stesso processo, quindi basta
 * un riferimento statico.
 */
object AudioStatusEvents {
    @Volatile
    var sink: ((Map<String, Any>) -> Unit)? = null

    fun emit(payload: Map<String, Any>) {
        try {
            sink?.invoke(payload)
        } catch (_: Exception) {
            // JS non pronto o bridge chiuso: l'evento si perde, l'audio no
        }
    }
}
