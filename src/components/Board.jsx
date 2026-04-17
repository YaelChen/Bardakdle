import React from 'react';
import { WORD_LENGTH } from '../gameLogic.js';
import { normalize, toDisplayLetter } from '../words.js';

function Tile({ letter, status, isReveal, revealDelay, isCurrentRow }) {
  const style = isReveal ? { animationDelay: `${revealDelay}ms` } : {};
  return (
    <div
      className={[
        'tile',
        status || '',
        isReveal ? 'reveal' : '',
        isCurrentRow && letter ? 'tbd' : '',
      ].filter(Boolean).join(' ')}
      style={style}
    >
      {letter}
    </div>
  );
}

function Row({ word, result, isCurrentRow, currentInput, isSolvedRow, isDisabled }) {
  const letters = [];

  if (isCurrentRow) {
    for (let i = 0; i < WORD_LENGTH; i++) {
      const raw = currentInput[i] || '';
      // הצג אות סופית בתא האחרון (האחרון בטקסט, שמאלי ב-RTL)
      const display = raw ? toDisplayLetter(raw, i, WORD_LENGTH) : '';
      letters.push({ letter: display, status: '', isReveal: false, isCurrentRow: true });
    }
  } else if (word) {
    const normWord = normalize(word);
    for (let i = 0; i < WORD_LENGTH; i++) {
      const raw = normWord[i] || '';
      const display = raw ? toDisplayLetter(raw, i, WORD_LENGTH) : '';
      letters.push({
        letter: display,
        status: result ? result[i] : '',
        isReveal: !!result,
        revealDelay: i * 120,
        isCurrentRow: false,
      });
    }
  } else {
    for (let i = 0; i < WORD_LENGTH; i++) {
      letters.push({ letter: '', status: '', isReveal: false, isCurrentRow: false });
    }
  }

  return (
    <div className={[
      'row',
      isSolvedRow ? 'solved-row' : '',
      isDisabled ? 'row-disabled' : '',
    ].filter(Boolean).join(' ')}>
      {letters.map((t, i) => (
        <Tile
          key={i}
          letter={t.letter}
          status={t.status}
          isReveal={t.isReveal}
          revealDelay={t.revealDelay}
          isCurrentRow={t.isCurrentRow}
        />
      ))}
    </div>
  );
}

export default function Board({ boardIndex, guesses, answer, currentInput, isSolved, gameOver, isInvalidWord, maxGuesses }) {
  const rows = [];

  for (let r = 0; r < maxGuesses; r++) {
    const guess = guesses[r];
    const isCurrentRow = !isSolved && !gameOver && r === guesses.length;
    // שורות ריקות לאחר פתרון הלוח — disabled
    const isDisabled = isSolved && !guess;

    const isSolvedRow = !!(
      isSolved &&
      guess &&
      normalize(guess.word) === normalize(answer)
    );

    rows.push(
      <Row
        key={r}
        word={guess?.word}
        result={guess?.result}
        isCurrentRow={isCurrentRow}
        currentInput={isCurrentRow ? currentInput : ''}
        isSolvedRow={isSolvedRow}
        isDisabled={isDisabled}
        isInvalidWord={isCurrentRow && isInvalidWord}
      />
    );
  }

  return (
    <div className={[
      'board-container',
      isSolved ? 'board-solved' : '',
    ].filter(Boolean).join(' ')}>
      <div className="board-number">{boardIndex + 1}</div>
      <div className={[
        'board',
        isInvalidWord && !isSolved && !gameOver ? 'board-invalid' : '',
      ].filter(Boolean).join(' ')}>
        {rows}
      </div>
      {isSolved && <div className="board-solved-label">✓</div>}
    </div>
  );
}
