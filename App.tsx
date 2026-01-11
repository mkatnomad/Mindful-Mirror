import React, { useState, useEffect, useRef } from 'react';
import { ViewState, JournalMode, ChatSession, Message, UserProfile, JournalEntry, SiteConfig, DailyInsightData } from './types';
import { BottomNav } from './components/BottomNav';
import { ChatInterface } from './components/ChatInterface';
import { JournalInterface } from './components/JournalInterface';
import { AdminInterface } from './components/AdminInterface';
import { sendMessageToGemini } from './services/geminiService';
import { Heart, BookOpen, ChevronRight, Settings, Info, User as UserIcon, Activity, Quote, Clock, Zap, Camera, Star, ArrowLeft, MessageSquare, Award, Medal, RefreshCw, Loader2, Cloud, Lock, Moon, Search, Sparkles, Sun, Coffee, Brain, Briefcase, Feather, Compass, Anchor, Target, Battery, X, Shield, Map, Smile } from 'lucide-react';

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
    "Mindful Mirror — это зеркало вашего сознания.",
    "Здесь вы находите ответы, которые уже есть внутри вас."
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
  DAILY_INSIGHT: 'mm_daily_insight_v9' // v9 - Новая структура сфер
};

const StylizedMMText = ({ text = "mm", className = "", color = "white", opacity = "1" }: { text?: string, className?: string, color?: string, opacity?: string }) => (
  <span className={`${className} font-extrabold italic select-none pointer-events-none uppercase`} style={{ color, opacity, fontFamily: 'Manrope, sans-serif' }}>{text}</span>
);

// --- ЛОГИКА ТЕСТА НА АРХЕТИП ---
const ARCHETYPES = {
  CREATOR: { title: "Творец", icon: Feather, desc: "Вы стремитесь создавать новое и выражать себя." },
  RULER: { title: "Правитель", icon: Briefcase, desc: "Вам важен порядок, контроль и достижения." },
  SAGE: { title: "Мудрец", icon: BookOpen, desc: "Вы ищете истину, знания и понимание мира." },
  CAREGIVER: { title: "Хранитель", icon: Shield, desc: "Ваша сила в заботе, эмпатии и поддержке." }
};

