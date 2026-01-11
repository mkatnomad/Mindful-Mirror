import React, { useState, useEffect, useRef } from 'react';
import { ViewState, JournalMode, ChatSession, Message, UserProfile, JournalEntry, SiteConfig, DailyInsightData } from './types';
import { BottomNav } from './components/BottomNav';
import { ChatInterface } from './components/ChatInterface';
import { JournalInterface } from './components/JournalInterface';
import { AdminInterface } from './components/AdminInterface';
import { sendMessageToGemini } from './services/geminiService';
import { Heart, BookOpen, ChevronRight, Settings, Info, User as UserIcon, Activity, Quote, Clock, Zap, Camera, Star, ArrowLeft, MessageSquare, Award, Medal, RefreshCw, Loader2, Cloud, Lock, Moon, Search, Sparkles, Sun, Coffee, Brain, Briefcase, Feather, Compass, Anchor, Target, Shield, Eye, Key, X } from 'lucide-react';

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
    "Mindful Mirror — зеркало твоей души.",
    "Мы используем психологическое профилирование и ИИ, чтобы помочь тебе настроить внутренний компас."
  ],
  quotes: [],
  adminPasscode: "0000"
};

const RANKS = [
  { threshold: 50000, title: "Дзен-Мастер", desc: "Путь и путник стали одним целым." },
  { threshold: 20000, title: "Мудрец", desc: "Глубокое спокойствие и знание." },
  { threshold: 5000, title: "Архитектор", desc: "Ты создаешь свои правила жизни." },
  { threshold: 1500, title: "Осознанный", desc: "Ты понимаешь причины своих чувств." },
  { threshold: 300, title: "Исследователь", desc: "Ты изучаешь себя системно." },
  { threshold: 80, title: "Искатель", desc: "Ты ищешь ответы." },
  { threshold: 15, title: "Странник", desc: "Первый шаг сделан." },
  { threshold: 0, title: "Наблюдатель", desc: "Ты присматриваешься." },
];

const STORAGE_KEYS = {
  PROFILE: 'mm_profile',
  HISTORY: 'mm_history',
  SESSIONS: 'mm_total_sessions',
  TIME: 'mm_total_time',
  ACTIVITY: 'mm_weekly_activity',
  JOURNAL: 'mm_journal_entries',
  CONFIG: 'mm_site_config',
  DAILY_INSIGHT: 'mm_daily_insight_v8' // v8 - Алхимическая карта
};

const StylizedMMText = ({ text = "mm", className = "", color = "white", opacity = "1" }: { text?: string, className?: string, color?: string, opacity?: string }) => (
  <span className={`${className} font-extrabold italic select-none pointer-events-none uppercase`} style={{ color, opacity, fontFamily: 'Manrope, sans-serif' }}>{text}</span>
);

const Logo = ({ className = "w-20 h-20" }: { className?: string, color?: string, bg?: string }) => (
  <img src="/logo.png" alt="Mindful Mirror" className={`${className} object-contain`} />
);

