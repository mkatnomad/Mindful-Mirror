import React, { useState, useEffect, useRef } from 'react';
// ИМПОРТИРУЕМ ТОЛЬКО СТАРЫЕ, ПРОВЕРЕННЫЕ ГОДАМИ ИКОНКИ
import { Heart, BookOpen, ChevronRight, Settings, Info, User as UserIcon, Activity, Zap, Star, ArrowLeft, MessageSquare, Award, Medal, Loader2, Cloud, Moon, Sun, Coffee, Brain, Briefcase, Feather, Compass, Anchor, Target, Battery, X, Shield, Map, Smile, Lightbulb } from 'lucide-react';
import { ViewState, JournalMode, ChatSession, Message, UserProfile, JournalEntry, SiteConfig, DailyInsightData } from './types';
import { BottomNav } from './components/BottomNav';
import { ChatInterface } from './components/ChatInterface';
import { JournalInterface } from './components/JournalInterface';
import { AdminInterface } from './components/AdminInterface';
import { sendMessageToGemini } from './services/geminiService';

// --- ЕЩЕ РАЗ МЕНЯЕМ КЛЮЧИ ДЛЯ ЧИСТОГО ЗАПУСКА ---
const STORAGE_KEYS = {
  PROFILE: 'mm_profile_stable_v1', 
  HISTORY: 'mm_history_stable_v1',
  SESSIONS: 'mm_sessions_stable_v1',
  TIME: 'mm_time_stable_v1',
  ACTIVITY: 'mm_activity_stable_v1',
  JOURNAL: 'mm_journal_stable_v1',
  CONFIG: 'mm_config_stable_v1',
  DAILY_INSIGHT: 'mm_insight_stable_v1'
};

const Logo = ({ className = "w-20 h-20" }: { className?: string }) => (
  <img src="/logo.png" alt="MM" className={`${className} object-contain`} onError={(e) => e.currentTarget.style.display = 'none'} />
);

// --- ДЕРЕВЬЯ (ЭМОДЗИ - САМЫЙ НАДЕЖНЫЙ ВАРИАНТ) ---
// Мы используем эмодзи, чтобы исключить ошибку "Иконка не найдена"
const TREE_STAGES = [
  { threshold: 50000, title: "Древо Жизни", emoji: "🌳", color: "bg-amber-100 text-amber-600", desc: "Вершина эволюции." },
  { threshold: 20000, title: "Мудрое Древо", emoji: "🌳", color: "bg-emerald-100 text-emerald-800", desc: "Глубокие корни." },
  { threshold: 5000, title: "Цветущий Сад", emoji: "🌸", color: "bg-pink-100 text-pink-600", desc: "Плоды практики." },
  { threshold: 1500, title: "Могучее Древо", emoji: "🌲", color: "bg-emerald-100 text-emerald-700", desc: "Сила и покой." },
  { threshold: 300, title: "Крепкое Древо", emoji: "🌳", color: "bg-emerald-50 text-emerald-600", desc: "Уверенность." },
  { threshold: 80, title: "Молодое Дерево", emoji: "🌿", color: "bg-emerald-50 text-emerald-500", desc: "Быстрый рост." },
  { threshold: 15, title: "Саженец", emoji: "🌱", color: "bg-emerald-50 text-emerald-400", desc: "Начало пути." },
  { threshold: 0, title: "Росток", emoji: "🌱", color: "bg-emerald-50 text-emerald-300", desc: "Потенциал." },
];

