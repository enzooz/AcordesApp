const STORAGE_KEY = 'acordesSongs';
const CULTO_KEY = 'acordesCulto';
const SEED_KEY = 'acordesSeedVersion';
const SEED_VERSION = 6;

const ALIGN_FIX_IDS = new Set([
  'default-023','default-024','default-025','default-026',
  'default-027','default-028','default-029','default-030',
  'default-031','default-032','default-033','default-034'
]);

const CHORDS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

const CHORD_MAP_FLAT = {
  'Db':'C#','Eb':'D#','Fb':'E','Gb':'F#','Ab':'G#','Bb':'A#','Cb':'B',
  'C':'C','D':'D','E':'E','F':'F','G':'G','A':'A','B':'B'
};


let songs = [];
let cultoSongs = [];
let currentSongId = null;
let currentTranspose = 0;
let currentFilter = 'order';
let currentSource = 'library';
let songNavList = [];


const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const openSidebarBtn = document.getElementById('openSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');
const navBtns = document.querySelectorAll('.nav-btn');
const views = document.querySelectorAll('.view');
const songList = document.getElementById('songList');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const searchFull = document.getElementById('searchFull');
const searchResults = document.getElementById('searchResults');
const songForm = document.getElementById('songForm');
const formTitle = document.getElementById('formTitle');
const songIdInput = document.getElementById('songId');
const songNameInput = document.getElementById('songName');
const songAuthorInput = document.getElementById('songAuthor');
const songContentInput = document.getElementById('songContent');
const cancelEditBtn = document.getElementById('cancelEdit');
const songTitleEl = document.getElementById('songTitle');
const songAuthorEl = document.getElementById('songAuthorView');
const songDisplay = document.getElementById('songDisplay');
const backToListBtn = document.getElementById('backToList');
const editSongBtn = document.getElementById('editSong');
const deleteSongBtn = document.getElementById('deleteSong');
const transposeUpBtn = document.getElementById('transposeUp');
const transposeDownBtn = document.getElementById('transposeDown');
const transposeResetBtn = document.getElementById('transposeReset');
const currentToneEl = document.getElementById('currentTone');
const prevSongBtn = document.getElementById('prevSong');
const nextSongBtn = document.getElementById('nextSong');
const autoScrollBtn = document.getElementById('autoScrollBtn');
const scrollSpeedInput = document.getElementById('scrollSpeed');
const scrollSpeedLbl = document.getElementById('scrollSpeedLbl');
const tabBtns = document.querySelectorAll('.tab');
const addToCultoBtn = document.getElementById('addToCulto');
const cultoList = document.getElementById('cultoList');
const cultoEmpty = document.getElementById('cultoEmpty');
const clearCultoBtn = document.getElementById('clearCulto');


function loadSongs() {
  try {
    songs = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch (e) {
    songs = [];
  }
  if (!Array.isArray(songs)) songs = [];

  const storedVersion = parseInt(localStorage.getItem(SEED_KEY) || '0');
  if (storedVersion < SEED_VERSION) {
    const existingIds = new Set(songs.map(s => s.id));
    DEFAULT_SONGS.forEach(def => {
      if (!existingIds.has(def.id)) {
        songs.push({ ...def });
        existingIds.add(def.id);
      }
    });
    if (storedVersion < 6) {
      songs.forEach(song => {
        if (ALIGN_FIX_IDS.has(song.id)) {
          const def = DEFAULT_SONGS.find(d => d.id === song.id);
          if (def) song.content = def.content;
        }
      });
    }
    localStorage.setItem(SEED_KEY, String(SEED_VERSION));
    saveSongs();
  }
}

function saveSongs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
}


function loadCulto() {
  const data = localStorage.getItem(CULTO_KEY);
  cultoSongs = data ? JSON.parse(data) : [];
}

function saveCulto() {
  localStorage.setItem(CULTO_KEY, JSON.stringify(cultoSongs));
}


