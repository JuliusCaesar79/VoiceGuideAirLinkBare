# Sessione 22 ottobre 2026 — Revisione VoiceGuide AirLink

> **Superato dal 23-10:** il redesign dell'app è stato abbandonato e i fix del backend sono online. Riparti da `2026-10-23-sessione.md`.

Documento di ripresa: cosa abbiamo fatto, cosa abbiamo deciso, cosa resta da controllare/fare alla prossima sessione.

---

## 1. Punto di partenza

Richiesta di Stefano (revisione generale):
- restyling del sito voiceguideapp.com (più moderno, animato, più snello);
- email automatiche più belle (HTML con logo);
- acquisto e richiesta prova gratuita più semplici;
- revisione di tutto il codice (app, backend, sito);
- risparmio su Google Workspace, paura che le email non arrivino;
- revisione privacy;
- app più moderna, idee "wow".

Feedback del cliente **Gianluca Marasco** (tour del 19–20 ottobre, 35 ospiti over 70):
1. alcuni ospiti non avevano scaricato l'app nonostante l'avviso → ritardo alla partenza;
2. 1–2 secondi di ritardo tra voce/labiale della guida e audio in cuffia;
3. ticchettio/interferenze verso la fine di un tour di ~2 ore;
4. un ospite uscito dall'app, rientrando, riceveva "Session full" anche se il gruppo non era pieno;
5. preferisce acquisti singoli, non abbonamenti.

Il 21 ottobre gli è stato regalato un codice da 50 ospiti (`VG-LIC-B0732C9A`) per un'uscita natalizia; ci manderà un nuovo feedback.

---

## 2. Scoperte importanti

- **L'app sugli store è `C:\Users\stefa\VoiceGuideAirlinkBare`** (React Native "bare", pacchetto `com.voiceguideairlinkbare`, GitHub `JuliusCaesar79/VoiceGuideAirLinkBare`).
  La cartella `Desktop\voiceguide_airlink_app` è un vecchio prototipo di novembre 2025, mai messo su GitHub: si può archiviare.
- **Il modulo audio iOS non è su GitHub**: nel repo, la cartella `ios/` contiene solo il progetto iniziale. Il modulo nativo `VoiceGuideForeground` per iPhone esiste solo sul Mac. Rischio di perdita e impedisce di usare EAS.
- **Email**: il dominio è configurato bene (SPF, DKIM per Google e Resend, DMARC `p=none`). Le email automatiche del backend sito possono usare Resend (`EMAIL_PROVIDER=resend`) — da verificare su Railway che sia davvero attivo.
- **DNS** del dominio su Aruba.
- **Railway**: il deploy automatico del backend AirLink non è partito. Lanciando il deploy a mano risponde `Deploys have been paused due to an upstream issue` (problema di Railway, non nostro).

---

## 3. Cosa è stato fatto

### Backend AirLink (`Desktop\voiceguide_airlink_backend`) — commit `bb54e14`, PUSHATO
Fix "Session full":
- il limite ospiti conta solo gli ospiti **collegati** (`is_connected=True`);
- `POST /api/join-pin` accetta un `listener_id` opzionale: se appartiene alla sessione del PIN, l'ospite riprende il suo posto (o viene riattivato se era uscito) invece di occuparne uno nuovo.
- Testato in locale su SQLite: rientro, uscita + nuovo ingresso, gruppo pieno, id non valido → tutto ok.
- Compatibile con l'app attuale.
- Nello stesso push è andato anche il commit `56f5b67` (solo documenti di ricerca LiveKit/HLS di settembre).

**⚠️ NON ANCORA IN PRODUZIONE** (deploy Railway sospesi). Produzione ferma al commit `2a7b593` dell'11 settembre.

### App (`C:\Users\stefa\VoiceGuideAirlinkBare`) — modifiche NON committate
- `app/guest/guestListenerStorage.ts` (nuovo): il telefono ricorda il `listener_id` ricevuto per un PIN.
- `app/config/api.ts`: `apiJoinPin` passa `listener_id`.
- `app/screens/guest/GuestJoinScreen.tsx`: rientro con l'id salvato + messaggi di errore tradotti invece di "Session full" in inglese.
- `app/i18n/locales/{it,en,fr,es,de}.json`: nuove chiavi `guestJoin.errorFull`, `errorNotFound`, `errorExpired`.
- **Android latenza/segnale**:
  - `VoiceGuideForegroundService.kt`: latenza ospite forzata a `AUDIENCE_LATENCY_LEVEL_ULTRA_LOW_LATENCY`; eventi `onConnectionStateChanged`, `onNetworkQuality`, `onRemoteAudioStats` (con `e2eDelay` = ritardo reale guida→ospite).
  - `AudioStatusEvents.kt` (nuovo): ponte servizio → modulo React Native.
  - `VoiceGuideForegroundModule.kt`: inoltra a JS l'evento `VGAudioStatus` (+ `addListener`/`removeListeners`).
- `app/audio/useAudioStatus.ts` (nuovo): hook JS che legge connessione, qualità rete, ritardo, perdita pacchetti. Non ancora usato in nessuna schermata (verrà usato nella nuova grafica).
- Verifiche fatte: `tsc --noEmit` ok, `gradlew :app:compileReleaseKotlin` ok. **Nessun test su telefono.**

