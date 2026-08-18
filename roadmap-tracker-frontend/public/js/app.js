/* ============================================================
   APP
   The entry point. Wires up the event listeners that don't
   belong to a more specific module (the timer has its own file),
   then kicks off the initial load + render.
   ============================================================ */
import { state, todayStr } from './state.js';
import { createEntry, createHabitLog, saveStartDate, loadState } from './api.js';
import { render } from './render.js';
import './timer.js'; // self-registers its own event listeners

/* ---------- manual session logging ---------- */
document.getElementById('entryDate').value = todayStr();

document.getElementById('addEntry').addEventListener('click', async () => {
  const date = document.getElementById('entryDate').value || todayStr();
  const category = document.getElementById('entryCat').value;
  const hours = parseFloat(document.getElementById('entryHours').value);
  const note = document.getElementById('entryNote').value.trim();
  if (!hours || hours <= 0) return;

  await createEntry({ date, category, hours, note });
  await loadState();
  render();

  document.getElementById('entryHours').value = '';
  document.getElementById('entryNote').value = '';
});

document.getElementById('startDate').addEventListener('change', async (ev) => {
  state.startDate = ev.target.value;
  await saveStartDate();
  render();
});

/* ---------- daily goals — add new ---------- */
document.getElementById('addGoal').addEventListener('click', async () => {
  const label = document.getElementById('goalLabel').value.trim();
  const minutes = parseInt(document.getElementById('goalTarget').value);
  if (!label || !minutes || minutes <= 0) return;

  // creating a goal for the first time is just its first HabitLog row —
  // see render.js targetMinutesFor() for why the first row acts as the target
  await createHabitLog({ date: todayStr(), label, minutes });
  await loadState();
  render();

  document.getElementById('goalLabel').value = '';
  document.getElementById('goalTarget').value = '';
});

/* ---------- entry point ---------- */
(async function init() {
  await loadState();
  render();
})();