function uuid() {
  return 'xxxx-xxxx'.replace(/x/g, () => (Math.random() * 16 | 0).toString(16));
}


function showView(viewName) {
  views.forEach(v => v.classList.remove('active'));
  navBtns.forEach(b => b.classList.remove('active'));

  const target = document.getElementById('view-' + viewName);
  if (target) target.classList.add('active');

  navBtns.forEach(b => {
    if (b.dataset.view === viewName) b.classList.add('active');
  });

  if (viewName !== 'song') stopAutoScroll();

  closeSidebar();
}

function getActiveView() {
  const active = document.querySelector('.view.active');
  return active ? active.id.replace('view-', '') : 'home';
}

function renderView(viewName, state = {}) {
  switch (viewName) {
    case 'culto':
      renderCultoList();
      showView('culto');
      break;
    case 'search':
      renderSongList(searchResults, getFilteredSongs('order', searchFull.value));
      showView('search');
      break;
    case 'add':
      if (state.editId) {
        const song = songs.find(s => s.id === state.editId);
        if (song) {
          fillForm(song);
        } else {
          resetForm();
        }
      } else {
        resetForm();
      }
      showView('add');
      break;
    case 'song':
      if (state.source === 'culto') {
        const cultoSong = cultoSongs.find(s => s.cultoId === state.cultoId);
        if (cultoSong) {
          openCultoSong(cultoSong, { push: false, from: state.from });
        } else {
          const fallback = state.from || 'culto';
          history.replaceState({ view: fallback }, '');
          renderView(fallback);
        }
      } else {
        const song = songs.find(s => s.id === state.songId);
        if (song) {
          openSong(song.id, { push: false, from: state.from });
        } else {
          const fallback = state.from || 'home';
          history.replaceState({ view: fallback }, '');
          renderView(fallback);
        }
      }
      break;
    case 'home':
    default:
      refreshList();
      showView('home');
      break;
  }
}

function navigate(viewName, state = {}) {
  const next = { ...state, view: viewName };
  history.pushState(next, '');
  renderView(viewName, next);
}

function replaceNavigation(viewName, state = {}) {
  const next = { ...state, view: viewName };
  history.replaceState(next, '');
  renderView(viewName, next);
}

function openSidebar() {
  sidebar.classList.add('open');
  overlay.classList.add('active');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  overlay.classList.remove('active');
}

function renderSongList(targetEl, songsToShow) {
  targetEl.innerHTML = '';

  if (songsToShow.length === 0) {
    targetEl.innerHTML = '<p style="padding:1rem;color:#999;">No se encontraron canciones.</p>';
    return;
  }

  songsToShow.forEach((song, idx) => {
    const item = document.createElement('div');
    item.className = 'song-item';
    item.innerHTML = `
      <div class="song-info">
        <div class="title">${escapeHtml(song.title)}</div>
        <div class="author">${escapeHtml(song.author)}</div>
      </div>
      <div class="song-actions-inline">
        <button class="btn-icon" data-action="moveUp" data-id="${song.id}" title="Mover arriba">&#9650;</button>
        <button class="btn-icon" data-action="moveDown" data-id="${song.id}" title="Mover abajo">&#9660;</button>
      </div>
    `;

    item.querySelector('.song-info').addEventListener('click', () => openSong(song.id));
    item.querySelector('[data-action="moveUp"]').addEventListener('click', (e) => {
      e.stopPropagation();
      moveSong(song.id, -1);
    });
    item.querySelector('[data-action="moveDown"]').addEventListener('click', (e) => {
      e.stopPropagation();
      moveSong(song.id, 1);
    });

    targetEl.appendChild(item);
  });
}

