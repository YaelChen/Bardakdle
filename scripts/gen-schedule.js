/**
 * gen-schedule.js
 * ---------------
 * מייצר src/data/daily_schedule.json — לוח-זמנים של תשובות יומיות.
 *
 * כיצד עובד:
 *  • ימים שכבר עברו (לפני היום) → נשמרים ללא שינוי (אם קיימים).
 *  • מהיום ואילך → נחשבים מחדש לפי answers.json הנוכחי.
 *
 * הרצה:
 *   node scripts/gen-schedule.js
 *
 * כשמוסיפים מילים חדשות ל-answers.json, מריצים שוב —
 * רק ימים עתידיים יקבלו את המילים החדשות.
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ANSWERS_PATH  = join(__dirname, '../src/data/answers.json');
const SCHEDULE_PATH = join(__dirname, '../src/data/daily_schedule.json');

// ===== עותק של הפונקציות מ-daily.js / gameLogic.js =====

function normalize(word) {
  return word
    .replace(/ך/g, 'כ')
    .replace(/ם/g, 'מ')
    .replace(/ן/g, 'נ')
    .replace(/ף/g, 'פ')
    .replace(/ץ/g, 'צ');
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, seed) {
  const rand = mulberry32(seed);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MODE_OFFSETS = { 8: 0, 16: 1_000_000, 32: 2_000_000 };
const MODES        = [8, 16, 32];
const MAX_DAYS     = 400; // ~13 חודשים מה-epoch

// ===== חישוב מספר היום של היום =====
const EPOCH    = new Date(2026, 3, 1).getTime();
const today    = new Date();
const todayMs  = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
const todayDay = Math.max(1, Math.floor((todayMs - EPOCH) / 86400000) + 1);

// ===== טעינת תיזמון קיים (שמירת ימים עברו) =====
let schedule = {};
if (existsSync(SCHEDULE_PATH)) {
  schedule = JSON.parse(readFileSync(SCHEDULE_PATH, 'utf8'));
  console.log(`Loaded existing schedule (${Object.keys(schedule).length} entries)`);
}

// ===== טעינת רשימת תשובות =====
const answers = JSON.parse(readFileSync(ANSWERS_PATH, 'utf8')).map(normalize);
console.log(`Answers pool: ${answers.length} words`);

// ===== יצירת לוח-הזמנים =====
let generated = 0;
let preserved = 0;

for (let day = 1; day <= MAX_DAYS; day++) {
  for (const numBoards of MODES) {
    const key = `${day}_${numBoards}`;

    // ימים שעברו וגם היום — שמור ולא תשנה (למנוע שינוי במהלך היום)
    if (schedule[key] && day <= todayDay) {
      preserved++;
      continue;
    }

    // ימים עתידיים בלבד — חשב לפי רשימת המילים הנוכחית
    const seed     = day + MODE_OFFSETS[numBoards];
    const shuffled = seededShuffle(answers, seed);
    schedule[key]  = shuffled.slice(0, numBoards);
    generated++;
  }
}

writeFileSync(SCHEDULE_PATH, JSON.stringify(schedule));
console.log(`\n✓ Done!`);
console.log(`  Today = day ${todayDay}`);
console.log(`  Preserved (past days): ${preserved} entries`);
console.log(`  Generated/updated:     ${generated} entries`);
console.log(`  Total entries:         ${Object.keys(schedule).length}`);
console.log(`\n  File: ${SCHEDULE_PATH}`);
