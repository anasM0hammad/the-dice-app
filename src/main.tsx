import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeAdMob } from './utils/admob';
import './index.css';

// Initialize AdMob (no banner — uses interstitial + rewarded only)
initializeAdMob();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
