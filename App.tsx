import React, { useState, useEffect } from 'react';

// --- 1. ВСТРОЕННАЯ ГРАФИКА (SVG) ---
// Мы не импортируем иконки, мы рисуем их кодом. Это 100% надежно.
const ICONS = {
  Zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  Heart: "M20.8 4.6a5.5 5.5 0 00-7.7 0l-1.1 1-1-1a5.5 5.5 0 00-7.8 7.8l1 1 7.8 7.8 7.8-7.7 1-1.1a5.5 5.5 0 000-7.8z",
  Book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
  User: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  Compass: "M21 21l-6-9-9-6 6 9 9 6z",
  ArrowLeft: "M19 12H5 M12 19l-7-7 7-7",
  Settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.18-.08a2 2 0 0 0-2 2v.44a2 2 0 0 0 2 2h.18a2 2 0 0 1 1.73 1l.25.43a2 2 0 0 1 0 2l-.08.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.18.08a2 2 0 0 0 2-2v-.44a2 2 0 0 0-2-2h-.18a2 2 0 0 1-1.73-1l-.25-.43a2 2 0 0 1 0-2l.08-.18a2 2 0 0 0-2-2z",
  Send: "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
  Battery: "M23 13v-2 M1 6h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z"
};

const Icon = ({ path, className }: { path: string, className?: string }) => (
  <svg className={className || "w-6 h-6"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
);

// --- 2. КОМПОНЕНТ ДЕРЕВА ---
const Tree = ({ stage }: { stage: number }) => {
  // Простая логика, без рандома, без градиентов, чтобы не крашилось
  const color = stage > 5 ? "#059669" : "#10B981";
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" fill="none">
      <circle cx="50" cy="50" r="48" fill="#ECFDF5" />
      <path d="M50 90V50" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
      {stage > 0 && <path d="M50 70L30 50" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />}
      {stage > 2 && <path d="M50 60L70 40" stroke="#78350F" strokeWidth="3" strokeLinecap="round" />}
      {stage > 0 && <circle cx="50" cy="40" r={10 + stage * 3} fill={color} />}
    </svg>
  );
};

// --- 3. ЗАГЛУШКА ИИ (ЧТОБЫ НЕ ЗАВИСЕТЬ ОТ ФАЙЛОВ) ---
const mockGeminiService = async (text: string) => {
  await new Promise(r => setTimeout(r, 1000));
  return "Это тестовый ответ ИИ.|||Действуй смело.|||Дыши глубже.|||Ты молодец.";
};

