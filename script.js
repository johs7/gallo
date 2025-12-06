// === CONFIG: grupos fijos (23 jugadores) ===
const groups = {
  A: [
    "Hanlley",
    "Petrucho115",
    "XAVI",
    "✨️❤️K•M•D❤️✨️",
    "Ak",
    "Johanssen",         // nuevo en grupo de Han
  ],
  B: [
    "GP PAO",
    "don’t do that",
    "ARCEBOX",
    "JJ Calero",
    "Nanan",
    "Mudito",            // nuevo en grupo B
  ],
  C: [
    "Electric Sheep",
    "Mister Lalo",
    "Jio罗莎",
    "Kun🔥Wes",
    "キラー Take ✨",
  ],
  D: [
    "ZPAUL DARK",
    "Dylan15",
    "Hunter💀",
    "Lucho",
    "El Makixx",
    "Flups",             // nuevo en grupo de Lucho
  ],
};

// cambia clave para “resetear” al nuevo formato de 1 partida
const STORAGE_KEY = "gallopinto_state_v2";

// Estado de la tabla: standings[group][player] = { pj, pts, row }
const standings = {};

// --- Banner simple de info ---
function showBanner(message) {
  const banner = document.getElementById("drawBanner");
  if (!banner) return;
  banner.innerHTML = `
    <span class="draw-number">Info</span>
    <span class="draw-vs">${message}</span>
  `;
  banner.classList.add("show");
}

function hideBanner() {
  const banner = document.getElementById("drawBanner");
  if (!banner) return;
  banner.classList.remove("show");
}

// === 1) Pintar listas de grupos ===
function renderGroups() {
  Object.entries(groups).forEach(([groupKey, players]) => {
    const list = document.querySelector(
      `.group-card[data-group="${groupKey}"] .group-list`
    );
    if (!list) return;

    list.innerHTML = "";
    players.forEach((name) => {
      const li = document.createElement("li");
      li.classList.add("group-player");
      li.textContent = name;
      list.appendChild(li);
    });
  });
}

// === 2) Tablas de posiciones + inicializar standings ===
function renderTables() {
  Object.entries(groups).forEach(([groupKey, players]) => {
    const tbody = document.querySelector(
      `.table-card[data-group="${groupKey}"] tbody`
    );
    if (!tbody) return;

    if (!standings[groupKey]) standings[groupKey] = {};
    tbody.innerHTML = "";

    players.forEach((name) => {
      const tr = document.createElement("tr");
      tr.dataset.player = name;

      const tdName = document.createElement("td");
      tdName.textContent = name;

      const tdPJ = document.createElement("td");
      tdPJ.textContent = "0";
      tdPJ.classList.add("pj-cell");

      const tdPts = document.createElement("td");
      tdPts.textContent = "0";
      tdPts.classList.add("pts-cell");

      tr.appendChild(tdName);
      tr.appendChild(tdPJ);
      tr.appendChild(tdPts);
      tbody.appendChild(tr);

      standings[groupKey][name] = {
        pj: 0,
        pts: 0,
        row: tr,
      };
    });
  });
}

// Actualizar una fila en la tabla según standings
function refreshRow(groupKey, playerName) {
  const data = standings[groupKey][playerName];
  if (!data || !data.row) return;
  const pjCell = data.row.querySelector(".pj-cell");
  const ptsCell = data.row.querySelector(".pts-cell");
  if (pjCell) pjCell.textContent = String(data.pj);
  if (ptsCell) ptsCell.textContent = String(data.pts);
}

// === 3) Guardar / cargar estado en localStorage ===
function saveState() {
  const data = {
    standings: {},
    matches: {}
  };

  // standings
  Object.entries(standings).forEach(([groupKey, playersMap]) => {
    data.standings[groupKey] = {};
    Object.entries(playersMap).forEach(([playerName, info]) => {
      data.standings[groupKey][playerName] = {
        pj: info.pj,
        pts: info.pts
      };
    });
  });

  // matches
  Object.keys(groups).forEach((groupKey) => {
    const matchItems = document.querySelectorAll(
      `.matches-card[data-group="${groupKey}"] .match-item`
    );
    data.matches[groupKey] = [];

    matchItems.forEach((li) => {
      const p1 = li.dataset.p1;
      const p2 = li.dataset.p2;

      const gameDiv = li.querySelector(".game");
      const winnerSide = gameDiv ? (gameDiv.dataset.winner || "none") : "none";

      data.matches[groupKey].push({
        p1,
        p2,
        winner: winnerSide, // 'p1' | 'p2' | 'none'
      });
    });
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return;
  }

  // standings
  if (data.standings) {
    Object.entries(data.standings).forEach(([groupKey, playersMap]) => {
      if (!standings[groupKey]) return;
      Object.entries(playersMap).forEach(([playerName, info]) => {
        if (!standings[groupKey][playerName]) return;
        standings[groupKey][playerName].pj = info.pj ?? 0;
        standings[groupKey][playerName].pts = info.pts ?? 0;
        refreshRow(groupKey, playerName);
      });
    });
  }

  // partidos (solo visual, no tocamos puntos aquí)
  if (data.matches) {
    Object.entries(data.matches).forEach(([groupKey, matches]) => {
      matches.forEach((m) => {
        const selector = `.matches-card[data-group="${groupKey}"] .match-item[data-p1="${m.p1}"][data-p2="${m.p2}"]`;
        const li = document.querySelector(selector);
        if (!li) return;

        const gameDiv = li.querySelector(".game");
        if (!gameDiv) return;

        const winnerSide = m.winner || "none";
        gameDiv.dataset.winner = winnerSide;

        const btns = gameDiv.querySelectorAll(".game-btn");
        btns.forEach((b) => b.classList.remove("selected"));

        if (winnerSide === "p1" || winnerSide === "p2") {
          const winnerBtn = gameDiv.querySelector(
            `.game-btn[data-winner="${winnerSide}"]`
          );
          if (winnerBtn) {
            winnerBtn.classList.add("selected");
          }
        }
      });
    });
  }
}

// === 4) Generar todos los partidos (todos contra todos) ===
function generatePairings(players) {
  const matches = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matches.push([players[i], players[j]]);
    }
  }
  return matches;
}

