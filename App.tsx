import React, { useState, useEffect, useRef } from 'react';

// --- 0. ВСТРОЕННЫЕ ЗАМЕНИТЕЛИ ИКОНОК (SVG ВНУТРИ) ---
// Чтобы не зависеть от библиотеки lucide-react, которая крашит приложение
const Icon = ({ p, c = "currentColor" }: { p: string, c?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={p} />
  </svg>
);

const ICONS = {
  Home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  User: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
  Book: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z",
  Heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
  Zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  Settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.18-.08a2 2 0 0 0-2 2v.44a2 2 0 0 0 2 2h.18a2 2 0 0 1 1.73 1l.25.43a2 2 0 0 1 0 2l-.08.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.18.08a2 2 0 0 0 2-2v-.44a2 2 0 0 0-2-2h-.18a2 2 0 0 1-1.73-1l-.25-.43a2 2 0 0 1 0-2l.08-.18a2 2 0 0 0-2-2z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  ArrowLeft: "M19 12H5 M12 19l-7-7 7-7",
  Send: "M22 2L11 13 M22 2l-7 20-4-9-9-4 20-7z",
  Compass: "M21 21l-6-9-9-6 6 9 9 6z",
  Battery: "M23 13v-2 M1 6h18a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z",
  Tree: "M12 22v-8 M12 14c-4 0-7-4-7-8s3-8 7-8 7 4 7 8-3 8-7 8z M12 22c-2 0-3-2-3-4s1-4 3-4 3 2 3 4-1 4-3 4z"
};

// --- 1. ВСТРОЕННЫЕ ТИПЫ ---
type ViewState = 'HOME' | 'ONBOARDING' | 'CHAT' | 'HISTORY' | 'PROFILE' | 'SETTINGS' | 'DAILY_GUIDE' | 'ARCHETYPE_RESULT' | 'TUTORIAL';
type JournalMode = 'DECISION' | 'EMOTIONS' | 'REFLECTION';

// --- 2. ВЕКТОРНЫЕ ДЕРЕВЬЯ (ВАШ ЛЮБИМЫЙ ДИЗАЙН) ---
const TreeIllustration: React.FC<{ stage: number, className?: string }> = ({ stage, className }) => {
  const c = className || "w-full h-full";
  // Уникальный ID для градиента
  const gid = `grad-${stage}-${Math.random().toString(36).substr(2, 9)}`;

  if (stage <= 1) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#FEF3C7" /><path d="M50 75C50 75 40 75 40 75" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="70" r="6" fill="#B45309" /></svg>;
  if (stage === 2) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#ECFDF5" /><path d="M50 80V60" stroke="#059669" strokeWidth="3" strokeLinecap="round"/><path d="M50 60C50 60 35 55 35 45C35 55 50 60 50 60Z" fill="#10B981" /><path d="M50 60C50 60 65 55 65 45C65 55 50 60 50 60Z" fill="#34D399" /></svg>;
  if (stage === 3) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#D1FAE5" /><path d="M50 85V50" stroke="#059669" strokeWidth="3" strokeLinecap="round"/><path d="M50 65L65 55" stroke="#059669" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="45" r="10" fill="#10B981" /><circle cx="65" cy="55" r="6" fill="#34D399" /></svg>;
  if (stage === 4) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#A7F3D0" /><path d="M50 85V45" stroke="#92400E" strokeWidth="4" strokeLinecap="round"/><path d="M50 65L30 55" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="40" r="15" fill="#10B981" /><circle cx="30" cy="55" r="8" fill="#34D399" /><circle cx="65" cy="50" r="8" fill="#34D399" /></svg>;
  if (stage === 5) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#6EE7B7" /><path d="M50 90V40" stroke="#92400E" strokeWidth="5" strokeLinecap="round"/><path d="M50 60L25 50" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/><path d="M50 50L75 40" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="35" r="20" fill="#059669" /><circle cx="25" cy="50" r="12" fill="#10B981" /><circle cx="75" cy="40" r="12" fill="#10B981" /></svg>;
  if (stage === 6) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#34D399" /><path d="M50 90L50 35" stroke="#78350F" strokeWidth="6" strokeLinecap="round"/><path d="M50 70L20 60" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/><path d="M50 60L80 50" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="30" r="25" fill="#047857" /><circle cx="20" cy="60" r="15" fill="#059669" /><circle cx="80" cy="50" r="15" fill="#059669" /></svg>;
  if (stage === 7) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#10B981" /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="7" strokeLinecap="round"/><path d="M50 70L20 55" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/><path d="M50 60L85 45" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/><circle cx="50" cy="35" r="30" fill="#064E3B" /><circle cx="20" cy="55" r="18" fill="#065F46" /><circle cx="85" cy="45" r="18" fill="#065F46" /><circle cx="35" cy="80" r="5" fill="#064E3B" opacity="0.5"/></svg>;
  // 8: Древо
  return (<svg viewBox="0 0 100 100" className={c} fill="none"><defs><radialGradient id={gid} cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" style={{stopColor:'rgb(255,255,255)', stopOpacity:0.8}} /><stop offset="100%" style={{stopColor:'rgb(16, 185, 129)', stopOpacity:0}} /></radialGradient></defs><circle cx="50" cy="50" r="48" fill={`url(#${gid})`} /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="10" strokeLinecap="round"/><circle cx="50" cy="40" r="40" fill="#064E3B" /><circle cx="20" cy="65" r="25" fill="#065F46" /><circle cx="80" cy="65" r="25" fill="#065F46" /><circle cx="50" cy="25" r="15" fill="#10B981" /><path d="M20 20L25 25" stroke="#FCD34D" strokeWidth="2" /><path d="M80 20L75 25" stroke="#FCD34D" strokeWidth="2" /></svg>);
};

const TREE_STAGES = [
  { threshold: 5000, title: "Древо Мудрости", stageIndex: 8 },
  { threshold: 600, title: "Ветвистое Древо", stageIndex: 6 },
  { threshold: 150, title: "Молодое Дерево", stageIndex: 4 },
  { threshold: 75, title: "Саженец", stageIndex: 3 },
  { threshold: 10, title: "Росток", stageIndex: 2 },
  { threshold: 0, title: "Семя", stageIndex: 1 },
];

const ARCHETYPE_INFO: any = {
  "Творец": { desc: "Для вас жизнь — это чистый холст. Ваша миссия — материализовать свои идеи.", strength: "Креативность", shadow: "Перфекционизм", advice: "Не ждите вдохновения.", bg: "bg-purple-50", color: "text-purple-600" },
  "Правитель": { desc: "Вы — архитектор реальности. Вы создаете порядок из хаоса.", strength: "Лидерство", shadow: "Контроль", advice: "Делегируйте.", bg: "bg-indigo-50", color: "text-indigo-600" },
  "Мудрец": { desc: "Ваш инструмент — разум. Вы ищете истину.", strength: "Интеллект", shadow: "Бездействие", advice: "Действуйте.", bg: "bg-blue-50", color: "text-blue-600" },
  "Хранитель": { desc: "Ваша сила — сердце. Вы заботитесь о людях.", strength: "Эмпатия", shadow: "Жертвенность", advice: "Берегите себя.", bg: "bg-emerald-50", color: "text-emerald-600" },
  "Искатель": { desc: "Рутина вас душит. Вы стремитесь к новым горизонтам.", strength: "Свобода", shadow: "Бегство", advice: "Найдите дом.", bg: "bg-amber-50", color: "text-amber-600" }
};

// --- КОМПОНЕНТЫ ---

const InternalBottomNav: React.FC<{ currentView: string, onChangeView: (v: string) => void }> = ({ currentView, onChangeView }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 px-6 py-4 flex justify-between items-center z-40">
    <button onClick={() => onChangeView('HOME')} className={currentView === 'HOME' ? 'text-indigo-600' : 'text-slate-400'}><Icon p={ICONS.Zap} /><span className="text-[10px] block font-bold">ПУТЬ</span></button>
    <button onClick={() => onChangeView('HISTORY')} className={currentView === 'HISTORY' ? 'text-indigo-600' : 'text-slate-400'}><Icon p={ICONS.Book} /><span className="text-[10px] block font-bold">ИСТОРИЯ</span></button>
    <button onClick={() => onChangeView('PROFILE')} className={currentView === 'PROFILE' ? 'text-indigo-600' : 'text-slate-400'}><Icon p={ICONS.User} /><span className="text-[10px] block font-bold">ПРОФИЛЬ</span></button>
  </div>
);

const OnboardingScreen: React.FC<{ onComplete: (data: any) => void, onBack: () => void }> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<any>({ CREATOR: 0, RULER: 0, SAGE: 0, CAREGIVER: 0, EXPLORER: 0 });
  const [finalData, setFinalData] = useState<any>({});
  
  const steps = [
    { title: "Что дает вам энергию?", options: [{ label: "Создание нового", type: 'CREATOR' }, { label: "Управление и успех", type: 'RULER' }, { label: "Поиск истины", type: 'SAGE' }, { label: "Помощь людям", type: 'CAREGIVER' }] },
    { title: "Чего вы избегаете?", options: [{ label: "Скуки и рутины", type: 'CREATOR' }, { label: "Хаоса", type: 'RULER' }, { label: "Незнания", type: 'SAGE' }, { label: "Застоя", type: 'EXPLORER' }] },
    { title: "Идеальный выходной?", options: [{ label: "Путешествие", type: 'EXPLORER' }, { label: "Уют с семьей", type: 'CAREGIVER' }, { label: "Изучение нового", type: 'SAGE' }, { label: "Планирование", type: 'RULER' }] },
    { title: "Драйвер жизни?", options: [{ label: "Самовыражение", type: 'CREATOR' }, { label: "Статус", type: 'RULER' }, { label: "Истина", type: 'SAGE' }, { label: "Свобода", type: 'EXPLORER' }] },
    { title: "Ценность в людях?", options: [{ label: "Уникальность", type: 'CREATOR' }, { label: "Верность", type: 'CAREGIVER' }, { label: "Ум", type: 'SAGE' }, { label: "Легкость", type: 'EXPLORER' }] },
    { title: "Решения?", options: [{ label: "Интуиция", type: 'CREATOR' }, { label: "Логика", type: 'SAGE' }, { label: "Выгода", type: 'RULER' }, { label: "Сердце", type: 'CAREGIVER' }] },
    { title: "Лидерство?", options: [{ label: "Вдохновитель", type: 'CREATOR' }, { label: "Стратег", type: 'RULER' }, { label: "Наставник", type: 'SAGE' }, { label: "Защитник", type: 'CAREGIVER' }] },
    { title: "Отношение к переменам?", options: [{ label: "Приключение!", type: 'EXPLORER' }, { label: "Изучаю", type: 'SAGE' }, { label: "Внедряю", type: 'RULER' }, { label: "Осторожно", type: 'CAREGIVER' }] },
    { title: "Подарок?", options: [{ label: "С душой", type: 'CAREGIVER' }, { label: "Билет", type: 'EXPLORER' }, { label: "Книга", type: 'SAGE' }, { label: "Статус", type: 'RULER' }] },
    { title: "Утро?", options: [{ label: "План", type: 'RULER' }, { label: "Кофе", type: 'CREATOR' }, { label: "В путь", type: 'EXPLORER' }, { label: "Семья", type: 'CAREGIVER' }] },
    { title: "Наследие?", options: [{ label: "Искусство", type: 'CREATOR' }, { label: "Империя", type: 'RULER' }, { label: "Открытие", type: 'SAGE' }, { label: "Память", type: 'CAREGIVER' }] },
    { title: "Фокус?", key: 'focus', options: [{ label: "Доходы", value: "Доходы" }, { label: "Спокойствие", value: "Спокойствие" }, { label: "Дисциплина", value: "Дисциплина" }, { label: "Семья", value: "Семья" }] },
    { title: "Помеха?", key: 'struggle', options: [{ label: "Лень", value: "Лень" }, { label: "Страх", value: "Страх" }, { label: "Усталость", value: "Усталость" }, { label: "Хаос", value: "Хаос" }] },
    { title: "Биоритмы?", key: 'chronotype', options: [{ label: "Жаворонок", value: "Утро" }, { label: "Сова", value: "Вечер" }, { label: "Плавающий", value: "Плавающий" }] }
  ];

  const currentStep = steps[step];
  if (!currentStep) return null;

  const handleSelect = (option: any) => {
    if (option.type) setScores((p:any) => ({ ...p, [option.type]: p[option.type] + 1 }));
    if (option.key) setFinalData((p:any) => ({ ...p, [option.key]: option.value }));

    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      let winner = 'SAGE';
      let max = -1;
      Object.entries(scores).forEach(([k, v]: any) => { if (v > max) { max = v; winner = k; } });
      const archMap: any = { CREATOR: "Творец", RULER: "Правитель", SAGE: "Мудрец", CAREGIVER: "Хранитель", EXPLORER: "Искатель" };
      onComplete({ archetype: archMap[winner] || "Искатель", ...finalData });
    }
  };

  return (
    <div className="h-full bg-white p-6 pt-10 flex flex-col">
      <button onClick={onBack} className="self-start mb-6 text-slate-400"><Icon p={ICONS.ArrowLeft} /></button>
      <div className="mb-8"><div className="flex space-x-1 mb-4">{steps.map((_, i) => (<div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-indigo-500' : 'bg-slate-100'}`} />))}</div><h2 className="text-2xl font-black text-slate-800">{currentStep.title}</h2></div>
      <div className="space-y-3">{currentStep.options.map((opt: any, i: number) => (<button key={i} onClick={() => handleSelect(opt)} className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 text-left font-semibold text-slate-700 hover:bg-indigo-50">{opt.label}</button>))}</div>
    </div>
  );
};

const ArchetypeResult: React.FC<{ archetype: string, onContinue: () => void }> = ({ archetype, onContinue }) => {
  const info = ARCHETYPE_INFO[archetype] || ARCHETYPE_INFO["Искатель"];
  return (
    <div className="h-full bg-white p-6 flex flex-col items-center text-center pt-12 animate-fade-in">
      <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl ${info.bg} ${info.color}`}><Icon p={ICONS.Star} /></div>
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ваш Архетип</h2>
      <h1 className="text-4xl font-black text-slate-800 mb-6">{archetype}</h1>
      <p className="text-lg text-slate-600 leading-relaxed mb-8">{info.desc}</p>
      <div className="w-full space-y-4 mb-8 text-left">
        <div className="p-4 bg-slate-50 rounded-xl"><span className="font-bold text-xs uppercase text-slate-400 block mb-1">Сила</span>{info.strength}</div>
        <div className="p-4 bg-slate-50 rounded-xl"><span className="font-bold text-xs uppercase text-slate-400 block mb-1">Совет</span>{info.advice}</div>
      </div>
      <button onClick={onContinue} className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-lg">Далее</button>
    </div>
  );
};

const Tutorial: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  return (
    <div className="h-full bg-white p-6 flex flex-col justify-center items-center text-center">
      <div className="w-32 h-32 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center mb-8"><Icon p={ICONS.Compass} /></div>
      <h2 className="text-3xl font-black text-slate-800 mb-4">Начнем путь</h2>
      <p className="text-slate-500 text-lg mb-8">ИИ создаст карту дня под ваш архетип. Дерево покажет прогресс.</p>
      <button onClick={onFinish} className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-lg">Вперед</button>
    </div>
  );
};

// --- APP ---
const App: React.FC = () => {
  useEffect(() => {
    if (!localStorage.getItem('mm_nuclear_reset_v1')) {
      localStorage.clear();
      localStorage.setItem('mm_nuclear_reset_v1', 'true');
      window.location.reload();
    }
  }, []);

  const [user, setUser] = useState<any>(() => {
    try { const s = localStorage.getItem(STORAGE_KEYS.PROFILE); return s ? JSON.parse(s) : { onboardingCompleted: false, currentMood: 'ok' }; } catch { return { onboardingCompleted: false }; }
  });
  const [view, setView] = useState('HOME');
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [moodOpen, setMoodOpen] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [sessions, setSessions] = useState(0);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(user)); }, [user]);

  const currentTree = TREE_STAGES.find(r => sessions >= r.threshold) || TREE_STAGES[0];

  useEffect(() => {
    const gen = async () => {
      if (!user.onboardingCompleted || !user.name) return;
      setLoading(true);
      try {
        const res = await sendMessageToGemini("Advice");
        const p = res.split('|||');
        setInsight({ mindset: p[0]||"Фокус", action: p[1]||"Действие", health: p[2]||"Энергия", insight: p[3]||"Мудрость" });
      } catch {} finally { setLoading(false); }
    };
    gen();
  }, [user]);

  const renderHome = () => (
    <div className="h-full overflow-y-auto px-6 pt-6 pb-32">
      <div className="flex justify-between items-center mb-6">
        <div><h1 className="text-xl font-bold text-slate-800">Привет!</h1><p className="text-xs text-slate-500">{user.archetype || 'Странник'}</p></div>
        <Logo />
      </div>

      {!user.onboardingCompleted ? (
        <button onClick={() => setView('ONBOARDING')} className="w-full bg-slate-900 rounded-[32px] p-6 text-white text-left shadow-lg mb-8">
          <div className="mb-4"><Icon p={ICONS.Compass} /></div>
          <h2 className="text-xl font-bold mb-2">Найти свой путь</h2>
          <p className="text-sm opacity-80 mb-4">Пройти тест архетипа</p>
          <span className="bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold">Начать</span>
        </button>
      ) : (
        <div className="w-full bg-white border border-slate-100 rounded-[32px] p-6 shadow-lg shadow-indigo-100/50 mb-8">
           <div className="flex justify-between mb-4">
             <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">Фокус дня</span>
             <button onClick={() => setMoodOpen(true)} className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded-full"><Icon p={ICONS.Battery} /><span className="text-[10px]">{user.currentMood || 'Норм'}</span></button>
           </div>
           <h2 className="text-lg font-bold text-slate-800 mb-4 line-clamp-3">{loading ? "Загрузка..." : (insight?.mindset || "...")}</h2>
           <button onClick={() => setView('DAILY')} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm">Открыть карту</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 mb-8">
        <button className="p-4 bg-indigo-50 rounded-2xl flex flex-col items-center"><Icon p={ICONS.Zap} c="#6366f1" /><span className="text-[10px] font-bold text-slate-600 mt-2">РЕШЕНИЕ</span></button>
        <button className="p-4 bg-rose-50 rounded-2xl flex flex-col items-center"><Icon p={ICONS.Heart} c="#e11d48" /><span className="text-[10px] font-bold text-slate-600 mt-2">ЭМОЦИИ</span></button>
        <button className="p-4 bg-emerald-50 rounded-2xl flex flex-col items-center"><Icon p={ICONS.Book} c="#10b981" /><span className="text-[10px] font-bold text-slate-600 mt-2">ДНЕВНИК</span></button>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
         <div className="flex items-center space-x-4"><div className="w-12 h-12"><TreeIllustration stage={currentTree.stageIndex} /></div><div><p className="text-[10px] uppercase text-slate-400 font-bold">Древо</p><h4 className="font-bold text-slate-800">{currentTree.title}</h4></div></div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full font-sans bg-[#F8FAFC]">
      {moodOpen && <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={() => setMoodOpen(false)}><div className="bg-white rounded-3xl p-6 w-full max-w-sm"><h3 className="text-xl font-bold text-center mb-4">Заряд?</h3><div className="grid grid-cols-2 gap-2">{['high','flow','ok','low'].map(m => (<button key={m} onClick={() => { setUser((p:any)=>({...p, currentMood: m})); setMoodOpen(false); }} className="p-3 bg-slate-50 rounded-xl font-bold text-slate-700">{m}</button>))}</div></div></div>}
      <main className="flex-1 h-full overflow-hidden">
        {view === 'HOME' && renderHome()}
        {view === 'ONBOARDING' && <OnboardingScreen onComplete={(d) => { setUser((p:any) => ({...p, ...d, onboardingCompleted: true})); setView('ARCHETYPE_RESULT'); }} onBack={() => setView('HOME')} />}
        {view === 'ARCHETYPE_RESULT' && <ArchetypeResult archetype={user.archetype} onContinue={() => setView('TUTORIAL')} />}
        {view === 'TUTORIAL' && <Tutorial onFinish={() => setView('HOME')} />}
        {view === 'DAILY' && <div className="p-6 pt-12"><h1>Карта дня</h1><p>{insight?.mindset}</p><button onClick={() => setView('HOME')} className="mt-4">Назад</button></div>}
        {view === 'PROFILE' && <div className="p-6 pt-12"><h1>Профиль</h1><p>{user.archetype}</p></div>}
      </main>
      {['HOME', 'PROFILE'].includes(view) && <InternalBottomNav currentView={view} onChangeView={setView} />}
    </div>
  );
};

export default App;
