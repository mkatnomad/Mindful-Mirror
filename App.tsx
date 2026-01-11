import React, { useState, useEffect, useRef } from 'react';
import { ViewState, JournalMode, ChatSession, Message, UserProfile, JournalEntry, SiteConfig } from './types';
import { BottomNav } from './components/BottomNav';
import { ChatInterface } from './components/ChatInterface';
import { JournalInterface } from './components/JournalInterface';
import { AdminInterface } from './components/AdminInterface';
import { sendMessageToGemini } from './services/geminiService';
import { Heart, BookOpen, ChevronRight, Settings, Info, User as UserIcon, Activity, Quote, Clock, Zap, Camera, Star, ArrowLeft, MessageSquare, Award, Medal, RefreshCw, Loader2, Cloud, Lock, Moon, Search, Sparkles } from 'lucide-react';

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
    "Mindful Mirror — это ваш персональный спутник.",
    "Мы используем ИИ, чтобы помочь вам лучше понять себя."
  ],
  quotes: [],
  adminPasscode: "0000"
};

const RANKS = [
  { threshold: 50000, title: "Дзен-Мастер", desc: "Путь и путник стали одним целым." },
  { threshold: 20000, title: "Мудрец", desc: "Глубокое спокойствие и знание." },
  { threshold: 5000, title: "Архитектор Смыслов", desc: "Ты создаешь свои правила жизни." },
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
  DAILY_INSIGHT: 'mm_daily_insight_v4'
};

const StylizedMMText = ({ text = "mm", className = "", color = "white", opacity = "1" }: { text?: string, className?: string, color?: string, opacity?: string }) => (
  <span className={`${className} font-extrabold italic select-none pointer-events-none uppercase`} style={{ color, opacity, fontFamily: 'Manrope, sans-serif' }}>{text}</span>
);

const Logo = ({ className = "w-20 h-20" }: { className?: string, color?: string, bg?: string }) => (
  <img src="/logo.png" alt="Mindful Mirror" className={`${className} object-contain`} />
);

// --- КОМПОНЕНТ ОПРОСА ---
const OnboardingScreen: React.FC<{ onComplete: (data: { focus: string, struggle: string, tone: string }) => void, onBack: () => void }> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [tempFocus, setTempFocus] = useState('');
  const [tempStruggle, setTempStruggle] = useState('');
  
  const steps = [
    {
      title: "Что для вас сейчас важнее всего?",
      options: [
        { label: "Внутреннее спокойствие", icon: Moon, value: "Найти внутренний покой и баланс" },
        { label: "Поиск себя и целей", icon: Search, value: "Разобраться в себе и найти цель" },
        { label: "Продуктивность", icon: Zap, value: "Стать эффективнее и дисциплинированнее" },
        { label: "Отношения с людьми", icon: Heart, value: "Улучшить отношения и коммуникацию" },
      ]
    },
    {
      title: "Что мешает вам чаще всего?",
      options: [
        { label: "Тревога и стресс", icon: Cloud, value: "Тревожность и постоянный стресс" },
        { label: "Прокрастинация", icon: Clock, value: "Откладывание дел и лень" },
        { label: "Неуверенность", icon: Lock, value: "Синдром самозванца и сомнения" },
        { label: "Выгорание", icon: Activity, value: "Усталость и отсутствие энергии" },
      ]
    },
    {
      title: "Какой наставник вам нужен?",
      options: [
        { label: "Мягкий и поддерживающий", icon: Heart, value: "Эмпатичный, теплый, заботливый друг" },
        { label: "Честный и прямой", icon: Zap, value: "Прямолинейный коуч, говорящий правду" },
        { label: "Мудрый философ", icon: BookOpen, value: "Глубокий, спокойный, говорящий метафорами" },
      ]
    }
  ];

  const currentStepData = steps[step];

  const handleOptionSelect = (value: string) => {
    if (step === 0) {
      setTempFocus(value);
      setStep(1);
    } else if (step === 1) {
      setTempStruggle(value);
      setStep(2);
    } else if (step === 2) {
      onComplete({ focus: tempFocus, struggle: tempStruggle, tone: value });
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
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-200'}`} />
            ))}
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 text-center leading-tight mb-2">
            {currentStepData.title}
          </h2>
          <p className="text-center text-slate-400 text-sm">Шаг {step + 1} из 3</p>
        </div>

        <div className="space-y-3">
          {currentStepData.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleOptionSelect(option.value)}
              className="w-full p-5 rounded-[24px] border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 transition-all active:scale-95 flex items-center text-left group"
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

