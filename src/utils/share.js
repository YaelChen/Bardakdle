const DIGIT_EMOJIS = ['0️⃣','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];

// LTR mark לפני הספרות — מונע היפוך בהקשר RTL (וואטסאפ/טלגרם בעברית)
const LTR = '\u200E';

function toEmojiNum(n) {
  const digits = String(n).padStart(2, '0').split('').map(d => DIGIT_EMOJIS[+d]).join('');
  return LTR + digits + LTR;
}

function boardResult(boardIdx, solvedBoards, boardGuesses) {
  if (!solvedBoards[boardIdx]) return null;
  return boardGuesses[boardIdx].length;
}

export function generateShareText(dayNumber, solvedBoards, boardGuesses, numBoards = 16, gameUrl = '', guessCount = 0) {
  // RTL mark בתחילת כל שורה — מגדיר כיוון בסיס לימין
  const RTL = '\u200F';

  const won = solvedBoards.every(Boolean);
  const lines = [`${RTL}ברדקדל יומי #${dayNumber} (${numBoards} לוחות)`];

  if (won && guessCount > 0) {
    lines.push(`${RTL}פתרתי ב-${guessCount} ניחושים`);
  }

  for (let i = 0; i < numBoards; i += 2) {
    const leftResult  = boardResult(i,     solvedBoards, boardGuesses);
    const rightResult = boardResult(i + 1, solvedBoards, boardGuesses);

    const left  = leftResult  !== null ? toEmojiNum(leftResult)  : '🟥🟥';
    const right = rightResult !== null ? toEmojiNum(rightResult) : '🟥🟥';

    // בהקשר RTL: הזוג הראשון (i) מוצג מימין — כך הסדר תואם את רשת הלוחות
    lines.push(`${RTL}${left}⬛${right}`);
  }

  if (gameUrl) {
    lines.push('');
    lines.push(`${RTL}שחקו גם אתם: ${gameUrl}`);
  }

  return lines.join('\n');
}