function getFilteredSongs(filter, query) {
  let result = [...songs];

  if (query) {
    const q = query.toLowerCase();
    result = result.filter(s =>
      s.title.toLowerCase().includes(q) ||
      s.author.toLowerCase().includes(q)
    );
  }

  switch (filter) {
    case 'author':
      result.sort((a, b) => a.author.localeCompare(b.author, 'es'));
      break;
    case 'alpha':
      result.sort((a, b) => a.title.localeCompare(b.title, 'es'));
      break;
    case 'order':
    default:
      result.sort((a, b) => a.order - b.order);
      break;
  }

  return result;
}

function refreshList() {
  const filtered = getFilteredSongs(currentFilter, '');
  renderSongList(songList, filtered);
  emptyState.style.display = filtered.length === 0 ? 'block' : 'none';
}


function addSong(title, author, content) {
  const maxOrder = songs.reduce((max, s) => Math.max(max, s.order || 0), 0);
  const song = {
    id: uuid(),
    title: title.trim(),
    author: author.trim(),
    content: content,
    order: maxOrder + 1,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  songs.push(song);
  saveSongs();
  return song;
}

function updateSong(id, title, author, content) {
  const song = songs.find(s => s.id === id);
  if (song) {
    song.title = title.trim();
    song.author = author.trim();
    song.content = content;
    song.updatedAt = Date.now();
    saveSongs();
  }
}

function deleteSong(id) {
  songs = songs.filter(s => s.id !== id);
  saveSongs();
}

function moveSong(id, direction) {
  const filtered = getFilteredSongs(currentFilter, '');
  const idx = filtered.findIndex(s => s.id === id);
  if (idx === -1) return;

  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= filtered.length) return;

  const songA = songs.find(s => s.id === filtered[idx].id);
  const songB = songs.find(s => s.id === filtered[targetIdx].id);

  const tmpOrder = songA.order;
  songA.order = songB.order;
  songB.order = tmpOrder;

  saveSongs();
  refreshList();
}


function addToCulto(songId) {
  const song = songs.find(s => s.id === songId);
  if (!song) return;

  const cultoSong = {
    ...song,
    cultoId: uuid(),
    originalId: song.id,
    addedAt: Date.now()
  };
  cultoSongs.push(cultoSong);
  saveCulto();
}

function removeFromCulto(cultoId) {
  cultoSongs = cultoSongs.filter(s => s.cultoId !== cultoId);
  saveCulto();
}

function clearCulto() {
  cultoSongs = [];
  saveCulto();
}

function moveCultoSong(cultoId, direction) {
  const idx = cultoSongs.findIndex(s => s.cultoId === cultoId);
  if (idx === -1) return;

  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= cultoSongs.length) return;

  const temp = cultoSongs[idx];
  cultoSongs[idx] = cultoSongs[targetIdx];
  cultoSongs[targetIdx] = temp;

  saveCulto();
  renderCultoList();
}

function renderCultoList() {
  cultoList.innerHTML = '';

  if (cultoSongs.length === 0) {
    cultoEmpty.style.display = 'block';
    return;
  }

  cultoEmpty.style.display = 'none';

  cultoSongs.forEach(song => {
    const item = document.createElement('div');
    item.className = 'song-item';
    item.innerHTML = `
      <div class="song-info">
        <div class="title">${escapeHtml(song.title)}</div>
        <div class="author">${escapeHtml(song.author)}</div>
      </div>
      <div class="song-actions-inline">
        <button class="btn-icon" data-action="moveUp" data-id="${song.cultoId}" title="Mover arriba">&#9650;</button>
        <button class="btn-icon" data-action="moveDown" data-id="${song.cultoId}" title="Mover abajo">&#9660;</button>
        <button class="btn-icon btn-icon-danger" data-action="remove" data-id="${song.cultoId}" title="Eliminar del culto">&times;</button>
      </div>
    `;

    item.querySelector('.song-info').addEventListener('click', () => openCultoSong(song));
    item.querySelector('[data-action="moveUp"]').addEventListener('click', (e) => {
      e.stopPropagation();
      moveCultoSong(song.cultoId, -1);
    });
    item.querySelector('[data-action="moveDown"]').addEventListener('click', (e) => {
      e.stopPropagation();
      moveCultoSong(song.cultoId, 1);
    });
    item.querySelector('[data-action="remove"]').addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromCulto(song.cultoId);
      renderCultoList();
    });

    cultoList.appendChild(item);
  });
}

