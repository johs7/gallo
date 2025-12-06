// === CONFIG: grupos fijos ===
const groups = {
  A: [
    "Hanlley",
    "Petrucho115",
    "XAVI",
    "✨️❤️K•M•D❤️✨️",
    "Ak",
  ],
  B: [
    "GP PAO",
    "don’t do that",
    "ARCEBOX",
    "JJ Calero",
    "Nanan",
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
  ],
};

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

// === 3) Generar todos los partidos (todos contra todos) ===
function generatePairings(players) {
  const matches = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      matches.push([players[i], players[j]]);
    }
  }
  return matches;
}

// === 4) Pintar los partidos con 2 partidas clicables ===
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
        <div class="games-row">
          <div class="game" data-game="1" data-winner="none">
            <span class="game-label">Partida 1:</span>
            <button class="game-btn" data-winner="p1">${p1}</button>
            <button class="game-btn" data-winner="p2">${p2}</button>
          </div>
          <div class="game" data-game="2" data-winner="none">
            <span class="game-label">Partida 2:</span>
            <button class="game-btn" data-winner="p1">${p1}</button>
            <button class="game-btn" data-winner="p2">${p2}</button>
          </div>
        </div>
      `;

      list.appendChild(li);
    });
  });

  attachMatchListeners();
}

// === 5) Lógica al marcar ganador de una partida ===
// Reglas:
// - Cada partida ganada = 1 punto.
// - PJ = partidas jugadas (cuenta para los dos jugadores).
// - Si antes no había ganador → PJ++ para ambos, +1 punto al ganador.
// - Si cambias de ganador → puntos se mueven, PJ no cambia.
// - Si haces clic de nuevo sobre el mismo ganador → se deshace: PJ-- ambos y puntos-- para ese jugador.
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

      // Caso 1: volver a hacer clic sobre el mismo ganador → deshacer la partida
      if (prevWinner === winnerSide) {
        gameDiv.dataset.winner = "none";
        gameDiv.querySelectorAll(".game-btn").forEach((b) =>
          b.classList.remove("selected")
        );

        // quitar 1 PJ a ambos y 1 punto al ganador
        standings[groupKey][p1].pj -= 1;
        standings[groupKey][p2].pj -= 1;
        standings[groupKey][winnerName].pts -= 1;

        refreshRow(groupKey, p1);
        refreshRow(groupKey, p2);
        return;
      }

      // Caso 2: antes no había ganador (partida nueva)
      if (prevWinner === "none") {
        // sumamos PJ a ambos
        standings[groupKey][p1].pj += 1;
        standings[groupKey][p2].pj += 1;

        // sumamos punto al nuevo ganador
        standings[groupKey][winnerName].pts += 1;
      } else {
        // Caso 3: cambiar de ganador (de p1 a p2 o viceversa)
        const prevWinnerName = prevWinner === "p1" ? p1 : p2;
        standings[groupKey][prevWinnerName].pts -= 1;
        standings[groupKey][winnerName].pts += 1;
      }

      // actualizar estado visual y dataset
      gameDiv.dataset.winner = winnerSide;
      gameDiv.querySelectorAll(".game-btn").forEach((b) =>
        b.classList.remove("selected")
      );
      btn.classList.add("selected");

      // refrescar tabla de ambos
      refreshRow(groupKey, p1);
      refreshRow(groupKey, p2);
    });
  });
}

// === Init ===
document.addEventListener("DOMContentLoaded", () => {
  renderGroups();
  renderTables();
  renderMatches();
  showBanner(
    "Fase de grupos lista. Marca el ganador de cada partida para actualizar la tabla."
  );
  setTimeout(hideBanner, 4000);
});
