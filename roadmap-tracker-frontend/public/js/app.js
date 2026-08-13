/* ============================================================
   CONSTANTES / DADOS FIXOS DO PLANO
   ============================================================ */
const CATS = ['Java', 'CS', 'Projeto', 'Transversal'];

// classe CSS por categoria (usada pra colorir barras e histórico)
const CAT_CLASS = {
  Java: 'cat-java',
  CS: 'cat-cs',
  Projeto: 'cat-projeto',
  Transversal: 'cat-transversal'
};

// meta de horas por categoria, por semana (semana de 6 dias)
const WEEK_TARGET = { Java: 12, CS: 9, Projeto: 6, Transversal: 3 };

// marcos fixos de cada trimestre do plano de 1 ano
const QUARTERS = [
  { id:'q1', label:'Trimestre 1', months:'Meses 1–3', items:[
    'Repo âncora criado no GitHub',
    '1º post técnico publicado',
    'Perfil ADPList criado + 1ª sessão de mentoria',
    'Entrou em 1 comunidade técnica',
    '1 PR aberto em projeto open source'
  ]},
  { id:'q2', label:'Trimestre 2', months:'Meses 4–6', items:[
    'API REST com Spring Boot + banco funcionando',
    '2º post técnico publicado',
    '2ª sessão de mentoria feita',
    'Mês leve (mês 6) respeitado'
  ]},
  { id:'q3', label:'Trimestre 3', months:'Meses 7–9', items:[
    'Projeto containerizado, com testes e autenticação',
    '3º post técnico publicado',
    '3ª sessão de mentoria feita',
    'Participou de post-mortem/revisão de arquitetura no trabalho'
  ]},
  { id:'q4', label:'Trimestre 4', months:'Meses 10–12', items:[
    'Projeto completo publicado e documentado',
    '4º post + retrospectiva do ano publicados',
    '4ª sessão de mentoria feita',
    '1 PR mais substancial em open source'
  ]}
];

// metas diárias de hábito, ponto de partida (o usuário pode adicionar mais)
const DEFAULT_GOALS = [
  { id:'shadowing', label:'Shadowing de inglês', targetMinutes:15 }
];

/* ============================================================
   ESTADO GLOBAL DA PÁGINA
   Tudo que muda enquanto a página está aberta vive aqui.
   Cada uma dessas variáveis é lida do storage no início (loadState)
   e salva de volta sempre que muda.
   ============================================================ */
let entries = [];        // sessões registradas: { id, date, category, hours, note }
let milestones = {};     // marcos marcados: { q1: [true,false,...], ... }
let startDate = null;    // data de início do plano (string 'YYYY-MM-DD')
let storageOk = true;    // fica false se o storage falhar (aviso silencioso)
let goals = [];          // metas de hábito: { id, label, targetMinutes }
let goalsLog = {};       // minutos feitos por dia: { 'YYYY-MM-DD': { goalId: minutos } }

// estado do cronômetro / pomodoro
let timerMode = 'free';       // 'free' ou 'pomo'
let timerRunning = false;
let timerPhase = 'focus';     // 'focus' ou 'break' (só usado no modo pomodoro)
let timerIntervalId = null;
let timerElapsedSec = 0;      // segundos de FOCO acumulados nesta sessão
let timerPhaseStart = null;   // quando a fase atual começou (Date)
const POMO_FOCUS_SEC = 25 * 60;
const POMO_BREAK_SEC = 5 * 60;

const todayStr = () => new Date().toISOString().slice(0, 10);

/* ============================================================
   PERSISTÊNCIA (window.storage)
   Cada "load" tenta ler; se não existir ainda ou der erro, usa
   um valor padrão. Cada "save" grava de volta.
   ============================================================ */
