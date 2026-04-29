import React, { useState } from 'react';
import { getDayNumber, getDateFromDayNumber, loadGameState } from '../utils/daily.js';

const HEBREW_MONTHS = [
  'ינואר','פברואר','מרץ','אפריל','מאי','יוני',
  'יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'
];
const HEBREW_DAYS = ['א','ב','ג','ד','ה','ו','ש'];

// EPOCH: 1 באפריל 2026
const EPOCH_DATE = new Date(2026, 3, 1);

// גבול מוקדם ביותר: תחילת החודש שהוא 6 חודשים אחורה
function getEarliestDate() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() - 6, 1);
}

// בודק את כל המצבים (8/16/32) ומחזיר סטטוס משולב ליום
export function getDayStatus(dayNum) {
  const modes = [8, 16, 32];
  const saves = modes.map(nb => loadGameState(dayNum, nb)).filter(Boolean);

  if (saves.length === 0) return null;

  // בתהליך — עדיפות עליונה
  if (saves.some(s => !s.gameOver && s.guessCount > 0)) return 'partial';
  // לפחות אחד נפתר מלא
  if (saves.some(s => s.gameOver && s.won)) return 'won';
  // לפחות אחד נגמר בהפסד
  if (saves.some(s => s.gameOver && !s.won)) return 'lost';

  return null;
}

// סטטוס למצב ספציפי (8/16/32)
export function getModeStatus(dayNum, numBoards) {
  const s = loadGameState(dayNum, numBoards);
  if (!s || s.guessCount === 0) return null;
  if (!s.gameOver) return 'partial';
  return s.won ? 'won' : 'lost';
}

export default function Calendar({ onSelectDay, onClose, currentDayNumber }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayDayNum = getDayNumber(today);
  const earliest = getEarliestDate();
  // הגבול המוקדם הוא המאוחר מבין: epoch ו-6 חודשים אחורה
  const limitDate = earliest < EPOCH_DATE ? EPOCH_DATE : earliest;

  function isValidGameDate(date) {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const todayMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    return d >= limitDate.getTime() && d <= todayMs;
  }

  function canGoPrev() {
    if (viewYear > limitDate.getFullYear()) return true;
    if (viewYear === limitDate.getFullYear() && viewMonth > limitDate.getMonth()) return true;
    return false;
  }

  function canGoNext() {
    return viewYear < today.getFullYear() ||
      (viewYear === today.getFullYear() && viewMonth < today.getMonth());
  }

  function prevMonth() {
    if (!canGoPrev()) return;
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }

  function nextMonth() {
    if (!canGoNext()) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDow = firstDay.getDay();

  const cells = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const STATUS_LABEL = { won: '✓', lost: '✗', partial: '…' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="calendar-box" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="calendar-header">
          <button className="cal-nav" onClick={nextMonth} disabled={!canGoNext()}>›</button>
          <span className="cal-title">{HEBREW_MONTHS[viewMonth]} {viewYear}</span>
          <button className="cal-nav" onClick={prevMonth} disabled={!canGoPrev()}>‹</button>
        </div>

        <div className="calendar-grid">
          {HEBREW_DAYS.map(d => (
            <div key={d} className="cal-day-label">{d}</div>
          ))}
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} />;

            const cellDate = new Date(viewYear, viewMonth, day);
            const valid = isValidGameDate(cellDate);
            const dayNum = valid ? getDayNumber(cellDate) : null;
            const isToday = dayNum === todayDayNum;
            const isCurrent = dayNum === currentDayNumber;
            const status = dayNum ? getDayStatus(dayNum) : null;

            return (
              <button
                key={day}
                className={[
                  'cal-day',
                  !valid ? 'cal-day-disabled' : '',
                  isToday ? 'cal-day-today' : '',
                  isCurrent ? 'cal-day-current' : '',
                  status ? `cal-day-${status}` : '',
                ].filter(Boolean).join(' ')}
                disabled={!valid}
                onClick={() => valid && onSelectDay(dayNum)}
                title={valid ? `יומי #${dayNum}${status ? ' ' + STATUS_LABEL[status] : ''}` : ''}
              >
                <span className="cal-day-num">{day}</span>
                {status && <span className="cal-day-status">{STATUS_LABEL[status]}</span>}
              </button>
            );
          })}
        </div>

        <div className="calendar-legend">
          <span className="leg-item"><span className="leg-dot won">✓</span> הושלם</span>
          <span className="leg-item"><span className="leg-dot lost">✗</span> לא הושלם</span>
          <span className="leg-item"><span className="leg-dot partial">…</span> בתהליך</span>
        </div>

        <button className="btn-modal-close cal-close-btn" onClick={onClose}>סגור</button>
      </div>
    </div>
  );
}