const ARCHETYPE_INFO: any = {
  "Творец": { desc: "Вы видите мир как полотно. Ваша суть — созидание.", strength: "Воображение", shadow: "Перфекционизм", advice: "Создавайте, не ожидая идеала.", icon: Feather, color: "text-purple-600", bg: "bg-purple-50" },
  "Правитель": { desc: "Вы создаете порядок из хаоса.", strength: "Лидерство", shadow: "Контроль", advice: "Доверяйте процессу.", icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50" },
  "Мудрец": { desc: "Вы ищете истину.", strength: "Интеллект", shadow: "Бездействие", advice: "Знание требует действий.", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
  "Хранитель": { desc: "Вы — опора и забота.", strength: "Эмпатия", shadow: "Жертвенность", advice: "Сначала маску на себя.", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
  "Искатель": { desc: "Вы — вечный путник.", strength: "Свобода", shadow: "Непостоянство", advice: "Найдите дом внутри себя.", icon: Compass, color: "text-amber-600", bg: "bg-amber-50" }
};

// --- КОМПОНЕНТЫ ---

const ArchetypeResultScreen: React.FC<{ archetype: string, onContinue: () => void, isReadOnly?: boolean, onBack?: () => void }> = ({ archetype, onContinue, isReadOnly, onBack }) => {
  const info = ARCHETYPE_INFO[archetype] || ARCHETYPE_INFO["Искатель"];
  const Icon = info.icon;
  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto animate-fade-in relative z-50 p-6">
      {isReadOnly && <button onClick={onBack} className="p-2 -ml-2 text-slate-400 mb-4"><ArrowLeft size={24} /></button>}
      <div className="flex-1 flex flex-col items-center text-center pt-8">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl ${info.bg} ${info.color}`}><Icon size={64} strokeWidth={1.5} /></div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ваш Архетип</h2>
        <h1 className="text-4xl font-black text-slate-800 mb-6">{archetype}</h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-8">{info.desc}</p>
        <div className="w-full space-y-4 mb-8 text-left">
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100"><div className="flex items-center space-x-3 mb-2 text-emerald-700 font-bold"><Star size={20} /><span>Суперсила</span></div><p className="text-emerald-900/80 font-medium">{info.strength}</p></div>
          <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100"><div className="flex items-center space-x-3 mb-2 text-indigo-700 font-bold"><Lightbulb size={20} /><span>Совет</span></div><p className="text-indigo-900/80 font-medium">{info.advice}</p></div>
        </div>
        {!isReadOnly && <button onClick={onContinue} className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-xl active:scale-95 transition-all">Далее</button>}
      </div>
    </div>
  );
};

const TutorialScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [slide, setSlide] = useState(0);
  const slides = [
    { title: "Карта Дня", desc: "Каждое утро — персональный план.", icon: Map, color: "text-indigo-500", bg: "bg-indigo-50" },
    { title: "Настроение", desc: "Кнопка «Как ты?» адаптирует план.", icon: Battery, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Древо", desc: "Практикуйтесь, чтобы вырастить дерево.", icon: Activity, color: "text-amber-500", bg: "bg-amber-50" }
  ];
  if (!slides[slide]) return null;
  return (
    <div className="h-full flex flex-col bg-white px-6 py-10 animate-fade-in relative z-50">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className={`w-32 h-32 rounded-[32px] flex items-center justify-center mb-8 shadow-sm ${slides[slide].bg} ${slides[slide].color}`}>{React.createElement(slides[slide].icon, { size: 64 })}</div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">{slides[slide].title}</h2>
        <p className="text-slate-500 text-lg leading-relaxed max-w-xs">{slides[slide].desc}</p>
      </div>
      <button onClick={() => { if (slide < 2) setSlide(s => s + 1); else onFinish(); }} className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-lg active:scale-95 transition-all">{slide < 2 ? "Далее" : "Начать"}</button>
    </div>
  );
};

const OnboardingScreen: React.FC<{ onComplete: (data: Partial<UserProfile>) => void, onBack: () => void }> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ CREATOR: 0, RULER: 0, SAGE: 0, CAREGIVER: 0, EXPLORER: 0 });
  const [finalData, setFinalData] = useState<any>({});
  
  const steps = [
    { title: "Что вдохновляет?", type: 'archetype', options: [{ label: "Творчество", type: 'CREATOR', icon: Feather }, { label: "Успех", type: 'RULER', icon: Target }, { label: "Знания", type: 'SAGE', icon: BookOpen }, { label: "Забота", type: 'CAREGIVER', icon: Heart }] },
    { title: "Чего избегаете?", type: 'archetype', options: [{ label: "Скуки", type: 'CREATOR', icon: Activity }, { label: "Хаоса", type: 'RULER', icon: Lock }, { label: "Незнания", type: 'SAGE', icon: Search }, { label: "Застоя", type: 'EXPLORER', icon: Map }] },
    { title: "Идеальный отдых?", type: 'archetype', options: [{ label: "Путешествие", type: 'EXPLORER', icon: Compass }, { label: "Семья", type: 'CAREGIVER', icon: Coffee }, { label: "Учеба", type: 'SAGE', icon: Zap }, { label: "Планы", type: 'RULER', icon: Briefcase }] },
    { title: "В кризис вы...", type: 'archetype', options: [{ label: "Креативите", type: 'CREATOR', icon: Sparkles }, { label: "Руководите", type: 'RULER', icon: Shield }, { label: "Думаете", type: 'SAGE', icon: Brain }, { label: "Помогаете", type: 'CAREGIVER', icon: Heart }] },
    { title: "Мотивация?", type: 'archetype', options: [{ label: "Выражение", type: 'CREATOR', icon: Feather }, { label: "Статус", type: 'RULER', icon: Award }, { label: "Истина", type: 'SAGE', icon: Search }, { label: "Свобода", type: 'EXPLORER', icon: Map }] },
    { title: "Главный фокус?", key: 'focus', options: [{ label: "Финансы", value: "Рост доходов", icon: Zap }, { label: "Спокойствие", value: "Снижение стресса", icon: Cloud }, { label: "Режим", value: "Дисциплина", icon: Brain }, { label: "Отношения", value: "Семья", icon: Heart }] },
    { title: "Что мешает?", key: 'struggle', options: [{ label: "Лень", value: "Прокрастинация", icon: Clock }, { label: "Страх", value: "Неуверенность", icon: Lock }, { label: "Усталость", value: "Выгорание", icon: Battery }, { label: "Хаос", value: "Расфокус", icon: Activity }] },
    { title: "Биоритмы?", key: 'chronotype', options: [{ label: "Утро", value: "Утро", icon: Sun }, { label: "Вечер", value: "Вечер", icon: Moon }, { label: "Разные", value: "Плавающий", icon: Activity }] }
  ];

  const currentStep = steps[step];
  if (!currentStep) return null;

  const handleSelect = (option: any) => {
    if (currentStep.type === 'archetype') setScores(prev => ({ ...prev, [option.type]: (prev[option.type as keyof typeof scores] || 0) + 1 }));
    if (currentStep.key) setFinalData(prev => ({ ...prev, [currentStep.key!]: option.value }));

    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      let winner = 'SAGE';
      let max = -1;
      Object.entries(scores).forEach(([k, v]) => { if (v > max) { max = v; winner = k; } });
      const archMap: any = { CREATOR: "Творец", RULER: "Правитель", SAGE: "Мудрец", CAREGIVER: "Хранитель", EXPLORER: "Искатель" };
      onComplete({ archetype: archMap[winner] || "Искатель", ...finalData });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white px-6 py-10 animate-fade-in relative z-50">
      <div className="flex justify-start mb-6"><button onClick={onBack} className="p-2 -ml-2 text-slate-400"><ArrowLeft size={24} /></button></div>
      <div className="mb-8"><div className="flex space-x-1 mb-4">{steps.map((_, i) => (<div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-indigo-500' : 'bg-slate-100'}`} />))}</div><h2 className="text-2xl font-bold text-slate-800">{currentStep.title}</h2></div>
      <div className="space-y-3">{currentStep.options.map((opt: any, i: number) => { const Icon = opt.icon; return (<button key={i} onClick={() => handleSelect(opt)} className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center hover:bg-indigo-50"><Icon size={20} className="text-indigo-500 mr-3" /><span className="font-semibold text-slate-700">{opt.label}</span></button>) })}</div>
    </div>
  );
};

// --- APP ---
const App: React.FC = () => {
  // АВТО-СБРОС КЭША ПРИ ПЕРВОМ ЗАПУСКЕ ЭТОЙ ВЕРСИИ
  useEffect(() => {
    const hasReset = localStorage.getItem('mm_emergency_reset_v2');
    if (!hasReset) {
      localStorage.clear(); // Полная очистка localStorage
      localStorage.setItem('mm_emergency_reset_v2', 'true');
      window.location.reload(); // Перезагрузка страницы
    }
  }, []);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try { const s = localStorage.getItem(STORAGE_KEYS.PROFILE); return s ? JSON.parse(s) : { onboardingCompleted: false }; } catch { return { onboardingCompleted: false }; }
  });
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  
  const [currentView, setCurrentView] = useState<string>(userProfile.onboardingCompleted ? 'HOME' : 'ONBOARDING');
  
  const [selectedMode, setSelectedMode] = useState<JournalMode | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [dailyInsight, setDailyInsight] = useState<DailyInsightData | null>(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_INSIGHT) || 'null'); } catch { return null; }});
  
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [isBatteryModalOpen, setIsBatteryModalOpen] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]'); } catch { return []; }});
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(0);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // Load Data
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.SESSIONS); if(s) setTotalSessions(parseInt(s) || 0);
      const t = localStorage.getItem(STORAGE_KEYS.TIME); if(t) setTotalTimeSeconds(parseInt(t) || 0);
      const j = localStorage.getItem(STORAGE_KEYS.JOURNAL); if(j) setJournalEntries(JSON.parse(j));
    } catch(e) {}
  }, []);

  // Save Data
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SESSIONS, totalSessions.toString()); }, [totalSessions]);

  // Logic
  const getTreeStage = (s: number) => TREE_STAGES.find(r => s >= r.threshold) || TREE_STAGES[7];
  const currentTree = getTreeStage(totalSessions + Math.round(totalTimeSeconds/60));

  const startMode = (m: JournalMode) => { setSelectedMode(m); setCurrentView('CHAT'); };
  
  const handleSessionComplete = (messages: Message[], duration: number) => {
    const newSession: ChatSession = { id: Date.now().toString(), mode: selectedMode!, date: Date.now(), duration, preview: messages.find(m=>m.role==='user')?.content.substring(0,30) || '...', messages };
    setHistory(p => [newSession, ...p]); setTotalSessions(p => p+1); setTotalTimeSeconds(p => p+duration);
  };
  
  // Generation
  useEffect(() => {
    const gen = async () => {
      if (!userProfile.onboardingCompleted || !userProfile.name) return;
      const today = new Date().toDateString();
      if (dailyInsight?.date === today && dailyInsight?.generatedForMood === userProfile.currentMood) return;
      
      setIsInsightLoading(true);
      try {
        const prompt = `Ментор для ${userProfile.name}. Архетип ${userProfile.archetype}, Цель ${userProfile.focus}, Настроение ${userProfile.currentMood}. 4 совета (Мышление, Действие, Тело, Инсайт) через |||.`;
        const res = await sendMessageToGemini(prompt);
        const p = res.split('|||');
        const ni = { date: today, generatedForMood: userProfile.currentMood, mindset: p[0]||"Фокус", action: p[1]||"Действие", health: p[2]||"Дыши", insight: p[3]||"Мудрость" };
        setDailyInsight(ni); localStorage.setItem(STORAGE_KEYS.DAILY_INSIGHT, JSON.stringify(ni));
      } catch(e) {} finally { setIsInsightLoading(false); }
    };
    gen();
  }, [userProfile, journalEntries]);

  // --- RENDER ---
  const renderHome = () => (
    <div className="h-full overflow-y-auto px-6 pt-4 pb-32">
       <div className="flex justify-between items-center mb-6">
         <div>
           <h1 className="text-xl font-bold text-slate-800">Привет, {userProfile.name || 'Странник'}</h1>
           <p className="text-xs text-slate-500">{userProfile.archetype || 'Начало пути'}</p>
         </div>
         <div className="w-8 h-8 opacity-20"><Logo /></div>
       </div>

       {!userProfile.onboardingCompleted ? (
         <button onClick={() => setCurrentView('ONBOARDING')} className="w-full bg-slate-900 rounded-3xl p-6 text-white text-left shadow-lg mb-8">
           <Compass className="mb-4" />
           <h2 className="text-xl font-bold mb-2">Найти свой путь</h2>
           <p className="text-sm opacity-80 mb-4">Пройдите тест, чтобы получить карту дня.</p>
           <span className="bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold">Начать</span>
         </button>
       ) : (
         <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-lg shadow-indigo-100/50 mb-8">
            <div className="flex justify-between mb-4">
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">Фокус дня</span>
              <button onClick={() => setIsBatteryModalOpen(true)} className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded-full"><Battery size={12} /><span className="text-[10px]">{userProfile.currentMood || 'Норм'}</span></button>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 line-clamp-3">{isInsightLoading ? "Загрузка..." : (dailyInsight?.mindset || "...")}</h2>
            <button onClick={() => setCurrentView('DAILY_GUIDE')} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm">Открыть карту</button>
         </div>
       )}

       <div className="grid grid-cols-3 gap-3 mb-8">
         <button onClick={() => startMode('DECISION')} className="p-4 bg-indigo-50 rounded-2xl flex flex-col items-center"><Zap size={24} className="text-indigo-500 mb-2" /><span className="text-[10px] font-bold text-slate-600">Решение</span></button>
         <button onClick={() => startMode('EMOTIONS')} className="p-4 bg-rose-50 rounded-2xl flex flex-col items-center"><Heart size={24} className="text-rose-500 mb-2" /><span className="text-[10px] font-bold text-slate-600">Эмоции</span></button>
         <button onClick={() => startMode('REFLECTION')} className="p-4 bg-emerald-50 rounded-2xl flex flex-col items-center"><BookOpen size={24} className="text-emerald-500 mb-2" /><span className="text-[10px] font-bold text-slate-600">Дневник</span></button>
       </div>

       <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between" onClick={() => setCurrentView('RANKS_INFO')}>
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-3xl ${currentTree.color}`}>{currentTree.emoji}</div>
            <div><p className="text-[10px] uppercase text-slate-400 font-bold">Древо</p><h4 className="font-bold text-slate-800">{currentTree.title}</h4></div>
          </div>
          <div className="text-right"><p className="font-bold text-slate-800">{totalSessions}</p><p className="text-[9px] text-slate-400 uppercase">Сессий</p></div>
       </div>
    </div>
  );

  const renderBattery = () => {
    if (!isBatteryModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
          <h3 className="text-xl font-bold text-center mb-4">Заряд?</h3>
          <div className="grid grid-cols-2 gap-2">
            {['high','flow','ok','low'].map(m => (
              <button key={m} onClick={() => { setUserProfile(p=>({...p, currentMood: m as any})); setIsBatteryModalOpen(false); }} className="p-3 bg-slate-50 rounded-xl font-bold text-slate-700">{m}</button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDailyGuide = () => (
    <div className="h-full bg-slate-50 px-6 pt-6 pb-32 overflow-y-auto">
      <button onClick={() => setCurrentView('HOME')} className="mb-6 flex items-center text-slate-500 font-bold"><ArrowLeft className="mr-2" /> Назад</button>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Карта дня</h1>
      {isInsightLoading ? <Loader2 className="animate-spin mx-auto text-indigo-500" /> : (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm"><div className="flex items-center mb-2 text-indigo-500 font-bold"><Brain size={18} className="mr-2" />МЫШЛЕНИЕ</div><p>{dailyInsight?.mindset}</p></div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-3xl shadow-lg"><div className="flex items-center mb-2 font-bold opacity-80"><Target size={18} className="mr-2" />ДЕЙСТВИЕ</div><p className="text-lg font-medium">{dailyInsight?.action}</p></div>
          <div className="bg-white p-6 rounded-3xl shadow-sm"><div className="flex items-center mb-2 text-emerald-500 font-bold"><Battery size={18} className="mr-2" />ТЕЛО</div><p>{dailyInsight?.health}</p></div>
          <div className="bg-slate-900 text-slate-200 p-6 rounded-3xl shadow-sm"><div className="flex items-center mb-2 text-amber-400 font-bold"><Sparkles size={18} className="mr-2" />ИНСАЙТ</div><p className="italic">"{dailyInsight?.insight}"</p></div>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col font-sans bg-[#F8FAFC]">
      <main className="flex-1 relative overflow-hidden z-10">
        {renderBattery()}
        {currentView === 'ONBOARDING' && <OnboardingScreen onComplete={(d) => { setUserProfile(p => ({...p, ...d, onboardingCompleted: true})); setCurrentView('ARCHETYPE_RESULT'); }} onBack={() => setCurrentView('HOME')} />}
        {currentView === 'ARCHETYPE_RESULT' && <ArchetypeResultScreen archetype={userProfile.archetype || 'Искатель'} onContinue={() => setCurrentView('TUTORIAL')} />}
        {currentView === 'ARCHETYPE_RESULT_VIEW' && <ArchetypeResultScreen archetype={userProfile.archetype || 'Искатель'} isReadOnly={true} onBack={() => setCurrentView('PROFILE')} onContinue={() => {}} />}
        {currentView === 'TUTORIAL' && <TutorialScreen onFinish={() => setCurrentView('HOME')} />}
        {currentView === 'DAILY_GUIDE' && renderDailyGuide()}
        {currentView === 'HOME' && renderHome()}
        {currentView === 'CHAT' && <ChatInterface mode={selectedMode!} onBack={() => setCurrentView('HOME')} onSessionComplete={handleSessionComplete as any} />}
        {currentView === 'HISTORY' && <div className="p-6"><h1 className="text-2xl font-bold">История</h1><div className="mt-4">{history.map(s => <div key={s.id} className="bg-white p-4 rounded-xl mb-2 shadow-sm">{new Date(s.date).toLocaleDateString()} - {s.preview}</div>)}</div></div>}
        {currentView === 'PROFILE' && <div className="p-6"><h1 className="text-2xl font-bold mb-4">Профиль</h1><div className="bg-white p-6 rounded-3xl text-center"><div className="w-20 h-20 bg-slate-200 rounded-full mx-auto mb-4"></div><h2 className="text-xl font-bold">{userProfile.name}</h2><p className="text-indigo-500">{userProfile.archetype}</p><button onClick={() => setCurrentView('ARCHETYPE_RESULT_VIEW')} className="mt-4 text-sm font-bold text-slate-400">Показать архетип</button></div></div>}
        {currentView === 'SETTINGS' && <div className="p-6"><h1 className="text-2xl font-bold mb-4">Настройки</h1><button onClick={() => { if(confirm('Сброс?')) localStorage.clear(); location.reload(); }} className="w-full p-4 bg-red-50 text-red-500 rounded-xl font-bold">Сбросить всё</button></div>}
        {currentView === 'RANKS_INFO' && <div className="p-6"><h1 className="text-2xl font-bold mb-4">Древо Сознания</h1>{TREE_STAGES.map(s => <div key={s.title} className="bg-white p-4 rounded-xl mb-2 flex items-center"><span className="text-2xl mr-4">{s.emoji}</span><div><h3 className="font-bold">{s.title}</h3><p className="text-xs text-slate-500">{s.desc}</p></div></div>)}</div>}
      </main>
      {['HOME', 'HISTORY', 'PROFILE', 'SETTINGS'].includes(currentView) && <BottomNav currentView={currentView as any} onChangeView={(v) => setCurrentView(v)} />}
    </div>
  );
};

export default App;
