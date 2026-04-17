import answersRaw from './data/answers.json';
import extraGuessesRaw from './data/valid_guesses.json';

// פונקציית נרמול: מחליפה אותיות סופיות באותיות רגילות
export function normalize(word) {
  return word
    .replace(/ך/g, 'כ')
    .replace(/ם/g, 'מ')
    .replace(/ן/g, 'נ')
    .replace(/ף/g, 'פ')
    .replace(/ץ/g, 'צ');
}

// המרת אות לצורת סופית לתצוגה בלבד (לא לשימוש לוגי)
const FINAL_MAP = { כ: 'ך', מ: 'ם', נ: 'ן', פ: 'ף', צ: 'ץ' };

export function toDisplayLetter(letter, index, wordLength) {
  if (index === wordLength - 1) {
    return FINAL_MAP[letter] || letter;
  }
  return letter;
}

// רשימת תשובות — מסוננת ל-5 אותיות בדיוק
export const ANSWERS = [...new Set(answersRaw.map(normalize))].filter(
  w => w.length === 5
);

// כל המילים התקינות לניחוש (תשובות + מילים נוספות)
export const VALID_WORDS = new Set([
  ...ANSWERS,
  ...[...new Set(extraGuessesRaw.map(normalize))].filter(w => w.length === 5),
]);
