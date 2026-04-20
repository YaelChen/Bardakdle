import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useGameState } from './useGameState.js';
import { useRouter } from './router.jsx';
import { normalize, toDisplayLetter } from './words.js';
import { WORD_LENGTH } from './gameLogic.js';
import { getTodayDayNumber, getDateFromDayNumber, clearAllHistory } from './utils/daily.js';
import { generateShareText } from './utils/share.js';
import Board from './components/Board.jsx';
import Keyboard from './components/Keyboard.jsx';
import Calendar from './components/Calendar.jsx';
import './App.css';

const HEBREW_LETTERS = new Set([
  'א','ב','ג','ד','ה','ו','ז','ח','ט','י',
  'כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת',
  'ך','ם','ן','ף','ץ',
]);

function loadExtraWords() {
  try {
    const stored = localStorage.getItem('bardakdal_extra_words');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
}

function saveExtraWords(set) {
  try {
    localStorage.setItem('bardakdal_extra_words', JSON.stringify([...set]));
  } catch {}
}

function loadExtraAnswers() {
  try {
    const stored = localStorage.getItem('bardakdal_extra_answers');
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch { return new Set(); }
}

function saveExtraAnswers(set) {
  try {
    localStorage.setItem('bardakdal_extra_answers', JSON.stringify([...set]));
  } catch {}
}

const HEBREW_MONTHS_SHORT = [
  'ינו','פבר','מרץ','אפר','מאי','יוני',
  'יולי','אוג','ספט','אוק','נוב','דצמ'
];

function formatDateHebrew(date) {
  return `${date.getDate()} ${HEBREW_MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export default function App({ mode }) {
  const { numBoards, maxGuesses, label } = mode;
  const { navigate } = useRouter();

  // נועל את מספר היום ב-session — לא משתנה בחצות באמצע משחק
  const [todayDayNum] = useState(getTodayDayNumber);
  const [selectedDay, setSelectedDay] = useState(getTodayDayNumber);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [extraValidWords, setExtraValidWords] = useState(loadExtraWords);
  const [extraAnswers, setExtraAnswers] = useState(loadExtraAnswers);
  const [addWordModal, setAddWordModal] = useState(false);
  const [addWordInput, setAddWordInput] = useState('');
  const [addWordMsg, setAddWordMsg] = useState('');
  const [addToAnswers, setAddToAnswers] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);
  const addWordInputRef = useRef(null);

  const isToday = selectedDay === todayDayNum;

  const {
    answers, boardGuesses, currentInput, dayNumber,
    isInvalidWord, guessCount, gameOver, won, message,
    solvedBoards, keyStatus,
    addLetter, deleteLetter, submitGuess,
  } = useGameState(selectedDay, extraValidWords, extraAnswers, numBoards, maxGuesses);

  // פותח את חלונית הסיום כשהמשחק נגמר (כולל טעינה מחדש של משחק שכבר נגמר)
  useEffect(() => {
    if (gameOver) setShowGameOver(true);
  }, [gameOver, selectedDay]);

  const handleSubmit = useCallback(() => {
    submitGuess(extraValidWords);
  }, [submitGuess, extraValidWords]);

  const handleKeyDown = useCallback((e) => {
    if (e.ctrlKey && e.shiftKey && (e.key === 'Y' || e.key === 'y')) {
      e.preventDefault();
      setAddWordInput('');
      setAddWordMsg('');
      setAddWordModal(true);
      return;
    }
    if (addWordModal || showCalendar) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      deleteLetter();
    } else if (e.key.length === 1 && HEBREW_LETTERS.has(e.key)) {
      addLetter(e.key);
    }
  }, [addLetter, deleteLetter, handleSubmit, addWordModal, showCalendar]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (addWordModal && addWordInputRef.current) {
      addWordInputRef.current.focus();
    }
  }, [addWordModal]);

  const handleAddWord = useCallback(async () => {
    const word = normalize(addWordInput.trim());
    if (word.length !== WORD_LENGTH) {
      setAddWordMsg('המילה חייבת להיות בת 5 אותיות');
      return;
    }

    // כתיבה ישירה לקבצי JSON (עובד רק בסביבת פיתוח עם Vite)
    let savedToFile = false;
    try {
      const res = await fetch('/api/add-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word, addToAnswers }),
      });
      savedToFile = res.ok;
    } catch {
      // בפרודקשן — אין API, נמשיך ל-localStorage בלבד
    }

    // עדכון localStorage (תמיד)
    const updatedValid = new Set(extraValidWords);
    updatedValid.add(word);
    setExtraValidWords(updatedValid);
    saveExtraWords(updatedValid);

    if (addToAnswers) {
      const updatedAnswers = new Set(extraAnswers);
      updatedAnswers.add(word);
      setExtraAnswers(updatedAnswers);
      saveExtraAnswers(updatedAnswers);
    }

    const modeLabel = addToAnswers ? 'ניחושים + תשובות' : 'ניחושים בלבד';
    const fileSuffix = savedToFile ? ' ✓ נשמר לקובץ' : '';
    setAddWordMsg(`"${addWordInput.trim()}" נוספה (${modeLabel})${fileSuffix}`);
    setAddWordInput('');
  }, [addWordInput, extraValidWords, extraAnswers, addToAnswers]);

  const handleClearHistory = useCallback(() => {
    if (window.confirm('למחוק את כל היסטוריית המשחקים?')) {
      clearAllHistory();
      window.location.reload();
    }
  }, []);

  const handleShare = useCallback(() => {
    const text = generateShareText(dayNumber, solvedBoards, boardGuesses, numBoards);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      });
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    }
  }, [dayNumber, solvedBoards, boardGuesses, numBoards]);

  const handleSelectDay = useCallback((dayNum) => {
    setSelectedDay(dayNum);
    setShowCalendar(false);
    setShareCopied(false);
  }, []);

  const solvedCount = solvedBoards.filter(Boolean).length;
  const sharePreview = gameOver
    ? generateShareText(dayNumber, solvedBoards, boardGuesses, numBoards)
    : null;
  const selectedDate = getDateFromDayNumber(selectedDay);

  return (
    <div className="app" dir="rtl">
      <header className="app-header">
        <div className="header-top-row">
          <button className="btn-home" onClick={() => navigate('/')} title="לעמוד הבית">🏠</button>
          <h1 className="app-title">ברדקדל</h1>
          <span className="mode-badge">{numBoards} לוחות</span>
        </div>
        <div className="app-subtitle">
          {isToday
            ? `יומי #${dayNumber} • ${guessCount}/${maxGuesses} ניחושים • ${solvedCount}/${numBoards} לוחות`
            : `#${dayNumber} — ${formatDateHebrew(selectedDate)} • ${guessCount}/${maxGuesses} ניחושים • ${solvedCount}/${numBoards} לוחות`
          }
        </div>
        {!isToday && (
          <div className="past-game-banner">
            📅 משחק קודם —{' '}
            <button className="link-btn" onClick={() => setSelectedDay(todayDayNum)}>
              עבור להיום
            </button>
          </div>
        )}
      </header>

      {message && (
        <div className={`message ${won ? 'message-win' : gameOver ? 'message-loss' : isInvalidWord ? 'message-invalid' : 'message-info'}`}>
          {message}
        </div>
      )}

      <div className={`boards-grid boards-grid-${numBoards}`}>
        {answers.map((answer, i) => (
          <Board
            key={i}
            boardIndex={i}
            guesses={boardGuesses[i]}
            answer={answer}
            currentInput={currentInput}
            isSolved={solvedBoards[i]}
            gameOver={gameOver}
            isInvalidWord={isInvalidWord}
            maxGuesses={maxGuesses}
          />
        ))}
      </div>

      <Keyboard
        onLetter={addLetter}
        onDelete={deleteLetter}
        onEnter={handleSubmit}
        keyStatus={keyStatus}
        isInvalidWord={isInvalidWord}
        inputFull={currentInput.length === WORD_LENGTH}
        numBoards={numBoards}
        solvedBoards={solvedBoards}
      />
      <div className="keyboard-spacer" />

      <footer className="app-footer">
        מצאתם באג או מילה חסרה?{' '}
        <a
          href="https://forms.gle/W9L4sGzrYAhuvBUC7"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
        >
          כתבו לי
        </a>
      </footer>

      {/* מודל הוספת מילה + ניקוי היסטוריה */}
      {addWordModal && (
        <div className="modal-overlay" onClick={() => setAddWordModal(false)}>
          <div className="modal-box" dir="rtl" onClick={e => e.stopPropagation()}>
            <h3>הוסף מילה לרשימה</h3>
            <p className="modal-hint">הוסף מילה שנדחתה כדי לאפשר אותה בעתיד</p>
            <div className="modal-toggle-row">
              <span className="modal-toggle-label">הוסף גם לתשובות</span>
              <button
                className={`toggle-switch ${addToAnswers ? 'toggle-on' : 'toggle-off'}`}
                onClick={() => setAddToAnswers(v => !v)}
                aria-pressed={addToAnswers}
              >
                <span className="toggle-knob" />
              </button>
              <span className="toggle-state-label">{addToAnswers ? 'פועל' : 'כבוי'}</span>
            </div>
            <input
              ref={addWordInputRef}
              className="modal-input"
              type="text"
              value={addWordInput}
              onChange={e => { setAddWordInput(e.target.value); setAddWordMsg(''); }}
              onKeyDown={e => {
                e.stopPropagation();
                if (e.key === 'Enter') handleAddWord();
                if (e.key === 'Escape') setAddWordModal(false);
              }}
              placeholder="הקלד מילה עברית (5 אותיות)"
              maxLength={10}
            />
            {addWordMsg && <div className="modal-msg">{addWordMsg}</div>}
            <div className="modal-buttons">
              <button className="btn-modal-add" onClick={handleAddWord}>הוסף</button>
              <button className="btn-modal-close" onClick={() => setAddWordModal(false)}>סגור</button>
            </div>
            {extraValidWords.size > 0 && (
              <div className="modal-extra-list">
                <strong>מילים שנוספו ({extraValidWords.size}):</strong>
                <div className="extra-words-grid">
                  {[...extraValidWords].map(w => (
                    <span key={w} className="extra-word">{w}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="modal-danger-zone">
              <button className="btn-clear-history" onClick={handleClearHistory}>
                🗑 נקה היסטוריית משחקים
              </button>
            </div>
          </div>
        </div>
      )}

      {/* לוח שנה */}
      {showCalendar && (
        <Calendar
          onSelectDay={handleSelectDay}
          onClose={() => setShowCalendar(false)}
          currentDayNumber={selectedDay}
        />
      )}

      {/* מסך סיום */}
      {gameOver && showGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-box">
            <button className="game-over-close" onClick={() => setShowGameOver(false)} aria-label="סגור">✕</button>
            <h2>{won ? '🎉 ניצחת!' : 'המשחק נגמר'}</h2>
            <p className="game-over-sub">
              {solvedCount}/{numBoards} לוחות • {guessCount} ניחושים
              {!isToday && ` • ${formatDateHebrew(selectedDate)}`}
            </p>

            <div className="share-preview" dir="ltr">
              <pre>{sharePreview}</pre>
            </div>

            <button
              className={`btn-share ${shareCopied ? 'btn-share-copied' : ''}`}
              onClick={handleShare}
            >
              {shareCopied ? '✓ הועתק!' : '📋 שתף תוצאות'}
            </button>

            <div className="answers-reveal">
              <h3>התשובות היו:</h3>
              <div className="answers-grid">
                {answers.map((ans, i) => (
                  <div key={i} className={`answer-item ${solvedBoards[i] ? 'solved' : 'unsolved'}`}>
                    <span className="answer-num">{i + 1}.</span>
                    <span className="answer-word">
                      {ans.split('').map((ch, idx) =>
                        toDisplayLetter(ch, idx, ans.length)
                      ).join('')}
                    </span>
                    {solvedBoards[i] ? ' ✓' : ' ✗'}
                  </div>
                ))}
              </div>
            </div>

            <button
              className="btn-past-games"
              onClick={() => setShowCalendar(true)}
            >
              📅 למשחקים קודמים
            </button>

            <button
              className="btn-past-games"
              style={{ marginTop: 6, background: '#2a2a2b' }}
              onClick={() => navigate('/')}
            >
              🏠 לעמוד הבית
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
