import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, BookOpen, ChevronRight, Settings, Info, User as UserIcon, 
  Activity, Zap, Camera, Star, ArrowLeft, MessageSquare, Award, Medal, 
  RefreshCw, Loader2, Cloud, Lock, Moon, Search, Sun, Coffee, Brain, 
  Briefcase, Feather, Compass, Anchor, Target, Battery, X, Shield, Map, 
  Smile, Lightbulb, CheckCircle, Leaf, Sprout, TreeDeciduous 
} from 'lucide-react';

// --- 1. ВСТРОЕННЫЕ ТИПЫ (Чтобы не зависеть от types.ts) ---
type ViewState = 'ONBOARDING' | 'HOME' | 'CHAT' | 'HISTORY' | 'PROFILE' | 'SETTINGS' | 'ABOUT' | 'READ_HISTORY' | 'RANKS_INFO' | 'DAILY_GUIDE' | 'ARCHETYPE_RESULT' | 'TUTORIAL';
type JournalMode = 'DECISION' | 'EMOTIONS' | 'REFLECTION';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  mode: JournalMode;
  date: number;
  duration: number;
  preview: string;
  messages: Message[];
}

interface UserProfile {
  name: string;
  avatarUrl: string | null;
  onboardingCompleted?: boolean;
  archetype?: string; 
  focus?: string;
  struggle?: string;
  chronotype?: string;
  currentMood?: 'high' | 'flow' | 'ok' | 'low';
}

interface DailyInsightData {
  date: string;
  generatedForMood?: string;
  mindset: string;
  action: string;
  health: string;
  insight: string;
}

