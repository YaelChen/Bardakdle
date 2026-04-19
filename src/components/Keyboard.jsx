import React from 'react';

const KEYBOARD_ROWS = [
  ['פ', 'ו', 'ט', 'א', 'ר', 'ק'],
  ['ל', 'ח', 'י', 'ע', 'כ', 'ג', 'ד', 'ש'],
  ['ת', 'צ', 'מ', 'נ', 'ה', 'ב', 'ס', 'ז'],
];

// רינדור גריד המשבצות בתוך הכפתור
function KeyGrid({ statuses, numBoards }) {
  return (
    <div className={`key-grid key-grid-${numBoards}`} aria-hidden="true">
      {Array.from({ length: numBoards }, (_, i) => (
        <span key={i} className={`key-cell key-cell-${statuses[i] || 'none'}`} />
      ))}
    </div>
  );
}

export default function Keyboard({ onLetter, onDelete, onEnter, keyStatus, isInvalidWord, inputFull, numBoards }) {
  const enterDisabled = inputFull && isInvalidWord;
  const empty = new Array(numBoards).fill('');

  return (
    <div className="keyboard" dir="rtl">
      {KEYBOARD_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="keyboard-row">
          {rowIdx === 2 && (
            <button
              className={`key key-wide key-enter ${enterDisabled ? 'key-disabled' : ''}`}
              onClick={onEnter}
              disabled={enterDisabled}
              aria-label="אישור"
            >
              אישור
            </button>
          )}
          {row.map(letter => {
            const statuses = keyStatus[letter] || empty;
            return (
              <button
                key={letter}
                className="key key-letter-btn"
                onClick={() => onLetter(letter)}
                aria-label={letter}
              >
                <KeyGrid statuses={statuses} numBoards={numBoards} />
                <span className="key-label">{letter}</span>
              </button>
            );
          })}
          {rowIdx === 2 && (
            <button
              className="key key-wide key-delete"
              onClick={onDelete}
              aria-label="מחיקה"
            >
              ⌦
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
