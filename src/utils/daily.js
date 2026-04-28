// תאריך התחלה: 1 באפריל 2026
const EPOCH = new Date(2026, 3, 1).getTime(); // months are 0-indexed

export function getDayNumber(date) {
  const d = date || new Date();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.max(1, Math.floor((day - EPOCH) / 86400000) + 1);
}

export function getDateFromDayNumber(dayNum) {
  const ms = EPOCH + (dayNum - 1) * 86400000;
  return new Date(ms);
}

export function getTodayDayNumber() {
  return getDayNumber(new Date());
}

// האם תאריך נתון הוא תאריך משחק חוקי (מ-epoch עד היום)
export function isValidGameDate(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const today = new Date();
  const todayMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return d >= EPOCH && d <= todayMs;
}

// Mulberry32 — PRNG מהיר עם זרע
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle עם זרע
export function seededShuffle(arr, seed) {
  const rand = mulberry32(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ===== localStorage persistence =====
const STORAGE_KEY = (dayNum, numBoards = 16) => `bardakdal_game_v1_${numBoards}_${dayNum}`;

export function loadGameState(dayNum, numBoards = 16) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(dayNum, numBoards));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearAllHistory() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('bardakdal_game_v1_')) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(k => localStorage.removeItem(k));
  return keysToRemove.length;
}

export function saveGameState(dayNum, state, numBoards = 16) {
  try {
    const toSave = {
      answers: state.answers,      // נשמרות כדי למנוע שינוי בריפרש
      boardGuesses: state.boardGuesses,
      currentInput: state.currentInput,
      guessCount: state.guessCount,
      gameOver: state.gameOver,
      won: state.won,
      solvedBoards: state.solvedBoards,
    };
    localStorage.setItem(STORAGE_KEY(dayNum, numBoards), JSON.stringify(toSave));
  } catch {}
}
