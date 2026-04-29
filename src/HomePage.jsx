import React, { useState } from 'react';
import { useRouter } from './router.jsx';
import { MODES } from './gameLogic.js';
import Calendar, { getModeStatus } from './components/Calendar.jsx';
import './HomePage.css';

const MODE_STATUS_CLASS = { won: 'mode-status-won', lost: 'mode-status-lost', partial: 'mode-status-partial' };
const MODE_STATUS_ICON  = { won: '✓', lost: '✗', partial: '…' };

export default function HomePage() {
  const { navigate } = useRouter();
  const [showCalendar, setShowCalendar] = useState(false);
  const [pendingDay, setPendingDay] = useState(null); // יום שנבחר — ממתין לבחירת מצב

  // שלב 1: בחרו יום בלוח השנה
  const handleSelectDay = (dayNum) => {
    setShowCalendar(false);
    setPendingDay(dayNum);
  };

  // שלב 2: בחרו מצב → נווטו למשחק
  const handleSelectMode = (path) => {
    sessionStorage.setItem('bardakdal_goto_day', pendingDay);
    navigate(path);
  };

  return (
    <div className="home-page" dir="rtl">
      <div className="home-inner">
        <h1 className="home-title">ברדקדל</h1>
        <p className="home-tagline">ניחוש מילים עבריות במקביל — כמו Wordle, רק הרבה יותר</p>

        <h2 className="home-choose">בחר רמת קושי</h2>

        <div className="home-modes">
          {Object.values(MODES).map(({ numBoards, emoji, path }) => (
            <button
              key={numBoards}
              className={`mode-btn mode-btn-${numBoards}`}
              onClick={() => navigate(path)}
            >
              <span className="mode-emoji">{emoji}</span>
              <span className="mode-boards">{numBoards} מילים</span>
            </button>
          ))}
        </div>

        <p className="home-hint">כל יום — חידה חדשה. אותה חידה לכולם.</p>

        <button className="btn-past-games-home" onClick={() => setShowCalendar(true)}>
          📅 למשחקים קודמים
        </button>
      </div>

      {/* שלב 1: לוח שנה */}
      {showCalendar && (
        <Calendar
          onSelectDay={handleSelectDay}
          onClose={() => setShowCalendar(false)}
          currentDayNumber={null}
        />
      )}

      {/* שלב 2: בחירת מצב לאחר בחירת יום */}
      {pendingDay && (
        <div className="modal-overlay" onClick={() => setPendingDay(null)}>
          <div className="modal-box past-mode-picker" dir="rtl" onClick={e => e.stopPropagation()}>
            <h3>בחרי כמה מילים לשחק</h3>
            <div className="past-mode-btns">
              {Object.values(MODES).map(({ numBoards, emoji, path }) => {
                const st = getModeStatus(pendingDay, numBoards);
                return (
                  <button
                    key={numBoards}
                    className={`mode-btn mode-btn-${numBoards} ${st ? MODE_STATUS_CLASS[st] : ''}`}
                    onClick={() => handleSelectMode(path)}
                  >
                    <span className="mode-emoji">{emoji}</span>
                    <span className="mode-boards">{numBoards} מילים</span>
                    {st && <span className="mode-status-icon">{MODE_STATUS_ICON[st]}</span>}
                  </button>
                );
              })}
            </div>
            <button className="btn-modal-close" style={{ marginTop: 12 }} onClick={() => setPendingDay(null)}>
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
