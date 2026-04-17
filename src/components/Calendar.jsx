import React, { useState } from 'react';
import { getDayNumber, getDateFromDayNumber, isValidGameDate, loadGameState } from '../utils/daily.js';

const HEBREW_MONTHS = [
  'ינואר','פברואר','מרץ','אפריל','מאי','יוני',
  'יולי','אוגוסט','ספטמבר','אוקטובר','נובמבר','דצמבר'
];
const HEBREW_DAYS = ['א','ב','ג','ד','ה','ו','ש'];

// EPOCH: 1 באפריל 2026
const EPOCH_DATE = new Date(2026, 3, 1);

function getStatusEmoji(dayNum) {
  const saved = loadGameState(dayNum);
  if (!saved) return null;
  if (saved.won) return '✓';
  if (saved.gameOver) return '✗';
  if (saved.guessCount > 0) return '…';
  return null;
}

export default function Calendar({ onSelectDay, onClose, currentDayNumber }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const todayDayNum = getDayNumber(today);

  function canGoPrev() {
    return viewYear > EPOCH_DATE.getFullYear() ||
      (viewYear === EPOCH_DATE.getFullYear() && viewMonth > EPOCH_DATE.getMonth());
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

  // בניית תאי הלוח
  const firstDay = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // יום בשבוע של תחילת החודש (0=ראשון)
  let startDow = firstDay.getDay(); // 0=Sun

  const cells = [];
  // ריווח לפני היום הראשון
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="calendar-box" dir="rtl" onClick={e => e.stopPropagation()}>
        <div className="calendar-header">
          <button className="cal-nav" onClick={nextMonth} disabled={!canGoNext()}>›</button>
          <span className="cal-title">
            {HEBREW_MONTHS[viewMonth]} {viewYear}
          </span>
          <button className="cal-nav" onClick={prevMonth} disabled={!canGoPrev()}>‹</button>
        </div>

        <div className="calendar-grid">
          {/* כותרות ימים */}
          {HEBREW_DAYS.map(d => (
            <div key={d} className="cal-day-label">{d}</div>
          ))}

          {/* תאים */}
          {cells.map((day, idx) => {
            if (!day) return <div key={`e-${idx}`} />;

            const cellDate = new Date(viewYear, viewMonth, day);
            const valid = isValidGameDate(cellDate);
            const dayNum = valid ? getDayNumber(cellDate) : null;
            const isToday = dayNum === todayDayNum;
            const isCurrent = dayNum === currentDayNumber;
            const status = dayNum ? getStatusEmoji(dayNum) : null;

            return (
              <button
                key={day}
                className={[
                  'cal-day',
                  !valid ? 'cal-day-disabled' : '',
                  isToday ? 'cal-day-today' : '',
                  isCurrent ? 'cal-day-current' : '',
                  status === '✓' ? 'cal-day-won' :
                  status === '✗' ? 'cal-day-lost' :
                  status === '…' ? 'cal-day-partial' : '',
                ].filter(Boolean).join(' ')}
                disabled={!valid}
                onClick={() => valid && onSelectDay(dayNum)}
                title={valid ? `יומי #${dayNum}${status ? ' ' + status : ''}` : ''}
              >
                <span className="cal-day-num">{day}</span>
                {status && <span className="cal-day-status">{status}</span>}
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
