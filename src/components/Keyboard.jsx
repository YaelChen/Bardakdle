import React, { useState, useEffect } from 'react';

const KEYBOARD_ROWS = [
  ['פ', 'ו', 'ט', 'א', 'ר', 'ק'],
  ['ל', 'ח', 'י', 'ע', 'כ', 'ג', 'ד', 'ש'],
  ['ת', 'צ', 'מ', 'נ', 'ה', 'ב', 'ס', 'ז'],
];

function useMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 600);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

function KeyGrid({ statuses, numBoards, solvedBoards }) {
  // אם האות לא נוחשה כלל — כל הקוביות נשארות אפור בהיר
  const hasBeenGuessed = statuses.some(s => s !== '');

  return (
    <div className={`key-grid key-grid-${numBoards}`} aria-hidden="true">
      {Array.from({ length: numBoards }, (_, i) => {
        let cellClass;
        if (!hasBeenGuessed) {
          cellClass = 'key-cell key-cell-none';        // לא נוחש — אפור בהיר לכולן
        } else if (solvedBoards[i]) {
          cellClass = 'key-cell key-cell-absent';      // לוח פתור — אפור כהה
        } else {
          cellClass = `key-cell key-cell-${statuses[i] || 'none'}`;
        }
        return <span key={i} className={cellClass} />;
      })}
    </div>
  );
}

export default function Keyboard({ onLetter, onDelete, onEnter, keyStatus, isInvalidWord, inputFull, numBoards, solvedBoards }) {
  const enterDisabled = inputFull && isInvalidWord;
  const empty = new Array(numBoards).fill('');
  const solved = solvedBoards || new Array(numBoards).fill(false);
  const isMobile = useMobile();

  const enterBtn = (
    <button
      className={`key key-wide key-enter ${enterDisabled ? 'key-disabled' : ''}`}
      onClick={onEnter}
      disabled={enterDisabled}
      aria-label="אישור"
    >
      אישור
    </button>
  );

  const deleteBtn = (
    <button
      className="key key-wide key-delete"
      onClick={onDelete}
      aria-label="מחיקה"
    >
      ⌦
    </button>
  );

  return (
    <div className="keyboard" dir="rtl">
      {KEYBOARD_ROWS.map((row, rowIdx) => (
        <div key={rowIdx} className="keyboard-row">
          {/* במובייל: enter מימין לפ' בשורה 0 */}
          {isMobile && rowIdx === 0 && enterBtn}

          {/* בדסקטופ: enter מימין בשורה 2 */}
          {!isMobile && rowIdx === 2 && enterBtn}

          {row.map(letter => {
            const statuses = keyStatus[letter] || empty;
            return (
              <button
                key={letter}
                className="key key-letter-btn"
                onClick={() => onLetter(letter)}
                aria-label={letter}
              >
                <KeyGrid statuses={statuses} numBoards={numBoards} solvedBoards={solved} />
                <span className="key-label">{letter}</span>
              </button>
            );
          })}

          {/* במובייל: delete משמאל לק' בשורה 0 */}
          {isMobile && rowIdx === 0 && deleteBtn}

          {/* בדסקטופ: delete משמאל בשורה 2 */}
          {!isMobile && rowIdx === 2 && deleteBtn}
        </div>
      ))}
    </div>
  );
}
