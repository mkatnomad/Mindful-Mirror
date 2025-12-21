import React, { useState, useEffect } from 'react';
import { ViewState, JournalMode, ChatSession, Message, UserProfile, JournalEntry } from './types';
import { BottomNav } from './components/BottomNav';
import { ChatInterface } from './components/ChatInterface';
import { JournalInterface } from './components/JournalInterface';
import { Heart, BookOpen, ChevronRight, Settings, Info, Bell, User as UserIcon, Activity, Calendar, Quote, Clock, Zap, Camera, Star, ArrowLeft, Footprints, MessageSquare, ArrowRight, Cloud, Lock, CheckCircle, Edit2, Mail, LogOut, LogIn, PenTool, Moon, Sun, Sparkles, ChevronUp, ChevronDown, Award, Medal } from 'lucide-react';

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

// --- ЛОГОТИП (ИСПРАВЛЕНО: Прямая ссылка, без импорта) ---
const Logo = ({ className = "w-20 h-20" }: { className?: string, color?: string, bg?: string }) => (
  <img 
    src="/logo.png" 
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
              <p className={`text-base font-semibold ${isSpaceTheme ? 'text-slate-20
