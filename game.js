/**
 * Mastermind — Frontend Game Logic
 * Communicates with api.php via fetch (no page reloads).
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple'];
const CODE_LEN    = 4;
const MAX_ROUNDS  = 10;

// ── Game State ────────────────────────────────────────────────────────────────

const state = {
  playerName:    '',
  currentRound:  1,          // 1-based
  currentGuess:  [],         // up to 4 colors
  selectedSlot:  0,          // which slot is highlighted (0-3)
  activeColor:   null,       // which color button is selected
  isSubmitting:  false,
  history:       [],         // [{ guess, feedback }]
};

// ── DOM References ─────────────────────────────────────────────────────────────

const startScreen  = document.getElementById('start-screen');
const gameScreen   = document.getElementById('game-screen');
const resultOverlay = document.getElementById('result-overlay');
const nameInput    = document.getElementById('name-input');
const btnStart     = document.getElementById('btn-start');
const boardEl      = document.getElementById('game-board-rows');
const headerPlayer = document.getElementById('header-player');
const headerRound  = document.getElementById('header-round');
const headerLeft   = document.getElementById('header-left');
const btnSubmit    = document.getElementById('btn-submit');
const btnClear     = document.getElementById('btn-clear');
const resultTitle  = document.getElementById('result-title');
const resultSubtitle = document.getElementById('result-subtitle');
const resultIcon   = document.getElementById('result-icon');
const resultSecretEl = document.getElementById('result-secret');
const btnPlayAgain = document.getElementById('btn-play-again');
const btnNewPlayer = document.getElementById('btn-new-player');
const toastEl      = document.getElementById('toast');

// ── Audio (Web Audio API — no external files) ─────────────────────────────────

let audioCtx = null;

function getAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.12, gain = 0.18, delay = 0) {
  try {
    const ctx = getAudio();
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.connect(g);
    g.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0, ctx.currentTime + delay);
    g.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.01);
  } catch (_) { /* audio not supported — silently skip */ }
}

function playClick()   { playTone(440, 'sine',     0.06, 0.08); }
function playPlace()   { playTone(600, 'triangle', 0.08, 0.12); }
function playBlack()   { playTone(880, 'sine',     0.10, 0.14); }
function playWhite()   { playTone(660, 'sine',     0.10, 0.10); }

function playWin() {
  [[523, 0], [659, 0.12], [784, 0.24], [1047, 0.38]].forEach(([f, d]) =>
    playTone(f, 'sine', 0.25, 0.18, d)
  );
}

function playLose() {
  [[440, 0], [370, 0.18], [311, 0.36], [277, 0.55]].forEach(([f, d]) =>
    playTone(f, 'sawtooth', 0.25, 0.12, d)
  );
}

// ── API ────────────────────────────────────────────────────────────────────────

