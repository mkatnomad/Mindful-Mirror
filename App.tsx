import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToGemini } from './services/geminiService';
// Используем только 100% безопасные иконки
import { 
  Heart, BookOpen, ChevronRight, User as UserIcon, Zap, Star, 
  ArrowLeft, Medal, Loader2, Cloud, Moon, Sun, Coffee, Brain, 
  Briefcase, Feather, Compass, Anchor, Target, Battery, X, 
  Shield, Map, Smile, Lightbulb, CheckCircle, Leaf, Sprout, 
  TreeDeciduous, Send 
} from 'lucide-react';

// --- 1. ВСТРОЕННЫЕ ТИПЫ ---
type ViewState = 'HOME' | 'ONBOARDING' | 'CHAT' | 'HISTORY' | 'PROFILE' | 'SETTINGS' | 'ABOUT' | 'READ_HISTORY' | 'RANKS_INFO' | 'DAILY_GUIDE' | 'ARCHETYPE_RESULT' | 'TUTORIAL';
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

const STORAGE_KEYS = {
  PROFILE: 'mm_profile_homefirst_v1', 
  HISTORY: 'mm_history_homefirst_v1',
  SESSIONS: 'mm_sessions_homefirst_v1',
  TIME: 'mm_time_homefirst_v1',
  JOURNAL: 'mm_journal_homefirst_v1',
  DAILY_INSIGHT: 'mm_insight_homefirst_v1'
};

const Logo = ({ className = "w-20 h-20" }: { className?: string }) => (
  <img src="/logo.png" alt="Mindful Mirror" className={`${className} object-contain`} onError={(e) => e.currentTarget.style.display = 'none'} />
);

// --- 2. ГРАФИКА ДЕРЕВЬЕВ ---
const TreeIllustration: React.FC<{ stage: number, className?: string }> = ({ stage, className }) => {
  const c = className || "w-full h-full";
  if (stage <= 1) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#FEF3C7" /><path d="M50 75C50 75 40 75 40 75" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="70" r="6" fill="#B45309" /></svg>;
  if (stage === 2) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#ECFDF5" /><path d="M50 80V60" stroke="#059669" strokeWidth="3" strokeLinecap="round"/><path d="M50 60C50 60 35 55 35 45C35 55 50 60 50 60Z" fill="#10B981" /><path d="M50 60C50 60 65 55 65 45C65 55 50 60 50 60Z" fill="#34D399" /></svg>;
  if (stage === 3) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#D1FAE5" /><path d="M50 85V50" stroke="#059669" strokeWidth="3" strokeLinecap="round"/><path d="M50 65L65 55" stroke="#059669" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="45" r="10" fill="#10B981" /><circle cx="65" cy="55" r="6" fill="#34D399" /></svg>;
  if (stage === 4) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#A7F3D0" /><path d="M50 85V45" stroke="#92400E" strokeWidth="4" strokeLinecap="round"/><path d="M50 65L30 55" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="40" r="15" fill="#10B981" /><circle cx="30" cy="55" r="8" fill="#34D399" /><circle cx="65" cy="50" r="8" fill="#34D399" /></svg>;
  if (stage === 5) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#6EE7B7" /><path d="M50 90V40" stroke="#92400E" strokeWidth="5" strokeLinecap="round"/><path d="M50 60L25 50" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/><path d="M50 50L75 40" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="35" r="20" fill="#059669" /><circle cx="25" cy="50" r="12" fill="#10B981" /><circle cx="75" cy="40" r="12" fill="#10B981" /></svg>;
  if (stage === 6) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#34D399" /><path d="M50 90L50 35" stroke="#78350F" strokeWidth="6" strokeLinecap="round"/><path d="M50 70L20 60" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/><path d="M50 60L80 50" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="30" r="25" fill="#047857" /><circle cx="20" cy="60" r="15" fill="#059669" /><circle cx="80" cy="50" r="15" fill="#059669" /></svg>;
  if (stage === 7) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#10B981" /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="7" strokeLinecap="round"/><path d="M50 70L20 55" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/><path d="M50 60L85 45" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/><circle cx="50" cy="35" r="30" fill="#064E3B" /><circle cx="20" cy="55" r="18" fill="#065F46" /><circle cx="85" cy="45" r="18" fill="#065F46" /><circle cx="35" cy="80" r="5" fill="#064E3B" opacity="0.5"/></svg>;
  // 8: Древо Мудрости
  return (<svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="48" fill="#ECFDF5" /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="10" strokeLinecap="round"/><circle cx="50" cy="40" r="40" fill="#064E3B" /><circle cx="20" cy="65" r="25" fill="#065F46" /><circle cx="80" cy="65" r="25" fill="#065F46" /><circle cx="50" cy="25" r="15" fill="#10B981" /></svg>);
};

