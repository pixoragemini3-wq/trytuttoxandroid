
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
console.log('TuttoXAndroid App Version: 1.0.10 - SEO and Bugfix Stable');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Hide crawlable HTML shell only after React mounts (theme CSS: html.txa-spa-ready)
document.documentElement.classList.add('txa-spa-ready');

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