async function api(payload) {
  const res = await fetch('api.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── Render Helpers ────────────────────────────────────────────────────────────

/** Create a large peg element */
function makePeg(color = null, slot = false) {
  const el = document.createElement('div');
  el.className = 'peg' + (slot ? ' peg-slot' : '') + (color ? ' filled' : ' empty');
  if (color) el.dataset.color = color;
  return el;
}

/** Create a 2×2 feedback grid for a row */
function makeFeedbackGrid(feedback = null) {
  const grid = document.createElement('div');
  grid.className = 'feedback-grid';
  // Build array: blacks first, then whites, then empties
  const pegs = [];
  if (feedback) {
    for (let i = 0; i < feedback.black; i++) pegs.push('black');
    for (let i = 0; i < feedback.white; i++) pegs.push('white');
  }
  while (pegs.length < 4) pegs.push('empty');

  pegs.forEach((type, i) => {
    const p = document.createElement('div');
    p.className = `feedback-peg ${type}`;
    if (feedback) {
      // Staggered reveal animation
      p.style.animationDelay = `${i * 60}ms`;
      p.classList.add('reveal');
    }
    grid.appendChild(p);
  });
  return grid;
}

/** Render the full board (history + active row + future rows) */
function renderBoard() {
  boardEl.innerHTML = '';

  // ── Completed rows ──────────────────────────────────────────────
  state.history.forEach((entry, idx) => {
    const row = document.createElement('div');
    row.className = 'board-row row-filled';

    const num = document.createElement('div');
    num.className = 'row-number';
    num.textContent = idx + 1;

    const pegs = document.createElement('div');
    pegs.className = 'guess-pegs';
    entry.guess.forEach(c => pegs.appendChild(makePeg(c)));

    row.appendChild(num);
    row.appendChild(pegs);
    row.appendChild(makeFeedbackGrid(entry.feedback));
    boardEl.appendChild(row);
  });

  // Stop here if game is over
  if (state.history.length >= MAX_ROUNDS || isGameOver()) return;

  // ── Active row ─────────────────────────────────────────────────
  const activeRow = document.createElement('div');
  activeRow.className = 'board-row active';
  activeRow.id = 'active-row';

  const num = document.createElement('div');
  num.className = 'row-number';
  num.textContent = state.currentRound;

  const pegs = document.createElement('div');
  pegs.className = 'guess-pegs';

  for (let i = 0; i < CODE_LEN; i++) {
    const slot = makePeg(state.currentGuess[i] ?? null, true);
    slot.dataset.index = i;
    if (i === state.selectedSlot && state.currentGuess.length < CODE_LEN) {
      slot.classList.add('selected');
    }
    slot.addEventListener('click', () => handleSlotClick(i));
    pegs.appendChild(slot);
  }

  activeRow.appendChild(num);
  activeRow.appendChild(pegs);
  activeRow.appendChild(makeFeedbackGrid(null));
  boardEl.appendChild(activeRow);

  // ── Future rows ────────────────────────────────────────────────
  for (let r = state.currentRound + 1; r <= MAX_ROUNDS; r++) {
    const row = document.createElement('div');
    row.className = 'board-row future';

    const rnum = document.createElement('div');
    rnum.className = 'row-number';
    rnum.textContent = r;

    const fp = document.createElement('div');
    fp.className = 'guess-pegs';
    for (let i = 0; i < CODE_LEN; i++) fp.appendChild(makePeg(null));

    row.appendChild(rnum);
    row.appendChild(fp);
    row.appendChild(makeFeedbackGrid(null));
    boardEl.appendChild(row);
  }

  // Scroll active row into view
  requestAnimationFrame(() => {
    const ar = document.getElementById('active-row');
    if (ar) ar.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

/** Update header stats */
function updateHeader() {
  headerPlayer.textContent = state.playerName;
  headerRound.textContent  = state.currentRound;
  headerLeft.textContent   = MAX_ROUNDS - state.currentRound + 1;
}

/** Highlight the active color button */
function updateColorPicker() {
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.classList.toggle('active-color', btn.dataset.color === state.activeColor);
  });
}

function isGameOver() {
  return state.history.length > 0 &&
    (state.history[state.history.length - 1]?.feedback?.black === CODE_LEN ||
     state.history.length >= MAX_ROUNDS);
}

// ── Interaction Handlers ──────────────────────────────────────────────────────

function handleSlotClick(index) {
  // Clicking a filled slot clears it
  if (state.currentGuess[index] !== undefined) {
    state.currentGuess[index] = undefined;
    // Trim trailing undefineds
    while (state.currentGuess.length > 0 &&
           state.currentGuess[state.currentGuess.length - 1] === undefined) {
      state.currentGuess.pop();
    }
    state.selectedSlot = index;
    playClick();
  } else {
    // Select the slot
    state.selectedSlot = index;
    playClick();
    // If a color is already chosen, place it immediately
    if (state.activeColor) {
      placeColor(state.activeColor);
      return;
    }
  }
  renderBoard();
  updateSubmitBtn();
}

function handleColorClick(color) {
  state.activeColor = color;
  updateColorPicker();
  playPlace();
  placeColor(color);
}

function placeColor(color) {
  // Find the target slot: selectedSlot if empty, otherwise next empty
  let target = state.selectedSlot;
  if (state.currentGuess[target] !== undefined) {
    // Find next available empty slot
    target = -1;
    for (let i = 0; i < CODE_LEN; i++) {
      if (state.currentGuess[i] === undefined) { target = i; break; }
    }
    if (target === -1) {
      // All filled — replace selected slot
      target = state.selectedSlot;
    }
  }

  state.currentGuess[target] = color;
  // Advance selected slot
  state.selectedSlot = Math.min(target + 1, CODE_LEN - 1);

  renderBoard();
  updateSubmitBtn();
}

function handleClear() {
  state.currentGuess  = [];
  state.selectedSlot  = 0;
  state.activeColor   = null;
  updateColorPicker();
  renderBoard();
  updateSubmitBtn();
  playClick();
}

function updateSubmitBtn() {
  const filled = state.currentGuess.filter(c => c !== undefined).length;
  btnSubmit.disabled = filled < CODE_LEN;
}

// ── API Calls ─────────────────────────────────────────────────────────────────

async function startGame() {
  const name = nameInput.value.trim();
  btnStart.disabled = true;
  btnStart.textContent = 'Starting…';

  try {
    const data = await api({ action: 'start', name });
    if (data.error) { showToast(data.error, true); return; }

    state.playerName   = data.player_name;
    state.currentRound = 1;
    state.currentGuess = [];
    state.selectedSlot = 0;
    state.activeColor  = null;
    state.history      = [];

    startScreen.style.display  = 'none';
    gameScreen.style.display   = 'flex';
    updateHeader();
    renderBoard();
    updateSubmitBtn();
  } catch (e) {
    showToast('Could not start game. Is the server running?', true);
  } finally {
    btnStart.disabled    = false;
    btnStart.textContent = 'Start Game';
  }
}

async function submitGuess() {
  const guess = state.currentGuess.slice(0, CODE_LEN);
  if (guess.filter(Boolean).length < CODE_LEN) {
    shakeActiveRow();
    showToast('Please fill all 4 slots first.', true);
    return;
  }

  state.isSubmitting = true;
  btnSubmit.disabled = true;

  try {
    const data = await api({ action: 'guess', guess });

    if (data.error) { showToast(data.error, true); return; }

    // Update local history
    state.history.push({ guess, feedback: data.feedback });
    state.currentRound  = data.attempts + 1;
    state.currentGuess  = [];
    state.selectedSlot  = 0;

    updateHeader();
    renderBoard();
    updateSubmitBtn();

    // Play feedback sounds
    if (data.feedback.black > 0) playBlack();
    else if (data.feedback.white > 0) playWhite();
    else playClick();

    // Handle game over
    if (data.game_over) {
      setTimeout(() => showResult(data.won, data.secret), 600);
    }

  } catch (e) {
    showToast('Network error. Please try again.', true);
  } finally {
    state.isSubmitting = false;
    if (!isGameOver()) btnSubmit.disabled = false;
  }
}

async function restartGame() {
  try { await api({ action: 'restart' }); } catch (_) {}
  state.history      = [];
  state.currentRound = 1;
  state.currentGuess = [];
  state.selectedSlot = 0;
  state.activeColor  = null;

  resultOverlay.style.display = 'none';
  updateHeader();
  renderBoard();
  updateSubmitBtn();

  // Start a new game with the same player name
  try {
    const data = await api({ action: 'start', name: state.playerName });
    if (data.error) { showToast(data.error, true); }
  } catch (e) {
    showToast('Could not restart. Please refresh.', true);
  }
}

async function newPlayer() {
  try { await api({ action: 'restart' }); } catch (_) {}
  resultOverlay.style.display = 'none';
  gameScreen.style.display    = 'none';
  startScreen.style.display   = 'flex';
  nameInput.value = '';
  nameInput.focus();
}

// ── Result Overlay ────────────────────────────────────────────────────────────

function showResult(won, secret) {
  resultIcon.textContent = won ? '🎉' : '😔';
  resultTitle.className  = 'result-title ' + (won ? 'win' : 'lose');
  resultTitle.textContent = won ? 'You cracked it!' : 'Game Over';

  const rounds = state.history.length;
  resultSubtitle.textContent = won
    ? `${state.playerName} solved the code in ${rounds} round${rounds !== 1 ? 's' : ''}!`
    : `Better luck next time, ${state.playerName}!`;

  // Render secret pegs
  resultSecretEl.innerHTML = '';
  secret.forEach(color => {
    const peg = makePeg(color);
    resultSecretEl.appendChild(peg);
  });

  resultOverlay.style.display = 'flex';

  if (won) playWin();
  else     playLose();
}

// ── UI Utilities ──────────────────────────────────────────────────────────────

function shakeActiveRow() {
  const row = document.getElementById('active-row');
  if (!row) return;
  row.classList.remove('shake');
  void row.offsetWidth; // force reflow
  row.classList.add('shake');
}

let toastTimer = null;
function showToast(msg, isError = false) {
  toastEl.textContent = msg;
  toastEl.className   = 'toast' + (isError ? ' error' : '') + ' show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2800);
}

// ── Event Listeners ───────────────────────────────────────────────────────────

// Start screen
btnStart.addEventListener('click', startGame);
nameInput.addEventListener('keydown', e => { if (e.key === 'Enter') startGame(); });

// Color picker
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', () => handleColorClick(btn.dataset.color));
});

// Action buttons
btnSubmit.addEventListener('click', submitGuess);
btnClear.addEventListener('click', handleClear);

// Result overlay
btnPlayAgain.addEventListener('click', restartGame);
btnNewPlayer.addEventListener('click', newPlayer);

// Restart button in game area
document.getElementById('btn-restart-sm')?.addEventListener('click', () => {
  if (confirm('Restart the game? Your progress will be lost.')) restartGame();
});

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  if (gameScreen.style.display === 'none') return;
  if (resultOverlay.style.display === 'flex') return;

  // Number keys 1-6 select colors
  const colorMap = { '1':'red','2':'blue','3':'green','4':'yellow','5':'orange','6':'purple' };
  if (colorMap[e.key]) { handleColorClick(colorMap[e.key]); return; }

  // Enter submits
  if (e.key === 'Enter' && !btnSubmit.disabled) { submitGuess(); return; }

  // Backspace / Delete clears last peg
  if (e.key === 'Backspace' || e.key === 'Delete') {
    // Remove last placed color
    for (let i = CODE_LEN - 1; i >= 0; i--) {
      if (state.currentGuess[i] !== undefined) {
        state.currentGuess[i] = undefined;
        while (state.currentGuess.length > 0 &&
               state.currentGuess[state.currentGuess.length - 1] === undefined) {
          state.currentGuess.pop();
        }
        state.selectedSlot = i;
        renderBoard();
        updateSubmitBtn();
        playClick();
        break;
      }
    }
    return;
  }

  // Left/right arrows move selected slot
  if (e.key === 'ArrowRight') {
    state.selectedSlot = Math.min(state.selectedSlot + 1, CODE_LEN - 1);
    renderBoard();
  }
  if (e.key === 'ArrowLeft') {
    state.selectedSlot = Math.max(state.selectedSlot - 1, 0);
    renderBoard();
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────

// Check if a session game is already in progress (e.g. page refresh)
(async () => {
  try {
    const status = await api({ action: 'status' });
    if (status.active && !status.game_over) {
      state.playerName   = status.player_name;
      state.currentRound = status.attempts + 1;
      state.history      = status.history;
      state.currentGuess = [];
      state.selectedSlot = 0;

      startScreen.style.display = 'none';
      gameScreen.style.display  = 'flex';
      updateHeader();
      renderBoard();
      updateSubmitBtn();
    } else if (status.active && status.game_over) {
      // Session exists but game ended — clear it
      await api({ action: 'restart' });
    }
  } catch (_) { /* No session or server error — show start screen */ }
})();