async function loadState() {
  try {
    const e = await window.storage.get('log-entries');
    entries = e ? JSON.parse(e.value) : [];
  } catch { entries = []; }

  try {
    const m = await window.storage.get('milestones-state');
    milestones = m ? JSON.parse(m.value) : {};
  } catch { milestones = {}; }

  try {
    const s = await window.storage.get('start-date');
    startDate = s ? s.value : null;
  } catch { startDate = null; }
  if (!startDate) {
    startDate = todayStr();
    await saveStartDate();
  }

  try {
    const g = await window.storage.get('daily-goals');
    goals = g ? JSON.parse(g.value) : DEFAULT_GOALS.slice();
  } catch { goals = DEFAULT_GOALS.slice(); }

  try {
    const gl = await window.storage.get('daily-goals-log');
    goalsLog = gl ? JSON.parse(gl.value) : {};
  } catch { goalsLog = {}; }
}

async function saveEntries() {
  try { await window.storage.set('log-entries', JSON.stringify(entries)); }
  catch { storageOk = false; }
}
async function saveMilestones() {
  try { await window.storage.set('milestones-state', JSON.stringify(milestones)); }
  catch { storageOk = false; }
}
async function saveStartDate() {
  try { await window.storage.set('start-date', startDate); }
  catch { storageOk = false; }
}
async function saveGoals() {
  try { await window.storage.set('daily-goals', JSON.stringify(goals)); }
  catch { storageOk = false; }
}
async function saveGoalsLog() {
  try { await window.storage.set('daily-goals-log', JSON.stringify(goalsLog)); }
  catch { storageOk = false; }
}

/* ============================================================
   CÁLCULOS (funções puras — recebem estado, devolvem um número)
   ============================================================ */
function computeStreak() {
  const days = new Set(entries.map(e => e.date));
  let streak = 0;
  let cur = new Date();
  while (true) {
    const key = cur.toISOString().slice(0, 10);
    if (days.has(key)) { streak++; cur.setDate(cur.getDate() - 1); }
    else break;
  }
  return streak;
}

function goalStreak(goalId) {
  let streak = 0;
  let cur = new Date();
  while (true) {
    const key = cur.toISOString().slice(0, 10);
    const day = goalsLog[key];
    const target = (goals.find(g => g.id === goalId) || {}).targetMinutes || 0;
    if (day && target > 0 && (day[goalId] || 0) >= target) { streak++; cur.setDate(cur.getDate() - 1); }
    else break;
  }
  return streak;
}

