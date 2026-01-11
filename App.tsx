import React, { useState, useEffect, useRef } from 'react';
import { ViewState, JournalMode, ChatSession, Message, UserProfile, JournalEntry, SiteConfig, DailyInsightData } from './types';
import { BottomNav } from './components/BottomNav';
import { ChatInterface } from './components/ChatInterface';
import { JournalInterface } from './components/JournalInterface';
import { AdminInterface } from './components/AdminInterface';
import { sendMessageToGemini } from './services/geminiService';
import { Heart, BookOpen, ChevronRight, Settings, Info, User as UserIcon, Activity, Quote, Clock, Zap, Camera, Star, ArrowLeft, MessageSquare, Award, Medal, RefreshCw, Loader2, Cloud, Lock, Moon, Search, Sparkles, Sun, Coffee, Brain, Briefcase, Feather, Compass, Anchor, Target, Battery, X, Shield, Map, Smile, TreeDeciduous, Sprout, Leaf } from 'lucide-react';

declare global {
  interface Window {
    Telegram: any;
  }
}

const DEFAULT_CONFIG: SiteConfig = {
  appTitle: "Mindful Mirror",
  logoText: "mm",
  customLogoUrl: null,
  customWatermarkUrl: null,
  aboutParagraphs: [
    "Mindful Mirror — это пространство для честного диалога с самим собой.",
    "Растите свое внутреннее дерево, уделяя внимание себе."
  ],
  quotes: [],
  adminPasscode: "0000"
};

const TREE_STAGES = [
  { threshold: 1500, title: "Мудрое Древо", icon: TreeDeciduous, color: "text-emerald-700", desc: "Глубокие корни и мощная крона. Вы достигли высокой осознанности." },
  { threshold: 500, title: "Крепкое Древо", icon: TreeDeciduous, color: "text-emerald-600", desc: "Вы уверенно стоите на ногах. Практика стала частью жизни." },
  { threshold: 200, title: "Молодое Дерево", icon: Leaf, color: "text-emerald-500", desc: "Вы быстро растете и развиваетесь." },
  { threshold: 50, title: "Росток", icon: Sprout, color: "text-emerald-400", desc: "Первые всходы ваших усилий." },
  { threshold: 0, title: "Семя", icon: Sprout, color: "text-emerald-300", desc: "Потенциал, готовый к пробуждению." },
];

const STORAGE_KEYS = {
  PROFILE: 'mm_profile',
  HISTORY: 'mm_history',
  SESSIONS: 'mm_total_sessions',
  TIME: 'mm_total_time',
  ACTIVITY: 'mm_weekly_activity',
  JOURNAL: 'mm_journal_entries',
  CONFIG: 'mm_site_config',
  DAILY_INSIGHT: 'mm_daily_insight_v10'
};

const StylizedMMText = ({ text = "mm", className = "", color = "white", opacity = "1" }: { text?: string, className?: string, color?: string, opacity?: string }) => (
  <span className={`${className} font-extrabold italic select-none pointer-events-none uppercase`} style={{ color, opacity, fontFamily: 'Manrope, sans-serif' }}>{text}</span>
);

