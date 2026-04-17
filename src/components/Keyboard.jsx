import React from 'react';

const KEYBOARD_ROWS = [
  ['פ', 'ו', 'ט', 'א', 'ר', 'ק'],
  ['ל', 'ח', 'י', 'ע', 'כ', 'ג', 'ד', 'ש'],
  ['ת', 'צ', 'מ', 'נ', 'ה', 'ב', 'ס', 'ז'],
];

export default function Keyboard({ onLetter, onDelete, onEnter, keyStatus, isInvalidWord, inputFull }) {
  // כפתור אישור: disabled אם המילה לא מוכרת
  const enterDisabled = inputFull && isInvalidWord;

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
          {row.map(letter => (
            <button
              key={letter}
              className={`key ${keyStatus[letter] || ''}`}
              onClick={() => onLetter(letter)}
              aria-label={letter}
            >
              {letter}
            </button>
          ))}
          {rowIdx === 2 && (
            <button
              className="key key-wide key-delete"
              onClick={onDelete}
              aria-label="מחיקה"
            >
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
