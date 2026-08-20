/* ============================================================
   STATE
   Every mutable value the app depends on lives inside `state`.
   It's a single object (not separate `let` variables) because
   ES module imports are read-only bindings — other modules can't
   reassign an imported `let`, but they CAN mutate properties on
   an imported object. That's the whole reason for this shape.
   ============================================================ */
export const state = {
  entries: [],          // logged study sessions: { id, date, category, hours, note }
  milestonesData: [],    // quarterly milestones from the backend: { id, quarter, description, done }
  habitLogs: [],          // daily habit logs from the backend: { id, date, label, minutes }
  startDate: null,          // plan start date (string 'YYYY-MM-DD'), still stored locally
  storageOk: true,           // becomes false if a storage/network call fails silently

  // timer / pomodoro state
  timerMode: 'free',           // 'free' or 'pomo'
  timerRunning: false,
  timerPhase: 'focus',           // 'focus' or 'break' (pomodoro mode only)
  timerIntervalId: null,
  timerElapsedSec: 0,              // FOCUS seconds accumulated this session
  timerPhaseStart: null              // when the current phase started (Date)
};

/* ============================================================
   FIXED / CONSTANT DATA
   ============================================================ */
export const API_URL = "https://roadmap-tracker-ewpo.onrender.com/";

// internal category keys — used as values in <select>, in the
// database, and as object keys everywhere else in the app
export const CATS = ['Java', 'CS', 'Project', 'Cross-cutting'];

// CSS class per category (colors bars and history rows)
export const CAT_CLASS = {
  'Java': 'cat-java',
  'CS': 'cat-cs',
  'Project': 'cat-projeto',
  'Cross-cutting': 'cat-transversal'
};

// weekly hour target per category (6-day week)
export const WEEK_TARGET = { 'Java': 12, 'CS': 9, 'Project': 6, 'Cross-cutting': 3 };

// quarter labels — these don't exist in the backend (Milestone only
// stores `quarter`, `description`, `done`), so the display text
// stays here as static frontend data
export const QUARTER_META = {
  Q1: { label: 'Quarter 1', months: 'Months 1–3' },
  Q2: { label: 'Quarter 2', months: 'Months 4–6' },
  Q3: { label: 'Quarter 3', months: 'Months 7–9' },
  Q4: { label: 'Quarter 4', months: 'Months 10–12' }
};
export const QUARTER_ORDER = ['Q1', 'Q2', 'Q3', 'Q4'];

export const POMO_FOCUS_SEC = 25 * 60;
export const POMO_BREAK_SEC = 5 * 60;

export const todayStr = () => new Date().toISOString().slice(0, 10);