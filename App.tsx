import React, { useState, useEffect } from 'react';
import { ViewState, JournalMode, ChatSession, Message, UserProfile, JournalEntry } from './types';
import { BottomNav } from './components/BottomNav';
import { ChatInterface } from './components/ChatInterface';
import { JournalInterface } from './components/JournalInterface';
import { Heart, BookOpen, ChevronRight, Settings, Info, Bell, User as UserIcon, Activity, Calendar, Quote, Clock, Zap, Camera, Star, ArrowLeft, Footprints, MessageSquare, ArrowRight, Cloud, Lock, CheckCircle, Edit2, Mail, LogOut, LogIn, PenTool } from 'lucide-react';

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
  { threshold: 50000, title: "Дзен-Мастер", desc: "Путь и путник стали одним целым." },
  { threshold: 20000, title: "Мудрец", desc: "Глубокое спокойствие и знание. Ты прошел тысячи дорог и знаешь, что все они ведут внутрь." },
  { threshold: 5000, title: "Архитектор Смыслов", desc: "Ты перестаешь искать чужие ответы и начинаешь создавать свои собственные правила жизни." },
  { threshold: 1500, title: "Осознанный", desc: "Количество перешло в качество. Ты понимаешь причины и следствия своих чувств. Ты идешь уверенно." },
  { threshold: 300, title: "Исследователь", desc: "Ты нашел интересную территорию и начал копать вглубь. Ты изучаешь себя системно." },
  { threshold: 80, title: "Искатель", desc: "Из блуждания рождается цель. Ты не просто идешь, ты ищешь ответы. Твои вопросы становятся точнее." },
  { threshold: 15, title: "Странник", desc: "Ты сделал первый шаг. Ты вышел в путь. Ты еще не знаешь точной цели, но ты уже в движении." },
  { threshold: 0, title: "Наблюдатель", desc: "Ты присматриваешься. Ты еще не идешь по пути, ты изучаешь карту. Ты смотришь на свои эмоции, но пока не работаешь с ними." },
];

// Persistence Keys
const STORAGE_KEYS = {
  PROFILE: 'mm_profile',
  HISTORY: 'mm_history',
  SESSIONS: 'mm_total_sessions',
  TIME: 'mm_total_time',
  ACTIVITY: 'mm_weekly_activity',
  JOURNAL: 'mm_journal_entries'
};

const Logo = ({ className = "w-20 h-20" }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="mirror_grad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
        <stop stopColor="#818cf8" />
        <stop offset="1" stopColor="#c084fc" />
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="5" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Mirror Frame */}
    <rect x="55" y="35" width="90" height="130" rx="45" stroke="url(#mirror_grad)" strokeWidth="8" fill="white" />
    
    {/* Glass Inner Surface */}
    <rect x="55" y="35" width="90" height="130" rx="45" fill="url(#mirror_grad)" fillOpacity="0.03" />

    {/* Reflection Highlights */}
    <path d="M75 60 C 75 60 90 50 120 58" stroke="url(#mirror_grad)" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.4" />
    
    {/* Decorative Sparkle */}
    <path d="M132 48 L134 45 L136 48 L139 50 L136 52 L134 55 L132 52 L129 50 Z" fill="#c084fc" filter="url(#glow)" />
  </svg>
);

