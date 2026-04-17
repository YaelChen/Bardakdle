import React from 'react';
import { useRouter } from './router.jsx';
import { MODES } from './gameLogic.js';
import './HomePage.css';

export default function HomePage() {
  const { navigate } = useRouter();

  return (
    <div className="home-page" dir="rtl">
      <div className="home-inner">
        <h1 className="home-title">ברדקדל</h1>
        <p className="home-tagline">ניחוש 16 מילים עבריות במקביל — כמו Wordle, רק הרבה יותר</p>

        <h2 className="home-choose">בחר רמת קושי</h2>

        <div className="home-modes">
          {Object.values(MODES).map(({ numBoards, maxGuesses, label, emoji, path }) => (
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
      </div>
    </div>
  );
}