// --- 2. ПРЕДОХРАНИТЕЛЬ (Error Boundary) ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: string }> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: '' }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, error: error.toString() }; }
  componentDidCatch(error: any, errorInfo: any) { console.error("App Crash:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-red-50">
          <h2 className="text-xl font-bold text-red-600 mb-2">Приложение остановлено</h2>
          <p className="text-xs font-mono bg-white p-4 rounded border border-red-200 mb-4 text-left w-full overflow-auto max-h-40">{this.state.error}</p>
          <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold">СБРОСИТЬ ДАННЫЕ</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- 3. ЗАГЛУШКИ ДЛЯ API И СЕРВИСОВ ---
// (Вместо импорта из services/geminiService)
const mockSendMessage = async (prompt: string): Promise<string> => {
  await new Promise(r => setTimeout(r, 1500)); // Имитация задержки
  return "Фокусируйся на главном.|||Сделай один шаг к цели.|||Дыши глубже и пей воду.|||Ответы уже внутри тебя.";
};

// --- 4. ВСТРОЕННЫЕ КОМПОНЕНТЫ UI ---

// BottomNav (Встроенный)
const InternalBottomNav: React.FC<{ currentView: any, onChangeView: (v: any) => void }> = ({ currentView, onChangeView }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 flex justify-between items-center z-50 safe-area-pb">
    {[
      { id: 'HOME', icon: Zap, label: 'Путь' },
      { id: 'HISTORY', icon: BookOpen, label: 'История' },
      { id: 'PROFILE', icon: UserIcon, label: 'Профиль' }
    ].map(item => (
      <button key={item.id} onClick={() => onChangeView(item.id)} className={`flex flex-col items-center space-y-1 ${currentView === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
        <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} />
        <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
      </button>
    ))}
  </div>
);

// Векторное дерево (Встроенное)
const TreeIllustration: React.FC<{ stage: number, className?: string }> = ({ stage, className }) => {
  const c = className || "w-full h-full";
  if (stage <= 1) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#FEF3C7" /><path d="M50 75C50 75 40 75 40 75" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="70" r="6" fill="#B45309" /></svg>;
  if (stage === 2) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#ECFDF5" /><path d="M50 80V60" stroke="#059669" strokeWidth="3" strokeLinecap="round"/><path d="M50 60C50 60 35 55 35 45C35 55 50 60 50 60Z" fill="#10B981" /><path d="M50 60C50 60 65 55 65 45C65 55 50 60 50 60Z" fill="#34D399" /></svg>;
  if (stage === 3) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#D1FAE5" /><path d="M50 85V50" stroke="#059669" strokeWidth="3" strokeLinecap="round"/><path d="M50 65L65 55" stroke="#059669" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="45" r="10" fill="#10B981" /><circle cx="65" cy="55" r="6" fill="#34D399" /></svg>;
  if (stage === 4) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#A7F3D0" /><path d="M50 85V45" stroke="#92400E" strokeWidth="4" strokeLinecap="round"/><path d="M50 65L30 55" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="40" r="15" fill="#10B981" /><circle cx="30" cy="55" r="8" fill="#34D399" /><circle cx="65" cy="50" r="8" fill="#34D399" /></svg>;
  if (stage === 5) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#6EE7B7" /><path d="M50 90V40" stroke="#92400E" strokeWidth="5" strokeLinecap="round"/><path d="M50 60L25 50" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/><path d="M50 50L75 40" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="35" r="20" fill="#059669" /><circle cx="25" cy="50" r="12" fill="#10B981" /><circle cx="75" cy="40" r="12" fill="#10B981" /></svg>;
  if (stage === 6) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#34D399" /><path d="M50 90L50 35" stroke="#78350F" strokeWidth="6" strokeLinecap="round"/><path d="M50 70L20 60" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/><path d="M50 60L80 50" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="30" r="25" fill="#047857" /><circle cx="20" cy="60" r="15" fill="#059669" /><circle cx="80" cy="50" r="15" fill="#059669" /></svg>;
  if (stage === 7) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#10B981" /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="7" strokeLinecap="round"/><path d="M50 70L20 55" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/><path d="M50 60L85 45" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/><circle cx="50" cy="35" r="30" fill="#064E3B" /><circle cx="20" cy="55" r="18" fill="#065F46" /><circle cx="85" cy="45" r="18" fill="#065F46" /><circle cx="35" cy="80" r="5" fill="#064E3B" opacity="0.5"/></svg>;
  // Древо Мудрости (8+)
  return (<svg viewBox="0 0 100 100" className={c} fill="none"><defs><radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" style={{stopColor:'rgb(255,255,255)', stopOpacity:0.8}} /><stop offset="100%" style={{stopColor:'rgb(16, 185, 129)', stopOpacity:0}} /></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#grad1)" /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="10" strokeLinecap="round"/><circle cx="50" cy="40" r="40" fill="#064E3B" /><circle cx="20" cy="65" r="25" fill="#065F46" /><circle cx="80" cy="65" r="25" fill="#065F46" /><circle cx="50" cy="25" r="15" fill="#10B981" /></svg>);
};

const TREE_STAGES = [
  { threshold: 5000, title: "Древо Мудрости", stageIndex: 8, desc: "Вершина." },
  { threshold: 1200, title: "Цветущее Древо", stageIndex: 7, desc: "Потенциал." },
  { threshold: 600, title: "Ветвистое Древо", stageIndex: 6, desc: "Знания." },
  { threshold: 300, title: "Крепкое Древо", stageIndex: 5, desc: "Уверенность." },
  { threshold: 150, title: "Молодое Дерево", stageIndex: 4, desc: "Укрепление." },
  { threshold: 75, title: "Саженец", stageIndex: 3, desc: "Корни." },
  { threshold: 30, title: "Побег", stageIndex: 2, desc: "Шаг к свету." },
  { threshold: 10, title: "Росток", stageIndex: 1, desc: "Первые всходы." },
  { threshold: 0, title: "Семя", stageIndex: 0, desc: "Начало." },
];

const ARCHETYPE_INFO: any = {
  "Творец": { desc: "Творец видит мир как полотно.", strength: "Воображение", shadow: "Перфекционизм", advice: "Создавай!", icon: Feather, color: "text-purple-600", bg: "bg-purple-50" },
  "Правитель": { desc: "Правитель создает порядок.", strength: "Лидерство", shadow: "Контроль", advice: "Делегируй.", icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50" },
  "Мудрец": { desc: "Мудрец ищет истину.", strength: "Интеллект", shadow: "Бездействие", advice: "Действуй.", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
  "Хранитель": { desc: "Хранитель — это опора.", strength: "Эмпатия", shadow: "Жертвенность", advice: "Береги себя.", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
  "Искатель": { desc: "Искатель — вечный путник.", strength: "Свобода", shadow: "Непостоянство", advice: "Найдите дом.", icon: Compass, color: "text-amber-600", bg: "bg-amber-50" }
};

// --- 5. КОМПОНЕНТЫ ЭКРАНОВ ---

// Результат теста
const ArchetypeResultScreen: React.FC<{ archetype: string, onContinue: () => void }> = ({ archetype, onContinue }) => {
  const info = ARCHETYPE_INFO[archetype] || ARCHETYPE_INFO["Искатель"];
  const Icon = info.icon;
  return (
    <div className="h-full bg-white p-6 flex flex-col items-center text-center animate-fade-in">
      <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 ${info.bg} ${info.color}`}><Icon size={64} /></div>
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ваш Архетип</h2>
      <h1 className="text-4xl font-black text-slate-800 mb-6">{archetype}</h1>
      <p className="text-lg text-slate-600 mb-8">{info.desc}</p>
      <div className="w-full space-y-4 mb-8 text-left">
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><span className="font-bold text-slate-700 block">Сила</span>{info.strength}</div>
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><span className="font-bold text-slate-700 block">Совет</span>{info.advice}</div>
      </div>
      <button onClick={onContinue} className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-lg">Далее</button>
    </div>
  );
};

// Туториал
const TutorialScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [slide, setSlide] = useState(0);
  const slides = [
    { title: "Карта Дня", desc: "Утренний план от ИИ.", icon: Map, color: "text-indigo-500", bg: "bg-indigo-50" },
    { title: "Настроение", desc: "Адаптируйте план под энергию.", icon: Battery, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Древо", desc: "Ваш прогресс — это дерево.", icon: Sprout, color: "text-amber-500", bg: "bg-amber-50" }
  ];
  return (
    <div className="h-full bg-white p-6 flex flex-col justify-center items-center text-center animate-fade-in">
      <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 ${slides[slide].bg} ${slides[slide].color}`}>{React.createElement(slides[slide].icon, { size: 64 })}</div>
      <h2 className="text-3xl font-black text-slate-800 mb-4">{slides[slide].title}</h2>
      <p className="text-slate-500 text-lg mb-8">{slides[slide].desc}</p>
      <button onClick={() => { if (slide < 2) setSlide(s => s + 1); else onFinish(); }} className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-lg">{slide < 2 ? "Далее" : "Начать"}</button>
    </div>
  );
};

// Опрос
const OnboardingScreen: React.FC<{ onComplete: (data: Partial<UserProfile>) => void }> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ CREATOR: 0, RULER: 0, SAGE: 0, CAREGIVER: 0, EXPLORER: 0 });
  
  const steps = [
    { title: "Что вдохновляет?", options: [{ label: "Творчество", type: 'CREATOR', icon: Feather }, { label: "Успех", type: 'RULER', icon: Target }, { label: "Знания", type: 'SAGE', icon: BookOpen }, { label: "Забота", type: 'CAREGIVER', icon: Heart }] },
    { title: "Чего избегаете?", options: [{ label: "Скуки", type: 'CREATOR', icon: Activity }, { label: "Хаоса", type: 'RULER', icon: Lock }, { label: "Незнания", type: 'SAGE', icon: Search }, { label: "Застоя", type: 'EXPLORER', icon: Map }] },
    { title: "Главный фокус?", key: 'focus', options: [{ label: "Финансы", value: "Рост доходов", icon: Zap }, { label: "Спокойствие", value: "Снижение стресса", icon: Cloud }, { label: "Режим", value: "Дисциплина", icon: Brain }, { label: "Отношения", value: "Семья", icon: Heart }] },
    { title: "Биоритмы?", key: 'chronotype', options: [{ label: "Утро", value: "Утро", icon: Sun }, { label: "Вечер", value: "Вечер", icon: Moon }, { label: "Разные", value: "Плавающий", icon: Activity }] }
  ];

  const currentStep = steps[step];
  if (!currentStep) return null;

  const handleSelect = (option: any) => {
    if (option.type) setScores(prev => ({ ...prev, [option.type]: (prev[option.type as keyof typeof scores] || 0) + 1 }));
    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      let winner = 'SAGE';
      let max = -1;
      Object.entries(scores).forEach(([k, v]) => { if (v > max) { max = v; winner = k; } });
      const archMap: any = { CREATOR: "Творец", RULER: "Правитель", SAGE: "Мудрец", CAREGIVER: "Хранитель", EXPLORER: "Искатель" };
      onComplete({ archetype: archMap[winner] || "Искатель" });
    }
  };

  return (
    <div className="h-full bg-white p-6 pt-10 flex flex-col">
      <h2 className="text-2xl font-bold text-slate-800 mb-8 text-center">{currentStep.title}</h2>
      <div className="space-y-3">{currentStep.options.map((opt: any, i: number) => { const Icon = opt.icon; return (<button key={i} onClick={() => handleSelect(opt)} className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center hover:bg-indigo-50"><Icon size={20} className="text-indigo-500 mr-3" /><span className="font-semibold text-slate-700">{opt.label}</span></button>) })}</div>
    </div>
  );
};

// --- ОСНОВНОЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ ---
const App: React.FC = () => {
  // КЛЮЧИ ХРАНИЛИЩА (НОВЫЕ = СБРОС)
  const KEY_PROFILE = 'mm_profile_mono_v1';
  const KEY_INSIGHT = 'mm_insight_mono_v1';
  const KEY_SESSIONS = 'mm_sessions_mono_v1';

  // State
  const [user, setUser] = useState<UserProfile>(() => {
    try { const s = localStorage.getItem(KEY_PROFILE); return s ? JSON.parse(s) : { onboardingCompleted: false, name: 'Странник', currentMood: 'ok' }; } catch { return { onboardingCompleted: false, name: 'Странник', currentMood: 'ok' }; }
  });
  
  const [view, setView] = useState<string>(user.onboardingCompleted ? 'HOME' : 'ONBOARDING');
  const [insight, setInsight] = useState<DailyInsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showMood, setShowMood] = useState(false);
  const [sessions, setSessions] = useState(0);

  // Load Insight & Sessions
  useEffect(() => {
    try {
      const i = localStorage.getItem(KEY_INSIGHT); if (i) setInsight(JSON.parse(i));
      const s = localStorage.getItem(KEY_SESSIONS); if (s) setSessions(parseInt(s) || 0);
    } catch {}
  }, []);

  // Save User
  useEffect(() => { localStorage.setItem(KEY_PROFILE, JSON.stringify(user)); }, [user]);

  // Tree Logic
  const getTree = () => TREE_STAGES.find(r => sessions >= r.threshold) || TREE_STAGES[7];
  const currentTree = getTree();

  // Generator
  useEffect(() => {
    if (!user.onboardingCompleted) return;
    const today = new Date().toDateString();
    if (insight?.date === today && insight?.generatedForMood === user.currentMood) return;

    const gen = async () => {
      setIsLoading(true);
      try {
        const res = await mockSendMessage("prompt"); // Используем заглушку для безопасности
        const p = res.split('|||');
        const newInsight = { 
          date: today, 
          generatedForMood: user.currentMood, 
          mindset: p[0] || "Фокус", 
          action: p[1] || "Действие", 
          health: p[2] || "Энергия", 
          insight: p[3] || "Мысль" 
        };
        setInsight(newInsight);
        localStorage.setItem(KEY_INSIGHT, JSON.stringify(newInsight));
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    gen();
  }, [user.name, user.currentMood, user.onboardingCompleted]);

  // --- RENDER SCREENS ---

  if (view === 'ONBOARDING') {
    return <OnboardingScreen onComplete={(d) => { setUser(p => ({ ...p, ...d, onboardingCompleted: true })); setView('ARCHETYPE_RESULT'); }} />;
  }

  if (view === 'ARCHETYPE_RESULT') {
    return <ArchetypeResultScreen archetype={user.archetype || 'Искатель'} onContinue={() => setView('TUTORIAL')} />;
  }

  if (view === 'TUTORIAL') {
    return <TutorialScreen onFinish={() => setView('HOME')} />;
  }

  if (view === 'DAILY_GUIDE') {
    return (
      <div className="h-full bg-slate-50 px-6 pt-6 pb-24 overflow-y-auto font-sans">
        <button onClick={() => setView('HOME')} className="mb-6 flex items-center text-slate-500 font-bold"><ArrowLeft className="mr-2" /> Назад</button>
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Карта дня</h1>
        {isLoading ? <Loader2 className="animate-spin text-indigo-500 mx-auto" /> : (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"><div className="flex items-center mb-2 text-indigo-500 font-bold"><Brain size={18} className="mr-2" />МЫШЛЕНИЕ</div><p>{insight?.mindset}</p></div>
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 rounded-3xl shadow-lg"><div className="flex items-center mb-2 font-bold opacity-80"><Target size={18} className="mr-2" />ДЕЙСТВИЕ</div><p className="text-lg font-medium">{insight?.action}</p></div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"><div className="flex items-center mb-2 text-emerald-500 font-bold"><Battery size={18} className="mr-2" />ЭНЕРГИЯ</div><p>{insight?.health}</p></div>
            <div className="bg-slate-900 text-slate-200 p-6 rounded-3xl shadow-sm"><div className="flex items-center mb-2 text-amber-400 font-bold"><Sparkles size={18} className="mr-2" />ИНСАЙТ</div><p className="italic">"{insight?.insight}"</p></div>
          </div>
        )}
      </div>
    );
  }

  // HOME SCREEN
  return (
    <ErrorBoundary>
      <div className="h-screen w-full flex flex-col font-sans bg-[#F8FAFC]">
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-32">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Привет, {user.name}</h1>
              <p className="text-xs text-slate-500">{user.archetype || 'Странник'}</p>
            </div>
            <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-400"><UserIcon size={20} /></div>
          </div>

          {/* Card */}
          <div className="w-full bg-white border border-slate-100 rounded-[32px] p-6 shadow-lg shadow-indigo-100/50 mb-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-4">
                 <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">Фокус дня</span>
                 <button onClick={() => setShowMood(true)} className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors active:scale-90"><Battery size={14} className={user.currentMood === 'low' ? "text-rose-500" : "text-emerald-500"} /><span className="text-[10px] font-bold text-slate-600">{user.currentMood || 'Норм'}</span></button>
               </div>
               <div className="mb-6 min-h-[60px]">
                 {isLoading ? (<div className="flex items-center space-x-2 text-slate-400 animate-pulse"><Loader2 size={18} className="animate-spin" /><span>Создаю карту...</span></div>) : (<h2 className="text-xl font-bold text-slate-800 leading-snug line-clamp-3">{insight?.mindset || "Загрузка..."}</h2>)}
               </div>
               <button onClick={() => setView('DAILY_GUIDE')} className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center space-x-2"><Map size={16} /><span>Открыть карту дня</span><ChevronRight size={16} className="opacity-60" /></button>
             </div>
          </div>

          {/* Tools */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <button className="flex flex-col items-center p-4 rounded-[24px] bg-white border border-slate-50 shadow-sm active:scale-95"><div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3"><Zap size={24} /></div><span className="text-[11px] font-bold text-slate-500">РЕШЕНИЕ</span></button>
            <button className="flex flex-col items-center p-4 rounded-[24px] bg-white border border-slate-50 shadow-sm active:scale-95"><div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-3"><Heart size={24} /></div><span className="text-[11px] font-bold text-slate-500">ЭМОЦИИ</span></button>
            <button className="flex flex-col items-center p-4 rounded-[24px] bg-white border border-slate-50 shadow-sm active:scale-95"><div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-3"><BookOpen size={24} /></div><span className="text-[11px] font-bold text-slate-500">ДНЕВНИК</span></button>
          </div>

          {/* Tree */}
          <div className="w-full bg-gradient-to-br from-white to-slate-50 border border-slate-100 p-5 rounded-[24px] shadow-sm active:scale-95 transition-all relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-60"></div>
            <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center space-x-4">
                   <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center overflow-hidden"><TreeIllustration stage={currentTree.stageIndex} className="w-10 h-10" /></div>
                   <div className="text-left"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Древо сознания</p><h4 className="text-base font-bold text-slate-800">{currentTree.title}</h4></div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 relative z-10">
               <div className="text-center border-r border-slate-100"><p className="text-lg font-bold text-slate-800">{sessions}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Сессий</p></div>
               <div className="text-center"><p className="text-lg font-bold text-slate-800">0</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Минут</p></div>
            </div>
         </div>
        </div>

        {/* Modal */}
        {showMood && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={() => setShowMood(false)}>
            <div className="bg-white rounded-[32px] p-6 w-full max-w-xs" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold text-center mb-4">Твой заряд?</h3>
              <div className="grid grid-cols-2 gap-2">
                {[ {l:'🔥 Пик', v:'high'}, {l:'🌊 Поток', v:'flow'}, {l:'🙂 Норм', v:'ok'}, {l:'🪫 Спад', v:'low'} ].map(m => (
                  <button key={m.v} onClick={() => { setUser(p => ({...p, currentMood: m.v as any})); setShowMood(false); }} className="p-4 bg-slate-50 rounded-2xl font-bold text-slate-700">{m.l}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        <InternalBottomNav currentView={view} onChangeView={setView} />
      </div>
    </ErrorBoundary>
  );
};

export default App;
