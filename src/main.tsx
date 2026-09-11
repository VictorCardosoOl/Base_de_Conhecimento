import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import './assets/styles/global.css';
import App from './App';
import { initTelemetry } from './lib/telemetry';

// Inicializa telemetria, Real User Monitoring (RUM) e rastreamento de exceções
initTelemetry();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
