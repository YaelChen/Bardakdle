import { normalize } from './words.js';
import { seededShuffle } from './utils/daily.js';

export const WORD_LENGTH = 5;

// הגדרת מצבי משחק: 8 / 16 / 32 לוחות
export const MODES = {
  8:  { numBoards: 8,  maxGuesses: 13, label: 'קל',   emoji: '🟢', path: '/8'  },
  16: { numBoards: 16, maxGuesses: 21, label: 'רגיל', emoji: '🟡', path: '/16' },
  32: { numBoards: 32, maxGuesses: 37, label: 'קשה',  emoji: '🔴', path: '/32' },
};

// בוחר N מילים לפי seed (מספר היום) — אותו seed = אותן מילים
export function pickAnswers(wordList, seed, numBoards = 16) {
  // seed שונה לכל מצב — מונע חפיפה בין 8/16/32 לוחות באותו יום
  const modeSeed = seed * 1000 + numBoards;
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

// מחשב סטטוס מקלדת: לכל אות — הצבע הטוב ביותר שנראה
export function computeKeyStatus(guesses, answers) {
  const keyStatus = {};
  const priority = { correct: 3, present: 2, absent: 1 };

  for (const boardGuesses of guesses) {
    for (const { word, result } of boardGuesses) {
      const normWord = normalize(word);
      for (let i = 0; i < normWord.length; i++) {
        const letter = normWord[i];
        const status = result[i];
        const prev = keyStatus[letter];
        if (!prev || priority[status] > priority[prev]) {
          keyStatus[letter] = status;
        }
      }
    }
  }

  return keyStatus;
}

// בדיקה אם לוח מסוים נוצח
export function isBoardSolved(boardGuesses, answer) {
  return boardGuesses.some(
    ({ word }) => normalize(word) === normalize(answer)
  );
}
