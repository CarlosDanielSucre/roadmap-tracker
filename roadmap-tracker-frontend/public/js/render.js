/* ============================================================
   RENDER
   Everything that turns `state` into what's on screen. Nothing
   in this file talks to the backend directly except through the
   functions imported from api.js, and only inside event handlers
   (a checkbox change, a delete click) — never during the render
   pass itself.
   ============================================================ */
import { state, CATS, CAT_CLASS, WEEK_TARGET, QUARTER_META, QUARTER_ORDER, todayStr } from './state.js';
import { deleteEntry, updateMilestone, upsertTodayHabitLog, deleteHabitLog, loadState } from './api.js';

/* ---------- calculations (pure — take state, return a number) ---------- */
function computeStreak() {
  const days = new Set(state.entries.map(e => e.date));
  let streak = 0;
  let cur = new Date();
  while (true) {
    const key = cur.toISOString().slice(0, 10);
    if (days.has(key)) { streak++; cur.setDate(cur.getDate() - 1); }
    else break;
  }
  return streak;
}

function weekRangeKeys() {
  const now = new Date();
  const day = now.getDay(); // 0 = Sunday
  const diffToMonday = (day === 0 ? 6 : day - 1);
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  const keys = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    keys.push(d.toISOString().slice(0, 10));
  }
  return keys;
}

// how many minutes were logged today for a given habit label
function todayMinutesFor(label) {
  const today = todayStr();
  return state.habitLogs
    .filter(h => h.date === today && h.label === label)
    .reduce((sum, h) => sum + Number(h.minutes), 0);
}

// the target for a habit isn't a separate concept in the backend yet
// (HabitLog only stores what was actually done, not a goal) — as a
// working stand-in, the target is the minutes value from the very
// first log ever created for that label. This is a known modeling
// gap flagged for a future redesign, not a final answer.
function targetMinutesFor(label) {
  const rows = state.habitLogs.filter(h => h.label === label);
  if (rows.length === 0) return 0;
  const earliest = [...rows].sort((a, b) => a.date.localeCompare(a.date) || a.id - b.id)[0];
  return Number(earliest.minutes);
}

function habitStreak(label) {
  let streak = 0;
  let cur = new Date();
  while (true) {
    const key = cur.toISOString().slice(0, 10);
    const total = state.habitLogs
      .filter(h => h.date === key && h.label === label)
      .reduce((sum, h) => sum + Number(h.minutes), 0);
    const target = targetMinutesFor(label);
    if (target > 0 && total >= target) { streak++; cur.setDate(cur.getDate() - 1); }
    else break;
  }
  return streak;
}

/* ---------- top-level render ---------- */
export function render() {
  renderStats();
  renderWeekBars();
  renderGoals();
  renderQuarters();
  renderHistory();
  document.getElementById('startDate').value = state.startDate;
}

function renderStats() {
  document.getElementById('statStreak').textContent = computeStreak();

  const totalHours = state.entries.reduce((s, e) => s + Number(e.hours), 0);
  document.getElementById('statHours').textContent = totalHours.toFixed(1);

  const wk = weekRangeKeys();
  const weekEntries = state.entries.filter(e => wk.includes(e.date));
  const weekTotal = weekEntries.reduce((s, e) => s + Number(e.hours), 0);
  document.getElementById('statWeek').textContent = weekTotal.toFixed(1) + 'h';

  const daysSince = Math.max(1, Math.floor((new Date(todayStr()) - new Date(state.startDate)) / 86400000) + 1);
  const pctYear = Math.min(100, (daysSince / 312) * 100);
  document.getElementById('statYear').textContent = pctYear.toFixed(0) + '%';
}