// --- 4. ГЛАВНОЕ ПРИЛОЖЕНИЕ ---
const App: React.FC = () => {
  // Состояния
  const [error, setError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [view, setView] = useState('HOME');
  const [user, setUser] = useState<any>({ name: 'Странник', archetype: 'Искатель', onboardingCompleted: false });
  const [history, setHistory] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [chatLog, setChatLog] = useState<any[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  // БЕЗОПАСНАЯ ЗАГРУЗКА
  useEffect(() => {
    try {
      // Глобальный перехватчик ошибок
      window.onerror = function (msg, url, lineNo, columnNo, error) {
        setError(`System Error: ${msg} line: ${lineNo}`);
        return false;
      };

      const savedUser = localStorage.getItem('mm_user_safe_v1');
      if (savedUser) setUser(JSON.parse(savedUser));
      
      const savedHistory = localStorage.getItem('mm_history_safe_v1');
      if (savedHistory) setHistory(JSON.parse(savedHistory));

      setIsLoaded(true); // Только теперь показываем интерфейс
    } catch (e: any) {
      setError("Ошибка загрузки данных: " + e.message);
    }
  }, []);

  // Сохранение
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('mm_user_safe_v1', JSON.stringify(user));
      localStorage.setItem('mm_history_safe_v1', JSON.stringify(history));
    }
  }, [user, history, isLoaded]);

  // Функции
  const startChat = (mode: string) => {
    setChatLog([{ role: 'assistant', content: `Режим: ${mode}. Я слушаю.` }]);
    setView('CHAT');
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newLog = [...chatLog, { role: 'user', content: input }];
    setChatLog(newLog);
    setInput('');
    setIsThinking(true);
    
    try {
      const reply = await mockGeminiService(input);
      const cleanReply = reply.split('|||')[0]; // Берем первую часть
      setChatLog([...newLog, { role: 'assistant', content: cleanReply }]);
      setHistory(prev => [{ date: Date.now(), text: input.substring(0, 20) + '...' }, ...prev]);
    } catch (e) {
      setChatLog([...newLog, { role: 'assistant', content: "Ошибка сети." }]);
    } finally {
      setIsThinking(false);
    }
  };

  const finishOnboarding = (archetype: string) => {
    setUser({ ...user, archetype, onboardingCompleted: true });
    setView('HOME');
  };

  // --- РЕНДЕР (ЕСЛИ ЕСТЬ ОШИБКА - ПОКАЖЕТ ЕЕ) ---
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-red-50 p-6 text-center text-red-800">
        <h1 className="text-2xl font-bold mb-4">Ой! Что-то сломалось.</h1>
        <pre className="bg-white p-4 rounded border border-red-200 text-xs text-left mb-4 overflow-auto max-w-full">{error}</pre>
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold">Полный сброс</button>
      </div>
    );
  }

  if (!isLoaded) {
    return <div className="h-screen flex items-center justify-center bg-slate-50 text-slate-400">Загрузка...</div>;
  }

  // --- ЭКРАН ЧАТА ---
  if (view === 'CHAT') {
    return (
      <div className="flex flex-col h-screen bg-white">
        <div className="p-4 border-b flex items-center justify-between">
          <button onClick={() => setView('HOME')} className="p-2"><Icon path={ICONS.ArrowLeft} /></button>
          <span className="font-bold">Чат</span>
          <div className="w-8"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {chatLog.map((m, i) => (
            <div key={i} className={`p-4 rounded-2xl max-w-[85%] text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white self-end ml-auto' : 'bg-white text-slate-800 shadow-sm'}`}>
              {m.content}
            </div>
          ))}
          {isThinking && <div className="text-slate-400 text-xs p-2">Печатает...</div>}
        </div>
        <div className="p-4 bg-white border-t flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} className="flex-1 bg-slate-100 rounded-full px-4 outline-none" placeholder="Сообщение..." />
          <button onClick={sendMessage} className="w-12 h-12 bg-indigo-600 rounded-full text-white flex items-center justify-center"><Icon path={ICONS.Send} /></button>
        </div>
      </div>
    );
  }

  // --- ЭКРАН ОПРОСА ---
  if (view === 'ONBOARDING') {
    return (
      <div className="h-screen bg-white p-6 pt-12">
        <h1 className="text-2xl font-bold mb-8">Кто вы?</h1>
        <div className="space-y-3">
          {[
            { label: "Я создаю новое (Творец)", val: "Творец" },
            { label: "Я управляю процессами (Правитель)", val: "Правитель" },
            { label: "Я ищу знания (Мудрец)", val: "Мудрец" },
            { label: "Я забочусь о людях (Хранитель)", val: "Хранитель" },
            { label: "Я ищу свободу (Искатель)", val: "Искатель" },
          ].map(opt => (
            <button key={opt.val} onClick={() => finishOnboarding(opt.val)} className="w-full p-5 rounded-2xl border border-slate-100 bg-slate-50 text-left font-bold text-slate-700 hover:bg-indigo-50">
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={() => setView('HOME')} className="mt-8 text-slate-400 text-sm">Назад</button>
      </div>
    );
  }

  // --- ГЛАВНЫЙ ЭКРАН ---
  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC]">
      <div className="flex-1 overflow-y-auto px-6 pt-8 pb-24">
        {/* Хедер */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Привет, {user.name}</h1>
            <p className="text-indigo-600 font-medium text-sm">{user.archetype}</p>
          </div>
          <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-400"><Icon path={ICONS.User} /></div>
        </div>

        {/* Баннер */}
        {!user.onboardingCompleted ? (
          <button onClick={() => setView('ONBOARDING')} className="w-full bg-slate-900 text-white p-6 rounded-[32px] text-left shadow-lg mb-8">
            <Icon path={ICONS.Compass} className="w-8 h-8 mb-4 opacity-80" />
            <h2 className="text-xl font-bold mb-1">Найти свой путь</h2>
            <p className="text-slate-400 text-sm">Пройти тест архетипа</p>
          </button>
        ) : (
          <div className="w-full bg-white border border-slate-100 p-6 rounded-[32px] text-left shadow-lg shadow-indigo-100/50 mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded text-[10px] font-bold">КАРТА ДНЯ</span>
              <div className="flex items-center space-x-1 text-slate-400"><Icon path={ICONS.Battery} className="w-4 h-4"/><span className="text-xs font-bold">Норм</span></div>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Фокусируйся на главном.</h3>
            <button className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm">Подробнее</button>
          </div>
        )}

        {/* Кнопки */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <button onClick={() => startChat('Решение')} className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-col items-center shadow-sm active:scale-95 transition-transform">
            <Icon path={ICONS.Zap} className="text-indigo-500 w-6 h-6 mb-2" />
            <span className="text-[10px] font-bold text-slate-600">РЕШЕНИЕ</span>
          </button>
          <button onClick={() => startChat('Эмоции')} className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-col items-center shadow-sm active:scale-95 transition-transform">
            <Icon path={ICONS.Heart} className="text-rose-500 w-6 h-6 mb-2" />
            <span className="text-[10px] font-bold text-slate-600">ЭМОЦИИ</span>
          </button>
          <button onClick={() => startChat('Дневник')} className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-col items-center shadow-sm active:scale-95 transition-transform">
            <Icon path={ICONS.Book} className="text-emerald-500 w-6 h-6 mb-2" />
            <span className="text-[10px] font-bold text-slate-600">ДНЕВНИК</span>
          </button>
        </div>

        {/* Дерево */}
        <div className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16"><Tree stage={history.length} /></div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Древо</p>
              <h4 className="text-lg font-bold text-slate-800">Уровень {history.length}</h4>
            </div>
          </div>
        </div>

        {/* История */}
        {history.length > 0 && (
          <div className="mt-8">
            <h3 className="font-bold text-slate-800 mb-4">История</h3>
            {history.map((h, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-slate-50 mb-2 text-sm text-slate-600">
                {new Date(h.date).toLocaleDateString()} — {h.text}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Меню */}
      <div className="fixed bottom-0 w-full bg-white border-t border-slate-100 p-4 flex justify-around text-slate-400">
        <button onClick={() => setView('HOME')} className={view === 'HOME' ? 'text-indigo-600' : ''}><Icon path={ICONS.Zap}/></button>
        <button onClick={() => setView('HISTORY')} className={view === 'HISTORY' ? 'text-indigo-600' : ''}><Icon path={ICONS.Book}/></button>
        <button onClick={() => setView('PROFILE')} className={view === 'PROFILE' ? 'text-indigo-600' : ''}><Icon path={ICONS.User}/></button>
      </div>
    </div>
  );
};

export default App;