function openCultoSong(song, options = {}) {
  const push = options.push !== false;
  const replace = options.replace === true;
  const from = options.from || getActiveView();

  currentSongId = song.cultoId;
  currentSource = 'culto';
  currentTranspose = 0;
  stopAutoScroll();

  if (push) {
    songNavList = buildSongNavList('culto', from);
  }

  songTitleEl.textContent = song.title;
  songAuthorEl.textContent = song.author;
  currentToneEl.textContent = '0';

  addToCultoBtn.style.display = 'none';

  renderSongContent(song.content, 0);
  showView('song');

  const state = { view: 'song', source: 'culto', cultoId: song.cultoId, from };
  if (push) {
    history.pushState(state, '');
  } else if (replace) {
    history.replaceState(state, '');
  }

  updateSongNavButtons();
}

function isInCulto(songId) {
  return cultoSongs.some(s => s.originalId === songId);
}

function getDisplayedSong() {
  if (currentSource === 'culto') {
    return cultoSongs.find(s => s.cultoId === currentSongId) || null;
  }
  return songs.find(s => s.id === currentSongId) || null;
}

function buildSongNavList(source, from) {
  if (source === 'culto') {
    return cultoSongs.map(s => s.cultoId);
  }
  if (from === 'search') {
    return getFilteredSongs('order', searchFull.value).map(s => s.id);
  }
  return getFilteredSongs(currentFilter, searchInput.value).map(s => s.id);
}

function getSongNavigationList() {
  if (!songNavList.includes(currentSongId)) {
    const from = (history.state && history.state.from) || 'home';
    songNavList = buildSongNavList(currentSource, from);
  }
  return songNavList;
}

function updateSongNavButtons() {
  const list = getSongNavigationList();
  const idx = list.indexOf(currentSongId);
  prevSongBtn.disabled = idx <= 0;
  nextSongBtn.disabled = idx === -1 || idx >= list.length - 1;
}

function goToAdjacentSong(direction) {
  const list = getSongNavigationList();
  const idx = list.indexOf(currentSongId);
  if (idx === -1) return;

  const targetIdx = idx + direction;
  if (targetIdx < 0 || targetIdx >= list.length) return;

  const from = (history.state && history.state.from) ||
    (currentSource === 'culto' ? 'culto' : 'home');
  const targetId = list[targetIdx];

  if (currentSource === 'culto') {
    const song = cultoSongs.find(s => s.cultoId === targetId);
    if (song) openCultoSong(song, { push: false, replace: true, from });
  } else {
    openSong(targetId, { push: false, replace: true, from });
  }
}


function openSong(id, options = {}) {
  const song = songs.find(s => s.id === id);
  if (!song) return;

  const push = options.push !== false;
  const replace = options.replace === true;
  const from = options.from || getActiveView();

  currentSongId = id;
  currentSource = 'library';
  currentTranspose = 0;
  stopAutoScroll();

  if (push) {
    songNavList = buildSongNavList('library', from);
  }

  songTitleEl.textContent = song.title;
  songAuthorEl.textContent = song.author;
  currentToneEl.textContent = '0';

  addToCultoBtn.style.display = '';

  if (isInCulto(id)) {
    addToCultoBtn.textContent = 'Agregada al culto';
    addToCultoBtn.classList.add('added');
  } else {
    addToCultoBtn.textContent = 'Agregar al culto de hoy';
    addToCultoBtn.classList.remove('added');
  }

  renderSongContent(song.content, 0);
  showView('song');

  const state = { view: 'song', source: 'library', songId: id, from };
  if (push) {
    history.pushState(state, '');
  } else if (replace) {
    history.replaceState(state, '');
  }

  updateSongNavButtons();
}

