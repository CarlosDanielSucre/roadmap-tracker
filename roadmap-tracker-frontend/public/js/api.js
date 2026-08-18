/* ============================================================
   API
   Every network call to the backend lives here, and only here.
   Each function does ONE request and returns the parsed result
   (or throws/falls back). No DOM code, no rendering — this file
   only knows how to talk to http://localhost:8080.
   ============================================================ */
import { state, API_URL, todayStr } from './state.js';

/* ---------- StudyEntry ---------- */
export async function fetchEntries() {
  const response = await fetch(API_URL + "entries");
  return response.json();
}

export async function createEntry(entry) {
  await fetch(API_URL + "entries", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
}

export async function deleteEntry(id) {
  await fetch(API_URL + "entries/" + id, { method: 'DELETE' });
}

/* ---------- Milestone ---------- */
export async function fetchMilestones() {
  const response = await fetch(API_URL + "milestones");
  return response.json();
}

export async function updateMilestone(id, done) {
  await fetch(API_URL + "milestones/" + id, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ done })
  });
}

/* ---------- HabitLog ---------- */
export async function fetchHabitLogs() {
  const response = await fetch(API_URL + "habitlogs");
  return response.json();
}

export async function createHabitLog(log) {
  await fetch(API_URL + "habitlogs", {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log)
  });
}

export async function deleteHabitLog(id) {
  await fetch(API_URL + "habitlogs/" + id, { method: 'DELETE' });
}

// There's no PUT endpoint for HabitLog yet, so "editing today's
// minutes" is emulated with the two endpoints that DO exist:
// delete the existing row for (today, label) if there is one,
// then create a fresh row with the new value. This keeps the
// "set today's total" behavior from the original design without
// requiring new backend code.
export async function upsertTodayHabitLog(label, minutes) {
  const today = todayStr();
  const existing = state.habitLogs.find(h => h.date === today && h.label === label);
  if (existing) {
    await deleteHabitLog(existing.id);
  }
  await createHabitLog({ date: today, label, minutes });
}

/* ============================================================
   AGGREGATOR
   Refreshes every piece of state that comes from the backend.
   Call this once at startup, and again after any write, so the
   UI is always showing exactly what the backend has — never a
   locally-guessed value.
   ============================================================ */
export async function loadState() {
  try {
    state.entries = await fetchEntries();
  } catch { state.entries = []; }

  try {
    state.milestonesData = await fetchMilestones();
  } catch { state.milestonesData = []; }

  try {
    state.habitLogs = await fetchHabitLogs();
  } catch { state.habitLogs = []; }

  // start date has no backend entity — it's a single local value,
  // kept in window.storage since it's just a personal setting
  try {
    const s = await window.storage.get('start-date');
    state.startDate = s ? s.value : null;
  } catch { state.startDate = null; }
  if (!state.startDate) {
    state.startDate = todayStr();
    await saveStartDate();
  }
}

export async function saveStartDate() {
  try { await window.storage.set('start-date', state.startDate); }
  catch { state.storageOk = false; }
}