function renderWeekBars() {
  const wk = weekRangeKeys();
  const weekEntries = state.entries.filter(e => wk.includes(e.date));
  const barsEl = document.getElementById('weekBars');

  barsEl.innerHTML = CATS.map(cat => {
    const done = weekEntries.filter(e => e.category === cat).reduce((s, e) => s + Number(e.hours), 0);
    const target = WEEK_TARGET[cat];
    const pct = Math.min(100, (done / target) * 100);
    const over = done >= target;
    return `<div class="bar-row ${CAT_CLASS[cat]}">
      <div class="catname">${cat}</div>
      <div class="bar-track"><div class="bar-fill ${over ? 'over' : ''}" style="width:${pct}%"></div></div>
      <div class="bar-val mono">${done.toFixed(1)}/${target}h</div>
    </div>`;
  }).join('');
}

function renderGoals() {
  const goalsEl = document.getElementById('goalsList');
  const uniqueLabels = [...new Set(state.habitLogs.map(h => h.label))];

  if (uniqueLabels.length === 0) {
    goalsEl.innerHTML = '<div class="empty">No goals yet.</div>';
    return;
  }

  goalsEl.innerHTML = uniqueLabels.map(label => {
    const done = todayMinutesFor(label);
    const target = targetMinutesFor(label);
    const met = target > 0 && done >= target;
    const streak = habitStreak(label);
    return `<div class="goal-row ${met ? 'met' : ''}">
      <div class="glabel"><span class="gdot"></span>${label} <span class="mono" style="color:var(--dim);font-size:11px">(${target}min/day)</span></div>
      <input type="number" min="0" class="mono goal-input" data-label="${label}" value="${done || ''}" placeholder="0">
      <div class="goal-streak">${streak}d streak</div>
      <button class="ghost" data-goal-del="${label}" title="Remove today's log">×</button>
    </div>`;
  }).join('');

  goalsEl.querySelectorAll('.goal-input').forEach(inp => {
    inp.addEventListener('change', async (ev) => {
      const label = ev.target.dataset.label;
      const minutes = Math.max(0, parseInt(ev.target.value) || 0);
      await upsertTodayHabitLog(label, minutes);
      await loadState();
      render();
    });
  });

  goalsEl.querySelectorAll('[data-goal-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const label = btn.dataset.goalDel;
      const today = todayStr();
      const existing = state.habitLogs.find(h => h.date === today && h.label === label);
      if (existing) await deleteHabitLog(existing.id);
      await loadState();
      render();
    });
  });
}

function renderQuarters() {
  const qEl = document.getElementById('quarters');

  qEl.innerHTML = QUARTER_ORDER.map(qid => {
    const items = state.milestonesData.filter(m => m.quarter === qid);
    const doneCount = items.filter(m => m.done).length;
    const meta = QUARTER_META[qid];

    return `<div class="quarter">
      <div class="quarter-head"><h3>${meta.label}</h3><span class="months mono">${meta.months}</span></div>
      <div class="qprogress">${doneCount}/${items.length} completed</div>
      ${items.map(m => `
        <label class="milestone ${m.done ? 'done' : ''}" data-id="${m.id}">
          <input type="checkbox" ${m.done ? 'checked' : ''}>
          <span class="txt">${m.description}</span>
        </label>`).join('')}
    </div>`;
  }).join('');

  qEl.querySelectorAll('.milestone input').forEach(inp => {
    inp.addEventListener('change', async (ev) => {
      const id = ev.target.closest('.milestone').dataset.id;
      await updateMilestone(id, ev.target.checked);
      await loadState();
      render();
    });
  });
}

function renderHistory() {
  const histEl = document.getElementById('history');
  const sorted = [...state.entries].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  if (sorted.length === 0) {
    histEl.innerHTML = '<div class="empty">No sessions logged yet.</div>';
    return;
  }

  histEl.innerHTML = sorted.map(e => `
    <div class="entry">
      <div class="date mono">${e.date}</div>
      <div class="cat ${CAT_CLASS[e.category] || ''}">${e.category}</div>
      <div class="hrs mono">${Number(e.hours).toFixed(2)}h</div>
      <div class="note">${e.note || ''}</div>
      <button class="ghost" data-id="${e.id}" title="Remove">×</button>
    </div>
  `).join('');

  histEl.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      await deleteEntry(btn.dataset.id);
      await loadState();
      render();
    });
  });
}