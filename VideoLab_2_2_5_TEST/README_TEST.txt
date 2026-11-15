MAGem VideoLab — PWA Android TEST
Build: Player v2.2.5 BASE STABILE + involucro PWA di prova
Stato: [SVILUPPO] — pacchetto di test, non pubblicato su GitHub.

BASE DI PARTENZA
Il file index.html deriva dalla copia caricata in chat:
MAGem_VideoLab_Player_v2.2.5_BASE_STABILE.html
La copia sorgente originale non viene modificata. Le modifiche sono limitate
all'aggiunta dei riferimenti PWA, alla registrazione del service worker e
all'etichetta visibile TEST PWA.

INSTALLAZIONE (Samsung / Android)
1. Pubblicare questa cartella come sottocartella di un sito HTTPS.
2. Aprire l'indirizzo della sottocartella con Chrome.
3. Dal menu di Chrome scegliere "Installa app" oppure "Aggiungi a schermata Home"
   (la dicitura può variare in base alla versione di Android/Chrome).
4. Avviare VideoLab dall'icona installata.

LIMITI NOTI DEL TEST
- La shell dell'app (pagina, manifest e icone) viene memorizzata per l'avvio offline.
- Il decoder MP4Box viene caricato da jsDelivr via rete: il funzionamento offline
  completo non è garantito e richiede una successiva verifica/decisione.
- I video scelti dall'utente non vengono memorizzati dal service worker.
- Le icone incluse sono provvisorie, create per identificare questa build TEST;
  non sono le icone originali presenti nella root GitHub.
- Nessun file del repository GitHub è stato modificato.