// === 5) Pintar los partidos con 1 sola partida ===
function renderMatches() {
  Object.entries(groups).forEach(([groupKey, players]) => {
    const list = document.querySelector(
      `.matches-card[data-group="${groupKey}"] .matches-list`
    );
    if (!list) return;

    list.innerHTML = "";

    const pairings = generatePairings(players);

    pairings.forEach(([p1, p2], index) => {
      const li = document.createElement("li");
      li.classList.add("match-item");
      li.dataset.group = groupKey;
      li.dataset.p1 = p1;
      li.dataset.p2 = p2;

      li.innerHTML = `
        <div class="match-header">
          <span class="match-label">Duelo ${index + 1}</span>
          <span class="match-vs">
            ${p1} <span>vs</span> ${p2}
          </span>
        </div>
        <div class="game" data-winner="none">
          <span class="game-label">Ganador:</span>
          <button class="game-btn" data-winner="p1">${p1}</button>
          <button class="game-btn" data-winner="p2">${p2}</button>
        </div>
      `;

      list.appendChild(li);
    });
  });

  attachMatchListeners();
}

// === 6) Lógica de una sola partida por duelo ===
// Reglas:
// - 1 partida por duelo.
// - Cada victoria = 1 punto.
// - PJ = partidas jugadas (cuenta para ambos jugadores).
// - Si no había ganador → PJ++ ambos, +1 punto ganador.
// - Si cambias de ganador → se mueve el punto, PJ no cambia.
// - Si haces clic otra vez sobre el mismo → se deshace, PJ-- ambos, puntos-- ganador.
function attachMatchListeners() {
  document.querySelectorAll(".game-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const gameDiv = btn.closest(".game");
      const matchLi = btn.closest(".match-item");
      if (!gameDiv || !matchLi) return;

      const groupKey = matchLi.dataset.group;
      const p1 = matchLi.dataset.p1;
      const p2 = matchLi.dataset.p2;
      const winnerSide = btn.dataset.winner; // 'p1' o 'p2'
      const prevWinner = gameDiv.dataset.winner || "none";

      const winnerName = winnerSide === "p1" ? p1 : p2;
      const loserName = winnerSide === "p1" ? p2 : p1;

      // 1) Deshacer: mismo ganador -> quitar resultado
      if (prevWinner === winnerSide) {
        gameDiv.dataset.winner = "none";
        gameDiv.querySelectorAll(".game-btn").forEach((b) =>
          b.classList.remove("selected")
        );

        standings[groupKey][p1].pj -= 1;
        standings[groupKey][p2].pj -= 1;
        standings[groupKey][winnerName].pts -= 1;

        refreshRow(groupKey, p1);
        refreshRow(groupKey, p2);
        saveState();
        return;
      }

      // 2) Nueva partida (no había ganador)
      if (prevWinner === "none") {
        standings[groupKey][p1].pj += 1;
        standings[groupKey][p2].pj += 1;
        standings[groupKey][winnerName].pts += 1;
      } else {
        // 3) Cambiar ganador (de p1 a p2 o viceversa)
        const prevWinnerName = prevWinner === "p1" ? p1 : p2;
        standings[groupKey][prevWinnerName].pts -= 1;
        standings[groupKey][winnerName].pts += 1;
      }

      // actualizar visual
      gameDiv.dataset.winner = winnerSide;
      gameDiv.querySelectorAll(".game-btn").forEach((b) =>
        b.classList.remove("selected")
      );
      btn.classList.add("selected");

      refreshRow(groupKey, p1);
      refreshRow(groupKey, p2);
      saveState();
    });
  });
}

// === Init ===
document.addEventListener("DOMContentLoaded", () => {
  renderGroups();
  renderTables();
  renderMatches();
  loadState();
  showBanner(
    "Fase de grupos lista. Marca el ganador de cada duelo (1 partida) para actualizar la tabla."
  );
  setTimeout(hideBanner, 4000);
});
