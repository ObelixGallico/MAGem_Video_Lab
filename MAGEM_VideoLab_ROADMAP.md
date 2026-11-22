# MAGem VideoLab — Roadmap

Documento di pianificazione delle evoluzioni del Player. La roadmap descrive le funzionalità concordate; non implica che siano già implementate.

## Riferimento stabile

- Versione di riferimento: **MAGem VideoLab Player v2.2.5 BASE STABILE**.
- Il file della BASE STABILE non deve essere modificato direttamente.
- Ogni nuova funzione va sviluppata e verificata su una copia/ramo di sviluppo.
- La roadmap non modifica il metodo MAGem 1.0: VideoLab è uno strumento di supporto al tecnico.

## Priorità di sviluppo

### 1. Riattivazione della timeline — priorità alta

Riabilitare la timeline come strumento di ricerca rapida e approssimativa nel filmato.

- Il trascinamento della timeline porta il video nella zona temporale selezionata.
- La timeline deve indicare la posizione del fotogramma effettivamente visualizzato.
- I controlli **Frame − / Frame +** restano lo strumento per la navigazione precisa, fotogramma per fotogramma.

### 2. Coordinamento timeline e navigazione precisa

Garantire che timeline, posizione temporale e frame mostrato siano coerenti.

- Dopo il rilascio della timeline, completare la ricerca e attendere la visualizzazione del frame corrispondente.
- Solo dopo il completamento della ricerca, consentire l'affinamento con Frame − / Frame +.
- Evitare disallineamenti tra indicatore della timeline e fotogramma realmente visualizzato.

### 3. Cattura del fotogramma

Aggiungere la cattura del fotogramma visualizzato, disponibile **solo in PAUSE**.

Per ogni cattura conservare almeno:
- immagine del solo fotogramma visualizzato (non screenshot dell'intero schermo);
- riferimento al file video;
- numero del fotogramma;
- posizione temporale nel video.

### 4. Ripetizione di un intervallo A–B

Aggiungere la possibilità di definire due estremi A e B e ripetere il segmento selezionato, per osservazioni ripetute e confronti.

### 5. Commenti vocali associati al video — prima versione

Consentire la registrazione e l'ascolto di commenti vocali collegati:
- a un singolo fotogramma, oppure
- a un intervallo di fotogrammi.

La durata della registrazione audio è libera e non deve essere vincolata alla durata dell'intervallo video. I commenti devono essere salvati insieme al progetto. L'audio **non** deve partire automaticamente durante la riproduzione del video: l'ascolto avviene tramite un comando dedicato.

### 6. Gestione evoluta dei commenti vocali

Estendere la prima versione con:
- elenco di più commenti;
- selezione e navigazione verso il frame/intervallo associato;
- modifica e cancellazione;
- gestione dei commenti nel progetto.

### 7. Trascrizione e classificazione MAGem

Valutare e introdurre, in una fase successiva:
- trascrizione automatica del commento;
- classificazione assistita secondo le categorie MAGem, mantenendo distinta l'osservazione dalla descrizione e dall'interpretazione.

La classificazione automatica è un supporto: non sostituisce la valutazione del tecnico e non trasforma un'ipotesi in un fatto.

### 8. Integrazione con il Registro Tecnico

Valutare l'integrazione dei commenti e dei riferimenti video con il Registro Tecnico MAGem, preservando tracciabilità e contesto delle osservazioni.

## Principi di progetto

- La navigazione deve offrire due livelli complementari: ricerca approssimativa tramite timeline e precisione tramite Frame − / Frame +.
- Le informazioni associate a un commento o a una cattura devono mantenere un riferimento verificabile al video e alla posizione temporale.
- Il VideoLab supporta il lavoro del tecnico; non formula autonomamente diagnosi o decisioni tecniche.
- Le funzionalità vanno introdotte progressivamente, verificandole prima di passare alla fase successiva.

## Stato

Questa roadmap registra le priorità concordate. Le funzionalità elencate sono **da sviluppare**, salvo quelle già presenti nella versione di riferimento. L'inserimento in roadmap non costituisce una modifica al Player né alla BASE STABILE.