// --- ГЛУБОКИЙ ОНБОРДИНГ (Определение Архетипа) ---
const ArchetypeOnboarding: React.FC<{ onComplete: (data: Partial<UserProfile>) => void, onBack: () => void }> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({ archetype: '', shadow: '', superpower: '', aiTone: '' });
  
  const steps = [
    {
      title: "Что движет тобой больше всего?",
      key: 'archetype',
      options: [
        { label: "Порядок и Контроль", icon: Shield, value: "Правитель (Стремление к порядку)" },
        { label: "Познание Истины", icon: BookOpen, value: "Мудрец (Поиск правды)" },
        { label: "Победа и Мастерство", icon: Medal, value: "Герой (Достижение целей)" },
        { label: "Связь и Чувства", icon: Heart, value: "Любовник (Эмпатия и связь)" },
        { label: "Создание Нового", icon: Feather, value: "Творец (Воображение)" },
      ]
    },
    {
      title: "Твой главный внутренний страх?",
      key: 'shadow',
      options: [
        { label: "Хаос и потеря контроля", icon: Cloud, value: "Страх хаоса" },
        { label: "Быть слабым / проиграть", icon: Lock, value: "Страх слабости" },
        { label: "Одиночество / Ненужность", icon: UserIcon, value: "Страх отвержения" },
        { label: "Застой / Пустота", icon: Anchor, value: "Страх бессмысленности" },
      ]
    },
    {
      title: "В чем твоя суперсила?",
      key: 'superpower',
      options: [
        { label: "Воля и Дисциплина", icon: Zap, value: "Железная воля" },
        { label: "Интуиция и Поток", icon: Sparkles, value: "Сильная интуиция" },
        { label: "Логика и Анализ", icon: Brain, value: "Холодный разум" },
        { label: "Эмпатия и Люди", icon: Heart, value: "Чувствование людей" },
      ]
    },
    {
      title: "Какой наставник тебе нужен?",
      key: 'aiTone',
      options: [
        { label: "Мудрый Философ", icon: Moon, value: "Философский, спокойный, глубокий" },
        { label: "Честный Тренер", icon: Target, value: "Прямой, мотивирующий, без жалости" },
        { label: "Мягкий Психолог", icon: Coffee, value: "Теплый, принимающий, заботливый" },
      ]
    }
  ];

  const currentStepData = steps[step];

  const handleOptionSelect = (value: string) => {
    const newAnswers = { ...answers, [currentStepData.key]: value };
    setAnswers(newAnswers);
    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      onComplete(newAnswers);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white px-6 py-10 animate-fade-in relative z-50">
      <div className="flex justify-start mb-4">
         <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
           <ArrowLeft size={24} />
         </button>
      </div>
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="mb-8">
          <div className="flex space-x-2 mb-6 justify-center">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-200'}`} />
            ))}
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 text-center leading-tight mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-center text-slate-400 text-sm">Шаг {step + 1} из {steps.length}</p>
        </div>
        
        {/* Key=Step нужен, чтобы сбрасывать фокус/выделение при смене вопроса */}
        <div className="space-y-3" key={step}>
          {currentStepData.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionSelect(option.value)}
              className="w-full p-5 rounded-[24px] border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 transition-all active:scale-95 flex items-center text-left group focus:outline-none"
            >
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-500 shadow-sm group-hover:scale-110 transition-transform">
                <option.icon size={24} />
              </div>
              <span className="ml-4 font-bold text-slate-700 group-hover:text-indigo-700">{option.label}</span>
              <ChevronRight className="ml-auto text-slate-300 group-hover:text-indigo-400" size={20} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- ЕЖЕДНЕВНЫЙ ЧЕК-ИН (Погода дня) ---
