const DIGIT_EMOJIS = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];

function toEmojiNum(n) {
  return String(n).padStart(2, '0').split('').map(d => DIGIT_EMOJIS[+d]).join('');
}

// מחשב עבור לוח בודד: מספר הניחוש שבו נפתר, או null אם לא נפתר
function boardResult(boardIdx, solvedBoards, boardGuesses) {
  if (!solvedBoards[boardIdx]) return null;
  return boardGuesses[boardIdx].length;
}

// יוצר את טקסט השיתוף
// פורמט: שורות של זוגות לוחות (כמספר הלוחות / 2)
// לוח שנפתר: מספר הניחוש כאמוג'י דו-ספרתי
// לוח שלא נפתר: 🟥🟥
export function generateShareText(dayNumber, solvedBoards, boardGuesses, numBoards = 16) {
  const lines = [`ברדקדל יומי #${dayNumber} (${numBoards} לוחות)`];

  for (let i = 0; i < numBoards; i += 2) {
    const leftResult  = boardResult(i,     solvedBoards, boardGuesses);
    const rightResult = boardResult(i + 1, solvedBoards, boardGuesses);

    const left  = leftResult  !== null ? toEmojiNum(leftResult)  : '🟥🟥';
    const right = rightResult !== null ? toEmojiNum(rightResult) : '🟥🟥';

    lines.push(`${left}⬛${right}`);
  }

  return lines.join('\n');
}