function renderSongContent(content, transpose) {
  songDisplay.innerHTML = '';

  const lines = content.split('\n');

  lines.forEach(line => {
    const chordLine = document.createElement('div');
    const lyricLine = document.createElement('div');

    const regex = /\[([A-G][^\]]*)\]/g;
    let hasChords = false;
    let chordPositions = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      hasChords = true;
      const chord = match[1];
      const pos = match.index;
      const transposed = transposeChord(chord, transpose);
      chordPositions.push({ text: transposed, pos: pos, len: match[0].length });
      lastIndex = regex.lastIndex;
    }

    if (hasChords) {
      let lyricText = '';
      let offset = 0;
      lastIndex = 0;
      chordPositions.forEach(cp => {
        lyricText += line.substring(lastIndex, cp.pos);
        lastIndex = cp.pos + cp.len;
      });
      lyricText += line.substring(lastIndex);

      let chordText = '';
      let lyricPos = 0;
      chordPositions.forEach(cp => {
        const targetPos = cp.pos - offset;
        while (lyricPos < targetPos) {
          chordText += ' ';
          lyricPos++;
        }
        chordText += cp.text;
        lyricPos += cp.text.length;
        offset += cp.len - cp.text.length;
      });

      chordLine.innerHTML = `<span class="chord">${escapeHtml(chordText)}</span>`;
      chordLine.style.height = '1.2em';
      lyricLine.textContent = lyricText;

      songDisplay.appendChild(chordLine);
      songDisplay.appendChild(lyricLine);
    } else {
      lyricLine.textContent = line;
      songDisplay.appendChild(lyricLine);
    }
  });
}

function transposeChord(chord, amount) {
  if (amount === 0) return chord;

  const match = chord.match(/^([A-G][#b]?)/);
  if (!match) return chord;

  const root = match[1];
  const rest = chord.substring(root.length);

  let normalized = CHORD_MAP_FLAT[root] || root;
  let idx = CHORDS.indexOf(normalized);
  if (idx === -1) return chord;

  idx = (idx + amount + 12) % 12;
  return CHORDS[idx] + rest;
}

function resetForm() {
  songIdInput.value = '';
  songNameInput.value = '';
  songAuthorInput.value = '';
  songContentInput.value = '';
  formTitle.textContent = 'Agregar Canción';
}

function fillForm(song) {
  songIdInput.value = song.id;
  songNameInput.value = song.title;
  songAuthorInput.value = song.author;
  songContentInput.value = song.content;
  formTitle.textContent = 'Editar Canción';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Sidebar
openSidebarBtn.addEventListener('click', openSidebar);
closeSidebarBtn.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

// Nav
navBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    navigate(btn.dataset.view);
  });
});

// Tabs
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    refreshList();
  });
});

// Search (header)
searchInput.addEventListener('input', () => {
  const q = searchInput.value;
  const filtered = getFilteredSongs(currentFilter, q);
  renderSongList(songList, filtered);
  emptyState.style.display = filtered.length === 0 ? 'block' : 'none';
});

// Search (full)
searchFull.addEventListener('input', () => {
  const q = searchFull.value;
  const filtered = getFilteredSongs('order', q);
  renderSongList(searchResults, filtered);
});

// Form submit
songForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const title = songNameInput.value;
  const author = songAuthorInput.value;
  const content = songContentInput.value;

  if (songIdInput.value) {
    updateSong(songIdInput.value, title, author, content);
  } else {
    addSong(title, author, content);
  }

  resetForm();
  replaceNavigation('home');
});

// Cancel edit
cancelEditBtn.addEventListener('click', () => {
  resetForm();
  replaceNavigation('home');
});

// Back to list
backToListBtn.addEventListener('click', () => {
  if (history.state && history.state.view === 'song') {
    history.back();
  } else {
    renderView(currentSource === 'culto' ? 'culto' : 'home');
  }
});