// --- MAIN APP ---
const App: React.FC = () => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch (e) {
      return DEFAULT_CONFIG;
    }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { onboardingCompleted: false, ...parsed };
      }
      return { name: '', avatarUrl: null, isSetup: true, isRegistered: false, onboardingCompleted: false };
    } catch (e) {
      return { name: '', avatarUrl: null, isSetup: true, isRegistered: false, onboardingCompleted: false };
    }
  });

  const isSpaceTheme = userProfile.theme === 'SPACE';

  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [selectedMode, setSelectedMode] = useState<JournalMode | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [dailyInsight, setDailyInsight] = useState<{ text: string, date: string, author: string } | null>(null);
  const [isInsightLoading, setIsInsightLoading] = useState(false);
   
  const [history, setHistory] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  });
   
  const [totalSessions, setTotalSessions] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    const val = saved ? parseInt(saved, 10) : 0;
    return isNaN(val) ? 0 : val;
  });
   
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIME);
    const val = saved ? parseInt(saved, 10) : 0;
    return isNaN(val) ? 0 : val;
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.JOURNAL);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  });

  const [weeklyActivity, setWeeklyActivity] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
      return saved ? JSON.parse(saved) : [40, 60, 30, 80, 55, 30, 10];
    } catch (e) { return [40, 60, 30, 80, 55, 30, 10]; }
  });

  const longPressTimer = useRef<number | null>(null);

  useEffect(() => {
    const generateDailyAdvice = async () => {
      if (!userProfile.onboardingCompleted || !userProfile.name) return;

      const todayStr = new Date().toDateString();
      const savedInsightRaw = localStorage.getItem(STORAGE_KEYS.DAILY_INSIGHT);
      
      let savedInsight = null;
      if (savedInsightRaw) {
        try { savedInsight = JSON.parse(savedInsightRaw); } catch (e) {}
      }

      if (savedInsight && savedInsight.date === todayStr) {
        setDailyInsight(savedInsight);
        return;
      }

      setIsInsightLoading(true);
      try {
        const recentEntries = journalEntries.slice(0, 3).map(e => e.content).join(". ");
        const userName = userProfile.name || "Друг";
        
        const prompt = `
          Ты — персональный ментор. 
          Пользователя зовут ${userName}.
          Его профиль:
          - Фокус: ${userProfile.focus || 'Развитие'}
          - Трудность: ${userProfile.struggle || 'Нет'}
          - Стиль: ${userProfile.aiTone || 'Мудрый'}

          Последние записи: "${recentEntries}".
          
          Дай ОДИН короткий, глубокий совет на сегодня. 
          Без приветствий. Максимум 2 предложения.
        `;

        const adviceText = await sendMessageToGemini(prompt);
        
        const newInsight = {
          text: adviceText,
          date: todayStr,
          author: "Mindful AI"
        };

        setDailyInsight(newInsight);
        localStorage.setItem(STORAGE_KEYS.DAILY_INSIGHT, JSON.stringify(newInsight));

      } catch (e) {
        setDailyInsight({
          text: "Вдохни глубоко. Ты там, где должен быть.",
          date: todayStr,
          author: "Mindful AI"
        });
      } finally {
        setIsInsightLoading(false);
      }
    };

    generateDailyAdvice();
  }, [userProfile.name, journalEntries, userProfile.onboardingCompleted]);

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
      const pass = prompt('Режим администратора. Введите пароль:');
      if (pass === siteConfig.adminPasscode) {
        if (window.Telegram?.WebApp?.HapticFeedback) {
          window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
        setCurrentView('ADMIN');
      } else if (pass !== null) {
        alert('Неверный пароль');
      }
    }, 2000); 
  };

  const handleAdminTriggerEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // --- RENDER FUNCTIONS ---
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

      <div className="px-6 space-y-3.5 mb-7">
        <h3 className="text-[10px] font-bold ml-2 text-slate-400 uppercase tracking-widest">
          {userProfile.onboardingCompleted ? "Совет дня" : "Персонализация"}
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
                  <h4 className="font-bold text-lg mb-1">Настроить профиль</h4>
                  <p className="text-indigo-100 text-xs leading-relaxed max-w-[200px]">
                    Ответьте на 3 вопроса, чтобы ИИ давал точные советы.
                  </p>
                </div>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                  <ChevronRight size={24} />
                </div>
             </div>
          </button>
        ) : (
          <div className="bg-white border-slate-50 p-6 rounded-[28px] border shadow-sm relative overflow-hidden min-h-[140px] flex flex-col justify-center">
             <div className="absolute top-0 left-0 w-24 h-24 bg-amber-50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
             <Quote size={24} className="text-amber-100 absolute top-4 left-4 opacity-50" />
             <div className="relative z-10 text-center px-2 py-1">
               {isInsightLoading ? (
                 <div className="flex flex-col items-center justify-center space-y-3">
                   <Loader2 className="animate-spin text-indigo-500" size={20} />
                   <p className="text-[10px] text-slate-400 animate-pulse font-medium">Синхронизация с космосом...</p>
                 </div>
               ) : (
                 <>
                   <p className="text-slate-700 italic font-semibold text-[15px] leading-relaxed mb-4">
                     "{dailyInsight?.text || 'Загрузка...'}"
                   </p>
                   <div className="w-8 h-1 bg-amber-200/40 mx-auto mb-2.5 rounded-full"></div>
                   <p className="text-[9px] text-slate-400 uppercase tracking-[0.2em] font-bold">{dailyInsight?.author || 'Mindful AI'}</p>
                 </>
               )}
             </div>
          </div>
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

  const renderHistory = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-24">
       <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">История</h1>
      </header>
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-2">
            <BookOpen size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-slate-700 font-medium text-lg">Пока пусто</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((session) => {
            // SAFE DATE PARSING
            let dateStr = 'Дата неизвестна';
            try {
                if (session.date) {
                    dateStr = new Date(session.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                }
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
                <p className="text-xs text-slate-500 line-clamp-2">{session.preview}</p>
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
        <p className="text-sm text-indigo-400 font-medium">{currentRank.title}</p>
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
                <p className="text-base font-semibold text-slate-700">1.3.0</p>
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
        {currentView === 'ONBOARDING' && (
          <OnboardingScreen 
            onComplete={(data) => {
              setUserProfile(prev => ({
                ...prev,
                focus: data.focus,
                struggle: data.struggle,
                aiTone: data.tone,
                onboardingCompleted: true
              }));
              localStorage.removeItem(STORAGE_KEYS.DAILY_INSIGHT);
              setDailyInsight(null);
              setCurrentView('HOME');
            }}
            onBack={() => setCurrentView('HOME')}
          />
        )}
        {currentView === 'HOME' && renderHome()}
        {currentView === 'CHAT' && selectedMode === 'REFLECTION' && <JournalInterface entries={journalEntries} onSaveEntry={handleSaveJournalEntry} onDeleteEntry={handleDeleteJournalEntry} onUpdateOrder={handleReorderJournalEntries} onBack={() => setCurrentView('HOME')} />}
        {currentView === 'CHAT' && selectedMode !== 'REFLECTION' && selectedMode && <ChatInterface mode={selectedMode} onBack={() => setCurrentView('HOME')} onSessionComplete={handleSessionComplete} />}
        {currentView === 'READ_HISTORY' && selectedSession && <ChatInterface mode={selectedSession.mode} onBack={() => setCurrentView('HISTORY')} readOnly={true} initialMessages={selectedSession.messages} />}
        {currentView === 'HISTORY' && renderHistory()}
        {currentView === 'PROFILE' && renderProfile()}
        {currentView === 'SETTINGS' && renderSettings()}
        {currentView === 'ABOUT' && renderAbout()}
        {currentView === 'RANKS_INFO' && renderRanksInfo()}
        {currentView === 'ADMIN' && (
          <AdminInterface 
            config={siteConfig} 
            onSave={(newCfg) => setSiteConfig(newCfg)} 
            onBack={() => setCurrentView('ABOUT')} 
          />
        )}
      </main>
      
      {(['HOME', 'HISTORY', 'PROFILE', 'ABOUT', 'RANKS_INFO', 'SETTINGS'].includes(currentView)) && <BottomNav currentView={currentView} onChangeView={setCurrentView} />}
    </div>
  );
};

export default App;
