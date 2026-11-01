import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerLeadEvents } from './modules/crm/services/leadEvents';

// CRM empieza a escuchar los contactos nuevos que avisa Captación
registerLeadEvents();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
