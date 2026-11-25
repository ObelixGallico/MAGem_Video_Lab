
"use strict";

/* MAGem VideoLab - Modulo Marcatori v2.0
   Unica entità registrata: marker.
   Gli intervalli si ricavano da due marker.
*/

(() => {
  const state = { items: [] };
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

  function newId() {
    return "m_" + Date.now().toString(36) + "_" +
      Math.random().toString(36).slice(2, 8);
  }

  function pausedFrame() {
    if (!fileObj || !total || current < 0) {
      $m("markerStatus").textContent = "Carica prima un video.";
      return false;
    }

    if (playing) {
      $m("markerStatus").textContent =
        "Metti in pausa il video prima di questa operazione.";
      return false;
    }

    return true;
  }

  function addMarker() {
    if (!pausedFrame()) return;

    const label = $m("markerLabel").value.trim();

    if (!label) {
      $m("markerStatus").textContent = "Inserisci un'etichetta.";
      return;
    }

    state.items.push({
      id: newId(),
      label,
      note: $m("markerNote").value.trim(),
      frame: current,
      pts: ptsOf(current),
      timeSeconds: timeOf(current)
    });

    render();
    $m("markerStatus").textContent =
      "Marker aggiunto al frame " + current + ".";
  }

  function orderedMarkers() {
    return [...state.items].sort((a, b) =>
      a.frame - b.frame || a.id.localeCompare(b.id)
    );
  }

  function navigateTo(frame, label) {
    if (!pausedFrame()) return;

    void requestNavigation(frame).then(ok => {
      $m("markerStatus").textContent = ok
        ? "Raggiunto " + label + " · frame " + frame + "."
        : "Navigazione non riuscita.";
    });
  }

  function navigateMarker(direction) {
    if (!pausedFrame()) return;

    const markers = orderedMarkers();

    if (!markers.length) {
      $m("markerStatus").textContent = "Nessun marker registrato.";
      return;
    }

    let target;

    if (direction < 0) {
      target = [...markers].reverse().find(m => m.frame < current);
    } else {
      target = markers.find(m => m.frame > current);
    }

    if (!target) {
      $m("markerStatus").textContent =
        direction < 0
          ? "Non ci sono marker precedenti."
          : "Non ci sono marker successivi.";
      return;
    }

    navigateTo(target.frame, target.label);
  }

  function render() {
    const list = $m("markerList");
    list.replaceChildren();

    for (const marker of orderedMarkers()) {
      const item = document.createElement("div");
      item.className = "markerItem";

      const title = document.createElement("strong");
      title.textContent = marker.label;
      item.append(title);

      const detail = document.createElement("div");
      detail.className = "markerDetail";
      detail.textContent =
        `Frame ${marker.frame} · ${marker.timeSeconds.toFixed(3)} s`;
      item.append(detail);

      if (marker.note) {
        const note = document.createElement("div");
        note.className = "markerDetail";
        note.textContent = marker.note;
        item.append(note);
      }

      const actions = document.createElement("div");
      actions.className = "markerActions";

      const jump = document.createElement("button");
      jump.type = "button";
      jump.textContent = "Vai al marker";
      jump.onclick = () => navigateTo(marker.frame, marker.label);
      actions.append(jump);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Elimina";
      remove.onclick = () => {
        state.items = state.items.filter(m => m.id !== marker.id);
        render();
        $m("markerStatus").textContent = "Marker eliminato.";
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
      schemaVersion: 2,
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
        data.schemaVersion !== 2 ||
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

      const ids = new Set();

      const valid = data.markers.every(m => {
        if (
          !m ||
          typeof m.id !== "string" ||
          !m.id ||
          ids.has(m.id) ||
          typeof m.label !== "string" ||
          !Number.isInteger(m.frame) ||
          m.frame < 0 ||
          m.frame >= total ||
          !Number.isFinite(m.pts) ||
          !Number.isFinite(m.timeSeconds) ||
          (m.note !== undefined && typeof m.note !== "string")
        ) return false;

        ids.add(m.id);
        return true;
      });

      if (!valid) throw Error("Sono presenti marker non validi.");

      state.items = data.markers;
      render();

      $m("markerStatus").textContent =
        "Caricati " + state.items.length + " marker.";

    } catch (error) {
      $m("markerStatus").textContent =
        "Caricamento non riuscito: " + error.message;
    }
  }

  function createInterface() {
    const style = document.createElement("style");

    style.textContent = `
      #markerPanel {
        display:none;
        position:fixed;
        z-index:80;
        right:10px;
        top:52px;
        width:min(290px,calc(100vw - 20px));
        max-height:48vh;
        overflow:hidden;
        background:rgba(20,24,31,0.66);
        color:#f2f3f5;
        border:1px solid rgba(160,175,195,0.48);
        border-radius:12px;
        padding:9px;
        box-shadow:0 8px 30px rgba(0,0,0,0.38);
        backdrop-filter:blur(7px);
        -webkit-backdrop-filter:blur(7px);
        touch-action:none;
      }

      #markerPanel.open { display:block; }

      #markerPanelHeader {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:8px;
        cursor:move;
        user-select:none;
      }

      #markerPanel h2 {
        font-size:15px;
        margin:0;
      }

      #markerPanel input,
      #markerPanel textarea {
        box-sizing:border-box;
        width:100%;
        background:#101317;
        color:#fff;
        border:1px solid #626a74;
        border-radius:7px;
        padding:7px;
        margin:3px 0 7px;
        touch-action:auto;
      }

      #markerPanel textarea { min-height:42px; }

      #markerPanel label,
      .markerHint {
        font-size:11px;
        color:#c1c8d2;
      }

      #markerPanel .markerButtons {
        display:flex;
        flex-wrap:wrap;
        gap:5px;
      }

      #markerPanel button {
        font-size:12px;
        padding:6px 8px;
      }

      #markerList {
        display:flex;
        flex-direction:column;
        gap:6px;
        margin-top:8px;
        max-height:19vh;
        overflow-y:auto;
        overscroll-behavior:contain;
        touch-action:pan-y;
      }

      .markerItem {
        border:1px solid rgba(170,180,195,0.4);
        border-radius:8px;
        padding:7px;
        font-size:12px;
        touch-action:pan-y;
      }

      .markerDetail {
        font-size:11px;
        color:#c1c8d2;
        margin-top:3px;
        overflow-wrap:anywhere;
      }

      .markerActions {
        display:flex;
        gap:5px;
        flex-wrap:wrap;
        margin-top:6px;
      }

      .markerActions button { font-size:11px !important; }

      .markerNavButton { display:none; }
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
      <div id="markerPanelHeader">
        <h2>Marcatori del video</h2>
        <button id="closeMarkers" type="button">Chiudi</button>
      </div>

      <div id="markerVideoInfo" class="markerHint">
        Carica un video per iniziare.
      </div>

      <label for="markerLabel">Etichetta</label>
      <input id="markerLabel" type="text" maxlength="120"
        placeholder="Es. Inizio trazione">

      <label for="markerNote">Nota facoltativa</label>
      <textarea id="markerNote" maxlength="1000"
        placeholder="Descrizione del marker"></textarea>

      <div class="markerButtons">
        <button id="addMarker" type="button">Aggiungi marker</button>
      </div>

      <div id="markerStatus" class="markerHint">
        Metti in pausa sul frame desiderato.
      </div>

      <div class="markerButtons">
        <button id="saveMarkers" type="button">Salva JSON</button>
        <button id="loadMarkersBtn" type="button">Carica JSON</button>
        <input id="loadMarkersFile" type="file"
          accept=".json,application/json" style="display:none">
      </div>

      <div id="markerList"></div>
    `;

    document.body.append(panel);

    const transport = document.querySelector(".mainTransport");

    const markPrev = document.createElement("button");
    markPrev.id = "markPrev";
    markPrev.type = "button";
    markPrev.className = "markerNavButton";
    markPrev.textContent = "MARK −";
    markPrev.title = "Marker precedente";

    const markNext = document.createElement("button");
    markNext.id = "markNext";
    markNext.type = "button";
    markNext.className = "markerNavButton";
    markNext.textContent = "MARK +";
    markNext.title = "Marker successivo";

    transport.append(markPrev, markNext);

    function setManagementOpen(open) {
      panel.classList.toggle("open", open);
      markPrev.style.display = open ? "" : "none";
      markNext.style.display = open ? "" : "none";

      if (open) {
        render();
        showLandscapeControls();
      }
    }

    button.onclick = () =>
      setManagementOpen(!panel.classList.contains("open"));

    $m("closeMarkers").onclick = () => setManagementOpen(false);
    $m("addMarker").onclick = addMarker;
    $m("saveMarkers").onclick = saveJSON;

    $m("loadMarkersBtn").onclick =
      () => $m("loadMarkersFile").click();

    $m("loadMarkersFile").onchange = event => {
      const file = event.target.files?.[0];
      if (file) loadJSON(file);
      event.target.value = "";
    };

    markPrev.onclick = () => navigateMarker(-1);
    markNext.onclick = () => navigateMarker(1);

    $m("file").addEventListener("change", () => {
      state.items = [];
      render();
    });

    // Trascinamento del pannello dalle sue zone libere.
    // I controlli e l'elenco restano utilizzabili normalmente.
    let dragState = null;

    panel.addEventListener("pointerdown", event => {
      if (event.target.closest(
        "button,input,textarea,select,label,#markerList"
      )) return;

      const rect = panel.getBoundingClientRect();

      dragState = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };

      panel.style.left = rect.left + "px";
      panel.style.top = rect.top + "px";
      panel.style.right = "auto";

      panel.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    panel.addEventListener("pointermove", event => {
      if (!dragState) return;

      const maxLeft = window.innerWidth - panel.offsetWidth;
      const maxTop = window.innerHeight - panel.offsetHeight;

      panel.style.left = Math.max(0, Math.min(
        event.clientX - dragState.x, maxLeft
      )) + "px";

      panel.style.top = Math.max(0, Math.min(
        event.clientY - dragState.y, maxTop
      )) + "px";
    });

    function stopDrag() {
      dragState = null;
    }

    panel.addEventListener("pointerup", stopDrag);
    panel.addEventListener("pointercancel", stopDrag);
  }

  createInterface();
})();
