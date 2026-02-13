import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeAdMob, showBannerAd } from './utils/admob';
import './index.css';

// Initialize AdMob and show banner ad on native platforms
initializeAdMob().then(() => showBannerAd());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