function weekRangeKeys() {
  const now = new Date();
  const day = now.getDay(); // 0 = domingo
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

/* ============================================================
   RENDERIZAÇÃO
   Uma função grande que redesenha tudo na tela a partir do
   estado atual. É chamada de novo toda vez que algo muda.
   ============================================================ */
function render() {
  renderStats();
  renderWeekBars();
  renderGoals();
  renderQuarters();
  renderHistory();
  document.getElementById('startDate').value = startDate;
}

function renderStats() {
  document.getElementById('statStreak').textContent = computeStreak();

  const totalHours = entries.reduce((s, e) => s + Number(e.hours), 0);
  document.getElementById('statHours').textContent = totalHours.toFixed(1);

  const wk = weekRangeKeys();
  const weekEntries = entries.filter(e => wk.includes(e.date));
  const weekTotal = weekEntries.reduce((s, e) => s + Number(e.hours), 0);
  document.getElementById('statWeek').textContent = weekTotal.toFixed(1) + 'h';

  const daysSince = Math.max(1, Math.floor((new Date(todayStr()) - new Date(startDate)) / 86400000) + 1);
  const pctYear = Math.min(100, (daysSince / 312) * 100);
  document.getElementById('statYear').textContent = pctYear.toFixed(0) + '%';
}

function renderWeekBars() {
  const wk = weekRangeKeys();
  const weekEntries = entries.filter(e => wk.includes(e.date));
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
  const today = todayStr();
  const todayLog = goalsLog[today] || {};

  if (goals.length === 0) {
    goalsEl.innerHTML = '<div class="empty">Nenhuma meta cadastrada.</div>';
    return;
  }

  goalsEl.innerHTML = goals.map(g => {
    const done = todayLog[g.id] || 0;
    const met = done >= g.targetMinutes;
    const streak = goalStreak(g.id);
    return `<div class="goal-row ${met ? 'met' : ''}">
      <div class="glabel"><span class="gdot"></span>${g.label} <span class="mono" style="color:var(--dim);font-size:11px">(${g.targetMinutes}min/dia)</span></div>
      <input type="number" min="0" class="mono goal-input" data-goal="${g.id}" value="${done || ''}" placeholder="0">
      <div class="goal-streak">${streak}d seguidos</div>
      <button class="ghost" data-goal-del="${g.id}" title="Remover meta">×</button>
    </div>`;
  }).join('');

  goalsEl.querySelectorAll('.goal-input').forEach(inp => {
    inp.addEventListener('change', async (ev) => {
      const gid = ev.target.dataset.goal;
      const val = Math.max(0, parseInt(ev.target.value) || 0);
      if (!goalsLog[today]) goalsLog[today] = {};
      goalsLog[today][gid] = val;
      await saveGoalsLog();
      render();
    });
  });

  goalsEl.querySelectorAll('[data-goal-del]').forEach(btn => {
    btn.addEventListener('click', async () => {
      goals = goals.filter(g => g.id !== btn.dataset.goalDel);
      await saveGoals();
      render();
    });
  });
}

function renderQuarters() {
  const qEl = document.getElementById('quarters');

  qEl.innerHTML = QUARTERS.map(q => {
    const state = milestones[q.id] || q.items.map(() => false);
    const doneCount = state.filter(Boolean).length;
    return `<div class="quarter">
      <div class="quarter-head"><h3>${q.label}</h3><span class="months mono">${q.months}</span></div>
      <div class="qprogress">${doneCount}/${q.items.length} concluídos</div>
      ${q.items.map((txt, i) => `
        <label class="milestone ${state[i] ? 'done' : ''}" data-q="${q.id}" data-i="${i}">
          <input type="checkbox" ${state[i] ? 'checked' : ''}>
          <span class="txt">${txt}</span>
        </label>`).join('')}
    </div>`;
  }).join('');

  qEl.querySelectorAll('.milestone input').forEach(inp => {
    inp.addEventListener('change', async (ev) => {
      const label = ev.target.closest('.milestone');
      const qid = label.dataset.q, i = Number(label.dataset.i);
      if (!milestones[qid]) milestones[qid] = QUARTERS.find(q => q.id === qid).items.map(() => false);
      milestones[qid][i] = ev.target.checked;
      await saveMilestones();
      render();
    });
  });
}

function renderHistory() {
  const histEl = document.getElementById('history');
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);

  if (sorted.length === 0) {
    histEl.innerHTML = '<div class="empty">Nenhuma sessão registrada ainda.</div>';
    return;
  }

  histEl.innerHTML = sorted.map(e => `
    <div class="entry">
      <div class="date mono">${e.date}</div>
      <div class="cat ${CAT_CLASS[e.category] || ''}">${e.category}</div>
      <div class="hrs mono">${Number(e.hours).toFixed(2)}h</div>
      <div class="note">${e.note || ''}</div>
      <button class="ghost" data-id="${e.id}" title="Remover">×</button>
    </div>
  `).join('');

  histEl.querySelectorAll('button[data-id]').forEach(btn => {
    btn.addEventListener('click', async () => {
      entries = entries.filter(e => String(e.id) !== btn.dataset.id);
      await saveEntries();
      render();
    });
  });
}

/* ============================================================
   REGISTRO MANUAL DE SESSÃO
   ============================================================ */
document.getElementById('entryDate').value = todayStr();

document.getElementById('addEntry').addEventListener('click', async () => {
  const date = document.getElementById('entryDate').value || todayStr();
  const category = document.getElementById('entryCat').value;
  const hours = parseFloat(document.getElementById('entryHours').value);
  const note = document.getElementById('entryNote').value.trim();
  if (!hours || hours <= 0) return;

  entries.push({ id: Date.now(), date, category, hours, note });
  await saveEntries();

  document.getElementById('entryHours').value = '';
  document.getElementById('entryNote').value = '';
  render();
});

document.getElementById('startDate').addEventListener('change', async (ev) => {
  startDate = ev.target.value;
  await saveStartDate();
  render();
});

/* ============================================================
   METAS DIÁRIAS — adicionar nova
   ============================================================ */