### Grafica — anteprima (nessun codice toccato)
Artifact "AirLink App Redesign": https://claude.ai/artifact/Nn1zSXJW6uuVHknoeygJSP
- Prima proposta (stile nuovo, scuro) → **bocciata**: l'attuale è più bella, mancavano parti.
- Versione attuale: percorso **Guida** in 5 schermate animate, stile dell'app attuale (logo pulcino, giallo `#FFC226`, Roboto, schede crema) con sfondo animato a macchie di luce e schede in vetro:
  1. Accedi come guida (email + codice 6 cifre, banner "3 licenze in regalo");
  2. Le mie licenze (regalo + acquistate, selezione, avvio tour);
  3. Acquista (7 tagli, quantità, totale);
  4. Tour pronto (QR animato + PIN, Copia link / Condividi, ospiti entrati);
  5. In onda (microfono con onde, pausa, ospiti/tempo/rete, Mostra QR).
- **In attesa del parere di Stefano** su queste 5 schermate.

---

## 4. Decisioni prese

1. **QR code** nella schermata "Tour pronto" = un unico link (es. `voiceguideapp.com/j/PIN`): se l'app c'è si apre col PIN già inserito, altrimenti pagina del sito → store giusto + PIN in grande.
2. **I messaggi WhatsApp li gestisce la guida** (invito giorni prima senza PIN, PIN il giorno del tour). L'app offre solo "Copia link" e "Condividi". WhatsApp non permette di creare gruppi da un'app.
3. **Registrazione solo per le guide**: email + codice a 6 cifre, niente password. Regala **3 licenze da 5, 25 e 35 ospiti**, una sola volta per email. Ospiti mai registrati. Serve "Elimina account" nell'app (obbligo Apple).
4. **Una sola app**, non due.
5. **Togliere dall'app iOS i link per acquistare fuori** (regole App Store).
6. **Nessuna modifica al codice dell'app prima che Stefano approvi tutte le schermate.**
7. Tutte le modifiche si fanno prima sul PC; alla fine si lascia nella cartella dell'app un file `HANDOFF_MAC.md` per Claude sul Mac, che deve allinearsi.
8. Pubblicazione iOS: per ora dal Mac con Claude; dopo aver portato il codice iOS su GitHub si valuta **EAS Build** (gratis fino a ~15 build iOS/mese).
9. **Google Workspace**: Stefano paga 1 utente. Si può passare alla Gmail personale (inoltro con ImprovMX + "Invia come" via SMTP Resend), risparmio ~€90/anno → **da fare dopo il tour di Natale**.

### Da decidere
- **Vendita licenze direttamente nell'app** (acquisti in-app, commissione 15%, pacchetti e fatture restano sul sito): proposta come fase 2, circa una settimana di lavoro. Non deciso.
- **Ingresso ospiti dal browser senza app**: proposto come "piano B" con streaming tipo radio web (2–5 s di ritardo). Prima serve una **prova di 10 minuti con due telefoni** per vedere se l'audio resiste all'uso della fotocamera. Stefano non ha ancora detto se farla.
- **App Clip iOS** (ingresso inquadrando il QR senza installare): idea da verificare sul Mac (limiti di dimensione, audio in background).
- **Margine di tolleranza** sul limite ospiti (es. +10%, minimo 3) per proteggere chi ha la vecchia app: proposto, non deciso.

---

## 5. Da fare alla prossima sessione (in ordine)

### Subito
- [ ] **Deploy backend AirLink**: `railway deployment list --service voiceguide-airlink-backend`. Se ancora fermo all'11 settembre, Stefano lancia:
      `railway redeploy --from-source -s voiceguide-airlink-backend -y` (dalla cartella del backend).
      Poi verificare che `/openapi.json` mostri `listener_id` tra i parametri di `/api/join-pin`.
- [ ] Verificare perché il **deploy automatico** al push non parte (Railway → servizio → Settings → Source).
- [ ] Raccogliere il parere di Stefano sulle **5 schermate della guida**.

### Grafica e app
- [ ] Disegnare le schermate **Ospite** nello stesso stile: Home, inserimento PIN/QR, ascolto (segnale + ritardo da `useAudioStatus`), fine tour.
- [ ] Dopo l'approvazione: applicare la grafica alle schermate vere dell'app.
- [ ] Backend: registrazione guide (email + codice), licenze regalo 5/25/35, contatore ospiti collegati per la guida.
- [ ] Sito: pagina `/j/[PIN]` + file `apple-app-site-association` e `assetlinks.json` per aprire l'app dal link.
- [ ] App: gestione dei link in entrata (PIN precompilato), QR reale, "Copia link"/"Condividi", rimozione link di acquisto su iOS.
- [ ] Test su due telefoni: rientro nel tour, ritardo misurato (`e2eDelay`), indicatore di rete.
- [ ] Ticchettio dopo 2 ore: con l'indicatore di rete attivo, chiedere a Gianluca di osservare al prossimo tour.
- [ ] Commit nel repo dell'app solo dopo i test.
- [ ] Scrivere `HANDOFF_MAC.md` per Claude sul Mac: replicare nel modulo iOS gli eventi `VGAudioStatus` e la latenza minima, portare il codice iOS su GitHub.

### Resto della revisione (non ancora iniziato)
- [ ] Restyling del sito voiceguideapp.com (5 lingue), più snello e animato; rendere evidente "paghi solo il tour, da €3,99".
- [ ] Email automatiche in HTML con logo (5 lingue); verificare su Railway che il backend sito usi Resend.
- [ ] Acquisto e prova gratuita più semplici sul sito.
- [ ] Revisione privacy/GDPR (cookie, assistente IoAlly, fornitori USA: Railway, Agora, Resend).
- [ ] Revisione del codice di tutti i repo.
- [ ] Assistente chat del sito (`VoiceGuideBackendSite/app/core/chat_assistant.py`): aggiornare con le novità (licenze regalo, QR, codici che non scadono, 4 ore dall'attivazione).
- [ ] Migrazione email da Workspace a Gmail personale (dopo Natale).
- [ ] Archiviare `Desktop\voiceguide_airlink_app` (vecchio prototipo).
