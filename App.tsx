import React, { useState, useEffect } from 'react';
// Импортируем ТОЛЬКО React и иконки. Никаких сложных типов из ./types пока не трогаем, чтобы исключить ошибку в них.
import { Zap, Heart, BookOpen, Trash2, RefreshCw } from 'lucide-react';

// Временная заглушка типов прямо здесь, чтобы не зависеть от внешнего файла
type ViewState = 'HOME' | 'CHAT' | 'DEBUG';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [error, setError] = useState<string>('');

  // Функция полного сброса
  const hardReset = () => {
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      alert('Ошибка очистки');
    }
  };

  // Простейший рендер
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 p-6 text-center">
        <h1 className="text-red-600 font-bold text-xl mb-4">Критическая ошибка</h1>
        <p className="text-sm mb-6">{error}</p>
        <button onClick={hardReset} className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold">
          СБРОСИТЬ ВСЁ
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans text-slate-900">
      {/* HEADER */}
      <div className="p-6 bg-white shadow-sm z-10">
        <h1 className="text-2xl font-extrabold text-indigo-600">Mindful Mirror</h1>
        <p className="text-xs text-slate-400 font-bold tracking-widest uppercase mt-1">Recovery Mode v1.0</p>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {view === 'HOME' && (
          <div className="space-y-6">
            <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-lg shadow-indigo-200">
              <h2 className="text-lg font-bold mb-2">Приложение запущено</h2>
              <p className="opacity-90 text-sm">Если вы видите это — значит, React работает исправно. Проблема была в старых данных.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center shadow-sm">
                <Zap className="text-indigo-500 mb-2" size={24} />
                <span className="text-[10px] font-bold text-slate-500">РЕШЕНИЕ</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center shadow-sm">
                <Heart className="text-rose-500 mb-2" size={24} />
                <span className="text-[10px] font-bold text-slate-500">ЭМОЦИИ</span>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col items-center justify-center shadow-sm">
                <BookOpen className="text-emerald-500 mb-2" size={24} />
                <span className="text-[10px] font-bold text-slate-500">ДНЕВНИК</span>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-100 rounded-2xl text-yellow-800 text-sm">
              <p className="font-bold mb-2">Диагностика:</p>
              <p>LocalStorage: {typeof window !== 'undefined' ? 'Доступен' : 'Ошибка'}</p>
              <p>Telegram WebApp: {window.Telegram ? 'Подключен' : 'Нет'}</p>
            </div>

            <button 
              onClick={hardReset}
              className="w-full py-4 bg-slate-200 text-slate-600 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Trash2 size={18} />
              <span>Очистить кэш и перезагрузить</span>
            </button>
          </div>
        )}

      </div>

      {/* BOTTOM NAV */}
      <div className="bg-white border-t border-slate-100 p-4 flex justify-around pb-8">
        <button className="text-indigo-600 flex flex-col items-center" onClick={() => setView('HOME')}>
          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mb-1"><Zap size={14} /></div>
          <span className="text-[10px] font-bold">Главная</span>
        </button>
        <button className="text-slate-400 flex flex-col items-center" onClick={hardReset}>
          <RefreshCw size={20} className="mb-1" />
          <span className="text-[10px] font-bold">Сброс</span>
        </button>
      </div>
    </div>
  );
};

export default App;
