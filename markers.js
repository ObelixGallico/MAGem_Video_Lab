"use strict";

/* MAGem VideoLab - Modulo Marcatori v1.0
   Richiede le variabili e le funzioni del Player principale. */

(() => {
  const state = {
    items: [],
    pendingStart: null
  };

  const $m = id => document.getElementById(id);

  function timeOf(frame) {
    return Number(ts(presentationOrder[frame])) / 1e6;
  }

  function ptsOf(frame) {
    return Number(presentationOrder[frame].cts);
  }

  function identity() {
    if (!fileObj || !total || !presentationOrder.length) return null;

    return {
      fileName: fileObj.name,
      fileSize: fileObj.size,
      lastModified: fileObj.lastModified || 0,
      frameCount: total,
      timescale,
      firstPts: ptsOf(0),
      lastPts: ptsOf(total - 1)
    };
  }

  function pausedFrame() {
    if (!fileObj || !total || current < 0) {
      $m("markerStatus").textContent = "Carica prima un video.";
      return false;
    }

    if (playing) {
      $m("markerStatus").textContent =
        "Metti in pausa il video prima di inserire il marcatore.";
      return false;
    }

    return true;
  }

  function newId() {
    return "m_" + Date.now().toString(36) + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function addPoint() {
    if (!pausedFrame()) return;

    const label = $m("markerLabel").value.trim();
    if (!label) {
      $m("markerStatus").textContent = "Inserisci un'etichetta.";
      return;
    }

    state.items.push({
      id: newId(),
      type: "point",
      label,
      note: $m("markerNote").value.trim(),
      frame: current,
      pts: ptsOf(current),
      timeSeconds: timeOf(current)
    });

    render();
    $m("markerStatus").textContent = "Marcatore puntuale aggiunto.";
  }

  function startInterval() {
    if (!pausedFrame()) return;

    const label = $m("markerLabel").value.trim();
    if (!label) {
      $m("markerStatus").textContent = "Inserisci un'etichetta.";
      return;
    }

    state.pendingStart = {
      frame: current,
      pts: ptsOf(current),
      timeSeconds: timeOf(current),
      label,
      note: $m("markerNote").value.trim()
    };

    $m("startInterval").disabled = true;
    $m("endInterval").disabled = false;
    $m("cancelInterval").disabled = false;

    $m("markerStatus").textContent =
      "Inizio registrato al frame " + current +
      ". Raggiungi il frame finale e premi Fine intervallo.";
  }

  function endInterval() {
    if (!pausedFrame() || !state.pendingStart) return;

    const start = state.pendingStart;

    if (current < start.frame) {
      $m("markerStatus").textContent =
        "Il frame finale non può precedere quello iniziale.";
      return;
    }

    state.items.push({
      id: newId(),
      type: "interval",
      label: start.label,
      note: start.note,
      start: {
        frame: start.frame,
        pts: start.pts,
        timeSeconds: start.timeSeconds
      },
      end: {
        frame: current,
        pts: ptsOf(current),
        timeSeconds: timeOf(current)
      }
    });

    cancelInterval();
    render();
    $m("markerStatus").textContent = "Intervallo aggiunto.";
  }

  function cancelInterval() {
    state.pendingStart = null;
    $m("startInterval").disabled = false;
    $m("endInterval").disabled = true;
    $m("cancelInterval").disabled = true;
  }

  function render() {
    const list = $m("markerList");
    list.replaceChildren();

    const ordered = [...state.items].sort((a, b) => {
      const fa = a.type === "point" ? a.frame : a.start.frame;
      const fb = b.type === "point" ? b.frame : b.start.frame;
      return fa - fb;
    });

    for (const marker of ordered) {
      const first = marker.type === "point"
        ? marker.frame : marker.start.frame;
      const last = marker.type === "point"
        ? null : marker.end.frame;

      const item = document.createElement("div");
      item.className = "markerItem";

      const title = document.createElement("strong");
      title.textContent =
        (marker.type === "point" ? "PUNTO · " : "INTERVALLO · ") +
        marker.label;
      item.append(title);

      const detail = document.createElement("div");
      detail.textContent = last === null
        ? `Frame ${first} · ${marker.timeSeconds.toFixed(3)} s`
        : `Frame ${first}–${last} · ` +
          `${marker.start.timeSeconds.toFixed(3)}–` +
          `${marker.end.timeSeconds.toFixed(3)} s`;
      item.append(detail);

      if (marker.note) {
        const note = document.createElement("div");
        note.textContent = marker.note;
        item.append(note);
      }

      const actions = document.createElement("div");
      actions.className = "markerActions";

      const jumpStart = document.createElement("button");
      jumpStart.textContent = "Vai all'inizio";
      jumpStart.onclick = () => {
        if (!playing) requestNavigation(first);
        else $m("markerStatus").textContent =
          "Metti in pausa prima di navigare.";
      };
      actions.append(jumpStart);

      if (last !== null) {
        const jumpEnd = document.createElement("button");
        jumpEnd.textContent = "Vai alla fine";
        jumpEnd.onclick = () => {
          if (!playing) requestNavigation(last);
          else $m("markerStatus").textContent =
            "Metti in pausa prima di navigare.";
        };
        actions.append(jumpEnd);
      }

      const remove = document.createElement("button");
      remove.textContent = "Elimina";
      remove.onclick = () => {
        state.items = state.items.filter(x => x.id !== marker.id);
        render();
      };
      actions.append(remove);

      item.append(actions);
      list.append(item);
    }

    $m("markerVideoInfo").textContent = fileObj
      ? `${fileObj.name} · ${total} frame`
      : "Carica un video per iniziare.";
  }

  function saveJSON() {
    const video = identity();
    if (!video) {
      $m("markerStatus").textContent = "Carica prima un video.";
      return;
    }

    const data = {
      format: "MAGem-VideoLab-Markers",
      schemaVersion: 1,
      video,
      markers: state.items
    };

    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download =
      fileObj.name.replace(/\.[^.]+$/, "") + ".marks.json";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    $m("markerStatus").textContent = "JSON pronto per il salvataggio.";
  }

  async function loadJSON(file) {
    try {
      const data = JSON.parse(await file.text());
      const expected = identity();

      if (!expected) throw Error("Carica prima il video.");

      if (
        data.format !== "MAGem-VideoLab-Markers" ||
        data.schemaVersion !== 1 ||
        !data.video ||
        !Array.isArray(data.markers)
      ) {
        throw Error("Formato JSON non riconosciuto.");
      }

      for (const key of [
        "fileName", "fileSize", "frameCount",
        "timescale", "firstPts", "lastPts"
      ]) {
        if (data.video[key] !== expected[key]) {
          throw Error("Il JSON non corrisponde al video: " + key);
        }
      }

      const valid = data.markers.every(m => {
        if (!m || typeof m.id !== "string" ||
            typeof m.label !== "string") return false;

        if (m.type === "point") {
          return Number.isInteger(m.frame) &&
            m.frame >= 0 && m.frame < total &&
            Number.isFinite(m.pts) &&
            Number.isFinite(m.timeSeconds);
        }

        if (m.type === "interval") {
          return Number.isInteger(m.start?.frame) &&
            Number.isInteger(m.end?.frame) &&
            m.start.frame >= 0 &&
            m.end.frame >= m.start.frame &&
            m.end.frame < total &&
            Number.isFinite(m.start.pts) &&
            Number.isFinite(m.end.pts) &&
            Number.isFinite(m.start.timeSeconds) &&
            Number.isFinite(m.end.timeSeconds);
        }

        return false;
      });

      if (!valid) throw Error("Sono presenti marcatori non validi.");

      state.items = data.markers;
      cancelInterval();
      render();

      $m("markerStatus").textContent =
        "Caricati " + state.items.length + " marcatori.";

    } catch (error) {
      $m("markerStatus").textContent =
        "Caricamento non riuscito: " + error.message;
    }
  }

  function createInterface() {
    const style = document.createElement("style");
    style.textContent = `
      #markerPanel {
        display:none; position:fixed; z-index:80;
        right:10px; top:52px;
        width:min(430px,calc(100vw - 20px));
        max-height:calc(100dvh - 65px); overflow:auto;
        background:#171a1f; color:#f2f3f5;
        border:1px solid #737b86; border-radius:12px;
        padding:12px; box-shadow:0 8px 30px #000b;
      }
      #markerPanel.open { display:block; }
      #markerPanel h2 { font-size:17px; margin:0 0 9px; }
      #markerPanel input[type=text],
      #markerPanel textarea {
        width:100%; background:#101317; color:#fff;
        border:1px solid #626a74; border-radius:7px;
        padding:8px; margin:4px 0 8px;
      }
      #markerPanel textarea { min-height:54px; }
      #markerList { display:flex; flex-direction:column; gap:6px; margin-top:10px; }
      .markerItem { border:1px solid #454c55; border-radius:8px; padding:7px; font-size:13px; }
      .markerActions { display:flex; gap:5px; flex-wrap:wrap; margin-top:5px; }
      .markerActions button { font-size:12px; padding:5px 8px; }
      .markerHint { font-size:12px; color:#b7bec8; margin:5px 0; }
    `;
    document.head.append(style);

    const button = document.createElement("button");
    button.id = "markersBtn";
    button.type = "button";
    button.textContent = "Marcatori";
    button.title = "Gestione marcatori";
    document.querySelector("header.header").append(button);

    const panel = document.createElement("section");
    panel.id = "markerPanel";
    panel.innerHTML = `
      <div class="row" style="justify-content:space-between">
        <h2>Marcatori del video</h2>
        <button id="closeMarkers" type="button">Chiudi</button>
      </div>
      <div id="markerVideoInfo" class="markerHint">
        Carica un video per iniziare.
      </div>
      <label class="markerHint" for="markerLabel">Etichetta</label>
      <input id="markerLabel" type="text" maxlength="120"
        placeholder="Es. Inizio espansione">
      <label class="markerHint" for="markerNote">Nota facoltativa</label>
      <textarea id="markerNote" maxlength="1000"
        placeholder="Descrizione del marcatore"></textarea>
      <div class="row">
        <button id="addPoint" type="button">Aggiungi punto</button>
        <button id="startInterval" type="button">Inizio intervallo</button>
        <button id="endInterval" type="button" disabled>Fine intervallo</button>
        <button id="cancelInterval" type="button" disabled>Annulla</button>
      </div>
      <div id="markerStatus" class="markerHint">
        Metti in pausa sul frame desiderato.
      </div>
      <div class="row">
        <button id="saveMarkers" type="button">Salva JSON</button>
        <button id="loadMarkersBtn" type="button">Carica JSON</button>
        <input id="loadMarkersFile" type="file"
          accept=".json,application/json" style="display:none">
      </div>
      <div id="markerList"></div>
    `;
    document.body.append(panel);

    button.onclick = () => {
      panel.classList.toggle("open");
      render();
      showLandscapeControls();
    };

    $m("closeMarkers").onclick =
      () => panel.classList.remove("open");
    $m("addPoint").onclick = addPoint;
    $m("startInterval").onclick = startInterval;
    $m("endInterval").onclick = endInterval;
    $m("cancelInterval").onclick = cancelInterval;
    $m("saveMarkers").onclick = saveJSON;
    $m("loadMarkersBtn").onclick =
      () => $m("loadMarkersFile").click();

    $m("loadMarkersFile").onchange = event => {
      const file = event.target.files?.[0];
      if (file) loadJSON(file);
      event.target.value = "";
    };

    $m("file").addEventListener("change", () => {
      state.items = [];
      cancelInterval();
      render();
    });
  }

  createInterface();
})();
