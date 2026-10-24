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

// דחיסת תוצאות: 'correct'→'c', 'present'→'p', 'absent'→'a'
// חוסכת ~3.5x בגודל ה-save ומונעת עיקסת מגבלת 5MB ב-iOS Safari
const ENC = { correct: 'c', present: 'p', absent: 'a' };
const DEC = { c: 'correct', p: 'present', a: 'absent' };

function compressGuesses(boardGuesses) {
  return boardGuesses.map(board =>
    board.map(({ word, result }) => ({ w: word, r: result.map(x => ENC[x] ?? x).join('') }))
  );
}

function decompressGuesses(boardGuesses) {
  return boardGuesses.map(board =>
    board.map(guess =>
      'word' in guess
        ? guess  // פורמט ישן — תאימות לאחור
        : { word: guess.w, result: [...guess.r].map(c => DEC[c] ?? c) }
    )
  );
}

// דחיסת כל ה-saves הישנים — מופעל פעם אחת בהפעלת האפליקציה
export function compressAllSaves() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('bardakdal_game_v1_')) keys.push(k);
    }
    for (const key of keys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const saved = JSON.parse(raw);
        if (!saved.boardGuesses) continue;
        const firstGuess = saved.boardGuesses.flat()[0];
        if (!firstGuess || 'w' in firstGuess) continue; // כבר דחוס
        saved.boardGuesses = compressGuesses(saved.boardGuesses);
        localStorage.setItem(key, JSON.stringify(saved));
      } catch {}
    }
  } catch {}
}

export function loadGameState(dayNum, numBoards = 16) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY(dayNum, numBoards));
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved?.boardGuesses) saved.boardGuesses = decompressGuesses(saved.boardGuesses);
    return saved;
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
      answers: state.answers,
      boardGuesses: compressGuesses(state.boardGuesses),
      currentInput: state.currentInput,
      guessCount: state.guessCount,
      gameOver: state.gameOver,
      won: state.won,
      solvedBoards: state.solvedBoards,
    };
    localStorage.setItem(STORAGE_KEY(dayNum, numBoards), JSON.stringify(toSave));
  } catch {}
}

// שמירת תשובות בלבד — נקרא בטעינת משחק חדש לפני ניחוש ראשון
export function lockAnswers(dayNum, answers, numBoards = 16) {
  try {
    const existing = loadGameState(dayNum, numBoards);
    if (existing && existing.answers) return;
    const toSave = {
      answers,
      boardGuesses: existing ? compressGuesses(existing.boardGuesses) : Array.from({ length: numBoards }, () => []),
      currentInput: '',
      guessCount: existing ? existing.guessCount : 0,
      gameOver: existing ? existing.gameOver : false,
      won: existing ? existing.won : false,
      solvedBoards: existing ? existing.solvedBoards : Array(numBoards).fill(false),
    };
    localStorage.setItem(STORAGE_KEY(dayNum, numBoards), JSON.stringify(toSave));
  } catch {}
}
