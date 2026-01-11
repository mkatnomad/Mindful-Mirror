import React, { useState, useEffect, useRef } from 'react';

// --- 0. ПРЕДОХРАНИТЕЛЬ (ЧТОБЫ ВИДЕТЬ ОШИБКУ, А НЕ БЕЛЫЙ ЭКРАН) ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: string }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: '' }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error: error.toString() }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 h-screen flex flex-col justify-center text-center">
          <h2 className="text-red-600 font-bold mb-2">Ошибка запуска</h2>
          <p className="text-xs font-mono bg-white p-2 rounded border border-red-200">{this.state.error}</p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="mt-4 bg-red-600 text-white py-2 px-4 rounded-xl">Сброс</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- 1. ВСТРОЕННЫЕ ИКОНКИ (БЕЗ БИБЛИОТЕК) ---
// Это гарантирует, что приложение не упадет из-за отсутствия пакета
const Icon = ({ path, className = "w-6 h-6", color = "currentColor" }: { path: string, className?: string, color?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const ICONS = {
  Home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  History: "M12 20h9 M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z", // Pen tool look for history
  Profile: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  Zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  Heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  Book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
  Battery: "M23 13v-2 M1 6h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
  Compass: "M21 21l-6-9-9-6 6 9 9 6z",
  ArrowLeft: "M19 12H5 M12 19l-7-7 7-7",
  Send: "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
  Star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
  Settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.18-.08a2 2 0 0 0-2 2v.44a2 2 0 0 0 2 2h.18a2 2 0 0 1 1.73 1l.25.43a2 2 0 0 1 0 2l-.08.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.18.08a2 2 0 0 0 2-2v-.44a2 2 0 0 0-2-2h-.18a2 2 0 0 1-1.73-1l-.25-.43a2 2 0 0 1 0-2l.08-.18a2 2 0 0 0-2-2z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
};

// --- 2. ВЕКТОРНЫЕ ДЕРЕВЬЯ (ИСПРАВЛЕННЫЕ - БЕЗ СЛУЧАЙНЫХ ID) ---
const TreeIllustration: React.FC<{ stage: number, className?: string }> = ({ stage, className }) => {
  const c = className || "w-full h-full";
  // Статичный ID, зависящий только от стадии. Это предотвращает ошибку рендера.
  const gid = `grad-tree-${stage}`;

  if (stage <= 1) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#FEF3C7" /><path d="M50 75C50 75 40 75 40 75" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="70" r="6" fill="#B45309" /></svg>;
  if (stage === 2) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#ECFDF5" /><path d="M50 80V60" stroke="#059669" strokeWidth="3" strokeLinecap="round"/><path d="M50 60C50 60 35 55 35 45C35 55 50 60 50 60Z" fill="#10B981" /><path d="M50 60C50 60 65 55 65 45C65 55 50 60 50 60Z" fill="#34D399" /></svg>;
  if (stage === 3) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#D1FAE5" /><path d="M50 85V50" stroke="#059669" strokeWidth="3" strokeLinecap="round"/><path d="M50 65L65 55" stroke="#059669" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="45" r="10" fill="#10B981" /><circle cx="65" cy="55" r="6" fill="#34D399" /></svg>;
  if (stage === 4) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#A7F3D0" /><path d="M50 85V45" stroke="#92400E" strokeWidth="4" strokeLinecap="round"/><path d="M50 65L30 55" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="40" r="15" fill="#10B981" /><circle cx="30" cy="55" r="8" fill="#34D399" /><circle cx="65" cy="50" r="8" fill="#34D399" /></svg>;
  if (stage === 5) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#6EE7B7" /><path d="M50 90V40" stroke="#92400E" strokeWidth="5" strokeLinecap="round"/><path d="M50 60L25 50" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/><path d="M50 50L75 40" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="35" r="20" fill="#059669" /><circle cx="25" cy="50" r="12" fill="#10B981" /><circle cx="75" cy="40" r="12" fill="#10B981" /></svg>;
  if (stage === 6) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#34D399" /><path d="M50 90L50 35" stroke="#78350F" strokeWidth="6" strokeLinecap="round"/><path d="M50 70L20 60" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/><path d="M50 60L80 50" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="30" r="25" fill="#047857" /><circle cx="20" cy="60" r="15" fill="#059669" /><circle cx="80" cy="50" r="15" fill="#059669" /></svg>;
  if (stage === 7) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#10B981" /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="7" strokeLinecap="round"/><path d="M50 70L20 55" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/><path d="M50 60L85 45" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/><circle cx="50" cy="35" r="30" fill="#064E3B" /><circle cx="20" cy="55" r="18" fill="#065F46" /><circle cx="85" cy="45" r="18" fill="#065F46" /><circle cx="35" cy="80" r="5" fill="#064E3B" opacity="0.5"/></svg>;
  // 8+: Древо
  return (<svg viewBox="0 0 100 100" className={c} fill="none"><defs><radialGradient id={gid} cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" style={{stopColor:'rgb(255,255,255)', stopOpacity:0.8}} /><stop offset="100%" style={{stopColor:'rgb(16, 185, 129)', stopOpacity:0}} /></radialGradient></defs><circle cx="50" cy="50" r="48" fill={`url(#${gid})`} /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="10" strokeLinecap="round"/><circle cx="50" cy="40" r="40" fill="#064E3B" /><circle cx="20" cy="65" r="25" fill="#065F46" /><circle cx="80" cy="65" r="25" fill="#065F46" /><circle cx="50" cy="25" r="15" fill="#10B981" /><path d="M20 20L25 25" stroke="#FCD34D" strokeWidth="2" /><path d="M80 20L75 25" stroke="#FCD34D" strokeWidth="2" /></svg>);
};

// --- 3. ДАННЫЕ (Вопросы и Архетипы) ---
const ARCHETYPE_INFO: any = {
  "Творец": { desc: "Для вас жизнь — это чистый холст, требующий выражения. Вы не переносите серость, рутину и застой.", strength: "Воображение и создание нового", shadow: "Перфекционизм", advice: "Не ждите вдохновения — создавайте.", color: "text-purple-600", bg: "bg-purple-50" },
  "Правитель": { desc: "Вы — архитектор реальности. Хаос вызывает у вас желание навести порядок.", strength: "Лидерство и структура", shadow: "Гиперконтроль", advice: "Делегируйте и доверяйте.", color: "text-indigo-600", bg: "bg-indigo-50" },
  "Мудрец": { desc: "Ваш инструмент — разум. Вы ищете истину и понимание законов мира.", strength: "Интеллект и анализ", shadow: "Бездействие", advice: "Знание требует практики.", color: "text-blue-600", bg: "bg-blue-50" },
  "Хранитель": { desc: "Ваша сила — сердце. Вы чувствуете людей и стремитесь помочь.", strength: "Эмпатия и забота", shadow: "Самопожертвование", advice: "Сначала маску на себя.", color: "text-emerald-600", bg: "bg-emerald-50" },
  "Искатель": { desc: "Рутина вас душит. Вы стремитесь к новым горизонтам и свободе.", strength: "Свобода и смелость", shadow: "Непостоянство", advice: "Иногда нужно остановиться.", color: "text-amber-600", bg: "bg-amber-50" }
};

// --- 4. КОМПОНЕНТЫ ---
const InternalChat: React.FC<{ mode: string, onBack: () => void, onComplete: (msg: any) => void }> = ({ mode, onBack, onComplete }) => {
  const [messages, setMessages] = useState<any[]>([{ id: '1', role: 'assistant', content: 'Привет! Я слушаю.', timestamp: Date.now() }]);
  const [input, setInput] = useState('');
  
  const send = async () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [userMsg, ...prev]);
    setInput('');
    // Имитация ответа (в реальном приложении тут запрос к Gemini)
    setTimeout(() => {
      setMessages(prev => [{ id: Date.now().toString(), role: 'assistant', content: "Я понимаю. Расскажи подробнее.", timestamp: Date.now() }, ...prev]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-white z-50 fixed inset-0">
      <div className="p-4 border-b flex justify-between items-center bg-white">
        <button onClick={onBack}><Icon path={ICONS.ArrowLeft} /></button>
        <span className="font-bold text-slate-800">{mode}</span>
        <button onClick={() => { onComplete(messages); onBack(); }} className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">Готово</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse space-y-reverse space-y-4 bg-slate-50">
        {messages.map(m => (<div key={m.id} className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'self-end bg-indigo-600 text-white' : 'self-start bg-white text-slate-800 shadow-sm'}`}>{m.content}</div>))}
      </div>
      <div className="p-4 border-t bg-white flex space-x-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Сообщение..." className="flex-1 bg-slate-100 rounded-full px-4 py-3 outline-none text-sm" />
        <button onClick={send} className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Icon path={ICONS.Send} /></button>
      </div>
    </div>
  );
};

// --- APP ---
const App: React.FC = () => {
  // АВТО-СБРОС ПРИ СТАРТЕ ЭТОЙ ВЕРСИИ
  useEffect(() => {
    if (!localStorage.getItem('mm_final_v10_reset')) {
      localStorage.clear();
      localStorage.setItem('mm_final_v10_reset', 'true');
      window.location.reload();
    }
  }, []);

  const [user, setUser] = useState<any>(() => {
    try { const s = localStorage.getItem('mm_user'); return s ? JSON.parse(s) : { onboardingCompleted: false, name: 'Странник' }; } catch { return { onboardingCompleted: false }; }
  });
  const [view, setView] = useState('HOME');
  const [insight, setInsight] = useState<any>(null);
  const [mode, setMode] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => { localStorage.setItem('mm_user', JSON.stringify(user)); }, [user]);

  // ОПРОСНИК
  const Onboarding = () => {
    const [step, setStep] = useState(0);
    const [scores, setScores] = useState<any>({ CREATOR: 0, RULER: 0, SAGE: 0, CAREGIVER: 0, EXPLORER: 0 });
    const steps = [
      { t: "Что дает энергию?", o: [{l:"Создание", t:"CREATOR"}, {l:"Успех", t:"RULER"}, {l:"Истина", t:"SAGE"}, {l:"Забота", t:"CAREGIVER"}] },
      { t: "Чего избегаете?", o: [{l:"Скуки", t:"CREATOR"}, {l:"Хаоса", t:"RULER"}, {l:"Незнания", t:"SAGE"}, {l:"Застоя", t:"EXPLORER"}] },
      { t: "В кризис вы...", o: [{l:"Креативите", t:"CREATOR"}, {l:"Руководите", t:"RULER"}, {l:"Думаете", t:"SAGE"}, {l:"Помогаете", t:"CAREGIVER"}] },
      { t: "Драйвер жизни?", o: [{l:"Выражение", t:"CREATOR"}, {l:"Статус", t:"RULER"}, {l:"Свобода", t:"EXPLORER"}, {l:"Польза", t:"CAREGIVER"}] },
      { t: "Ценность в людях?", o: [{l:"Талант", t:"CREATOR"}, {l:"Верность", t:"CAREGIVER"}, {l:"Ум", t:"SAGE"}, {l:"Легкость", t:"EXPLORER"}] },
      { t: "Решения?", o: [{l:"Интуиция", t:"CREATOR"}, {l:"Логика", t:"SAGE"}, {l:"Выгода", t:"RULER"}, {l:"Сердце", t:"CAREGIVER"}] },
      { t: "Лидерство?", o: [{l:"Вдохновитель", t:"CREATOR"}, {l:"Стратег", t:"RULER"}, {l:"Наставник", t:"SAGE"}, {l:"Защитник", t:"CAREGIVER"}] },
      { t: "Перемены?", o: [{l:"Приключение", t:"EXPLORER"}, {l:"Анализ", t:"SAGE"}, {l:"План", t:"RULER"}, {l:"Осторожность", t:"CAREGIVER"}] },
      { t: "Подарок?", o: [{l:"С душой", t:"CAREGIVER"}, {l:"Билет", t:"EXPLORER"}, {l:"Книга", t:"SAGE"}, {l:"Статус", t:"RULER"}] },
      { t: "Утро?", o: [{l:"План", t:"RULER"}, {l:"Мечты", t:"CREATOR"}, {l:"В путь", t:"EXPLORER"}, {l:"Семья", t:"CAREGIVER"}] },
      { t: "Наследие?", o: [{l:"Искусство", t:"CREATOR"}, {l:"Империя", t:"RULER"}, {l:"Открытие", t:"SAGE"}, {l:"Память", t:"CAREGIVER"}] },
      { t: "Фокус?", o: [{l:"Доходы"}, {l:"Спокойствие"}, {l:"Дисциплина"}, {l:"Семья"}] },
      { t: "Помеха?", o: [{l:"Лень"}, {l:"Страх"}, {l:"Усталость"}, {l:"Хаос"}] },
      { t: "Биоритмы?", o: [{l:"Жаворонок"}, {l:"Сова"}, {l:"Плавающий"}] },
    ];
    
    const handle = (opt: any) => {
      if (opt.t) setScores((s:any) => ({...s, [opt.t]: s[opt.t]+1}));
      if (step < steps.length - 1) setStep(s => s + 1);
      else {
        let max = -1, arch = "Искатель";
        Object.entries(scores).forEach(([k, v]: any) => { if (v > max) { max = v; arch = {CREATOR:"Творец", RULER:"Правитель", SAGE:"Мудрец", CAREGIVER:"Хранитель", EXPLORER:"Искатель"}[k] || "Искатель"; }});
        setUser((u:any) => ({...u, archetype: arch, onboardingCompleted: true}));
        setView('RESULT');
      }
    };

    return (
      <div className="p-6 pt-10 h-full bg-white">
        <button onClick={() => setView('HOME')} className="mb-6 text-slate-400"><Icon path={ICONS.ArrowLeft}/></button>
        <h2 className="text-2xl font-bold mb-6">{steps[step].t}</h2>
        <div className="space-y-3">{steps[step].o.map((o:any, i:number) => (
          <button key={i} onClick={() => handle(o)} className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 text-left font-semibold hover:bg-indigo-50">{o.l}</button>
        ))}</div>
      </div>
    );
  };

  // ЭКРАНЫ
  if (view === 'ONBOARDING') return <Onboarding />;
  
  if (view === 'RESULT') {
    const info = ARCHETYPE_INFO[user.archetype] || ARCHETYPE_INFO["Искатель"];
    return (
      <div className="p-6 pt-12 h-full bg-white text-center flex flex-col items-center">
         <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl ${info.bg} ${info.color}`}><Icon path={ICONS.Star} className="w-16 h-16"/></div>
         <h1 className="text-3xl font-black text-slate-800 mb-2">{user.archetype}</h1>
         <p className="text-slate-600 mb-8">{info.desc}</p>
         <div className="w-full text-left space-y-4 mb-8">
            <div className="p-4 bg-slate-50 rounded-xl"><span className="text-xs font-bold text-slate-400 uppercase">Сила</span><p>{info.strength}</p></div>
            <div className="p-4 bg-indigo-50 rounded-xl"><span className="text-xs font-bold text-indigo-400 uppercase">Совет</span><p>{info.advice}</p></div>
         </div>
         <button onClick={() => setView('HOME')} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold">Начать путь</button>
      </div>
    );
  }

  if (view === 'CHAT') return <InternalChat mode={mode} onBack={() => setView('HOME')} onComplete={(msgs) => { setHistory(prev => [...prev, {id: Date.now(), mode, date: Date.now(), preview: 'Запись...', messages: msgs}]); }} />;

  // HOME SCREEN
  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col font-sans bg-[#F8FAFC]">
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32">
          <div className="flex justify-between items-center mb-6">
            <div><h1 className="text-xl font-bold text-slate-800">Привет, {user.name}</h1><p className="text-xs text-slate-500">{user.archetype || 'Странник'}</p></div>
            <div className="w-8 h-8 opacity-20"><Logo /></div>
          </div>

          {!user.onboardingCompleted ? (
            <button onClick={() => setView('ONBOARDING')} className="w-full bg-slate-900 rounded-[32px] p-6 text-white text-left shadow-lg mb-8">
              <Icon path={ICONS.Compass} className="w-8 h-8 mb-4 text-white"/>
              <h2 className="text-xl font-bold mb-2">Найти свой путь</h2>
              <p className="text-sm opacity-80 mb-4">Пройти тест архетипа</p>
              <span className="bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold">Начать</span>
            </button>
          ) : (
            <div className="w-full bg-white border border-slate-100 rounded-[32px] p-6 shadow-lg shadow-indigo-100/50 mb-8">
              <div className="flex justify-between mb-4"><span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">ФОКУС ДНЯ</span></div>
              <h2 className="text-lg font-bold text-slate-800 mb-4">{insight?.mindset || "Нажми, чтобы получить совет..."}</h2>
              <button onClick={() => setInsight({mindset: "Фокусируйся на главном. Сделай один шаг.", action: "Действуй.", health: "Дыши.", insight: "Ты можешь."})} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm">Получить карту</button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 mb-8">
            <button onClick={() => { setMode('РЕШЕНИЕ'); setView('CHAT'); }} className="p-4 bg-white border border-slate-50 rounded-2xl flex flex-col items-center shadow-sm"><Icon path={ICONS.Zap} className="text-indigo-500 mb-2"/><span className="text-[10px] font-bold text-slate-600">РЕШЕНИЕ</span></button>
            <button onClick={() => { setMode('ЭМОЦИИ'); setView('CHAT'); }} className="p-4 bg-white border border-slate-50 rounded-2xl flex flex-col items-center shadow-sm"><Icon path={ICONS.Heart} className="text-rose-500 mb-2"/><span className="text-[10px] font-bold text-slate-600">ЭМОЦИИ</span></button>
            <button onClick={() => { setMode('ДНЕВНИК'); setView('CHAT'); }} className="p-4 bg-white border border-slate-50 rounded-2xl flex flex-col items-center shadow-sm"><Icon path={ICONS.Book} className="text-emerald-500 mb-2"/><span className="text-[10px] font-bold text-slate-600">ДНЕВНИК</span></button>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
             <div className="flex items-center space-x-4"><div className="w-12 h-12"><TreeIllustration stage={history.length > 8 ? 8 : history.length} /></div><div><p className="text-[10px] uppercase text-slate-400 font-bold">Древо</p><h4 className="font-bold text-slate-800">Уровень {history.length}</h4></div></div>
          </div>

          {view === 'HISTORY' && (
            <div className="mt-8">
              <h2 className="font-bold mb-4">История</h2>
              {history.map((h, i) => <div key={i} className="bg-white p-4 rounded-xl mb-2 text-sm">{new Date(h.date).toLocaleDateString()} - {h.mode}</div>)}
            </div>
          )}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-between items-center">
          <button onClick={() => setView('HOME')} className={view === 'HOME' ? 'text-indigo-600' : 'text-slate-400'}><div className="flex flex-col items-center"><Icon path={ICONS.Zap}/><span className="text-[10px] font-bold mt-1">ПУТЬ</span></div></button>
          <button onClick={() => setView('HISTORY')} className={view === 'HISTORY' ? 'text-indigo-600' : 'text-slate-400'}><div className="flex flex-col items-center"><Icon path={ICONS.Book}/><span className="text-[10px] font-bold mt-1">ИСТОРИЯ</span></div></button>
          <button onClick={() => setView('PROFILE')} className={view === 'PROFILE' ? 'text-indigo-600' : 'text-slate-400'}><div className="flex flex-col items-center"><Icon path={ICONS.Profile}/><span className="text-[10px] font-bold mt-1">ПРОФИЛЬ</span></div></button>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default App;