const DailyCheckinModal: React.FC<{ onClose: () => void, onSubmit: (energy: string, context: string) => void }> = ({ onClose, onSubmit }) => {
  const [stage, setStage] = useState<'ENERGY' | 'CONTEXT'>('ENERGY');
  const [energy, setEnergy] = useState('');

  const energyOptions = [
    { label: "На пике 🔥", value: "Высокая, готов свернуть горы" },
    { label: "В потоке 🌊", value: "Ровная, спокойная уверенность" },
    { label: "В хаосе 🌪", value: "Тревожная, много мыслей" },
    { label: "На нуле 🪫", value: "Низкая, нужно восстановление" },
  ];

  const contextOptions = [
    { label: "Битва / Вызов ⚔️", value: "Важная встреча или сложная задача" },
    { label: "Рутина / Работа 🏗", value: "Обычный рабочий день" },
    { label: "Тишина / Отдых 🧘", value: "Выходной, время для себя" },
    { label: "Творчество 🎨", value: "Создание чего-то нового" },
  ];

  const handleSelect = (val: string) => {
    if (stage === 'ENERGY') {
      setEnergy(val);
      setStage('CONTEXT');
    } else {
      onSubmit(energy, val);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in p-4">
      <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
          <X size={20} />
        </button>
        
        <h3 className="text-xl font-bold text-slate-800 mb-6 text-center mt-2">
          {stage === 'ENERGY' ? "Как твоя батарейка?" : "Что предстоит сегодня?"}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {(stage === 'ENERGY' ? energyOptions : contextOptions).map((opt) => (
            <button
              key={opt.label}
              onClick={() => handleSelect(opt.value)}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-all active:scale-95 flex flex-col items-center text-center space-y-2"
            >
              <span className="font-bold text-slate-700 text-sm">{opt.label}</span>
            </button>
          ))}
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
      return saved ? { onboardingCompleted: false, ...JSON.parse(saved) } : { name: '', avatarUrl: null, isSetup: true, isRegistered: false, onboardingCompleted: false };
    } catch { return { name: '', avatarUrl: null, isSetup: true, isRegistered: false, onboardingCompleted: false }; }
  });

  const isSpaceTheme = userProfile.theme === 'SPACE';

  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [selectedMode, setSelectedMode] = useState<JournalMode | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  
  const [dailyInsight, setDailyInsight] = useState<DailyInsightData | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_INSIGHT) || 'null'); } catch { return null; }
  });
  
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [showCheckin, setShowCheckin] = useState(false);
   
  const [history, setHistory] = useState<ChatSession[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]'); } catch { return []; }
  });
   
  const [totalSessions, setTotalSessions] = useState<number>(() => parseInt(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '0', 10) || 0);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(() => parseInt(localStorage.getItem(STORAGE_KEYS.TIME) || '0', 10) || 0);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.JOURNAL) || '[]'); } catch { return []; }
  });
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVITY) || '[40, 60, 30, 80, 55, 30, 10]'); } catch { return [40, 60, 30, 80, 55, 30, 10]; }
  });

  const longPressTimer = useRef<number | null>(null);

  // Функция запуска генерации карты (вызывается после чекина)
  const generateAlchemicalMap = async (currentEnergy: string, currentContext: string) => {
    setShowCheckin(false);
    setIsInsightLoading(true);
    const todayStr = new Date().toDateString();

    try {
      const recentEntries = journalEntries.slice(0, 3).map(e => e.content).join(". ");
      const userName = userProfile.name || "Путешественник";
      
      const prompt = `
        Ты — мудрый оракул и психолог. Клиент: ${userName}.
        
        ГЛОБАЛЬНЫЙ ПРОФИЛЬ (Кто он по сути):
        - Архетип: ${userProfile.archetype}
        - Тень (Страх): ${userProfile.shadow}
        - Сила: ${userProfile.superpower}
        - Тон: ${userProfile.aiTone}
        
        ТЕКУЩАЯ ПОГОДА (Здесь и сейчас):
        - Энергия: ${currentEnergy}
        - Контекст дня: ${currentContext}
        - Мысли из дневника: "${recentEntries}"
        
        ЗАДАЧА:
        Составь "Алхимическую Карту Дня". Она должна помочь прожить этот день максимально гармонично, учитывая разницу между Архетипом и текущим состоянием.
        
        СТРУКТУРА ОТВЕТА (4 коротких емких блока, разделитель "|||"):
        1. Роль дня (Метафора). Кем ему сегодня быть? (Например: "Раненый Целитель", "Наблюдатель в башне", "Веселый Трикстер").
        2. Щит (Ловушка). От чего предостеречь? (Учитывая Тень и Энергию).
        3. Призма (Оптика). Как смотреть на происходящее?
        4. Артефакт (Ключ). Одно микро-действие или фраза-оберег.
        
        Формат ответа (только текст):
        РОЛЬ_МЕТАФОРА|||ПРЕДОСТЕРЕЖЕНИЕ|||ФОКУС_ВНИМАНИЯ|||КЛЮЧЕВОЕ_ДЕЙСТВИЕ
      `;

      const responseText = await sendMessageToGemini(prompt);
      const parts = responseText.split('|||');
      
      const newInsight: DailyInsightData = {
        date: todayStr,
        archetype: parts[0]?.trim() || "Тихий Наблюдатель",
        trap: parts[1]?.trim() || "Не пытайся спасти всех.",
        lens: parts[2]?.trim() || "Смотри сквозь шум.",
        key: parts[3]?.trim() || "Дыши.",
      };

      setDailyInsight(newInsight);
      localStorage.setItem(STORAGE_KEYS.DAILY_INSIGHT, JSON.stringify(newInsight));
      setCurrentView('DAILY_GUIDE');

    } catch (e) {
      console.error("AI Error", e);
    } finally {
      setIsInsightLoading(false);
    }
  };

  const handleDailyCardClick = () => {
    const todayStr = new Date().toDateString();
    if (dailyInsight && dailyInsight.date === todayStr) {
      setCurrentView('DAILY_GUIDE');
    } else {
      setShowCheckin(true);
    }
  };

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SESSIONS, totalSessions.toString()); }, [totalSessions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TIME, totalTimeSeconds.toString()); }, [totalTimeSeconds]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(weeklyActivity)); }, [weeklyActivity]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(journalEntries)); }, [journalEntries]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(siteConfig)); }, [siteConfig]);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready(); tg.expand();
      try { if (tg.setHeaderColor) tg.setHeaderColor('#F8FAFC'); if (tg.setBackgroundColor) tg.setBackgroundColor('#F8FAFC'); } catch (e) {}
      const user = tg.initDataUnsafe?.user;
      if (user) {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
        setUserProfile(prev => {
          const tgPhoto = user.photo_url || null;
          return { ...prev, name: prev.name || fullName, avatarUrl: (!prev.avatarUrl?.startsWith('data:') && prev.avatarUrl !== tgPhoto) ? tgPhoto : prev.avatarUrl, isRegistered: true };
        });
      }
    }
  }, []);

  const totalMinutes = Math.round(totalTimeSeconds / 60);
  const totalSteps = totalSessions + totalMinutes; 
  const getCurrentRank = (steps: number) => {
    const safeSteps = (typeof steps === 'number' && !isNaN(steps)) ? steps : 0;
    return RANKS.find(r => safeSteps >= r.threshold) || RANKS[RANKS.length - 1];
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

  const currentRank = getCurrentRank(totalSteps);
  const ascendingRanks = [...RANKS].reverse();
  const nextRank = ascendingRanks.find(r => r.threshold > totalSteps);
  const prevThreshold = ascendingRanks.find(r => r.threshold <= totalSteps)?.threshold || 0;
  let progressPercent = 100;
  if (nextRank) progressPercent = ((totalSteps - prevThreshold) / (nextRank.threshold - prevThreshold)) * 100;
  if (isNaN(progressPercent)) progressPercent = 0;
  const practiceTime = { value: totalTimeSeconds < 3600 ? Math.round(totalTimeSeconds / 60).toString() : (totalTimeSeconds / 3600).toFixed(1), unit: totalTimeSeconds < 3600 ? 'мин' : 'ч' };

  const handleAdminTriggerStart = () => {
    longPressTimer.current = window.setTimeout(() => {
      const pass = prompt('Пароль администратора:');
      if (pass === siteConfig.adminPasscode) setCurrentView('ADMIN');
    }, 2000); 
  };

  const handleAdminTriggerEnd = () => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  // --- ЭКРАН "АЛХИМИЧЕСКАЯ КАРТА" ---
  const renderDailyGuide = () => (
    <div className="h-full flex flex-col bg-[#F8FAFC] px-6 pt-10 pb-32 animate-fade-in overflow-y-auto">
      <header className="mb-8 flex items-center space-x-4">
         <button onClick={() => setCurrentView('HOME')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500">
           <ArrowLeft size={24} />
         </button>
         <h1 className="text-3xl font-bold text-slate-800">Твой Компас</h1>
      </header>

      {dailyInsight ? (
        <div className="space-y-6">
          {/* РОЛЬ ДНЯ */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[32px] p-8 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4 opacity-80">
                <span className="bg-white/20 p-1.5 rounded-lg"><UserIcon size={16} /></span>
                <span className="text-xs font-bold uppercase tracking-widest">Архетип дня</span>
                </div>
                <h2 className="text-2xl font-bold leading-tight">{dailyInsight.archetype}</h2>
            </div>
          </div>

          {/* ЩИТ (ПРЕДОСТЕРЕЖЕНИЕ) */}
          <div className="bg-white rounded-[28px] p-6 border border-rose-100 shadow-sm relative overflow-hidden">
             <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-rose-400"></div>
             <div className="flex items-center space-x-3 mb-3 text-rose-500">
               <Shield size={20} />
               <span className="text-[10px] font-bold uppercase tracking-widest">Ловушка дня</span>
             </div>
             <p className="text-slate-700 leading-relaxed font-medium pl-2">{dailyInsight.trap}</p>
          </div>

          {/* ЛИНЗА (ОПТИКА) */}
          <div className="bg-white rounded-[28px] p-6 border border-indigo-50 shadow-sm">
            <div className="flex items-center space-x-3 mb-3 text-indigo-500">
              <Eye size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Оптика</span>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium pl-2">{dailyInsight.lens}</p>
          </div>

          {/* КЛЮЧ (АРТЕФАКТ) */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-[28px] p-6 border border-amber-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-3 text-amber-600">
              <Key size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Артефакт силы</span>
            </div>
            <p className="text-slate-800 leading-relaxed font-bold italic pl-2">"{dailyInsight.key}"</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
          <p className="text-slate-400">Синхронизация...</p>
        </div>
      )}
    </div>
  );

  // --- ГЛАВНЫЙ ЭКРАН ---
  const renderHome = () => (
    <div className="h-full overflow-y-auto animate-fade-in relative z-10 pb-32">
      <header className="mb-10 w-full relative overflow-hidden">
        <div className="absolute inset-0 bg-[#F8FAFC]">
           <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `radial-gradient(#6366f1 0.8px, transparent 0.8px)`, backgroundSize: '16px 16px' }}></div>
           <div className="absolute -top-[10%] -left-[5%] w-[50%] h-[120%] bg-gradient-to-br from-indigo-100/30 to-transparent rounded-full blur-[40px] opacity-20"></div>
        </div>
        <div className="relative flex flex-row items-center pt-4 pb-4 px-8 min-h-[90px]">
          <div 
            className="absolute right-[-10%] top-1/2 -translate-y-1/2 pointer-events-auto select-none transition-all duration-700 active:opacity-30 flex items-center justify-center overflow-hidden"
            onPointerDown={handleAdminTriggerStart}
            onPointerUp={handleAdminTriggerEnd}
            onPointerLeave={handleAdminTriggerEnd}
          >
             {userProfile.avatarUrl ? (
               <div className="relative w-[240px] h-[240px] rounded-full overflow-hidden opacity-[0.18] grayscale brightness-110 pointer-events-none">
                 <img src={userProfile.avatarUrl} className="w-full h-full object-cover scale-110" alt="Avatar Watermark" />
               </div>
             ) : siteConfig.customWatermarkUrl ? (
               <img src={siteConfig.customWatermarkUrl} className="h-[80px] object-contain opacity-[0.08] grayscale pointer-events-none" alt="Watermark" />
             ) : (
                <div className="w-[100px] h-[100px] flex items-center justify-center opacity-[0.02]">
                  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="50" cy="50" r="40" stroke="#6366f1" strokeWidth="1"/>
                    <path d="M50 10V90M10 50H90" stroke="#6366f1" strokeWidth="1"/>
                  </svg>
                </div>
             )}
          </div>
          <div className="relative z-10 flex-1 pr-16">
            <h1 className="text-[19px] font-light tracking-tight text-slate-800/95 leading-tight">
              Привет, <span className="font-bold text-slate-900">{userProfile.name || 'Странник'}</span>
            </h1>
            <p className="text-[11px] font-medium text-slate-400 tracking-tight opacity-75 border-l border-indigo-200/50 pl-2 mt-0.5">
              Как твое настроение?
            </p>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-px bg-slate-100/30"></div>
      </header>

      <div className="px-6 mb-10 relative z-20">
        <div className="grid grid-cols-3 gap-5">
          {[
            { id: 'DECISION', label: 'Решение', icon: Zap, color: 'indigo', iconColor: 'text-indigo-500', bgGrad: 'from-indigo-50 to-purple-50' },
            { id: 'EMOTIONS', label: 'Эмоции', icon: Heart, color: 'rose', iconColor: 'text-rose-500', bgGrad: 'from-rose-50 to-pink-50' },
            { id: 'REFLECTION', label: 'Дневник', icon: BookOpen, color: 'emerald', iconColor: 'text-emerald-500', bgGrad: 'from-emerald-50 to-teal-50' }
          ].map((m) => (
            <button key={m.id} onClick={() => startMode(m.id as JournalMode)} className="flex flex-col items-center space-y-2.5 group">
              <div className="w-full aspect-square rounded-[28px] bg-white border-slate-100 shadow-sm border flex items-center justify-center relative overflow-hidden group-hover:-translate-y-1 transition-all duration-300">
                <div className={`absolute inset-0 bg-gradient-to-br ${m.bgGrad} opacity-40`}></div>
                <m.icon size={28} className={`${m.iconColor} relative z-10`} fill={m.id === 'DECISION' ? "currentColor" : "none"} strokeWidth={m.id === 'DECISION' ? 0 : 2} />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* --- ИНТЕРАКТИВНЫЙ БЛОК --- */}
      <div className="px-6 space-y-3.5 mb-7">
        <h3 className="text-[10px] font-bold ml-2 text-slate-400 uppercase tracking-widest">
          {userProfile.onboardingCompleted ? "Компас дня" : "Начало"}
        </h3>
        
        {!userProfile.onboardingCompleted ? (
          <button 
            onClick={() => setCurrentView('ONBOARDING')}
            className="w-full bg-indigo-600 text-white p-6 rounded-[28px] shadow-lg shadow-indigo-200 border border-indigo-500 relative overflow-hidden group transition-all active:scale-95"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-90"></div>
             <div className="absolute -right-4 -bottom-4 opacity-20 rotate-12">
               <Sparkles size={100} fill="white" />
             </div>
             
             <div className="relative z-10 flex items-center justify-between">
                <div className="text-left">
                  <h4 className="font-bold text-lg mb-1">Узнать свой Архетип</h4>
                  <p className="text-indigo-100 text-xs leading-relaxed max-w-[200px]">
                    Пройдите тест, чтобы получить паспорт личности.
                  </p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                  <ChevronRight size={24} />
                </div>
             </div>
          </button>
        ) : (
          <button 
            onClick={handleDailyCardClick}
            className="w-full bg-white border-slate-50 p-6 rounded-[28px] border shadow-sm relative overflow-hidden min-h-[140px] flex flex-col justify-center items-start text-left transition-all active:scale-95 group"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
             
             {isInsightLoading ? (
               <div className="flex flex-col items-center justify-center w-full space-y-3">
                 <Loader2 className="animate-spin text-indigo-500" size={20} />
                 <p className="text-[10px] text-slate-400 animate-pulse font-medium">Синхронизация...</p>
               </div>
             ) : (
               <>
                 <div className="relative z-10 mb-3">
                   <span className="bg-indigo-100 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                     Сегодня
                   </span>
                 </div>
                 <p className="text-slate-800 font-bold text-lg leading-tight mb-2 relative z-10">
                   {dailyInsight ? `Архетип: ${dailyInsight.archetype}` : "Получить карту дня"}
                 </p>
                 <div className="flex items-center text-indigo-500 text-xs font-bold mt-2 group-hover:translate-x-1 transition-transform">
                   <span>{dailyInsight ? "Открыть компас" : "Настроить день"}</span>
                   <ChevronRight size={14} className="ml-1" />
                 </div>
               </>
             )}
          </button>
        )}
      </div>

      <div className="px-6 mb-6">
         <button onClick={() => setCurrentView('RANKS_INFO')} className="w-full text-left outline-none active:scale-[0.98] transition-all group bg-white border-white shadow-[0_15px_30px_-12px_rgba(200,210,255,0.25)] rounded-[28px] p-6 border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/3 group-hover:scale-110 transition-transform duration-700"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.15em] mb-1.5 flex items-center">ПУТЬ ОСОЗНАНИЯ <ChevronRight size={10} className="ml-1 opacity-50" /></p>
                  <h4 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700">{currentRank.title}</h4>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-md border border-indigo-100/20"><Star size={20} fill="currentColor" /></div>
              </div>
              <div className="mb-6">
                <div className="flex justify-between text-[9px] text-slate-400 mb-2 font-bold uppercase tracking-wider"><span>Прогресс</span><span>{totalSteps} / {nextRank ? nextRank.threshold : 'MAX'}</span></div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner"><div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full relative transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}><div className="absolute inset-0 bg-white/20 animate-pulse"></div></div></div>
              </div>
              <div className="flex items-center pt-5 border-t border-slate-50">
                <div className="flex-1 flex items-center space-x-2.5"><div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm"><MessageSquare size={18} fill="currentColor" /></div><div><div className="text-lg font-bold text-slate-800">{totalSessions}</div><div className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.1em]">Сессии</div></div></div>
                <div className="w-px h-9 bg-slate-100 mx-2"></div>
                <div className="flex-1 flex items-center space-x-2.5 pl-1.5"><div className="w-9 h-9 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shadow-sm"><Activity size={18} /></div><div><div className="text-lg font-bold text-slate-800">{practiceTime.value}<span className="text-[10px] font-bold text-slate-400 ml-0.5">{practiceTime.unit}</span></div><div className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.1em]">Практика</div></div></div>
              </div>
            </div>
         </button>
      </div>
    </div>
  );

  const renderSettings = () => {
    const tgPhoto = window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url;
    
    return (
      <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-24">
        <header className="mb-8 flex items-center space-x-4">
           <button onClick={() => setCurrentView('PROFILE')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500">
             <ArrowLeft size={24} />
           </button>
           <h1 className="text-3xl font-bold text-slate-800">Настройки</h1>
        </header>

        <div className="bg-white shadow-sm border-slate-100 rounded-[32px] p-8 border border-slate-50 space-y-8">
          <div className="flex flex-col items-center">
            <div className="relative">
               <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md transition-transform active:scale-95">
                  {userProfile.avatarUrl ? (
                    <img src={userProfile.avatarUrl} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50">
                      <UserIcon size={40} />
                    </div>
                  )}
               </div>
               <label className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-full text-white cursor-pointer shadow-md"><Camera size={16} /><input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} /></label>
            </div>
            
            {tgPhoto && (
               <button 
                 onClick={resetToTelegramAvatar}
                 className="mt-4 flex items-center space-x-2 text-xs font-bold text-indigo-500 bg-indigo-50 px-4 py-2 rounded-full active:scale-95 transition-all"
               >
                 <RefreshCw size={12} />
                 <span>Использовать фото из Telegram</span>
               </button>
            )}
          </div>

          <div className="space-y-2">
             <label className="text-sm font-bold text-slate-700">Имя</label>
             <input type="text" value={userProfile.name} onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-slate-100 border focus:outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold" />
          </div>

          <div className="pt-4 border-t border-slate-100">
             <label className="text-sm font-bold text-slate-700 mb-2 block">Паспорт личности</label>
             <button 
               onClick={() => {
                 setCurrentView('ONBOARDING');
               }}
               className="w-full py-4 rounded-2xl bg-slate-50 text-slate-600 font-bold border border-slate-100 active:scale-95 transition-all flex items-center justify-center space-x-2 hover:bg-slate-100"
             >
                <Compass size={18} />
                <span>Определить Архетип заново</span>
             </button>
          </div>

          <button onClick={() => setCurrentView('PROFILE')} className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-bold shadow-lg mt-4 active:scale-98 transition-transform">Сохранить</button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col font-sans relative bg-[#F8FAFC]">
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[50%] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-purple-100 rounded-full blur-[100px] opacity-60"></div>
      </div>

      <main className="flex-1 relative overflow-hidden z-10">
        {showCheckin && (
          <DailyCheckinModal 
            onClose={() => setShowCheckin(false)}
            onSubmit={generateAlchemicalMap}
          />
        )}

        {currentView === 'ONBOARDING' && (
          <ArchetypeOnboarding 
            onComplete={(data) => {
              setUserProfile(prev => ({ ...prev, ...data, onboardingCompleted: true }));
              localStorage.removeItem(STORAGE_KEYS.DAILY_INSIGHT);
              setDailyInsight(null);
              setCurrentView('HOME');
            }}
            onBack={() => setCurrentView('HOME')}
          />
        )}
        
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
      
      {(['HOME', 'HISTORY', 'PROFILE', 'ABOUT', 'RANKS_INFO', 'SETTINGS'].includes(currentView)) && <BottomNav currentView={currentView} onChangeView={setCurrentView} />}
    </div>
  );
};

export default App;
