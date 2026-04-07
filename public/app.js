const gamemodes = ['Overall', 'Vanilla', 'UHC', 'Pot', 'NethOP', 'SMP', 'Sword', 'Axe', 'Mace'];
const modeButtons = document.getElementById('gamemodeButtons');
const tierGrid = document.getElementById('tierGrid');
let selectedMode = 'Overall';

function normalizeTier(tier) {
  const match = tier.match(/^(HT|LT)([1-5])$/);
  return match ? { kind: match[1], number: match[2] } : null;
}

const loginModal = document.getElementById('loginModal');
const loginButton = document.getElementById('loginButton');
const closeModal = document.getElementById('closeModal');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');

function showLogin() {
  loginModal.classList.add('active');
}

function hideLogin() {
  loginModal.classList.remove('active');
  loginError.textContent = '';
}

function handleManagerClick(event) {
  event.preventDefault();
  showLogin();
}

function login() {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();
  fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.message || 'Login failed');
      }
      return res.json();
    })
    .then((data) => {
      hideLogin();
      window.location.href = '/admin';
    })
    .catch((error) => {
      loginError.textContent = error.message;
    });
}

function createButton(text, active = false) {
  const button = document.createElement('button');
  button.textContent = text;
  if (active) button.classList.add('active');
  return button;
}

function loadEntries() {
  const query = selectedMode === 'Overall' ? '' : `?gamemode=${encodeURIComponent(selectedMode)}`;
  fetch(`/api/entries${query}`)
    .then((res) => res.json())
    .then((entries) => {
      if (selectedMode === 'Overall') {
        renderOverallEntries(entries);
      } else {
        renderTierCards(entries);
      }
    });
}

function renderOverallEntries(entries) {
  tierGrid.classList.add('overall-mode');
  tierGrid.innerHTML = '';
  if (!entries.length) {
    tierGrid.innerHTML = '<div class="tier-card"><div class="tier-empty">Tier rankings will appear here once managers add players.</div></div>';
    return;
  }

  const playerMap = new Map();
  entries.forEach((entry) => {
    const key = entry.username.toLowerCase();
    if (!playerMap.has(key)) {
      playerMap.set(key, { username: entry.username, region: entry.region, tiers: [], highestTier: null });
    }
    playerMap.get(key).tiers.push(entry);
    const currentValue = tierValue(entry.tier);
    if (playerMap.get(key).highestTier === null || currentValue > tierValue(playerMap.get(key).highestTier)) {
      playerMap.get(key).highestTier = entry.tier;
    }
  });

  const sortedPlayers = Array.from(playerMap.values()).sort((a, b) => {
    const scoreA = tierValue(a.highestTier);
    const scoreB = tierValue(b.highestTier);
    if (scoreA !== scoreB) return scoreB - scoreA;
    return a.username.localeCompare(b.username, undefined, { sensitivity: 'base' });
  });

  sortedPlayers.forEach((player, index) => {
    const rank = index + 1;
    const row = document.createElement('div');
    row.className = 'overall-row';
    row.innerHTML = `
      <div class="player-main">
        <div class="rank-number">${rank}</div>
        <img class="player-avatar" src="https://cravatar.eu/helmhead/${encodeURIComponent(player.username)}/60.png" alt="${player.username}" />
        <div class="player-details">
          <div class="player-name">${player.username}</div>
          <div class="player-tiers">
            ${player.tiers.map((tierEntry) => `<span class="overall-tier" title="${tierEntry.gamemode}">${tierEntry.tier}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
    tierGrid.appendChild(row);
  });
}

function renderTierCards(entries) {
  tierGrid.classList.remove('overall-mode');
  tierGrid.innerHTML = '';
  if (!entries.length) {
    tierGrid.innerHTML = '<div class="tier-card"><div class="tier-empty">Tier rankings will appear here once managers add players.</div></div>';
    return;
  }

  const groups = new Map();
  entries.forEach((entry) => {
    if (!groups.has(entry.tier)) {
      groups.set(entry.tier, []);
    }
    groups.get(entry.tier).push(entry);
  });

  const sortedTiers = Array.from(groups.keys()).sort((a, b) => tierValue(b) - tierValue(a));

  sortedTiers.forEach((tier) => {
    const tierEntries = groups.get(tier);
    const tierInfo = normalizeTier(tier);
    const tierLabel = tierInfo ? `Tier ${tierInfo.number}` : tier;
    const tierCat = tierInfo ? tierInfo.kind : '';

    const card = document.createElement('div');
    card.className = 'tier-card';
    card.innerHTML = `
      <div class="tier-header">
        <span class="trophy">🏆</span>
        <div>
          <div class="tier-title">${tierLabel}</div>
          <div class="tier-subtitle">${tierCat}</div>
        </div>
      </div>
      <div class="tier-body">
        ${tierEntries.map((entry) => renderTierEntry(entry)).join('')}
      </div>
    `;
    tierGrid.appendChild(card);
  });
}

function renderTierEntry(entry) {
  return `
    <div class="tier-entry">
      <img class="player-avatar" src="https://cravatar.eu/helmhead/${encodeURIComponent(entry.username)}/72.png" alt="${entry.username}" />
      <div class="entry-details">
        <div class="entry-name">${entry.username}</div>
        <div class="entry-labels">
          <span class="entry-tag region-tag">${entry.region}</span>
          <span class="entry-tag tier-tag">${entry.tier}</span>
        </div>
      </div>
    </div>
  `;
}

function initControls() {
  gamemodes.forEach((mode) => {
    const button = createButton(mode, mode === selectedMode);
    button.addEventListener('click', () => {
      selectedMode = mode;
      Array.from(modeButtons.children).forEach((btn) => btn.classList.toggle('active', btn.textContent === mode));
      loadEntries();
    });
    modeButtons.appendChild(button);
  });
}

function tierValue(tier) {
  const match = tier.match(/^(HT|LT)([1-5])$/);
  if (!match) return 0;
  return match[1] === 'HT' ? 100 - Number(match[2]) : 10 - Number(match[2]);
}

initControls();
loadEntries();

loginButton.addEventListener('click', login);
closeModal.addEventListener('click', hideLogin);
