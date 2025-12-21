import React, { useState, useEffect } from 'react';
// 👇 ВОТ ЭТА СТРОКА ОБЯЗАТЕЛЬНА, БЕЗ НЕЁ БЕЛЫЙ ЭКРАН
import logoImage from './logo.png'; 

import { ViewState, JournalMode, ChatSession, Message, UserProfile, JournalEntry } from './types';
import { BottomNav } from './components/BottomNav';
import { ChatInterface } from './components/ChatInterface';
import { JournalInterface } from './components/JournalInterface';
import { Heart, BookOpen, ChevronRight, Settings, Info, Bell, User as UserIcon, Activity, Calendar, Quote, Clock, Zap, Camera, Star, ArrowLeft, Footprints, MessageSquare, ArrowRight, Cloud, Lock, CheckCircle, Edit2, Mail, LogOut, LogIn, PenTool, Moon, Sun, Sparkles, ChevronUp, ChevronDown, Award, Medal } from 'lucide-react';;

declare global {
  interface Window {
    Telegram: any;
  }
}

const QUOTES = [
  { text: "Счастье — это не что-то готовое. Оно происходит из ваших собственных действий.", author: "Далай-лама" },
  { text: "Ваше время ограничено, не тратьте его, живя чужой жизнью.", author: "Стив Джобс" },
  { text: "Единственный способ делать великие дела — любить то, что вы делаете.", author: "Стив Джобс" },
  { text: "Начинать всегда стоит с того, что сеет сомнения.", author: "Борис Стругацкий" },
  { text: "Не позволяйте шуму чужих мнений перебить ваш внутренний голос.", author: "Стив Джобс" },
  { text: "Лучший способ предсказать будущее — создать его.", author: "Питер Друкер" },
  { text: "Успех — это способность шагать от одной неудачи к другой, не теряя энтузиазма.", author: "Уинстон Черчилль" },
];

const RANKS = [
  { threshold: 50000, title: "Дзен-Мастер", desc: "Путь и путник стали одним целым. Вы достигли вершины самопознания." },
  { threshold: 20000, title: "Мудрец", desc: "Глубокое спокойствие и знание. Ты прошел тысячи дорог и знаешь, что все они ведут внутрь." },
  { threshold: 5000, title: "Архитектор Смыслов", desc: "Ты перестаешь искать чужие ответы и начинаешь создавать свои собственные правила жизни." },
  { threshold: 1500, title: "Осознанный", desc: "Количество перешло в качество. Ты понимаешь причины и следствия своих чувств. Ты идешь уверенно." },
  { threshold: 300, title: "Исследователь", desc: "Ты нашел интересную территорию и начал копать вглубь. Ты изучаешь себя системно." },
  { threshold: 80, title: "Искатель", desc: "Из блуждания рождается цель. Ты не просто идешь, ты ищешь ответы. Твои вопросы становятся точнее." },
  { threshold: 15, title: "Странник", desc: "Ты сделал первый шаг. Ты вышел в путь. Ты еще не знаешь точной цели, но ты уже в движении." },
  { threshold: 0, title: "Наблюдатель", desc: "Ты присматриваешься. Ты еще не идешь по пути, ты изучаешь карту. Ты смотришь на свои эмоции, но пока не работаешь с ними." },
];

const STORAGE_KEYS = {
  PROFILE: 'mm_profile',
  HISTORY: 'mm_history',
  SESSIONS: 'mm_total_sessions',
  TIME: 'mm_total_time',
  ACTIVITY: 'mm_weekly_activity',
  JOURNAL: 'mm_journal_entries'
};

