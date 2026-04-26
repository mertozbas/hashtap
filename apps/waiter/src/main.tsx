import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '@hashtap/ui';
import '@hashtap/ui/styles.css';
import { App } from './App.js';
import { startQueueAutoFlush } from './store/queue.js';

const root = document.getElementById('root');
if (!root) throw new Error('root element not found');

// Offline queue otomatik flush — online dönünce bekleyen siparişleri yollar
startQueueAutoFlush();

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
