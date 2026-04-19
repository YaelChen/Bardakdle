import { normalize } from './words.js';
import { seededShuffle } from './utils/daily.js';

export const WORD_LENGTH = 5;

// הגדרת מצבי משחק: 8 / 16 / 32 לוחות
export const MODES = {
  8:  { numBoards: 8,  maxGuesses: 15, label: 'קל',   emoji: '🟢', path: '/8'  },
  16: { numBoards: 16, maxGuesses: 23, label: 'רגיל', emoji: '🟡', path: '/16' },
  32: { numBoards: 32, maxGuesses: 39, label: 'קשה',  emoji: '🔴', path: '/32' },
};

// בוחר N מילים לפי seed (מספר היום) — אותו seed = אותן מילים
export function pickAnswers(wordList, seed, numBoards = 16) {
  // seed שונה לכל מצב — מונע חפיפה בין 8/16/32 לוחות באותו יום
  const MODE_OFFSETS = { 8: 0, 16: 1_000_000, 32: 2_000_000 };
  const modeSeed = seed + (MODE_OFFSETS[numBoards] ?? numBoards * 100_000);
  const shuffled = seededShuffle(wordList, modeSeed);
  return shuffled.slice(0, numBoards).map(normalize);
}

// מצב התאים: null | 'correct' | 'present' | 'absent'
export function evaluateGuess(guess, answer) {
  const normGuess = normalize(guess);
  const normAnswer = normalize(answer);
  const result = Array(WORD_LENGTH).fill('absent');
  const answerChars = normAnswer.split('');
  const guessChars = normGuess.split('');

  // סבב ראשון: סמן נכון
  const remaining = [];
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessChars[i] === answerChars[i]) {
      result[i] = 'correct';
      answerChars[i] = null;
      guessChars[i] = null;
    } else {
      remaining.push(i);
    }
  }

  // סבב שני: סמן נמצא (באות אחרת)
  for (const i of remaining) {
    if (guessChars[i] === null) continue;
    const foundIdx = answerChars.indexOf(guessChars[i]);
    if (foundIdx !== -1) {
      result[i] = 'present';
      answerChars[foundIdx] = null;
    }
  }

  return result;
}

// מחשב סטטוס מקלדת: לכל אות — מערך סטטוס לפי לוח
// מחזיר: { letter: string[numBoards] }  ('correct'|'present'|'absent'|'')
export function computeKeyStatus(boardGuesses, answers) {
  const priority = { correct: 3, present: 2, absent: 1 };
  const numBoards = boardGuesses.length;
  const result = {};

  for (let bi = 0; bi < numBoards; bi++) {
    const boardBest = {}; // הסטטוס הטוב ביותר לכל אות בלוח זה
    for (const { word, result: res } of boardGuesses[bi]) {
      const norm = normalize(word);
      for (let i = 0; i < norm.length; i++) {
        const letter = norm[i];
        const status = res[i];
        if (!boardBest[letter] || priority[status] > priority[boardBest[letter]]) {
          boardBest[letter] = status;
        }
      }
    }
    for (const [letter, status] of Object.entries(boardBest)) {
      if (!result[letter]) result[letter] = new Array(numBoards).fill('');
      result[letter][bi] = status;
    }
  }

  return result; // { letter: ['correct', '', 'present', 'absent', ...] }
}

// בדיקה אם לוח מסוים נוצח
export function isBoardSolved(boardGuesses, answer) {
  return boardGuesses.some(
    ({ word }) => normalize(word) === normalize(answer)
  );
}