const TREE_STAGES = [
  { threshold: 5000, title: "Древо Мудрости", stageIndex: 8, desc: "Вершина эволюции." },
  { threshold: 1200, title: "Цветущее Древо", stageIndex: 7, desc: "Потенциал раскрыт." },
  { threshold: 600, title: "Ветвистое Древо", stageIndex: 6, desc: "Знания расширяются." },
  { threshold: 300, title: "Крепкое Древо", stageIndex: 5, desc: "Уверенность." },
  { threshold: 150, title: "Молодое Дерево", stageIndex: 4, desc: "Укрепление." },
  { threshold: 75, title: "Саженец", stageIndex: 3, desc: "Корни." },
  { threshold: 30, title: "Побег", stageIndex: 2, desc: "Шаг к свету." },
  { threshold: 10, title: "Росток", stageIndex: 1, desc: "Первые всходы." },
  { threshold: 0, title: "Семя", stageIndex: 0, desc: "Начало." },
];

const ARCHETYPE_INFO: any = {
  "Творец": { desc: "Вы видите мир как полотно.", strength: "Воображение", shadow: "Перфекционизм", advice: "Создавайте!", icon: Feather, color: "text-purple-600", bg: "bg-purple-50" },
  "Правитель": { desc: "Вы создаете порядок.", strength: "Лидерство", shadow: "Контроль", advice: "Делегируйте.", icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50" },
  "Мудрец": { desc: "Вы ищете истину.", strength: "Интеллект", shadow: "Бездействие", advice: "Действуйте.", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
  "Хранитель": { desc: "Вы — опора.", strength: "Эмпатия", shadow: "Жертвенность", advice: "Берегите себя.", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
  "Искатель": { desc: "Вы — путник.", strength: "Свобода", shadow: "Непостоянство", advice: "Найдите дом.", icon: Compass, color: "text-amber-600", bg: "bg-amber-50" }
};

// --- 3. ВНУТРЕННИЕ КОМПОНЕНТЫ ---

const InternalChat: React.FC<{ mode: JournalMode, onBack: () => void, onComplete: (msg: any, dur: number) => void }> = ({ mode, onBack, onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([{ id: '1', role: 'assistant', content: 'Привет! О чем хочешь поговорить?', timestamp: Date.now() }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const startTime = useRef(Date.now());

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [userMsg, ...prev]); 
    setInput('');
    setLoading(true);
    try {
      const response = await sendMessageToGemini(input);
      setMessages(prev => [{ id: (Date.now()+1).toString(), role: 'assistant', content: response, timestamp: Date.now() }, ...prev]);
    } catch {
      setMessages(prev => [{ id: (Date.now()+1).toString(), role: 'assistant', content: "Ошибка связи.", timestamp: Date.now() }, ...prev]);
    } finally { setLoading(false); }
  };

  const finish = () => { onComplete(messages, Math.round((Date.now() - startTime.current) / 1000)); onBack(); };

  return (
    <div className="flex flex-col h-full bg-white z-50 fixed inset-0">
      <div className="p-4 border-b flex justify-between items-center bg-white">
        <button onClick={onBack}><ArrowLeft size={24} className="text-slate-500" /></button>
        <span className="font-bold text-slate-800">{mode}</span>
        <button onClick={finish} className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">Завершить</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse space-y-reverse space-y-4 bg-slate-50">
        {loading && <div className="self-start bg-white p-3 rounded-2xl shadow-sm"><Loader2 className="animate-spin text-indigo-500" size={16}/></div>}
        {messages.map(m => (<div key={m.id} className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'self-end bg-indigo-600 text-white' : 'self-start bg-white text-slate-800 shadow-sm'}`}>{m.content}</div>))}
      </div>
      <div className="p-4 border-t bg-white flex space-x-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Напишите..." className="flex-1 bg-slate-100 rounded-full px-4 py-3 outline-none text-sm" />
        <button onClick={send} className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Send size={20} /></button>
      </div>
    </div>
  );
};

const InternalBottomNav: React.FC<{ currentView: string, onChangeView: (v: string) => void }> = ({ currentView, onChangeView }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 px-6 py-4 flex justify-between items-center z-40">
    {[{ id: 'HOME', icon: Zap, label: 'Путь' }, { id: 'HISTORY', icon: BookOpen, label: 'История' }, { id: 'PROFILE', icon: UserIcon, label: 'Профиль' }].map(item => (
      <button key={item.id} onClick={() => onChangeView(item.id)} className={`flex flex-col items-center space-y-1 ${currentView === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
        <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} />{currentView === item.id && <span className="text-[10px] font-bold">{item.label}</span>}
      </button>
    ))}
  </div>
);

// --- ЭКРАНЫ ---

const ArchetypeResultScreen: React.FC<{ archetype: string, onContinue: () => void }> = ({ archetype, onContinue }) => {
  const info = ARCHETYPE_INFO[archetype] || ARCHETYPE_INFO["Искатель"];
  const Icon = info.icon;
  return (
    <div className="h-full bg-white p-6 flex flex-col items-center text-center animate-fade-in pt-12">
      <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl ${info.bg} ${info.color}`}><Icon size={64} /></div>
      <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ваш Архетип</h2>
      <h1 className="text-4xl font-black text-slate-800 mb-6">{archetype}</h1>
      <p className="text-lg text-slate-600 mb-8">{info.desc}</p>
      <div className="w-full space-y-4 mb-8 text-left">
        <div className="p-4 bg-slate-50 rounded-xl"><span className="font-bold block text-slate-500 text-xs uppercase mb-1">Сила</span>{info.strength}</div>
        <div className="p-4 bg-slate-50 rounded-xl"><span className="font-bold block text-slate-500 text-xs uppercase mb-1">Тень</span>{info.shadow}</div>
        <div className="p-4 bg-indigo-50 rounded-xl text-indigo-900"><span className="font-bold block text-indigo-400 text-xs uppercase mb-1">Совет</span>{info.advice}</div>
      </div>
      <button onClick={onContinue} className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-lg">Далее</button>
    </div>
  );
};

const TutorialScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [slide, setSlide] = useState(0);
  const slides = [
    { t: "Карта Дня", d: "Каждое утро — персональный план.", i: Map, c: "text-indigo-500", b: "bg-indigo-50" },
    { t: "Настроение", d: "Адаптируйте план под энергию.", i: Battery, c: "text-emerald-500", b: "bg-emerald-50" },
    { t: "Древо", d: "Растите свое сознание.", i: Sprout, c: "text-amber-500", b: "bg-amber-50" }
  ];
  return (
    <div className="h-full bg-white p-6 flex flex-col justify-center items-center text-center animate-fade-in">
      <div className={`w-32 h-32 rounded-3xl flex items-center justify-center mb-8 ${slides[slide].b} ${slides[slide].c}`}>{React.createElement(slides[slide].i, { size: 64 })}</div>
      <h2 className="text-3xl font-black text-slate-800 mb-4">{slides[slide].t}</h2>
      <p className="text-slate-500 text-lg mb-8">{slides[slide].d}</p>
      <button onClick={() => { if (slide < 2) setSlide(s => s + 1); else onFinish(); }} className="w-full py-4 rounded-xl bg-indigo-600 text-white font-bold text-lg">{slide < 2 ? "Далее" : "Начать"}</button>
    </div>
  );
};

const OnboardingScreen: React.FC<{ onComplete: (data: Partial<UserProfile>) => void, onBack: () => void }> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<any>({ CREATOR: 0, RULER: 0, SAGE: 0, CAREGIVER: 0, EXPLORER: 0 });
  const [finalData, setFinalData] = useState<any>({});
  
  const steps = [
    { title: "Что вдохновляет?", type: 'archetype', options: [{ label: "Творчество", type: 'CREATOR', icon: Feather }, { label: "Успех", type: 'RULER', icon: Target }, { label: "Знания", type: 'SAGE', icon: BookOpen }, { label: "Забота", type: 'CAREGIVER', icon: Heart }] },
    { title: "Чего избегаете?", type: 'archetype', options: [{ label: "Скуки", type: 'CREATOR', icon: Activity }, { label: "Хаоса", type: 'RULER', icon: Lock }, { label: "Незнания", type: 'SAGE', icon: Search }, { label: "Застоя", type: 'EXPLORER', icon: Map }] },
    { title: "Главный фокус?", key: 'focus', options: [{ label: "Финансы", value: "Рост доходов", icon: Zap }, { label: "Спокойствие", value: "Снижение стресса", icon: Cloud }, { label: "Режим", value: "Дисциплина", icon: Brain }, { label: "Отношения", value: "Семья", icon: Heart }] },
    { title: "Что мешает?", key: 'struggle', options: [{ label: "Лень", value: "Прокрастинация", icon: Clock }, { label: "Страх", value: "Неуверенность", icon: Lock }, { label: "Усталость", value: "Выгорание", icon: Battery }, { label: "Хаос", value: "Расфокус", icon: Activity }] },
    { title: "Биоритмы?", key: 'chronotype', options: [{ label: "Жаворонок", value: "Утро", icon: Sun }, { label: "Сова", value: "Вечер", icon: Moon }, { label: "Разные", value: "Плавающий", icon: Activity }] }
  ];

  const currentStep = steps[step];

  const handleSelect = (option: any) => {
    if (currentStep.type === 'archetype') setScores((prev:any) => ({ ...prev, [option.type]: prev[option.type] + 1 }));
    if (currentStep.key) setFinalData((prev:any) => ({ ...prev, [currentStep.key!]: option.value }));

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
       <button onClick={onBack} className="self-start mb-6 text-slate-400"><ArrowLeft /></button>
       <div className="mb-8"><div className="flex space-x-1 mb-4">{steps.map((_, i) => (<div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-indigo-500' : 'bg-slate-100'}`} />))}</div><h2 className="text-2xl font-bold text-slate-800">{currentStep.title}</h2></div>
       <div className="space-y-3">{currentStep.options.map((opt: any, i: number) => { const Icon = opt.icon; return (<button key={i} onClick={() => handleSelect(opt)} className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center hover:bg-indigo-50"><Icon size={20} className="text-indigo-500 mr-3" /><span className="font-semibold text-slate-700">{opt.label}</span></button>) })}</div>
    </div>
  );
};

// --- APP ---
const App: React.FC = () => {
  // АВТО-СБРОС ДЛЯ ПОЧИНКИ
  useEffect(() => {
    const hasReset = localStorage.getItem('mm_monolith_fix_v2');
    if (!hasReset) { localStorage.clear(); localStorage.setItem('mm_monolith_fix_v2', 'true'); window.location.reload(); }
  }, []);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try { const s = localStorage.getItem(STORAGE_KEYS.PROFILE); return s ? JSON.parse(s) : { onboardingCompleted: false, currentMood: 'ok' }; } catch { return { onboardingCompleted: false, currentMood: 'ok' }; }
  });

  const [currentView, setCurrentView] = useState<string>('HOME'); // ВСЕГДА HOME ПО УМОЛЧАНИЮ
  const [selectedMode, setSelectedMode] = useState<JournalMode | null>(null);
  const [dailyInsight, setDailyInsight] = useState<DailyInsightData | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [isBatteryModalOpen, setIsBatteryModalOpen] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);

  // Сохранение
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile)); }, [userProfile]);

  // Дерево
  const currentTree = TREE_STAGES.find(r => totalSessions >= r.threshold) || TREE_STAGES[8];

  // Генерация
  useEffect(() => {
    const gen = async () => {
      if (!userProfile.onboardingCompleted || !userProfile.name) return;
      setIsInsightLoading(true);
      try {
        const res = await sendMessageToGemini("Совет дня...");
        const p = res.split('|||');
        setDailyInsight({ date: new Date().toDateString(), generatedForMood: userProfile.currentMood, mindset: p[0]||"Фокус", action: p[1]||"Действие", health: p[2]||"Энергия", insight: p[3]||"Мысль" });
      } catch(e) {} finally { setIsInsightLoading(false); }
    };
    gen();
  }, [userProfile.name, userProfile.currentMood]);

  // RENDER HOME
  const renderHome = () => (
    <div className="h-full overflow-y-auto px-6 pt-6 pb-32">
       <div className="flex justify-between items-center mb-6">
         <div><h1 className="text-xl font-bold text-slate-800">Привет!</h1><p className="text-xs text-slate-500">{userProfile.archetype || 'Начало пути'}</p></div>
         <Logo />
       </div>

       {!userProfile.onboardingCompleted ? (
         <button onClick={() => setCurrentView('ONBOARDING')} className="w-full bg-slate-900 rounded-[32px] p-6 text-white text-left shadow-lg mb-8 relative overflow-hidden">
           <div className="relative z-10"><Compass className="mb-4" /><h2 className="text-xl font-bold mb-2">Найти свой путь</h2><p className="text-sm opacity-80 mb-4">Пройдите тест, чтобы получить карту дня.</p><span className="bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold">Начать</span></div>
         </button>
       ) : (
         <div className="w-full bg-white border border-slate-100 rounded-[32px] p-6 shadow-lg shadow-indigo-100/50 mb-8">
            <div className="flex justify-between mb-4">
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">Фокус дня</span>
              <button onClick={() => setIsBatteryModalOpen(true)} className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded-full"><Battery size={12} /><span className="text-[10px]">{userProfile.currentMood || 'Норм'}</span></button>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 line-clamp-3">{isInsightLoading ? "Загрузка..." : (dailyInsight?.mindset || "...")}</h2>
            <button onClick={() => setCurrentView('DAILY_GUIDE')} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm">Открыть карту</button>
         </div>
       )}

       <div className="grid grid-cols-3 gap-3 mb-8">
         <button onClick={() => { setSelectedMode('DECISION'); setCurrentView('CHAT'); }} className="p-4 bg-indigo-50 rounded-2xl flex flex-col items-center"><Zap size={24} className="text-indigo-500 mb-2" /><span className="text-[10px] font-bold text-slate-600">РЕШЕНИЕ</span></button>
         <button onClick={() => { setSelectedMode('EMOTIONS'); setCurrentView('CHAT'); }} className="p-4 bg-rose-50 rounded-2xl flex flex-col items-center"><Heart size={24} className="text-rose-500 mb-2" /><span className="text-[10px] font-bold text-slate-600">ЭМОЦИИ</span></button>
         <button onClick={() => { setSelectedMode('REFLECTION'); setCurrentView('CHAT'); }} className="p-4 bg-emerald-50 rounded-2xl flex flex-col items-center"><BookOpen size={24} className="text-emerald-500 mb-2" /><span className="text-[10px] font-bold text-slate-600">ДНЕВНИК</span></button>
       </div>

       <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-4"><div className="w-12 h-12"><TreeIllustration stage={currentTree.stageIndex} className="w-full h-full" /></div><div><p className="text-[10px] uppercase text-slate-400 font-bold">Древо</p><h4 className="font-bold text-slate-800">{currentTree.title}</h4></div></div>
          <div className="text-right"><p className="font-bold text-slate-800">{totalSessions}</p><p className="text-[9px] text-slate-400 uppercase">Сессий</p></div>
       </div>
    </div>
  );

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col font-sans bg-[#F8FAFC]">
      <main className="flex-1 relative overflow-hidden z-10">
        {isBatteryModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" onClick={() => setIsBatteryModalOpen(false)}>
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm"><h3 className="text-xl font-bold text-center mb-4">Заряд?</h3><div className="grid grid-cols-2 gap-2">{['high','flow','ok','low'].map(m => (<button key={m} onClick={() => { setUserProfile(p=>({...p, currentMood: m as any})); setIsBatteryModalOpen(false); }} className="p-3 bg-slate-50 rounded-xl font-bold text-slate-700">{m}</button>))}</div></div>
          </div>
        )}
        {currentView === 'HOME' && renderHome()}
        {currentView === 'ONBOARDING' && <OnboardingScreen onComplete={(d) => { setUserProfile(p => ({...p, ...d, onboardingCompleted: true})); setCurrentView('ARCHETYPE_RESULT'); }} onBack={() => setCurrentView('HOME')} />}
        {currentView === 'ARCHETYPE_RESULT' && <ArchetypeResultScreen archetype={userProfile.archetype || 'Искатель'} onContinue={() => setCurrentView('TUTORIAL')} />}
        {currentView === 'TUTORIAL' && <TutorialScreen onFinish={() => setCurrentView('HOME')} />}
        {currentView === 'DAILY_GUIDE' && <div className="p-6"><h1>Карта дня</h1><p>{dailyInsight?.mindset}</p><button onClick={() => setCurrentView('HOME')}>Назад</button></div>}
        {currentView === 'CHAT' && <InternalChat mode={selectedMode!} onBack={() => setCurrentView('HOME')} onComplete={(msgs) => { setHistory(p => [...p, { id: Date.now().toString(), mode: selectedMode!, date: Date.now(), duration: 0, preview: '...', messages: msgs }]); setTotalSessions(p => p+1); }} />}
        {currentView === 'PROFILE' && <div className="p-6"><h1 className="text-2xl font-bold">Профиль</h1><p>{userProfile.name}</p><p>{userProfile.archetype}</p></div>}
        {currentView === 'HISTORY' && <div className="p-6"><h1 className="text-2xl font-bold">История</h1>{history.map(h => <div key={h.id} className="p-2 border-b">{h.preview}</div>)}</div>}
      </main>
      {['HOME', 'HISTORY', 'PROFILE'].includes(currentView) && <InternalBottomNav currentView={currentView} onChangeView={setCurrentView} />}
    </div>
  );
};

export default App;