const OnboardingScreen: React.FC<{ onComplete: (data: Partial<UserProfile>) => void, onBack: () => void }> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ CREATOR: 0, RULER: 0, SAGE: 0, CAREGIVER: 0 });
  const [finalData, setFinalData] = useState<{ focus?: string, struggle?: string }>({});
  const [resultArchetype, setResultArchetype] = useState<string | null>(null);

  // Вопросы теста
  const questions = [
    {
      title: "Что движет вами больше всего?",
      options: [
        { label: "Желание создать что-то уникальное", type: 'CREATOR' },
        { label: "Стремление к успеху и влиянию", type: 'RULER' },
        { label: "Поиск истины и знаний", type: 'SAGE' },
        { label: "Желание помогать людям", type: 'CAREGIVER' },
      ]
    },
    {
      title: "Чего вы боитесь?",
      options: [
        { label: "Быть посредственностью", type: 'CREATOR' },
        { label: "Хаоса и потери контроля", type: 'RULER' },
        { label: "Быть обманутым или невежественным", type: 'SAGE' },
        { label: "Эгоизма и неблагодарности", type: 'CAREGIVER' },
      ]
    },
    {
      title: "Как вы отдыхаете?",
      options: [
        { label: "Хобби, искусство, креатив", type: 'CREATOR' },
        { label: "Планирование, спорт, статус", type: 'RULER' },
        { label: "Чтение, размышления, учеба", type: 'SAGE' },
        { label: "Время с близкими, уют", type: 'CAREGIVER' },
      ]
    },
    // Вопросы для настройки (не влияют на архетип, но сохраняются)
    {
      title: "Главный фокус на месяц?",
      key: 'focus',
      options: [
        { label: "Деньги и Карьера", value: "Рост доходов" },
        { label: "Спокойствие", value: "Снижение стресса" },
        { label: "Самореализация", value: "Поиск предназначения" },
        { label: "Отношения", value: "Улучшение связей" },
      ]
    },
    {
      title: "Что мешает прямо сейчас?",
      key: 'struggle',
      options: [
        { label: "Прокрастинация", value: "Откладывание дел" },
        { label: "Тревога и Страх", value: "Неуверенность" },
        { label: "Нет энергии", value: "Выгорание" },
        { label: "Хаос в мыслях", value: "Расфокус" },
      ]
    }
  ];

  const handleSelect = (option: any) => {
    // Если это вопрос на архетип (первые 3)
    if (option.type) {
      setScores(prev => ({ ...prev, [option.type]: prev[option.type as keyof typeof scores] + 1 }));
    }
    // Если это вопрос настройки
    if (questions[step].key) {
      setFinalData(prev => ({ ...prev, [questions[step].key!]: option.value }));
    }

    if (step < questions.length - 1) {
      setStep(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = () => {
    // Находим победителя
    let winner = 'SAGE';
    let maxScore = -1;
    (Object.keys(scores) as Array<keyof typeof scores>).forEach(key => {
      if (scores[key] > maxScore) {
        maxScore = scores[key];
        winner = key;
      }
    });
    setResultArchetype(winner);
  };

  const finish = () => {
    if (resultArchetype) {
      const arch = ARCHETYPES[resultArchetype as keyof typeof ARCHETYPES];
      onComplete({ 
        archetype: arch.title,
        focus: finalData.focus,
        struggle: finalData.struggle
      });
    }
  };

  if (resultArchetype) {
    const arch = ARCHETYPES[resultArchetype as keyof typeof ARCHETYPES];
    const Icon = arch.icon;
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-white animate-fade-in text-center">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
          <Icon size={48} />
        </div>
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Ваш Архетип</h2>
        <h1 className="text-4xl font-extrabold text-slate-800 mb-4">{arch.title}</h1>
        <p className="text-slate-600 leading-relaxed mb-10 max-w-xs">{arch.desc}</p>
        <button onClick={finish} className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-all">
          Получить персональный план
        </button>
      </div>
    );
  }

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
            {questions.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-200'}`} />
            ))}
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 text-center leading-tight mb-2">
            {questions[step].title}
          </h2>
        </div>
        <div className="space-y-3" key={step}>
          {questions[step].options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(option)}
              className="w-full p-5 rounded-[24px] border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 transition-all active:scale-95 flex items-center text-left group focus:outline-none"
            >
              <span className="ml-2 font-bold text-slate-700 group-hover:text-indigo-700">{option.label}</span>
              <ChevronRight className="ml-auto text-slate-300 group-hover:text-indigo-400" size={20} />
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

  // --- ГЕНЕРАЦИЯ ПО СФЕРАМ ЖИЗНИ ---
  useEffect(() => {
    const generateDailyAdvice = async () => {
      if (!userProfile.onboardingCompleted || !userProfile.name) return;

      const todayStr = new Date().toDateString();
      if (dailyInsight && dailyInsight.date === todayStr) return;

      setIsInsightLoading(true);
      try {
        const recentEntries = journalEntries.slice(0, 3).map(e => e.content).join(". ");
        const userName = userProfile.name || "Друг";
        
        const prompt = `
          Ты — элитный ментор. Клиент: ${userName}.
          Профиль: Архетип "${userProfile.archetype || 'Искатель'}", Цель "${userProfile.focus}", Проблема "${userProfile.struggle}".
          Контекст дневника: "${recentEntries}".
          
          Составь "Карту Дня" по 4 сферам. Дай конкретные, глубокие рекомендации (2-3 предложения каждая).
          Разделитель: "|||".
          
          1. СФЕРА МЫШЛЕНИЯ (Mindset): На чем держать ментальный фокус?
          2. СФЕРА ДЕЙСТВИЙ (Action): Какой конкретный шаг сделать к цели?
          3. СФЕРА ТЕЛА (Energy): Как восстановить ресурс сегодня?
          4. СФЕРА СМЫСЛОВ (Insight): Философский вопрос или мысль дня.
          
          Ответ только текст: МЫШЛЕНИЕ|||ДЕЙСТВИЕ|||ТЕЛО|||СМЫСЛ
        `;

        const responseText = await sendMessageToGemini(prompt);
        const parts = responseText.split('|||');
        
        const newInsight: DailyInsightData = {
          date: todayStr,
          mindset: parts[0]?.trim() || "Фокусируйся на том, что ты можешь контролировать.",
          action: parts[1]?.trim() || "Сделай самую важную задачу в первые 2 часа дня.",
          health: parts[2]?.trim() || "Прогуляйся 15 минут без телефона.",
          insight: parts[3]?.trim() || "Куда направлено внимание, туда течет энергия.",
        };

        setDailyInsight(newInsight);
        localStorage.setItem(STORAGE_KEYS.DAILY_INSIGHT, JSON.stringify(newInsight));

      } catch (e) {
        setDailyInsight({
          date: todayStr,
          mindset: "Слушай тишину.",
          action: "Один шаг вперед.",
          health: "Дыши глубоко.",
          insight: "Ты на верном пути."
        });
      } finally {
        setIsInsightLoading(false);
      }
    };

    generateDailyAdvice();
  }, [userProfile.name, journalEntries, userProfile.onboardingCompleted, dailyInsight]);

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
    const safeSteps = isNaN(steps) ? 0 : steps;
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
  const handleAdminTriggerEnd = () => { if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; } };

  // --- COMPONENT: BATTERY MODAL ---
  const renderBatteryModal = () => {
    if (!isBatteryModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsBatteryModalOpen(false)}></div>
        <div className="bg-white rounded-[32px] p-6 w-full max-w-xs relative z-10 animate-fade-in shadow-2xl">
          <button onClick={() => setIsBatteryModalOpen(false)} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
          <h3 className="text-xl font-bold text-center mb-6 text-slate-800">Твой заряд?</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "На пике 🔥", val: "high" },
              { label: "В потоке 🌊", val: "flow" },
              { label: "Нормально 🙂", val: "ok" },
              { label: "На нуле 🪫", val: "low" }
            ].map((item) => (
              <button 
                key={item.val}
                onClick={() => {
                  setIsBatteryModalOpen(false);
                  if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
                }}
                className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 font-semibold text-slate-700 transition-all active:scale-95 text-sm"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // --- COMPONENT: DAILY GUIDE ---
  const renderDailyGuide = () => (
    <div className="h-full flex flex-col bg-[#F8FAFC] px-6 pt-10 pb-32 animate-fade-in overflow-y-auto">
      <header className="mb-8 flex items-center space-x-4">
         <button onClick={() => setCurrentView('HOME')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500">
           <ArrowLeft size={24} />
         </button>
         <h1 className="text-3xl font-bold text-slate-800">Ваш план</h1>
      </header>

      {dailyInsight ? (
        <div className="space-y-6">
          {/* СФЕРА МЫШЛЕНИЯ */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-50 rounded-bl-[100px] opacity-50"></div>
             <div className="flex items-center space-x-3 mb-3 text-indigo-500 relative z-10">
               <Brain size={20} />
               <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Мышление</span>
             </div>
             <p className="text-slate-700 leading-relaxed font-medium relative z-10">{dailyInsight.mindset}</p>
          </div>

          {/* СФЕРА ДЕЙСТВИЙ (Акцент) */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[28px] p-6 text-white shadow-lg shadow-indigo-200 transform hover:scale-[1.01] transition-transform">
            <div className="flex items-center space-x-3 mb-3 opacity-90">
              <Target size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Действие</span>
            </div>
            <h2 className="text-lg font-bold leading-relaxed">{dailyInsight.action}</h2>
          </div>

          {/* СФЕРА ТЕЛА */}
          <div className="bg-white rounded-[28px] p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center space-x-3 mb-3 text-emerald-600">
              <Battery size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Тело & Ресурс</span>
            </div>
            <p className="text-slate-700 leading-relaxed font-medium">{dailyInsight.health}</p>
          </div>

          {/* СФЕРА СМЫСЛОВ */}
          <div className="bg-slate-900 rounded-[28px] p-6 text-slate-300 shadow-sm">
            <div className="flex items-center space-x-3 mb-3 text-amber-400">
              <Sparkles size={20} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Инсайт</span>
            </div>
            <p className="text-slate-200 leading-relaxed italic">"{dailyInsight.insight}"</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <Loader2 className="animate-spin text-indigo-500 mb-4" size={32} />
          <p className="text-slate-400">ИИ анализирует профиль...</p>
        </div>
      )}
    </div>
  );

  // --- RENDER HOME ---
  const renderHome = () => (
    <div className="h-full overflow-y-auto animate-fade-in relative z-10 pb-32">
      <header className="mb-8 w-full relative overflow-hidden">
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
             ) : (
                <div className="w-[100px] h-[100px] flex items-center justify-center opacity-[0.02]">
                  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40" stroke="#6366f1" strokeWidth="1"/><path d="M50 10V90M10 50H90" stroke="#6366f1" strokeWidth="1"/></svg>
                </div>
             )}
          </div>
          <div className="relative z-10 flex-1 pr-16">
            <h1 className="text-[19px] font-light tracking-tight text-slate-800/95 leading-tight">
              Привет, <span className="font-bold text-slate-900">{userProfile.name || 'Странник'}</span>
            </h1>
            
            {/* ЯРКАЯ КНОПКА "КАК ТЫ?" */}
            <button 
              onClick={() => setIsBatteryModalOpen(true)}
              className="mt-3 flex items-center space-x-2 bg-white shadow-sm border border-indigo-100 rounded-full pl-1 pr-4 py-1 active:scale-95 transition-all group"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                <Smile size={14} />
              </div>
              <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800">Отметить состояние</span>
            </button>
          </div>
        </div>
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

      <div className="px-6 space-y-3.5 mb-7">
        <h3 className="text-[10px] font-bold ml-2 text-slate-400 uppercase tracking-widest">
          {userProfile.onboardingCompleted ? "Ваш план" : "Персонализация"}
        </h3>
        
        {!userProfile.onboardingCompleted ? (
          <button 
            onClick={() => setCurrentView('ONBOARDING')}
            className="w-full bg-indigo-600 text-white p-6 rounded-[28px] shadow-lg shadow-indigo-200 border border-indigo-500 relative overflow-hidden group transition-all active:scale-95"
          >
             <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-90"></div>
             <div className="relative z-10 flex items-center justify-between">
                <div className="text-left">
                  <h4 className="font-bold text-lg mb-1">Пройти тест личности</h4>
                  <p className="text-indigo-100 text-xs leading-relaxed max-w-[200px]">
                    Узнайте свой архетип, чтобы ИИ создал стратегию под вас.
                  </p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                  <ChevronRight size={24} />
                </div>
             </div>
          </button>
        ) : (
          <button 
            onClick={() => setCurrentView('DAILY_GUIDE')}
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
                     План на день
                   </span>
                 </div>
                 <p className="text-slate-800 font-bold text-lg leading-tight mb-2 relative z-10 line-clamp-2">
                   {dailyInsight?.mindset || "Загрузка..."}
                 </p>
                 <div className="flex items-center text-indigo-500 text-xs font-bold mt-2 group-hover:translate-x-1 transition-transform">
                   <span>Смотреть карту</span>
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
                  <h4 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700">{currentRank?.title || "Странник"}</h4>
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

  const renderHistory = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-24">
       <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">История</h1>
      </header>
      {!history || history.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2">
            <BookOpen size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-slate-700 font-medium text-lg">Пока пусто</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((session) => {
            let dateStr = "Дата неизвестна";
            try {
              if (session.date) dateStr = new Date(session.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
            } catch (e) {}

            return (
            <button key={session.id} onClick={() => { setSelectedSession(session); setCurrentView('READ_HISTORY'); }} className="w-full text-left p-4 rounded-[24px] bg-white border-slate-50 shadow-sm border flex items-start space-x-4 hover:shadow-md transition-shadow active:scale-98">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${session.mode === 'DECISION' ? 'bg-indigo-50 text-indigo-500' : session.mode === 'EMOTIONS' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                {session.mode === 'DECISION' ? <Zap size={20} fill="currentColor" strokeWidth={0} /> : session.mode === 'EMOTIONS' ? <Heart size={20} /> : <BookOpen size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                   <h4 className="font-semibold text-slate-700 text-sm">
                      {session.mode === 'DECISION' ? 'Решение' : session.mode === 'EMOTIONS' ? 'Эмоции' : 'Дневник'}
                   </h4>
                   <span className="text-[10px] text-slate-400">{dateStr}</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2">{session.preview || 'Нет описания'}</p>
              </div>
            </button>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-24">
       <header className="mb-8 flex items-center space-x-4">
         <button onClick={() => setCurrentView('HOME')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500">
           <ArrowLeft size={24} />
         </button>
         <h1 className="text-3xl font-bold text-slate-800">Профиль</h1>
      </header>
      
      <div className="bg-white shadow-sm rounded-[32px] p-8 mb-8 flex flex-col items-center text-center relative overflow-hidden border border-slate-50">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-100 to-purple-100 opacity-50"></div>
        <div className="w-24 h-24 rounded-full bg-white p-1 shadow-sm relative z-10 -mt-2 overflow-hidden border border-slate-100">
           {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <UserIcon size={40} />}</div>}
        </div>
        <h3 className="text-xl font-bold mt-4 text-slate-800">{userProfile.name || 'Странник'}</h3>
        <p className="text-sm text-indigo-400 font-medium">{userProfile.archetype ? `Архетип: ${userProfile.archetype}` : (currentRank?.title || "Странник")}</p>
      </div>

      <div className="space-y-4">
        <button onClick={() => setCurrentView('RANKS_INFO')} className="w-full p-5 rounded-[24px] bg-white border-slate-50 shadow-sm text-slate-600 border flex items-center justify-between transition-all active:scale-95">
          <div className="flex items-center space-x-4">
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500"><Medal size={20} /></div>
            <span className="text-sm font-semibold">Ранги</span>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </button>

        <button onClick={() => setCurrentView('SETTINGS')} className="w-full p-5 rounded-[24px] bg-white border-slate-50 shadow-sm text-slate-600 border flex items-center justify-between transition-all active:scale-95">
          <div className="flex items-center space-x-4">
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500"><Settings size={20} /></div>
            <span className="text-sm font-semibold">Настройки</span>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </button>

        <button onClick={() => setCurrentView('ABOUT')} className="w-full p-5 rounded-[24px] bg-white border-slate-50 shadow-sm text-slate-600 border flex items-center justify-between transition-all active:scale-95">
          <div className="flex items-center space-x-4">
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500"><Info size={20} /></div>
            <span className="text-sm font-semibold">О приложении</span>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
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
             <label className="text-sm font-bold text-slate-700 mb-2 block">Тест личности</label>
             <button 
               onClick={() => {
                 setCurrentView('ONBOARDING');
               }}
               className="w-full py-4 rounded-2xl bg-slate-50 text-slate-600 font-bold border border-slate-100 active:scale-95 transition-all flex items-center justify-center space-x-2 hover:bg-slate-100"
             >
                <Compass size={18} />
                <span>Пройти тест заново</span>
             </button>
          </div>

          <button onClick={() => setCurrentView('PROFILE')} className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-bold shadow-lg mt-4 active:scale-98 transition-transform">Сохранить</button>
        </div>
      </div>
    );
  };

  const renderRanksInfo = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-32">
      <header className="mb-8 flex items-center space-x-4 text-left">
         <button onClick={() => setCurrentView('PROFILE')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500">
           <ArrowLeft size={24} />
         </button>
         <h1 className="text-3xl font-bold text-slate-800">Ранги пути</h1>
      </header>

      <div className="space-y-4">
        {[...RANKS].reverse().map((rank) => (
          <div 
            key={rank.title} 
            className={`p-5 rounded-[24px] border transition-all ${
              totalSteps >= rank.threshold 
                ? 'bg-indigo-50 border-indigo-100 shadow-sm'
                : 'bg-slate-50/50 border-slate-100 opacity-50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
               <h4 className={`font-bold ${totalSteps >= rank.threshold ? 'text-indigo-700' : 'text-slate-400'}`}>
                 {rank.title}
               </h4>
               {totalSteps >= rank.threshold && (
                 <Award size={18} className="text-indigo-500" />
               )}
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              {rank.desc}
            </p>
            <div className="mt-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-60">
              Требуется: {rank.threshold} баллов
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-32">
      <header className="mb-8 flex items-center space-x-4 text-left">
         <button onClick={() => setCurrentView('PROFILE')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500">
           <ArrowLeft size={24} />
         </button>
         <h1 className="text-3xl font-bold text-slate-800">О приложении</h1>
      </header>
      
      <div className="bg-white shadow-sm border-slate-100 rounded-[32px] p-8 border flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
           <StylizedMMText text={siteConfig.logoText} className="text-[200px]" color="#A78BFA" opacity="0.05" />
        </div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <div className="mb-10 p-6 rounded-3xl bg-indigo-500/10 flex items-center justify-center min-w-[120px] min-h-[120px]">
            {siteConfig.customLogoUrl ? (
              <img src={siteConfig.customLogoUrl} className="w-24 h-24 object-contain" alt="App Logo" />
            ) : (
              <StylizedMMText text={siteConfig.logoText} className="text-7xl" color="#6366f1" />
            )}
          </div>
          <h2 className="text-2xl font-bold mb-6 text-slate-800">{siteConfig.appTitle}</h2>
          
          <div className="space-y-6 text-left w-full px-2">
            {siteConfig.aboutParagraphs.map((p, i) => (
              <p key={i} className="text-[16px] leading-relaxed text-slate-600">
                {p}
              </p>
            ))}
          </div>

          <div className="w-full pt-8 mt-10 border-t border-slate-100 flex justify-around">
             <div className="text-center">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Версия</p>
                <p className="text-base font-semibold text-slate-700">1.6.0</p>
             </div>
             <div className="text-center">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Сборка</p>
                <p className="text-base font-semibold text-slate-700">09-2025</p>
             </div>
          </div>
          
          <p className="text-[12px] text-slate-400 font-medium italic mt-12">
            "Познай самого себя, и ты познаешь мир."
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col font-sans relative bg-[#F8FAFC]">
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[50%] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-purple-100 rounded-full blur-[100px] opacity-60"></div>
      </div>

      <main className="flex-1 relative overflow-hidden z-10">
        {renderBatteryModal()}
        {currentView === 'ONBOARDING' && (
          <OnboardingScreen 
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
