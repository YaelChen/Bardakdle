import { useState, useCallback, useEffect, useRef } from 'react';
import { ANSWERS, VALID_WORDS, normalize } from './words.js';
import { loadGameState, saveGameState, lockAnswers } from './utils/daily.js';
import {
  WORD_LENGTH,
  pickAnswers, evaluateGuess, isBoardSolved, computeKeyStatus
} from './gameLogic.js';

function initState(dayNumber, extraAnswers, numBoards, maxGuesses) {
  const saved = loadGameState(dayNumber, numBoards);

  // אם יש save עם תשובות שמורות — משחזרים אותן כדי למנוע שינוי בריפרש
  if (saved && saved.boardGuesses && saved.answers) {
    return {
      dayNumber,
      answers: saved.answers,
      boardGuesses: saved.boardGuesses,
      currentInput: '',
      isInvalidWord: false,
      guessCount: saved.guessCount,
      gameOver: saved.gameOver,
      won: saved.won,
      message: saved.gameOver
        ? (saved.won ? 'כל הכבוד! פתרת את כל הלוחות!' : 'נגמרו הניחושים!')
        : '',
      solvedBoards: saved.solvedBoards,
    };
  }

  // משחק חדש — מחשבים תשובות טריות
  const answerPool = extraAnswers && extraAnswers.size > 0
    ? [...ANSWERS, ...[...extraAnswers].filter(w => !ANSWERS.includes(w))]
    : ANSWERS;
  const answers = pickAnswers(answerPool, dayNumber, numBoards);

  // נועל את התשובות ב-localStorage מיד — לפני ניחוש ראשון
  // כך שינויים עתידיים ברשימת המילים לא ישפיעו על המשחק הנוכחי
  lockAnswers(dayNumber, answers, numBoards);

  return {
    dayNumber,
    answers,
    boardGuesses: Array.from({ length: numBoards }, () => []),
    currentInput: '',
    isInvalidWord: false,
    guessCount: 0,
    gameOver: false,
    won: false,
    message: '',
    solvedBoards: Array(numBoards).fill(false),
  };
}

export function useGameState(dayNumber, extraValidWords, extraAnswers, numBoards, maxGuesses) {
  const [state, setState] = useState(() => initState(dayNumber, extraAnswers, numBoards, maxGuesses));

  // עוקבים אחרי שינוי יום עם ref — לא גורם ל-render נוסף
  const prevDayRef = useRef(dayNumber);
  useEffect(() => {
    if (prevDayRef.current !== dayNumber) {
      prevDayRef.current = dayNumber;
      setState(initState(dayNumber, extraAnswers, numBoards, maxGuesses));
    }
  }, [dayNumber]);

  const addLetter = useCallback((letter) => {
    setState(prev => {
      if (prev.gameOver) return prev;
      if (prev.currentInput.length >= WORD_LENGTH) return prev;
      return { ...prev, currentInput: prev.currentInput + normalize(letter), isInvalidWord: false, message: '' };
    });
  }, []);

  const deleteLetter = useCallback(() => {
    setState(prev => {
      if (prev.gameOver) return prev;
      if (prev.currentInput.length === 0) return prev;
      return { ...prev, currentInput: prev.currentInput.slice(0, -1), isInvalidWord: false, message: '' };
    });
  }, []);

  const submitGuess = useCallback((extraWords) => {
    setState(prev => {
      if (prev.gameOver) return prev;
      if (prev.currentInput.length !== WORD_LENGTH) {
        return { ...prev, message: 'המילה חייבת להיות בת 5 אותיות', isInvalidWord: false };
      }

      const guess = normalize(prev.currentInput);
      const isValid = VALID_WORDS.has(guess) || (extraWords && extraWords.has(guess));
      if (!isValid) {
        return { ...prev, isInvalidWord: true, message: 'מילה לא מוכרת' };
      }

      const newBoardGuesses = prev.boardGuesses.map((bg, i) => {
        if (prev.solvedBoards[i]) return bg;
        const result = evaluateGuess(guess, prev.answers[i]);
        return [...bg, { word: guess, result }];
      });

      const newGuessCount = prev.guessCount + 1;
      const newSolvedBoards = newBoardGuesses.map((bg, i) =>
        isBoardSolved(bg, prev.answers[i])
      );
      const allSolved = newSolvedBoards.every(Boolean);
      const outOfGuesses = newGuessCount >= maxGuesses;
      const newGameOver = allSolved || outOfGuesses;

      let message = '';
      if (allSolved) message = 'כל הכבוד! פתרת את כל הלוחות!';
      else if (outOfGuesses) message = 'נגמרו הניחושים!';

      const next = {
        ...prev,
        boardGuesses: newBoardGuesses,
        currentInput: '',
        isInvalidWord: false,
        guessCount: newGuessCount,
        gameOver: newGameOver,
        won: allSolved,
        message,
        solvedBoards: newSolvedBoards,
      };

      // שמירה ישירה אחרי כל ניחוש — לא מסתמכים על useEffect
      saveGameState(prev.dayNumber, next, numBoards);

      return next;
    });
  }, [maxGuesses, numBoards]);

  const keyStatus = computeKeyStatus(state.boardGuesses, state.answers);

  return {
    ...state,
    keyStatus,
    addLetter,
    deleteLetter,
    submitGuess,
  };
}