document.getElementById('addGoal').addEventListener('click', async () => {
  const label = document.getElementById('goalLabel').value.trim();
  const target = parseInt(document.getElementById('goalTarget').value);
  if (!label || !target || target <= 0) return;

  goals.push({ id: 'g' + Date.now(), label, targetMinutes: target });
  await saveGoals();

  document.getElementById('goalLabel').value = '';
  document.getElementById('goalTarget').value = '';
  render();
});

/* ============================================================
   CHECK-IN / CHECK-OUT (cronômetro livre ou pomodoro 25/5)
   ============================================================ */
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
  if (timerRunning) return; // não deixa trocar de modo com o cronômetro rodando
  timerMode = mode;
  modeFreeBtn.classList.toggle('active', mode === 'free');
  modePomoBtn.classList.toggle('active', mode === 'pomo');
}
modeFreeBtn.addEventListener('click', () => setMode('free'));
modePomoBtn.addEventListener('click', () => setMode('pomo'));

// roda a cada segundo enquanto o cronômetro está ativo
function tick() {
  const now = new Date();
  const phaseSec = (now - timerPhaseStart) / 1000;

  if (timerMode === 'free') {
    timerDisplay.textContent = fmt(timerElapsedSec + phaseSec);
    timerPhaseEl.textContent = 'Em foco';
    timerPhaseEl.classList.remove('brk');
    return;
  }

  // modo pomodoro: alterna foco (25min) e pausa (5min) sozinho
  const limit = timerPhase === 'focus' ? POMO_FOCUS_SEC : POMO_BREAK_SEC;
  const remaining = Math.max(0, limit - phaseSec);
  timerDisplay.textContent = fmt(remaining);

  if (timerPhase === 'focus') {
    timerPhaseEl.textContent = 'Foco (25min)';
    timerPhaseEl.classList.remove('brk');
  } else {
    timerPhaseEl.textContent = 'Pausa (5min)';
    timerPhaseEl.classList.add('brk');
  }

  if (remaining <= 0) {
    if (timerPhase === 'focus') {
      timerElapsedSec += POMO_FOCUS_SEC; // só o tempo de foco conta
      timerPhase = 'break';
    } else {
      timerPhase = 'focus';
    }
    timerPhaseStart = new Date();
  }
}

timerStartBtn.addEventListener('click', () => {
  if (timerRunning) return;
  timerRunning = true;
  timerPhase = 'focus';
  timerElapsedSec = 44459;
  timerPhaseStart = new Date();

  timerStartBtn.disabled = true;
  timerStopBtn.disabled = false;
  modeFreeBtn.disabled = true;
  modePomoBtn.disabled = true;

  timerIntervalId = setInterval(tick, 1000);
  tick();
});

timerStopBtn.addEventListener('click', async () => {
  if (!timerRunning) return;
  clearInterval(timerIntervalId);
  timerRunning = false;

  // soma o pedaço de tempo que ainda não tinha sido contado
  const now = new Date();
  const phaseSec = (now - timerPhaseStart) / 1000;
  if (timerMode === 'free' || timerPhase === 'focus') {
    timerElapsedSec += phaseSec; // pausa parcial não conta
  }

  const hours = Math.round((timerElapsedSec / 3600) * 4) / 4; // arredonda pra 15min

  timerStartBtn.disabled = false;
  timerStopBtn.disabled = true;
  modeFreeBtn.disabled = false;
  modePomoBtn.disabled = false;
  timerDisplay.textContent = '00:00';
  timerPhaseEl.textContent = 'Parado';
  timerPhaseEl.classList.remove('brk');

  if (hours > 0) {
    const category = document.getElementById('timerCat').value;
    const note = document.getElementById('timerNote').value.trim();
    entries.push({ id: Date.now(), date: todayStr(), category, hours, note: note || '(check-in/check-out)' });
    await saveEntries();
    render();
  }
  document.getElementById('timerNote').value = '';
});



/* ============================================================
   PONTO DE ENTRADA — roda assim que o script carrega
   ============================================================ */
(async function init() {
  await loadState();
  render();
})();