const App: React.FC = () => {
  // User Profile State - Load from LocalStorage
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return saved ? JSON.parse(saved) : { name: '', avatarUrl: null, isSetup: true, isRegistered: false };
  });

  const [currentView, setCurrentView] = useState<ViewState>('HOME');

  const [selectedMode, setSelectedMode] = useState<JournalMode | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  
  // State for History and Stats - Load from LocalStorage
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

  // Journal Entries State
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.JOURNAL);
    return saved ? JSON.parse(saved) : [];
  });

  // Default weekly activity
  const [weeklyActivity, setWeeklyActivity] = useState<number[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    return saved ? JSON.parse(saved) : [40, 60, 30, 80, 55, 30, 10];
  });

  // Telegram Initialization
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      try {
        if (tg.setHeaderColor) tg.setHeaderColor('#F8FAFC');
        if (tg.setBackgroundColor) tg.setBackgroundColor('#F8FAFC');
      } catch (e) {
        console.error("Error setting Telegram colors:", e);
      }

      const user = tg.initDataUnsafe?.user;
      if (user) {
        setUserProfile(prev => {
          if (!prev.name) {
             const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ');
             return {
               ...prev,
               name: fullName,
               isRegistered: true 
             };
          }
          return prev;
        });
      }
    }
  }, []);

  // Persistence Effects
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
      setWeeklyActivity(prev => {
        const newActivity = [...prev];
        const todayIndex = 6;
        newActivity[todayIndex] = Math.min(newActivity[todayIndex] + 15, 100);
        return newActivity;
      });
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
    setWeeklyActivity(prev => {
      const newActivity = [...prev];
      const todayIndex = 6;
      newActivity[todayIndex] = Math.min(newActivity[todayIndex] + 15, 100);
      return newActivity;
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
         setUserProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
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
    const hours = seconds / 3600;
    return { value: hours.toFixed(1), unit: 'ч' };
  };

  const practiceTime = formatDuration(totalTimeSeconds);

  const renderHome = () => (
    <div className="p-6 pt-12 pb-32 h-full overflow-y-auto animate-fade-in relative z-10">
      
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight">
          Привет{userProfile.name ? `, ${userProfile.name}` : ''} <br/>
          <span className="text-slate-400 font-light">Как твое настроение?</span>
        </h1>
      </header>

      <div className="mb-10">
        <div className="grid grid-cols-3 gap-4">
          <button onClick={() => startMode('DECISION')} className="flex flex-col items-center space-y-3 group">
            <div className="w-full aspect-square rounded-[24px] bg-white border border-slate-100 shadow-[0_8px_20px_-6px_rgba(192,132,252,0.2)] flex items-center justify-center relative overflow-hidden group-hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 opacity-50"></div>
              <Zap size={28} className="text-indigo-500 relative z-10" fill="currentColor" strokeWidth={0} />
            </div>
            <span className="text-[11px] font-semibold text-slate-600">Решение</span>
          </button>

          <button onClick={() => startMode('EMOTIONS')} className="flex flex-col items-center space-y-3 group">
            <div className="w-full aspect-square rounded-[24px] bg-white border border-slate-100 shadow-[0_8px_20px_-6px_rgba(244,114,182,0.2)] flex items-center justify-center relative overflow-hidden group-hover:-translate-y-1 transition-transform duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-pink-50 opacity-50"></div>
              <Heart size={28} className="text-rose-500 relative z-10" strokeWidth={2} />
            </div>
             <span className="text-[11px] font-semibold text-slate-600">Эмоции</span>
          </button>

          <button onClick={() => startMode('REFLECTION')} className="flex flex-col items-center space-y-3 group">
            <div className="w-full aspect-square rounded-[24px] bg-white border border-slate-100 shadow-[0_8px_20px_-6px_rgba(52,211,153,0.2)] flex items-center justify-center relative overflow-hidden group-hover:-translate-y-1 transition-transform duration-300">
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-50"></div>
              <BookOpen size={28} className="text-emerald-500 relative z-10" strokeWidth={2} />
            </div>
             <span className="text-[11px] font-semibold text-slate-600">Дневник</span>
          </button>
        </div>
      </div>

      {/* Quote of the Day (Moved Up) */}
      <div className="space-y-4 mb-10">
        <h3 className="text-lg font-semibold text-slate-700">Мудрость дня</h3>
        <div className="p-6 rounded-[24px] bg-white border border-slate-50 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 w-16 h-16 bg-amber-50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-xl"></div>
           <Quote size={32} className="text-amber-100 absolute top-4 left-4" />
           <div className="relative z-10 text-center px-2 py-2">
              <p className="text-slate-700 italic font-medium leading-relaxed mb-4">
                "{quoteOfTheDay.text}"
              </p>
              <div className="w-8 h-0.5 bg-amber-100 mx-auto mb-2"></div>
              <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">
                {quoteOfTheDay.author}
              </p>
           </div>
        </div>
      </div>

      {/* Unified Stats Panel (Moved Down) */}
      <div className="mb-8">
         <div className="w-full bg-white rounded-[32px] p-6 shadow-[0_20px_40px_-10px_rgba(200,210,255,0.4)] border border-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">ПУТЬ ОСОЗНАНИЯ</p>
                  <h4 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                    {currentRank.title}
                  </h4>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100/50">
                  <Star size={24} fill="currentColor" />
                </div>
              </div>

              <div className="mb-8">
                <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                   <span>Прогресс (шаги)</span>
                   <span>{totalSteps} / {nextRank ? nextRank.threshold : 'MAX'}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative transition-all duration-1000 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  >
                     <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center pt-6 border-t border-slate-50">
                <div className="flex-1 flex items-center space-x-3">
                   <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
                     <MessageSquare size={20} fill="currentColor" />
                   </div>
                   <div>
                     <div className="text-xl font-bold text-slate-700">{totalSessions}</div>
                     <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Сессии</div>
                   </div>
                </div>
                <div className="w-px h-10 bg-slate-100 mx-2"></div>
                <div className="flex-1 flex items-center space-x-3 pl-4">
                   <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-500">
                     <Activity size={20} />
                   </div>
                   <div>
                     <div className="text-xl font-bold text-slate-700">
                        {practiceTime.value}<span className="text-sm font-normal text-slate-400 ml-0.5">{practiceTime.unit}</span>
                     </div>
                     <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Практика</div>
                   </div>
                </div>
              </div>
            </div>
         </div>
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
          <p className="text-slate-400 text-sm max-w-[200px]">Начните сессию, чтобы сохранить ваши инсайты здесь.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((session) => (
            <button 
              key={session.id} 
              onClick={() => {
                setSelectedSession(session);
                setCurrentView('READ_HISTORY');
              }}
              className="w-full text-left p-4 rounded-[24px] bg-white border border-slate-50 shadow-sm flex items-start space-x-4 hover:shadow-md transition-shadow active:scale-98"
            >
              <div className={`
                w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                ${session.mode === 'DECISION' ? 'bg-indigo-50 text-indigo-500' : 
                  session.mode === 'EMOTIONS' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}
              `}>
                {session.mode === 'DECISION' && <Zap size={20} fill="currentColor" strokeWidth={0} />}
                {session.mode === 'EMOTIONS' && <Heart size={20} />}
                {session.mode === 'REFLECTION' && <BookOpen size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                   <h4 className="font-semibold text-slate-700 text-sm">
                      {session.mode === 'DECISION' ? 'Сложное решение' : 
                       session.mode === 'EMOTIONS' ? 'Разбор эмоций' : 'Дневник'}
                   </h4>
                   <span className="text-[10px] text-slate-400">
                     {new Date(session.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                   </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                   {session.preview}
                </p>
                <div className="mt-2 flex items-center text-[10px] text-slate-400">
                  <Clock size={10} className="mr-1" />
                  {Math.round(session.duration / 60) < 1 ? '< 1 мин' : `${Math.round(session.duration / 60)} мин`}
                </div>
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
         <button onClick={() => setCurrentView('HOME')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500">
           <ArrowLeft size={24} />
         </button>
         <h1 className="text-3xl font-bold text-slate-800">Профиль</h1>
      </header>
      
      <div className="bg-white shadow-lg shadow-indigo-100/50 rounded-[32px] p-8 mb-8 flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-100 to-purple-100 opacity-50"></div>
        <div className="w-24 h-24 rounded-full bg-white p-1 shadow-sm relative z-10 -mt-2 overflow-hidden">
           {userProfile.avatarUrl ? (
             <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-full" />
           ) : (
             <div className="w-full h-full rounded-full bg-gradient-to-tr from-indigo-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
               {userProfile.name ? userProfile.name.charAt(0).toUpperCase() : <UserIcon size={40} />}
             </div>
           )}
        </div>
        
        <div className="flex items-center mt-4">
           <h3 className="text-xl font-bold text-slate-800">{userProfile.name || 'Странник'}</h3>
        </div>
        <p className="text-sm text-indigo-400 font-medium">{currentRank.title}</p>
        
        <div className="flex w-full mt-6 pt-6 border-t border-slate-50">
           <div className="flex-1">
              <div className="text-lg font-bold text-slate-700">{totalSessions}</div>
              <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Сессии</div>
           </div>
           <div className="w-px bg-slate-100"></div>
           <div className="flex-1">
              <div className="text-lg font-bold text-slate-700">{totalMinutes}</div>
              <div className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Минуты</div>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <button onClick={() => setCurrentView('SETTINGS')} className="w-full p-5 rounded-[24px] bg-white border border-slate-50 shadow-sm text-slate-600 flex items-center justify-between transition-all active:scale-95">
          <div className="flex items-center space-x-4">
            <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500">
               <Settings size={20} />
            </div>
            <span className="text-sm font-semibold">Настройки</span>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </button>
        <button onClick={() => setCurrentView('ABOUT')} className="w-full p-5 rounded-[24px] bg-white border border-slate-50 shadow-sm text-slate-600 flex items-center justify-between transition-all active:scale-95">
          <div className="flex items-center space-x-4">
             <div className="p-2.5 rounded-xl bg-slate-50 text-slate-500">
              <Info size={20} />
            </div>
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
         <button onClick={() => setCurrentView('PROFILE')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500">
           <ArrowLeft size={24} />
         </button>
         <h1 className="text-3xl font-bold text-slate-800">Настройки</h1>
      </header>

      <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col items-center">
          <div className="relative">
             <div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg">
                {userProfile.avatarUrl ? (
                  <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <UserIcon size={40} />
                  </div>
                )}
             </div>
             <label className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-full text-white cursor-pointer hover:bg-indigo-600 transition-colors shadow-md">
               <Camera size={16} />
               <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
             </label>
          </div>
          <p className="mt-4 text-sm text-slate-500">Нажмите на камеру, чтобы изменить фото</p>
        </div>

        <div className="space-y-2">
           <label className="text-sm font-bold text-slate-700 ml-1">Имя пользователя</label>
           <input 
             type="text" 
             value={userProfile.name}
             onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))}
             className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-indigo-500 text-slate-800"
             placeholder="Введите ваше имя"
           />
        </div>

        <button onClick={() => setCurrentView('PROFILE')} className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-200 mt-4 active:scale-98 transition-transform">
          Сохранить
        </button>
      </div>
    </div>
  );

  const renderAbout = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-24">
       <header className="mb-8 flex items-center space-x-4">
         <button onClick={() => setCurrentView('PROFILE')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500">
           <ArrowLeft size={24} />
         </button>
         <h1 className="text-3xl font-bold text-slate-800">О приложении</h1>
      </header>

      <div className="space-y-6">
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-50">
           <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-50">
                <Logo className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Mindful Mirror</h2>
           </div>
           <p className="text-slate-600 leading-relaxed text-sm">
             Mindful Mirror помогает вам принимать взвешенные решения, понимать свои истинные эмоции и 
             повышать уровень осознанности через ежедневную практику и рефлексию.
           </p>
        </div>

        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-slate-50">
           <h3 className="text-lg font-bold text-slate-800 mb-4">Путь Осознания</h3>
           <div className="space-y-6 relative">
             <div className="absolute left-[11px] top-2 bottom-2 w-[2px] bg-slate-100"></div>
             {[...RANKS].reverse().map((rank, idx) => {
               const isReached = totalSteps >= rank.threshold;
               return (
                 <div key={idx} className={`relative flex items-start space-x-4 ${isReached ? 'opacity-100' : 'opacity-50 grayscale'}`}>
                    <div className={`w-6 h-6 rounded-full border-4 border-white shadow-sm flex-shrink-0 z-10 ${isReached ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                    <div>
                       <h4 className="text-sm font-bold text-slate-800 flex items-center">
                         {rank.title}
                         <span className="ml-2 text-[10px] font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                           {rank.threshold > 0 ? `${rank.threshold}+ шагов` : '0 шагов'}
                         </span>
                       </h4>
                       <p className="text-xs text-slate-500 mt-1">{rank.desc}</p>
                    </div>
                 </div>
               );
             })}
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full overflow-hidden bg-[#F8FAFC] flex flex-col font-sans relative">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[50%] bg-blue-100 rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-purple-100 rounded-full blur-[100px] opacity-60"></div>
      </div>

      <main className="flex-1 relative overflow-hidden z-10">
        {currentView === 'HOME' && renderHome()}
        
        {currentView === 'CHAT' && selectedMode === 'REFLECTION' && (
           <JournalInterface 
             entries={journalEntries}
             onSaveEntry={handleSaveJournalEntry}
             onDeleteEntry={handleDeleteJournalEntry}
             onUpdateOrder={handleReorderJournalEntries}
             onBack={() => setCurrentView('HOME')}
           />
        )}

        {currentView === 'CHAT' && selectedMode !== 'REFLECTION' && selectedMode && (
          <ChatInterface 
            mode={selectedMode} 
            onBack={() => setCurrentView('HOME')}
            onSessionComplete={handleSessionComplete}
          />
        )}

        {currentView === 'READ_HISTORY' && selectedSession && (
          <ChatInterface
            mode={selectedSession.mode}
            onBack={() => setCurrentView('HISTORY')}
            readOnly={true}
            initialMessages={selectedSession.messages}
          />
        )}
        {currentView === 'HISTORY' && renderHistory()}
        {currentView === 'PROFILE' && renderProfile()}
        {currentView === 'SETTINGS' && renderSettings()}
        {currentView === 'ABOUT' && renderAbout()}
      </main>
      
      {(currentView === 'HOME' || currentView === 'HISTORY' || currentView === 'PROFILE') && (
        <BottomNav currentView={currentView} onChangeView={setCurrentView} />
      )}
    </div>
  );
};

export default App;
