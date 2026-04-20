import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import './index.css';
import { Router, useRouter } from './router.jsx';
import App from './App.jsx';
import HomePage from './HomePage.jsx';
import { MODES } from './gameLogic.js';

function Root() {
  const { path } = useRouter();

  // /8  → מצב קל
  // /16 → מצב רגיל
  // /32 → מצב קשה
  const modeKey = path.replace(/^\//, ''); // הסר / מההתחלה
  const mode = MODES[modeKey];

  if (mode) return <App mode={mode} />;
  return <HomePage />;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Router>
      <Root />
    </Router>
    <Analytics />
  </StrictMode>,
);