// --- КОМПОНЕНТ ОПРОСА ---
const OnboardingScreen: React.FC<{ onComplete: (data: Partial<UserProfile>) => void, onBack: () => void }> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ CREATOR: 0, RULER: 0, SAGE: 0, CAREGIVER: 0, EXPLORER: 0 });
  const [finalData, setFinalData] = useState<{ focus?: string, struggle?: string, chronotype?: string, aiTone?: string }>({});
  
  const steps = [
    {
      title: "Что вас вдохновляет?",
      type: 'archetype',
      options: [
        { label: "Создание нового", type: 'CREATOR' },
        { label: "Управление и успех", type: 'RULER' },
        { label: "Познание мира", type: 'SAGE' },
        { label: "Забота о людях", type: 'CAREGIVER' },
      ]
    },
    {
      title: "Чего вы избегаете?",
      type: 'archetype',
      options: [
        { label: "Скуки и рутины", type: 'CREATOR' },
        { label: "Хаоса и беспорядка", type: 'RULER' },
        { label: "Ошибок и незнания", type: 'SAGE' },
        { label: "Застоя на месте", type: 'EXPLORER' },
      ]
    },
    {
      title: "Главный фокус сейчас?",
      key: 'focus',
      options: [
        { label: "Финансы и Карьера", value: "Рост доходов", icon: Zap },
        { label: "Спокойствие", value: "Снижение стресса", icon: Cloud },
        { label: "Дисциплина", value: "Режим и привычки", icon: Brain },
        { label: "Отношения", value: "Семья и люди", icon: Heart },
      ]
    },
    {
      title: "Что мешает больше всего?",
      key: 'struggle',
      options: [
        { label: "Прокрастинация", value: "Откладывание дел", icon: Clock },
        { label: "Тревога", value: "Неуверенность", icon: Lock },
        { label: "Нет энергии", value: "Выгорание", icon: Battery },
        { label: "Расфокус", value: "Сложно концентрироваться", icon: Activity },
      ]
    },
    {
      title: "Ваши биоритмы?",
      key: 'chronotype',
      options: [
        { label: "Утро (Жаворонок)", value: "Утренний тип", icon: Sun },
        { label: "Вечер (Сова)", value: "Вечерний тип", icon: Moon },
        { label: "По-разному", value: "Плавающий режим", icon: Activity },
      ]
    }
  ];

  const currentStepData = steps[step];

  const handleSelect = (option: any) => {
    if (option.type) setScores(prev => ({ ...prev, [option.type]: (prev[option.type as keyof typeof scores] || 0) + 1 }));
    if (questions[step]?.key) setFinalData(prev => ({ ...prev, [questions[step].key!]: option.value }));

    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      let winner = 'SAGE';
      let max = -1;
      Object.entries(scores).forEach(([k, v]) => { if (v > max) { max = v; winner = k; } });
      const archMap: any = { CREATOR: "Творец", RULER: "Правитель", SAGE: "Мудрец", CAREGIVER: "Хранитель", EXPLORER: "Искатель" };
      
      onComplete({ 
        archetype: archMap[winner] || "Искатель",
        ...finalData,
        [currentStepData.key!]: option.value 
      });
    }
  };

  const questions = steps as any; 

  return (
    <div className="h-full flex flex-col bg-white px-6 py-10 animate-fade-in relative z-50">
      <div className="flex justify-start mb-6">
         <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600"><ArrowLeft size={24} /></button>
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="mb-10">
          <div className="flex space-x-1.5 mb-8 justify-center">
            {steps.map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-100'}`} />))}
          </div>
          <h2 className="text-3xl font-black text-slate-800 text-center leading-tight mb-2">{questions[step].title}</h2>
        </div>
        <div className="space-y-3" key={step}>
          {questions[step].options.map((option: any, idx: number) => {
            const Icon = option.icon;
            return (
            <button key={idx} onClick={() => handleSelect(option)} className="w-full p-5 rounded-[24px] border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-lg transition-all active:scale-[0.98] flex items-center text-left group focus:outline-none">
              {Icon && (<div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm mr-4 group-hover:scale-110 transition-transform"><Icon size={20} /></div>)}
              <span className="font-bold text-slate-700 text-lg group-hover:text-indigo-700">{option.label}</span>
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG) || 'null') || DEFAULT_CONFIG; } catch { return DEFAULT_CONFIG; }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? { onboardingCompleted: false, currentMood: 'ok', ...JSON.parse(saved) } : { name: '', avatarUrl: null, isSetup: true, isRegistered: false, onboardingCompleted: false, currentMood: 'ok' };
    } catch { return { name: '', avatarUrl: null, isSetup: true, isRegistered: false, onboardingCompleted: false, currentMood: 'ok' }; }
  });

  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [selectedMode, setSelectedMode] = useState<JournalMode | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [dailyInsight, setDailyInsight] = useState<DailyInsightData | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_INSIGHT) || 'null'); } catch { return null; }
  });
  
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [isBatteryModalOpen, setIsBatteryModalOpen] = useState(false);
   
  const [history, setHistory] = useState<ChatSession[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]'); } catch { return []; }
  });
   
  const [totalSessions, setTotalSessions] = useState<number>(() => {
    const val = parseInt(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '0', 10);
    return isNaN(val) ? 0 : val;
  });
   
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(() => {
    const val = parseInt(localStorage.getItem(STORAGE_KEYS.TIME) || '0', 10);
    return isNaN(val) ? 0 : val;
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.JOURNAL) || '[]'); } catch { return []; }
  });
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY) || '[40, 60, 30, 80, 55, 30, 10]'); } catch { return [40, 60, 30, 80, 55, 30, 10]; }
  });

  const longPressTimer = useRef<number | null>(null);

  // --- ГЕНЕРАЦИЯ ---
  useEffect(() => {
    const generateDailyAdvice = async () => {
      if (!userProfile.onboardingCompleted || !userProfile.name) return;

      const todayStr = new Date().toDateString();
      const currentMood = userProfile.currentMood || 'ok';

      if (dailyInsight && dailyInsight.date === todayStr && dailyInsight.generatedForMood === currentMood) return;

      setIsInsightLoading(true);
      try {
        const recentEntries = journalEntries.slice(0, 3).map(e => e.content).join(". ");
        const userName = userProfile.name || "Друг";
        
        let moodInstruction = "";
        if (currentMood === 'low') moodInstruction = "КЛИЕНТ УСТАЛ. Дай мягкие советы. Фокус на отдыхе.";
        if (currentMood === 'high') moodInstruction = "КЛИЕНТ НА ПИКЕ. Дай амбициозные задачи.";
        if (currentMood === 'flow') moodInstruction = "КЛИЕНТ В ПОТОКЕ. Помоги удержать состояние.";
        
        const prompt = `
          Ты — мудрый ментор. Клиент: ${userName}.
          Архетип: "${userProfile.archetype}". Цель: "${userProfile.focus}".
          СОСТОЯНИЕ: ${moodInstruction}
          
          Составь Карту Дня.
          Разделитель: "|||". БЕЗ ЗАГОЛОВКОВ.
          
          1. МЫШЛЕНИЕ (Установка).
          2. ДЕЙСТВИЕ (Шаг к цели).
          3. ТЕЛО (Энергия).
          4. ИНСАЙТ (Мысль).
          
          Ответ: ТЕКСТ1|||ТЕКСТ2|||ТЕКСТ3|||ТЕКСТ4
        `;

        const responseText = await sendMessageToGemini(prompt);
        const cleanText = responseText.replace(/^(Мышление|Действие|Тело|Инсайт|Mindset|Action|Body|Insight)[:\.]\s*/gim, "").trim();
        const parts = cleanText.split('|||');
        
        const newInsight: DailyInsightData = {
          date: todayStr,
          generatedForMood: currentMood,
          mindset: parts[0]?.trim() || "Фокусируйся на главном.",
          action: parts[1]?.trim() || "Сделай один маленький шаг.",
          health: parts[2]?.trim() || "Дыши глубже.",
          insight: parts[3]?.trim() || "Все ответы внутри.",
        };

        setDailyInsight(newInsight);
        localStorage.setItem(STORAGE_KEYS.DAILY_INSIGHT, JSON.stringify(newInsight));

      } catch (e) { } finally {
        setIsInsightLoading(false);
      }
    };

    generateDailyAdvice();
  }, [userProfile.name, userProfile.currentMood, journalEntries, userProfile.onboardingCompleted]);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SESSIONS, totalSessions.toString()); }, [totalSessions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TIME, totalTimeSeconds.toString()); }, [totalTimeSeconds]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(journalEntries)); }, [journalEntries]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(siteConfig)); }, [siteConfig]);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready(); tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setUserProfile(prev => ({ ...prev, name: prev.name || [user.first_name, user.last_name].join(' '), avatarUrl: (!prev.avatarUrl?.startsWith('data:') && prev.avatarUrl !== user.photo_url) ? user.photo_url : prev.avatarUrl, isRegistered: true }));
      }
    }
  }, []);

  const totalMinutes = Math.round(totalTimeSeconds / 60);
  const totalSteps = totalSessions + totalMinutes; 
  
  const getTreeStage = (steps: number) => {
    const safeSteps = isNaN(steps) ? 0 : steps;
    return TREE_STAGES.find(r => safeSteps >= r.threshold) || TREE_STAGES[TREE_STAGES.length - 1];
  };

  const startMode = (mode: JournalMode) => { setSelectedMode(mode); setCurrentView('CHAT'); };
  
  const handleSaveJournalEntry = (entry: JournalEntry, isNew: boolean, duration: number) => {
    setTotalTimeSeconds(prev => prev + duration);
    if (isNew) { setJournalEntries(prev => [entry, ...prev]); setTotalSessions(prev => prev + 1); } 
    else { setJournalEntries(prev => prev.map(e => e.id === entry.id ? entry : e)); }
  };
  const handleDeleteJournalEntry = (id: string) => setJournalEntries(prev => prev.filter(e => e.id !== id));
  const handleReorderJournalEntries = (newOrder: JournalEntry[]) => setJournalEntries(newOrder);
  const handleSessionComplete = (messages: Message[], duration: number) => {
    const previewText = messages.find(m => m.role === 'user')?.content || 'Сессия';
    const newSession: ChatSession = { id: Date.now().toString(), mode: selectedMode!, date: Date.now(), duration, preview: previewText.substring(0, 50) + '...', messages };
    setHistory(prev => [newSession, ...prev]); setTotalSessions(prev => prev + 1); setTotalTimeSeconds(prev => prev + duration);
  };
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setUserProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
      reader.readAsDataURL(e.target.files[0]);
    }
  };
  const resetToTelegramAvatar = () => {
    const tgPhoto = window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url;
    if (tgPhoto) setUserProfile(prev => ({ ...prev, avatarUrl: tgPhoto }));
  };

  const currentTree = getTreeStage(totalSteps);
  const practiceTime = { value: totalTimeSeconds < 3600 ? Math.round(totalTimeSeconds / 60).toString() : (totalTimeSeconds / 3600).toFixed(1), unit: totalTimeSeconds < 3600 ? 'мин' : 'ч' };

  const handleAdminTriggerStart = () => { longPressTimer.current = window.setTimeout(() => { if (prompt('Admin:') === siteConfig.adminPasscode) setCurrentView('ADMIN'); }, 2000); };
  const handleAdminTriggerEnd = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };

  // --- MODALS & SCREENS ---
  const renderBatteryModal = () => {
    if (!isBatteryModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsBatteryModalOpen(false)}></div>
        <div className="bg-white rounded-[32px] p-6 w-full max-w-xs relative z-10 animate-fade-in shadow-2xl">
          <button onClick={() => setIsBatteryModalOpen(false)} className="absolute right-4 top-4 text-slate-300 hover:text-slate-500"><X size={24} /></button>
          <h3 className="text-xl font-extrabold text-center mb-6 text-slate-800">Твой заряд?</h3>
          <div className="grid grid-cols-2 gap-3">
            {[ { label: "На пике 🔥", val: "high" }, { label: "В потоке 🌊", val: "flow" }, { label: "Нормально 🙂", val: "ok" }, { label: "На нуле 🪫", val: "low" } ].map((item) => (
              <button key={item.val} onClick={() => { setIsBatteryModalOpen(false); setUserProfile(prev => ({ ...prev, currentMood: item.val as any })); if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); }} className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 font-bold text-slate-700 transition-all active:scale-95 text-sm">{item.label}</button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDailyGuide = () => (
    <div className="h-full flex flex-col bg-[#F8FAFC] px-6 pt-10 pb-32 animate-fade-in overflow-y-auto">
      <header className="mb-8 flex items-center space-x-4"><button onClick={() => setCurrentView('HOME')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500"><ArrowLeft size={24} /></button><h1 className="text-3xl font-bold text-slate-800">Карта дня</h1></header>
      {dailyInsight ? (
        <div className="space-y-6">
          <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm relative overflow-hidden"><div className="flex items-center space-x-3 mb-3 text-indigo-500 relative z-10"><Brain size={20} /><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Мышление</span></div><p className="text-slate-700 leading-relaxed font-medium relative z-10">{dailyInsight.mindset}</p></div>
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[28px] p-6 text-white shadow-lg shadow-indigo-200 transform hover:scale-[1.01] transition-transform"><div className="flex items-center space-x-3 mb-3 opacity-90"><Target size={20} /><span className="text-[10px] font-bold uppercase tracking-widest">Действие</span></div><h2 className="text-lg font-bold leading-relaxed">{dailyInsight.action}</h2></div>
          <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm"><div className="flex items-center space-x-3 mb-3 text-emerald-600"><Battery size={20} /><span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Тело & Ресурс</span></div><p className="text-slate-700 leading-relaxed font-medium">{dailyInsight.health}</p></div>
          <div className="bg-slate-900 rounded-[28px] p-6 text-slate-300 shadow-sm"><div className="flex items-center space-x-3 mb-3 text-amber-400"><Sparkles size={20} /><span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Инсайт</span></div><p className="text-slate-200 leading-relaxed italic">"{dailyInsight.insight}"</p></div>
        </div>
      ) : ( <div className="flex flex-col items-center justify-center h-full"><Loader2 className="animate-spin text-indigo-500 mb-4" size={32} /><p className="text-slate-400">Составляю карту...</p></div> )}
    </div>
  );

  const renderHome = () => (
    <div className="h-full overflow-y-auto animate-fade-in relative z-10 pb-32">
      <header className="mb-4 w-full flex items-center justify-between px-6 pt-4">
         <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm">{userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><UserIcon size={20} /></div>}</div>
            <div><h3 className="text-sm font-bold text-slate-900 leading-tight">{userProfile.name || 'Странник'}</h3><p className="text-[10px] text-slate-400 font-medium">{userProfile.archetype || 'Начало пути'}</p></div>
         </div>
         <div className="w-10 h-10 flex items-center justify-center" onPointerDown={handleAdminTriggerStart} onPointerUp={handleAdminTriggerEnd} onPointerLeave={handleAdminTriggerEnd}><Logo className="w-8 h-8 opacity-20" /></div>
      </header>

      {/* КАРТА ДНЯ (ГЛАВНАЯ) */}
      <div className="px-6 mb-8">
        {!userProfile.onboardingCompleted ? (
          <button onClick={() => setCurrentView('ONBOARDING')} className="w-full relative overflow-hidden rounded-[32px] bg-slate-900 p-8 text-left shadow-xl shadow-slate-200 group active:scale-95 transition-all">
             <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full blur-[60px] opacity-30 group-hover:opacity-50 transition-opacity"></div>
             <div className="relative z-10">
               <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6"><Compass size={24} /></div>
               <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Найти свой путь</h2>
               <p className="text-slate-400 text-sm mb-6 leading-relaxed max-w-[200px]">Узнайте свой архетип и получите карту развития.</p>
               <div className="inline-flex items-center space-x-2 bg-white text-slate-900 px-5 py-2.5 rounded-full text-xs font-bold"><span>Начать тест</span><ArrowLeft className="rotate-180" size={14} /></div>
             </div>
          </button>
        ) : (
          <div className="w-full relative overflow-hidden rounded-[32px] bg-white border border-slate-100 p-6 text-left shadow-lg shadow-indigo-100/50">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-4">
                 <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">Фокус дня</span>
                 <button onClick={(e) => { e.stopPropagation(); setIsBatteryModalOpen(true); }} className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors active:scale-90"><Battery size={14} className={userProfile.currentMood === 'low' ? "text-rose-500" : "text-emerald-500"} /><span className="text-[10px] font-bold text-slate-600">{userProfile.currentMood === 'high' ? 'На пике' : userProfile.currentMood === 'low' ? 'На нуле' : userProfile.currentMood === 'flow' ? 'В потоке' : 'Норм'}</span></button>
               </div>
               <div className="mb-6 min-h-[60px]">
                 {isInsightLoading ? (<div className="flex items-center space-x-2 text-slate-400 animate-pulse"><Loader2 size={18} className="animate-spin" /><span>Синхронизация...</span></div>) : (<h2 className="text-xl font-bold text-slate-800 leading-snug line-clamp-3">{dailyInsight?.mindset || "Загрузка..."}</h2>)}
               </div>
               <button onClick={() => setCurrentView('DAILY_GUIDE')} className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center space-x-2 group"><Map size={16} /><span>Открыть карту дня</span><ChevronRight size={16} className="opacity-60 group-hover:translate-x-1 transition-transform" /></button>
             </div>
          </div>
        )}
      </div>

      {/* КНОПКИ ЧАТОВ (ВЕРНУЛ ЦВЕТНЫЕ) */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-3 gap-4">
          {[ 
            { id: 'DECISION', label: 'Решение', icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-50' }, 
            { id: 'EMOTIONS', label: 'Эмоции', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' }, 
            { id: 'REFLECTION', label: 'Дневник', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50' } 
          ].map((m) => (
            <button key={m.id} onClick={() => startMode(m.id as JournalMode)} className="flex flex-col items-center p-4 rounded-[24px] bg-white border border-slate-50 shadow-sm active:scale-95 transition-all group">
              <div className={`w-12 h-12 rounded-2xl ${m.bg} flex items-center justify-center ${m.color} mb-3 group-hover:scale-110 transition-transform`}><m.icon size={24} fill={m.id === 'DECISION' ? "currentColor" : "none"} strokeWidth={m.id === 'DECISION' ? 0 : 2} /></div><span className="text-[11px] font-bold text-slate-500">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ДРЕВО СОЗНАНИЯ (ВЕРНУЛ СТАТИСТИКУ) */}
      <div className="px-6 mb-6">
         <button onClick={() => setCurrentView('RANKS_INFO')} className="w-full bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm active:scale-95 transition-all">
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center space-x-4">
                   <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center"><currentTree.icon size={24} /></div>
                   <div className="text-left"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Древо сознания</p><h4 className="text-base font-bold text-slate-800">{currentTree.title}</h4></div>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
            </div>
            
            {/* Статистика внутри карточки */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
               <div className="text-center border-r border-slate-50">
                  <p className="text-lg font-bold text-slate-800">{totalSessions}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Сессий</p>
               </div>
               <div className="text-center">
                  <p className="text-lg font-bold text-slate-800">{totalMinutes}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Минут</p>
               </div>
            </div>
         </button>
      </div>
    </div>
  );

  const renderRanksInfo = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-32">
      <header className="mb-8 flex items-center space-x-4 text-left"><button onClick={() => setCurrentView('PROFILE')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500"><ArrowLeft size={24} /></button><h1 className="text-3xl font-bold text-slate-800">Древо сознания</h1></header>
      <div className="space-y-4">
        {[...TREE_STAGES].reverse().map((stage) => (
          <div key={stage.title} className={`p-5 rounded-[24px] border transition-all ${totalSteps >= stage.threshold ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-50'}`}>
            <div className="flex justify-between items-start mb-2">
               <div className="flex items-center space-x-3">
                 <stage.icon size={24} className={totalSteps >= stage.threshold ? stage.color : "text-slate-400"} />
                 <h4 className={`font-bold ${totalSteps >= stage.threshold ? 'text-emerald-800' : 'text-slate-400'}`}>{stage.title}</h4>
               </div>
               {totalSteps >= stage.threshold && (<Award size={18} className="text-emerald-500" />)}
            </div>
            <p className="text-xs leading-relaxed text-slate-500 mt-2">{stage.desc}</p>
            <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-60">Требуется: {stage.threshold} очков</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-24">
       <header className="mb-8"><h1 className="text-3xl font-bold text-slate-800">История</h1></header>
      {!history || history.length === 0 ? (<div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4"><div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2"><BookOpen size={32} strokeWidth={1.5} /></div><h3 className="text-slate-700 font-medium text-lg">Пока пусто</h3></div>) : (
        <div className="space-y-4">
          {history.map((session) => {
            let dateStr = "Дата неизвестна";
            try { if (session.date) dateStr = new Date(session.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }); } catch (e) {}
            return (
            <button key={session.id} onClick={() => { setSelectedSession(session); setCurrentView('READ_HISTORY'); }} className="w-full text-left p-4 rounded-[24px] bg-white border-slate-50 shadow-sm border flex items-start space-x-4 active:scale-98">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${session.mode === 'DECISION' ? 'bg-indigo-50 text-indigo-500' : session.mode === 'EMOTIONS' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>{session.mode === 'DECISION' ? <Zap size={20} fill="currentColor" /> : session.mode === 'EMOTIONS' ? <Heart size={20} /> : <BookOpen size={20} />}</div>
              <div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-1"><h4 className="font-semibold text-slate-700 text-sm">{session.mode === 'DECISION' ? 'Решение' : session.mode === 'EMOTIONS' ? 'Эмоции' : 'Дневник'}</h4><span className="text-[10px] text-slate-400">{dateStr}</span></div><p className="text-xs text-slate-500 line-clamp-2">{session.preview || 'Нет описания'}</p></div>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-24">
       <header className="mb-8 flex items-center space-x-4"><button onClick={() => setCurrentView('HOME')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500"><ArrowLeft size={24} /></button><h1 className="text-3xl font-bold text-slate-800">Профиль</h1></header>
      <div className="bg-white shadow-sm rounded-[32px] p-8 mb-8 flex flex-col items-center text-center relative overflow-hidden border border-slate-50">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-100 to-purple-100 opacity-50"></div>
        <div className="w-24 h-24 rounded-full bg-white p-1 shadow-sm relative z-10 -mt-2 overflow-hidden border border-slate-100">{userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <UserIcon size={40} />}</div>}</div>
        <h3 className="text-xl font-bold mt-4 text-slate-800">{userProfile.name || 'Странник'}</h3>
        <p className="text-sm text-indigo-400 font-medium">{userProfile.archetype || "Странник"}</p>
      </div>
      <div className="space-y-4">
        <button onClick={() => setCurrentView('RANKS_INFO')} className="w-full p-5 rounded-[24px] bg-white border-slate-50 shadow-sm text-slate-600 border flex items-center justify-between active:scale-95"><div className="flex items-center space-x-4"><div className="p-2.5 rounded-xl bg-slate-50 text-slate-500"><Medal size={20} /></div><span className="text-sm font-semibold">Древо сознания</span></div><ChevronRight size={18} className="text-slate-300" /></button>
        <button onClick={() => setCurrentView('SETTINGS')} className="w-full p-5 rounded-[24px] bg-white border-slate-50 shadow-sm text-slate-600 border flex items-center justify-between active:scale-95"><div className="flex items-center space-x-4"><div className="p-2.5 rounded-xl bg-slate-50 text-slate-500"><Settings size={20} /></div><span className="text-sm font-semibold">Настройки</span></div><ChevronRight size={18} className="text-slate-300" /></button>
        <button onClick={() => setCurrentView('ABOUT')} className="w-full p-5 rounded-[24px] bg-white border-slate-50 shadow-sm text-slate-600 border flex items-center justify-between active:scale-95"><div className="flex items-center space-x-4"><div className="p-2.5 rounded-xl bg-slate-50 text-slate-500"><Info size={20} /></div><span className="text-sm font-semibold">О приложении</span></div><ChevronRight size={18} className="text-slate-300" /></button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-24">
        <header className="mb-8 flex items-center space-x-4"><button onClick={() => setCurrentView('PROFILE')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500"><ArrowLeft size={24} /></button><h1 className="text-3xl font-bold text-slate-800">Настройки</h1></header>
        <div className="bg-white shadow-sm border-slate-100 rounded-[32px] p-8 border border-slate-50 space-y-8">
          <div className="flex flex-col items-center">
            <div className="relative"><div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md active:scale-95">{userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><UserIcon size={40} /></div>}</div><label className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-full text-white cursor-pointer shadow-md"><Camera size={16} /><input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} /></label></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Имя</label><input type="text" value={userProfile.name} onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-slate-100 border focus:outline-none focus:border-indigo-500 font-semibold" /></div>
          <div className="pt-4 border-t border-slate-100"><label className="text-sm font-bold text-slate-700 mb-2 block">Тест личности</label><button onClick={() => setCurrentView('ONBOARDING')} className="w-full py-4 rounded-2xl bg-slate-50 text-slate-600 font-bold border border-slate-100 active:scale-95 transition-all flex items-center justify-center space-x-2 hover:bg-slate-100"><Compass size={18} /><span>Пройти тест заново</span></button></div>
          <button onClick={() => setCurrentView('PROFILE')} className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-bold shadow-lg mt-4 active:scale-98 transition-transform">Сохранить</button>
        </div>
    </div>
  );

  const renderAbout = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-32">
      <header className="mb-8 flex items-center space-x-4 text-left"><button onClick={() => setCurrentView('PROFILE')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500"><ArrowLeft size={24} /></button><h1 className="text-3xl font-bold text-slate-800">О приложении</h1></header>
      <div className="bg-white shadow-sm border-slate-100 rounded-[32px] p-8 border flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"><StylizedMMText text={siteConfig.logoText} className="text-[200px]" color="#A78BFA" opacity="0.05" /></div>
        <div className="relative z-10 flex flex-col items-center w-full">
          <div className="mb-10 p-6 rounded-3xl bg-indigo-500/10 flex items-center justify-center min-w-[120px] min-h-[120px]">{siteConfig.customLogoUrl ? <img src={siteConfig.customLogoUrl} className="w-24 h-24 object-contain" /> : <StylizedMMText text={siteConfig.logoText} className="text-7xl" color="#6366f1" />}</div>
          <h2 className="text-2xl font-bold mb-6 text-slate-800">{siteConfig.appTitle}</h2>
          <div className="space-y-6 text-left w-full px-2">{siteConfig.aboutParagraphs.map((p, i) => (<p key={i} className="text-[16px] leading-relaxed text-slate-600">{p}</p>))}</div>
          <div className="w-full pt-8 mt-10 border-t border-slate-100 flex justify-around"><div className="text-center"><p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Версия</p><p className="text-base font-semibold text-slate-700">1.8.0</p></div><div className="text-center"><p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Сборка</p><p className="text-base font-semibold text-slate-700">09-2025</p></div></div>
          <p className="text-[12px] text-slate-400 font-medium italic mt-12">"Познай самого себя, и ты познаешь мир."</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col font-sans relative bg-[#F8FAFC]">
      <div className="absolute inset-0 z-0 pointer-events-none"><div className="absolute top-[-10%] left-[-10%] w-[70%] h-[50%] bg-blue-100 rounded-full blur-[100px] opacity-60"></div><div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-purple-100 rounded-full blur-[100px] opacity-60"></div></div>
      <main className="flex-1 relative overflow-hidden z-10">
        {renderBatteryModal()}
        {currentView === 'ONBOARDING' && <OnboardingScreen onComplete={(data) => { setUserProfile(prev => ({ ...prev, ...data, onboardingCompleted: true })); localStorage.removeItem(STORAGE_KEYS.DAILY_INSIGHT); setDailyInsight(null); setCurrentView('HOME'); }} onBack={() => setCurrentView('HOME')} />}
        {currentView === 'DAILY_GUIDE' && renderDailyGuide()}
        {currentView === 'HOME' && renderHome()}
        {currentView === 'CHAT' && selectedMode === 'REFLECTION' && <JournalInterface entries={journalEntries} onSaveEntry={handleSaveJournalEntry} onDeleteEntry={handleDeleteJournalEntry} onUpdateOrder={handleReorderJournalEntries} onBack={() => setCurrentView('HOME')} />}
        {currentView === 'CHAT' && selectedMode !== 'REFLECTION' && selectedMode && <ChatInterface mode={selectedMode} onBack={() => setCurrentView('HOME')} onSessionComplete={handleSessionComplete} />}
        {currentView === 'READ_HISTORY' && selectedSession && <ChatInterface mode={selectedSession.mode} onBack={() => setCurrentView('HISTORY')} readOnly={true} initialMessages={selectedSession.messages} />}
        {currentView === 'HISTORY' && renderHistory()}
        {currentView === 'PROFILE' && renderProfile()}
        {currentView === 'SETTINGS' && renderSettings()}
        {currentView === 'ABOUT' && renderAbout()}
        {currentView === 'RANKS_INFO' && renderRanksInfo()}
        {currentView === 'ADMIN' && <AdminInterface config={siteConfig} onSave={(newCfg) => setSiteConfig(newCfg)} onBack={() => setCurrentView('ABOUT')} />}
      </main>
      {(['HOME', 'HISTORY', 'PROFILE', 'ABOUT', 'SETTINGS'].includes(currentView)) && <BottomNav currentView={currentView} onChangeView={setCurrentView} />}
    </div>
  );
};

export default App;
