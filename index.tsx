
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// --- Изолированная аналитика трафика ---
const trackTrafficSource = async () => {
  try {
    const tg = (window as any).Telegram?.WebApp;
    if (!tg) return;

    const startParam = tg.initDataUnsafe?.start_param || 'organic';
    const userId = tg.initDataUnsafe?.user?.id;
    
    // Предотвращаем дублирование отчетов в рамках одной сессии браузера
    const lastReported = localStorage.getItem('mm_last_reported_source');
    
    if (lastReported !== startParam) {
      // Отправляем тихий запрос на сервер аналитики
      fetch('/api/report-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'app_start', 
          value: { source: startParam },
          userId: userId 
        })
      }).catch(e => console.warn("Analytics fetch failed", e));
      
      localStorage.setItem('mm_last_reported_source', startParam);
    }
  } catch (err) {
    console.warn("Traffic tracking error:", err);
  }
};

// Запускаем отслеживание асинхронно, не блокируя рендер
trackTrafficSource();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
