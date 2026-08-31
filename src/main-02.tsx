import React from 'react';
import ReactDOM from 'react-dom/client';
import { ZenithApp } from './ZenithApp';
import './index.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ZenithApp />
    </React.StrictMode>
  );
}
