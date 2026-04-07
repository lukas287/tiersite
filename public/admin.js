const loginModal = document.getElementById('loginModal');
const loginButton = document.getElementById('loginButton');
const closeModal = document.getElementById('closeModal');
const loginEmail = document.getElementById('loginEmail');
const loginPassword = document.getElementById('loginPassword');
const loginError = document.getElementById('loginError');
const logoutButton = document.getElementById('logoutButton');
const addEntryButton = document.getElementById('addEntryButton');
const usernameInput = document.getElementById('usernameInput');
const regionSelect = document.getElementById('regionSelect');
const gamemodeSelect = document.getElementById('gamemodeSelect');
const tierSelect = document.getElementById('tierSelect');
const managedEntries = document.getElementById('managedEntries');

function showLogin() {
  loginModal.classList.add('active');
}

function hideLogin() {
  loginModal.classList.remove('active');
  loginError.textContent = '';
}

function fetchEntries() {
  fetch('/api/entries')
    .then((res) => res.json())
    .then((entries) => renderManaged(entries));
}

function deleteEntry(entry) {
  if (!confirm(`Delete ${entry.username} (${entry.region} ${entry.gamemode})?`)) {
    return;
  }

  fetch(`/api/entry?username=${encodeURIComponent(entry.username)}&region=${encodeURIComponent(entry.region)}&gamemode=${encodeURIComponent(entry.gamemode)}`, {
    method: 'DELETE',
    headers: {
      Authorization: 'Bearer creepertiers-admin-token',
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        fetchEntries();
      }
    });
}

function renderManaged(entries) {
  managedEntries.innerHTML = '';
  const header = document.createElement('div');
  header.className = 'table-row head';
  header.innerHTML = '<span>PLAYER</span><span>REGION</span><span>GAMEMODE</span><span>TIER</span><span>ACTION</span>';
  managedEntries.appendChild(header);

  entries.forEach((entry) => {
    const row = document.createElement('div');
    row.className = 'table-row';
    row.innerHTML = `
      <div class="player-grid"><img src="https://cravatar.eu/helmhead/${encodeURIComponent(entry.username)}/64.png" alt="${entry.username}" /><span>${entry.username}</span></div>
      <span>${entry.region}</span>
      <span>${entry.gamemode}</span>
      <span>${entry.tier}</span>
      <button class="delete-button">Remove</button>
    `;
    const deleteButton = row.querySelector('.delete-button');
    deleteButton.addEventListener('click', () => deleteEntry(entry));
    managedEntries.appendChild(row);
  });
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
      fetchEntries();
      fetchMembers();
    })
    .catch((error) => {
      loginError.textContent = error.message;
    });
}

function addOrUpdateEntry() {
  const username = usernameInput.value.trim();
  const region = regionSelect.value;
  const gamemode = gamemodeSelect.value;
  const tier = tierSelect.value;
  if (!username) return;

  fetch('/api/entry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer creepertiers-admin-token',
    },
    body: JSON.stringify({ username, region, gamemode, tier }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        usernameInput.value = '';
        fetchEntries();
      }
    });
}

const memberSearch = document.getElementById('memberSearch');
const memberList = document.getElementById('memberList');

function fetchMembers() {
  fetch('/api/members', {
    headers: { Authorization: 'Bearer creepertiers-admin-token' },
  })
    .then((res) => res.json())
    .then((members) => renderMembers(members));
}

function renderMembers(members) {
  const filtered = members.filter(member => member.toLowerCase().includes(memberSearch.value.toLowerCase()));
  memberList.innerHTML = '';
  filtered.forEach((member) => {
    const item = document.createElement('div');
    item.className = 'member-item';
    item.innerHTML = `
      <div class="member-info">
        <img src="https://cravatar.eu/helmhead/${encodeURIComponent(member)}/64.png" alt="${member}" />
        <span class="member-name">${member}</span>
      </div>
      <button class="remove-member-btn">Remove</button>
    `;
    const removeBtn = item.querySelector('.remove-member-btn');
    removeBtn.addEventListener('click', () => removeMember(member));
    memberList.appendChild(item);
  });
}

function removeMember(username) {
  if (!confirm(`Remove ${username} from all rankings?`)) return;
  fetch(`/api/member?username=${encodeURIComponent(username)}`, {
    method: 'DELETE',
    headers: { Authorization: 'Bearer creepertiers-admin-token' },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        fetchMembers();
        fetchEntries();
      }
    });
}

loginButton.addEventListener('click', login);
closeModal.addEventListener('click', hideLogin);
logoutButton.addEventListener('click', () => {
  managedEntries.innerHTML = '';
  window.location.href = '/';
});
addEntryButton.addEventListener('click', addOrUpdateEntry);
memberSearch.addEventListener('input', () => {
  fetchMembers();
});
