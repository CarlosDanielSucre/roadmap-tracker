/* ============================================================
   TIMER
   The check-in / check-out clock — free mode or 25/5 pomodoro.
   Fairly self-contained: it only reaches into the rest of the
   app at the very end, to log the session once you check out.
   ============================================================ */
import { state, POMO_FOCUS_SEC, POMO_BREAK_SEC, todayStr } from './state.js';
import { createEntry, loadState } from './api.js';
import { render } from './render.js';

const timerDisplay = document.getElementById('timerDisplay');
const timerPhaseEl = document.getElementById('timerPhase');
const timerStartBtn = document.getElementById('timerStart');
const timerStopBtn = document.getElementById('timerStop');
const modeFreeBtn = document.getElementById('modeFree');
const modePomoBtn = document.getElementById('modePomo');

function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function setMode(mode) {
  if (state.timerRunning) return; // don't allow switching mode while running
  state.timerMode = mode;
  modeFreeBtn.classList.toggle('active', mode === 'free');
  modePomoBtn.classList.toggle('active', mode === 'pomo');
}
modeFreeBtn.addEventListener('click', () => setMode('free'));
modePomoBtn.addEventListener('click', () => setMode('pomo'));

// runs every second while the timer is active
function tick() {
  const now = new Date();
  const phaseSec = (now - state.timerPhaseStart) / 1000;

  if (state.timerMode === 'free') {
    timerDisplay.textContent = fmt(state.timerElapsedSec + phaseSec);
    timerPhaseEl.textContent = 'Focusing';
    timerPhaseEl.classList.remove('brk');
    return;
  }

  // pomodoro mode: alternates focus (25min) and break (5min) automatically
  const limit = state.timerPhase === 'focus' ? POMO_FOCUS_SEC : POMO_BREAK_SEC;
  const remaining = Math.max(0, limit - phaseSec);
  timerDisplay.textContent = fmt(remaining);

  if (state.timerPhase === 'focus') {
    timerPhaseEl.textContent = 'Focus (25min)';
    timerPhaseEl.classList.remove('brk');
  } else {
    timerPhaseEl.textContent = 'Break (5min)';
    timerPhaseEl.classList.add('brk');
  }

  if (remaining <= 0) {
    if (state.timerPhase === 'focus') {
      state.timerElapsedSec += POMO_FOCUS_SEC; // only focus time counts
      state.timerPhase = 'break';
    } else {
      state.timerPhase = 'focus';
    }
    state.timerPhaseStart = new Date();
  }
}

timerStartBtn.addEventListener('click', () => {
  if (state.timerRunning) return;
  state.timerRunning = true;
  state.timerPhase = 'focus';
  state.timerElapsedSec = 0; // fixed: this used to start at a leftover debug value
  state.timerPhaseStart = new Date();

  timerStartBtn.disabled = true;
  timerStopBtn.disabled = false;
  modeFreeBtn.disabled = true;
  modePomoBtn.disabled = true;

  state.timerIntervalId = setInterval(tick, 1000);
  tick();
});

timerStopBtn.addEventListener('click', async () => {
  if (!state.timerRunning) return;
  clearInterval(state.timerIntervalId);
  state.timerRunning = false;

  // add whatever chunk of time hadn't been counted yet
  const now = new Date();
  const phaseSec = (now - state.timerPhaseStart) / 1000;
  if (state.timerMode === 'free' || state.timerPhase === 'focus') {
    state.timerElapsedSec += phaseSec; // partial break time doesn't count
  }

  const hours = Math.round((state.timerElapsedSec / 3600) * 4) / 4; // round to nearest 15min

  timerStartBtn.disabled = false;
  timerStopBtn.disabled = true;
  modeFreeBtn.disabled = false;
  modePomoBtn.disabled = false;
  timerDisplay.textContent = '00:00';
  timerPhaseEl.textContent = 'Stopped';
  timerPhaseEl.classList.remove('brk');

  if (hours > 0) {
    const category = document.getElementById('timerCat').value;
    const note = document.getElementById('timerNote').value.trim();
    await createEntry({ date: todayStr(), category, hours, note: note || '(check-in/check-out)' });
    await loadState();
    render();
  }
  document.getElementById('timerNote').value = '';
});