// Edit song
editSongBtn.addEventListener('click', () => {
  const displayed = getDisplayedSong();
  if (!displayed) return;

  let song = displayed;
  if (currentSource === 'culto' && displayed.originalId) {
    song = songs.find(s => s.id === displayed.originalId) || displayed;
  }
  fillForm(song);
  navigate('add', { editId: song.id });
});

// Delete song
deleteSongBtn.addEventListener('click', () => {
  if (!confirm('¿Eliminar esta canción?')) return;

  if (currentSource === 'culto') {
    removeFromCulto(currentSongId);
  } else {
    deleteSong(currentSongId);
  }

  if (history.state && history.state.view === 'song') {
    history.back();
  } else {
    replaceNavigation(currentSource === 'culto' ? 'culto' : 'home');
  }
});

// Browser / mobile back
window.addEventListener('popstate', (e) => {
  const state = e.state || { view: 'home' };
  renderView(state.view || 'home', state);
});

// Song navigation
prevSongBtn.addEventListener('click', () => goToAdjacentSong(-1));
nextSongBtn.addEventListener('click', () => goToAdjacentSong(1));

// Transpose
transposeUpBtn.addEventListener('click', () => {
  currentTranspose++;
  currentToneEl.textContent = currentTranspose > 0 ? '+' + currentTranspose : currentTranspose;
  const song = getDisplayedSong();
  if (song) renderSongContent(song.content, currentTranspose);
});

transposeDownBtn.addEventListener('click', () => {
  currentTranspose--;
  currentToneEl.textContent = currentTranspose > 0 ? '+' + currentTranspose : currentTranspose;
  const song = getDisplayedSong();
  if (song) renderSongContent(song.content, currentTranspose);
});

transposeResetBtn.addEventListener('click', () => {
  currentTranspose = 0;
  currentToneEl.textContent = '0';
  const song = getDisplayedSong();
  if (song) renderSongContent(song.content, 0);
});

// Auto scroll
let autoScrollActive = false;
let autoScrollTimer = null;

function startAutoScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  if (max <= 0) return;

  stopAutoScroll();
  autoScrollActive = true;
  autoScrollBtn.textContent = '\u25A0 Detener';
  autoScrollBtn.classList.add('running');

  autoScrollTimer = setInterval(() => {
    const speed = parseInt(scrollSpeedInput.value, 10) || 1;
    const step = Math.max(1, Math.round(speed * 0.4));
    const limit = document.documentElement.scrollHeight - window.innerHeight;

    if (window.scrollY >= limit - 2) {
      stopAutoScroll();
      return;
    }
    window.scrollBy(0, step);
  }, 30);
}

function stopAutoScroll() {
  autoScrollActive = false;
  if (autoScrollTimer) {
    clearInterval(autoScrollTimer);
    autoScrollTimer = null;
  }
  if (autoScrollBtn) {
    autoScrollBtn.textContent = '\u25B6 Corrido';
    autoScrollBtn.classList.remove('running');
  }
}

autoScrollBtn.addEventListener('click', () => {
  if (autoScrollActive) {
    stopAutoScroll();
  } else {
    startAutoScroll();
  }
});

scrollSpeedInput.addEventListener('input', () => {
  scrollSpeedLbl.textContent = scrollSpeedInput.value;
});

// Add to culto
addToCultoBtn.addEventListener('click', () => {
  if (isInCulto(currentSongId)) return;
  addToCulto(currentSongId);
  addToCultoBtn.textContent = 'Agregada al culto';
  addToCultoBtn.classList.add('added');
});

// Clear culto
clearCultoBtn.addEventListener('click', () => {
  if (cultoSongs.length === 0) return;
  if (confirm('¿Limpiar todo el culto del día?')) {
    clearCulto();
    renderCultoList();
  }
});

// =============================================
// Init
// =============================================
loadSongs();
loadCulto();
history.replaceState({ view: 'home' }, '');
refreshList();