// Логотип: Чистый, без фона, сохраняет пропорции
const Logo = ({ className = "w-20 h-20" }: { className?: string, color?: string, bg?: string }) => (
  <img 
    src={logoImage} 
    alt="Mindful Mirror" 
    className={`${className} object-contain`} 
  />
);

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : { name: '', avatarUrl: null, isSetup: true, isRegistered: false, theme: 'LIGHT' };
  });

  const isSpaceTheme = userProfile.theme === 'SPACE';

  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [selectedMode, setSelectedMode] = useState<JournalMode | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  
  const [history, setHistory] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [totalSessions, setTotalSessions] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return saved ? parseInt(saved, 10) : 0;
  });
  
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TIME);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.JOURNAL);
    return saved ? JSON.parse(saved) : [];
  });

  const [weeklyActivity, setWeeklyActivity] = useState<number[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    return saved ? JSON.parse(saved) : [40, 60, 30, 80, 55, 30, 10];
  });

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      try {
        const headerColor = isSpaceTheme ? '#0B0E14' : '#F8FAFC';
        if (tg.setHeaderColor) tg.setHeaderColor(headerColor);
        if (tg.setBackgroundColor) tg.setBackgroundColor(headerColor);
      } catch (e) {
        console.error("Error setting Telegram colors:", e);
      }

      const user = tg.initDataUnsafe?.user;
      if (user && !userProfile.name) {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
        setUserProfile(prev => ({ ...prev, name: fullName, isRegistered: true }));
      }
    }
  }, [isSpaceTheme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, totalSessions.toString());
  }, [totalSessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TIME, totalTimeSeconds.toString());
  }, [totalTimeSeconds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(weeklyActivity));
  }, [weeklyActivity]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(journalEntries));
  }, [journalEntries]);

  const totalMinutes = Math.round(totalTimeSeconds / 60);
  const totalSteps = totalSessions + totalMinutes; 

  const getCurrentRank = (steps: number) => {
    return RANKS.find(r => steps >= r.threshold) || RANKS[RANKS.length - 1];
  };

  const startMode = (mode: JournalMode) => {
    setSelectedMode(mode);
    setCurrentView('CHAT');
  };

  const handleSaveJournalEntry = (entry: JournalEntry, isNew: boolean, duration: number) => {
    setTotalTimeSeconds(prev => prev + duration);
    if (isNew) {
      setJournalEntries(prev => [entry, ...prev]);
      setTotalSessions(prev => prev + 1);
    } else {
      setJournalEntries(prev => prev.map(e => e.id === entry.id ? entry : e));
    }
  };

  const handleDeleteJournalEntry = (id: string) => {
    setJournalEntries(prev => prev.filter(e => e.id !== id));
  };
  
  const handleReorderJournalEntries = (newOrder: JournalEntry[]) => {
    setJournalEntries(newOrder);
  };

  const handleSessionComplete = (messages: Message[], duration: number) => {
    const firstUserMessage = messages.find(m => m.role === 'user');
    const previewText = firstUserMessage ? firstUserMessage.content : 'Сессия без сообщений';
    const newSession: ChatSession = {
      id: Date.now().toString(),
      mode: selectedMode!,
      date: Date.now(),
      duration: duration,
      preview: previewText.length > 50 ? previewText.substring(0, 50) + '...' : previewText,
      messages: messages
    };
    setHistory(prev => [newSession, ...prev]);
    setTotalSessions(prev => prev + 1);
    setTotalTimeSeconds(prev => prev + duration);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setUserProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const today = new Date();
  const quoteIndex = (today.getDate() + today.getMonth()) % QUOTES.length;
  const quoteOfTheDay = QUOTES[quoteIndex];
  const currentRank = getCurrentRank(totalSteps);

  const ascendingRanks = [...RANKS].reverse();
  const nextRank = ascendingRanks.find(r => r.threshold > totalSteps);
  const prevThreshold = ascendingRanks.find(r => r.threshold <= totalSteps)?.threshold || 0;
  
  let progressPercent = 100;
  if (nextRank) {
      const totalGap = nextRank.threshold - prevThreshold;
      const progressInGap = totalSteps - prevThreshold;
      progressPercent = (progressInGap / totalGap) * 100;
  }
  if (isNaN(progressPercent)) progressPercent = 0;

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return { value: '< 1', unit: 'мин' };
    if (seconds < 3600) return { value: Math.round(seconds / 60).toString(), unit: 'мин' };
    return { value: (seconds / 3600).toFixed(1), unit: 'ч' };
  };

  const practiceTime = formatDuration(totalTimeSeconds);

  const toggleTheme = () => {
    setUserProfile(prev => ({ ...prev, theme: prev.theme === 'SPACE' ? 'LIGHT' : 'SPACE' }));
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
  };

  const renderRanksInfo = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-32">
      <header className="mb-8 flex items-center space-x-4 text-left">
         <button onClick={() => setCurrentView('PROFILE')} className={`p-2 -ml-2 rounded-full ${isSpaceTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} text-slate-500`}>
           <ArrowLeft size={24} />
         </button>
         <h1 className={`text-3xl font-bold ${isSpaceTheme ? 'text-white' : 'text-slate-800'}`}>Ранги пути</h1>
      </header>

      <div className="space-y-4">
        {[...RANKS].reverse().map((rank) => (
          <div 
            key={rank.title} 
            className={`p-5 rounded-[24px] border transition-all ${
              totalSteps >= rank.threshold 
                ? (isSpaceTheme ? 'bg-indigo-900/20 border-indigo-500/30 ring-1 ring-indigo-500/10' : 'bg-indigo-50 border-indigo-100')
                : (isSpaceTheme ? 'bg-slate-900/40 border-slate-800 opacity-60' : 'bg-slate-50/50 border-slate-100 opacity-50')
            }`}
          >
            <div className="flex justify-between items-start mb-2">
               <h4 className={`font-bold ${totalSteps >= rank.threshold ? (isSpaceTheme ? 'text-indigo-300' : 'text-indigo-700') : 'text-slate-400'}`}>
                  {rank.title}
               </h4>
               {totalSteps >= rank.threshold && (
                 <Award size={18} className={isSpaceTheme ? 'text-indigo-400' : 'text-indigo-500'} />
               )}
            </div>
            <p className={`text-xs leading-relaxed ${isSpaceTheme ? 'text-slate-400' : 'text-slate-500'}`}>
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
         <button onClick={() => setCurrentView('PROFILE')} className={`p-2 -ml-2 rounded-full ${isSpaceTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} text-slate-500`}>
           <ArrowLeft size={24} />
         </button>
         <h1 className={`text-3xl font-bold ${isSpaceTheme ? 'text-white' : 'text-slate-800'}`}>О приложении</h1>
      </header>
      
      <div className={`${isSpaceTheme ? 'bg-[#1C2128] border-slate-800' : 'bg-white shadow-sm border-slate-100'} rounded-[32px] p-8 border flex flex-col items-center text-center`}>
        <div className="flex justify-center mb-10">
          <Logo className="w-48 h-48 drop-shadow-xl" bg="white" />
        </div>
        <h2 className={`text-3xl font-bold mb-6 ${isSpaceTheme ? 'text-white' : 'text-slate-800'}`}>Mindful Mirror</h2>
        
        <div className="space-y-6 text-left">
          <p className={`text-[16px] leading-relaxed ${isSpaceTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Mindful Mirror — это ваш персональный спутник в мире осознанности. Мы объединили возможности современных технологий и психологических практик, чтобы помочь вам находить ответы внутри себя.
          </p>
          <p className={`text-[16px] leading-relaxed ${isSpaceTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Это пространство для вашего внутреннего диалога. Оно не для того, чтобы давать советы, а чтобы помочь вам услышать самих себя.
          </p>
          <p className={`text-[16px] leading-relaxed ${isSpaceTheme ? 'text-slate-400' : 'text-slate-600'}`}>
            Каждая сессия, каждая запись в дневнике — это шаг по пути самопознания. Набирайте баллы осознанности, открывайте новые ранги и изучайте ландшафт своей души.
          </p>
        </div>

        <div className={`w-full pt-8 mt-10 border-t ${isSpaceTheme ? 'border-slate-800' : 'border-slate-100'} flex justify-around`}>
           <div className="text-center">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Версия</p>
              <p className={`text-base font-semibold ${isSpaceTheme ? 'text-slate-200' : 'text-slate-700'}`}>1.2.0</p>
           </div>
           <div className="text-center">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Сборка</p>
              <p className={`text-base font-semibold ${isSpaceTheme ? 'text-slate-200' : 'text-slate-700'}`}>09-2025</p>
           </div>
        </div>
        
        <p className="text-[12px] text-slate-400 font-medium italic mt-12">
          "Познай самого себя, и ты познаешь мир."
        </p>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="h-full overflow-y-auto animate-fade-in relative z-10 pb-32">
    {/* --- ЗАГОЛОВОК (ОТСТУПЫ И РАЗМЕР ИСПРАВЛЕНЫ) --- */}
        <div className="flex justify-between items-center mb-8 relative z-20 pt-4 px-6">
          <div className="flex-1 mr-2">
            <h1 className={`text-4xl font-extrabold tracking-tight leading-none mb-2 ${isSpaceTheme ? 'text-white' : 'text-slate-800'}`}>
              Привет{userProfile.name ? `, ${userProfile.name}` : ''}
            </h1>
            <p className={`text-lg font-medium ${isSpaceTheme ? 'text-blue-100/90' : 'text-slate-500'}`}>
              Как твое настроение?
            </p>
          </div>
          
          {/* Логотип: Стал больше (w-24) и без фона */}
          <Logo className="w-24 h-24 flex-shrink-0" />
        </div>
        {/* --- КОНЕЦ ШАПКИ --- */}

      <div className="px-6 mb-12">
        <div className="grid grid-cols-3 gap-5">
          {[
            { id: 'DECISION', label: 'Решение', icon: Zap, color: 'indigo', iconColor: 'text-indigo-500', bgGrad: 'from-indigo-50 to-purple-50' },
            { id: 'EMOTIONS', label: 'Эмоции', icon: Heart, color: 'rose', iconColor: 'text-rose-500', bgGrad: 'from-rose-50 to-pink-50' },
            { id: 'REFLECTION', label: 'Дневник', icon: BookOpen, color: 'emerald', iconColor: 'text-emerald-500', bgGrad: 'from-emerald-50 to-teal-50' }
          ].map((m) => (
            <button key={m.id} onClick={() => startMode(m.id as JournalMode)} className="flex flex-col items-center space-y-3 group">
              <div className={`w-full aspect-square rounded-[30px] ${isSpaceTheme ? 'bg-[#1C2128] border-slate-800 shadow-xl' : 'bg-white border-slate-100 shadow-sm'} border flex items-center justify-center relative overflow-hidden group-hover:-translate-y-2 transition-all duration-300`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${m.bgGrad} ${isSpaceTheme ? 'opacity-5' : 'opacity-50'}`}></div>
                <m.icon size={32} className={`${m.iconColor} relative z-10`} fill={m.id === 'DECISION' ? "currentColor" : "none"} strokeWidth={m.id === 'DECISION' ? 0 : 2} />
              </div>
              <span className={`text-[12px] font-bold ${isSpaceTheme ? 'text-slate-400' : 'text-slate-600'}`}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 space-y-4 mb-10">
        <h3 className={`text-lg font-bold ml-2 ${isSpaceTheme ? 'text-slate-300' : 'text-slate-700'}`}>Мудрость дня</h3>
        <div className={`${isSpaceTheme ? 'bg-[#1C2128] border-slate-800' : 'bg-white border-slate-50'} p-6 rounded-[32px] border shadow-sm relative overflow-hidden`}>
           <div className={`absolute top-0 left-0 w-24 h-24 ${isSpaceTheme ? 'bg-indigo-900/20' : 'bg-amber-50'} rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl`}></div>
           <Quote size={32} className={`${isSpaceTheme ? 'text-indigo-900/40' : 'text-amber-100'} absolute top-5 left-5`} />
           <div className="relative z-10 text-center px-4 py-4">
              <p className={`${isSpaceTheme ? 'text-slate-300' : 'text-slate-700'} italic font-semibold text-[17px] leading-relaxed mb-6`}>
                "{quoteOfTheDay.text}"
              </p>
              <div className={`w-12 h-1 ${isSpaceTheme ? 'bg-indigo-500/30' : 'bg-amber-200'} mx-auto mb-3 rounded-full`}></div>
              <p className="text-[11px] text-slate-400 uppercase tracking-[0.2em] font-black">{quoteOfTheDay.author}</p>
           </div>
        </div>
      </div>

      <div className="px-6 mb-8">
         <button 
           onClick={() => setCurrentView('RANKS_INFO')}
           className={`w-full text-left outline-none active:scale-[0.98] transition-all group ${isSpaceTheme ? 'bg-gradient-to-br from-[#1C2128] to-[#0D1117] border-slate-800 shadow-indigo-900/10' : 'bg-white border-white shadow-[0_25px_50px_-15px_rgba(200,210,255,0.4)]'} rounded-[40px] p-8 border relative overflow-hidden`}
         >
            {isSpaceTheme && (
               <div className="absolute inset-0 overflow-hidden opacity-30 pointer-events-none">
                 {[...Array(25)].map((_, i) => (
                   <div key={i} className="absolute bg-white rounded-full" style={{
                     width: Math.random() * 2 + 'px',
                     height: Math.random() * 2 + 'px',
                     top: Math.random() * 100 + '%',
                     left: Math.random() * 100 + '%',
                     animation: `pulse ${Math.random() * 3 + 2}s infinite`
                   }}></div>
                 ))}
               </div>
            )}
            <div className={`absolute top-0 right-0 w-48 h-48 ${isSpaceTheme ? 'bg-indigo-500/10' : 'bg-indigo-50'} rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3 group-hover:scale-125 transition-transform duration-700`}></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <p className="text-[11px] text-slate-400 font-black uppercase tracking-[0.15em] mb-2 flex items-center">
                    ПУТЬ ОСОЗНАНИЯ <ChevronRight size={12} className="ml-1 opacity-50" />
                  </p>
                  <h4 className={`text-4xl font-black text-transparent bg-clip-text ${isSpaceTheme ? 'bg-gradient-to-r from-indigo-400 to-cyan-400' : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700'}`}>
                    {currentRank.title}
                  </h4>
                </div>
                <div className={`w-14 h-14 rounded-3xl ${isSpaceTheme ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'} flex items-center justify-center shadow-lg border ${isSpaceTheme ? 'border-indigo-500/20' : 'border-indigo-100/50'} transform group-hover:rotate-12 transition-transform`}>
                  <Star size={28} fill="currentColor" />
                </div>
              </div>

              <div className="mb-10">
                <div className="flex justify-between text-[11px] text-slate-400 mb-3 font-black uppercase tracking-wider">
                   <span>Прогресс</span>
                   <span>{totalSteps} / {nextRank ? nextRank.threshold : 'MAX'}</span>
                </div>
                <div className={`w-full h-4 ${isSpaceTheme ? 'bg-slate-800' : 'bg-slate-100'} rounded-full overflow-hidden shadow-inner`}>
                  <div 
                    className={`h-full ${isSpaceTheme ? 'bg-gradient-to-r from-indigo-500 to-cyan-500' : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600'} rounded-full relative transition-all duration-1000 ease-out`}
                    style={{ width: `${progressPercent}%` }}
                  >
                     <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className={`flex items-center pt-8 border-t ${isSpaceTheme ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex-1 flex items-center space-x-4">
                   <div className={`w-12 h-12 rounded-2xl ${isSpaceTheme ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-50 text-purple-600'} flex items-center justify-center shadow-sm`}>
                     <MessageSquare size={24} fill="currentColor" />
                   </div>
                   <div>
                     <div className={`text-2xl font-black ${isSpaceTheme ? 'text-white' : 'text-slate-800'}`}>{totalSessions}</div>
                     <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">Сессии</div>
                   </div>
                </div>
                <div className={`w-px h-12 ${isSpaceTheme ? 'bg-slate-800' : 'bg-slate-100'} mx-4`}></div>
                <div className="flex-1 flex items-center space-x-4 pl-4">
                   <div className={`w-12 h-12 rounded-2xl ${isSpaceTheme ? 'bg-cyan-500/10 text-cyan-400' : 'bg-pink-50 text-pink-600'} flex items-center justify-center shadow-sm`}>
                     <Activity size={24} />
                   </div>
                   <div>
                     <div className={`text-2xl font-black ${isSpaceTheme ? 'text-white' : 'text-slate-800'}`}>
                        {practiceTime.value}<span className="text-sm font-bold text-slate-400 ml-1">{practiceTime.unit}</span>
                     </div>
                     <div className="text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">Практика</div>
                   </div>
                </div>
              </div>
            </div>
         </button>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-24">
       <header className="mb-8">
        <h1 className={`text-3xl font-bold ${isSpaceTheme ? 'text-white' : 'text-slate-800'}`}>История</h1>
      </header>
      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
          <div className={`w-24 h-24 rounded-full ${isSpaceTheme ? 'bg-[#1C2128]' : 'bg-slate-50'} flex items-center justify-center text-slate-300 mb-2`}>
            <BookOpen size={32} strokeWidth={1.5} />
          </div>
          <h3 className={`${isSpaceTheme ? 'text-slate-300' : 'text-slate-700'} font-medium text-lg`}>Пока пусто</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((session) => (
            <button key={session.id} onClick={() => { setSelectedSession(session); setCurrentView('READ_HISTORY'); }} className={`w-full text-left p-4 rounded-[24px] ${isSpaceTheme ? 'bg-[#1C2128] border-slate-800 shadow-none' : 'bg-white border-slate-50 shadow-sm'} border flex items-start space-x-4 hover:shadow-md transition-shadow active:scale-98`}>
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${session.mode === 'DECISION' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500' : session.mode === 'EMOTIONS' ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-500' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'}`}>
                {session.mode === 'DECISION' ? <Zap size={20} fill="currentColor" strokeWidth={0} /> : session.mode === 'EMOTIONS' ? <Heart size={20} /> : <BookOpen size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                   <h4 className={`font-semibold ${isSpaceTheme ? 'text-slate-200' : 'text-slate-700'} text-sm`}>
                      {session.mode === 'DECISION' ? 'Решение' : session.mode === 'EMOTIONS' ? 'Эмоции' : 'Дневник'}
                   </h4>
                   <span className="text-[10px] text-slate-400">{new Date(session.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                </div>
                <p className={`text-xs ${isSpaceTheme ? 'text-slate-400' : 'text-slate-500'} line-clamp-2`}>{session.preview}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderProfile = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-24">
       <header className="mb-8 flex items-center space-x-4">
         <button onClick={() => setCurrentView('HOME')} className={`p-2 -ml-2 rounded-full ${isSpaceTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} text-slate-500`}>
           <ArrowLeft size={24} />
         </button>
         <h1 className={`text-3xl font-bold ${isSpaceTheme ? 'text-white' : 'text-slate-800'}`}>Профиль</h1>
      </header>
      
      <div className={`${isSpaceTheme ? 'bg-[#1C2128] border-slate-800' : 'bg-white shadow-indigo-100/50'} rounded-[32px] p-8 mb-8 flex flex-col items-center text-center relative overflow-hidden border`}>
        <div className={`absolute top-0 left-0 w-full h-24 ${isSpaceTheme ? 'bg-gradient-to-r from-indigo-900/20 to-purple-900/20' : 'bg-gradient-to-r from-indigo-100 to-purple-100'} opacity-50`}></div>
        <div className="w-24 h-24 rounded-full bg-white p-1 shadow-sm relative z-10 -mt-2 overflow-hidden border border-slate-100">
           {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover rounded-full" /> : <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">{userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <UserIcon size={40} />}</div>}
        </div>
        <h3 className={`text-xl font-bold mt-4 ${isSpaceTheme ? 'text-white' : 'text-slate-800'}`}>{userProfile.name || 'Странник'}</h3>
        <p className="text-sm text-indigo-400 font-medium">{currentRank.title}</p>
      </div>

      <div className="space-y-4">
        <button onClick={() => setCurrentView('RANKS_INFO')} className={`w-full p-5 rounded-[24px] ${isSpaceTheme ? 'bg-[#1C2128] border-slate-800 text-slate-300' : 'bg-white border-slate-50 shadow-sm text-slate-600'} border flex items-center justify-between transition-all active:scale-95`}>
          <div className="flex items-center space-x-4">
            <div className={`p-2.5 rounded-xl ${isSpaceTheme ? 'bg-slate-800' : 'bg-slate-50'} text-slate-500`}><Medal size={20} /></div>
            <span className="text-sm font-semibold">Ранги</span>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </button>

        <button onClick={() => setCurrentView('SETTINGS')} className={`w-full p-5 rounded-[24px] ${isSpaceTheme ? 'bg-[#1C2128] border-slate-800 text-slate-300' : 'bg-white border-slate-50 shadow-sm text-slate-600'} border flex items-center justify-between transition-all active:scale-95`}>
          <div className="flex items-center space-x-4">
            <div className={`p-2.5 rounded-xl ${isSpaceTheme ? 'bg-slate-800' : 'bg-slate-50'} text-slate-500`}><Settings size={20} /></div>
            <span className="text-sm font-semibold">Настройки</span>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </button>

        <button onClick={() => setCurrentView('ABOUT')} className={`w-full p-5 rounded-[24px] ${isSpaceTheme ? 'bg-[#1C2128] border-slate-800 text-slate-300' : 'bg-white border-slate-50 shadow-sm text-slate-600'} border flex items-center justify-between transition-all active:scale-95`}>
          <div className="flex items-center space-x-4">
            <div className={`p-2.5 rounded-xl ${isSpaceTheme ? 'bg-slate-800' : 'bg-slate-50'} text-slate-500`}><Info size={20} /></div>
            <span className="text-sm font-semibold">О приложении</span>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-24">
      <header className="mb-8 flex items-center space-x-4">
         <button onClick={() => setCurrentView('PROFILE')} className={`p-2 -ml-2 rounded-full ${isSpaceTheme ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} text-slate-500`}>
           <ArrowLeft size={24} />
         </button>
         <h1 className={`text-3xl font-bold ${isSpaceTheme ? 'text-white' : 'text-slate-800'}`}>Настройки</h1>
      </header>

      <div className={`${isSpaceTheme ? 'bg-[#1C2128] border-slate-800' : 'bg-white shadow-sm border-slate-100'} rounded-[32px] p-6 border space-y-6`}>
        <div className="flex flex-col items-center">
          <div className="relative">
             <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><UserIcon size={40} /></div>}
             </div>
             <label className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-full text-white cursor-pointer shadow-md"><Camera size={16} /><input type="file" className="hidden" onChange={handleAvatarChange} /></label>
          </div>
        </div>

        <div className="space-y-2">
           <label className={`text-sm font-bold ml-1 ${isSpaceTheme ? 'text-slate-300' : 'text-slate-700'}`}>Имя</label>
           <input type="text" value={userProfile.name} onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))} className={`w-full px-5 py-4 rounded-2xl ${isSpaceTheme ? 'bg-[#0D1117] border-slate-700 text-white' : 'bg-slate-50 border-slate-200'} border focus:outline-none focus:border-indigo-500`} />
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
           <label className={`text-sm font-bold ml-1 mb-3 block ${isSpaceTheme ? 'text-slate-300' : 'text-slate-700'}`}>Тема приложения</label>
           <div className="grid grid-cols-2 gap-3">
              <button onClick={() => userProfile.theme !== 'LIGHT' && toggleTheme()} className={`flex items-center justify-center space-x-2 p-4 rounded-2xl border transition-all ${!isSpaceTheme ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-[#0D1117] border-slate-800 text-slate-400'}`}>
                <Sun size={18} />
                <span className="text-sm font-bold">Светлая</span>
              </button>
              <button onClick={() => userProfile.theme !== 'SPACE' && toggleTheme()} className={`flex items-center justify-center space-x-2 p-4 rounded-2xl border transition-all ${isSpaceTheme ? 'bg-indigo-900/30 border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                <Sparkles size={18} />
                <span className="text-sm font-bold">Космос</span>
              </button>
           </div>
        </div>

        <button onClick={() => setCurrentView('PROFILE')} className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-bold shadow-lg mt-4 active:scale-98 transition-transform">Сохранить</button>
      </div>
    </div>
  );

  return (
    <div className={`h-screen w-full overflow-hidden flex flex-col font-sans relative transition-colors duration-500 ${isSpaceTheme ? 'bg-[#0B0E14]' : 'bg-[#F8FAFC]'}`}>
      <div className="absolute inset-0 z-0 pointer-events-none">
        {isSpaceTheme ? (
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-transparent to-transparent"></div>
        ) : (
           <>
             <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[50%] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-purple-100 rounded-full blur-[100px] opacity-60"></div>
           </>
        )}
      </div>

      <main className="flex-1 relative overflow-hidden z-10">
        {currentView === 'HOME' && renderHome()}
        {currentView === 'CHAT' && selectedMode === 'REFLECTION' && <JournalInterface entries={journalEntries} onSaveEntry={handleSaveJournalEntry} onDeleteEntry={handleDeleteJournalEntry} onUpdateOrder={handleReorderJournalEntries} onBack={() => setCurrentView('HOME')} />}
        {currentView === 'CHAT' && selectedMode !== 'REFLECTION' && selectedMode && <ChatInterface mode={selectedMode} onBack={() => setCurrentView('HOME')} onSessionComplete={handleSessionComplete} />}
        {currentView === 'READ_HISTORY' && selectedSession && <ChatInterface mode={selectedSession.mode} onBack={() => setCurrentView('HISTORY')} readOnly={true} initialMessages={selectedSession.messages} />}
        {currentView === 'HISTORY' && renderHistory()}
        {currentView === 'PROFILE' && renderProfile()}
        {currentView === 'SETTINGS' && renderSettings()}
        {currentView === 'ABOUT' && renderAbout()}
        {currentView === 'RANKS_INFO' && renderRanksInfo()}
      </main>
      
      {(currentView === 'HOME' || currentView === 'HISTORY' || currentView === 'PROFILE' || currentView === 'ABOUT' || currentView === 'RANKS_INFO' || currentView === 'SETTINGS') && <BottomNav currentView={currentView} onChangeView={setCurrentView} isSpace={isSpaceTheme} />}
    </div>
  );
};

export default App;
