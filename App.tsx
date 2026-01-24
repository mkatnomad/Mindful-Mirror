
import React, { useState, useEffect, useCallback } from 'react';
import { ViewState, JournalMode, ChatSession, Message, UserProfile, JournalEntry, Archetype } from './types';
import { BottomNav } from './components/BottomNav';
import { ChatInterface } from './components/ChatInterface';
import { JournalInterface } from './components/JournalInterface';
import { generateRPGQuest, processRPGChoice } from './services/geminiService';
import { Heart, BookOpen, User as UserIcon, Zap, Star, ArrowLeft, ArrowRight, Compass, Check, X, Sparkle, RefreshCw, Quote, Loader2, Trophy, Wand2, Award, Info, ChevronRight, Sparkles, Sword, ShieldCheck, Lock } from 'lucide-react';

declare global {
  interface Window {
    Telegram: any;
  }
}

// Helper to interact with Telegram CloudStorage
const cloudStorage = {
  setItem: (key: string, value: any): Promise<void> => {
    return new Promise((resolve) => {
      if (window.Telegram?.WebApp?.CloudStorage) {
        window.Telegram.WebApp.CloudStorage.setItem(key, JSON.stringify(value), () => resolve());
      } else {
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      }
    });
  },
  getItem: <T,>(key: string): Promise<T | null> => {
    return new Promise((resolve) => {
      if (window.Telegram?.WebApp?.CloudStorage) {
        window.Telegram.WebApp.CloudStorage.getItem(key, (err: any, value: string) => {
          if (err || !value) resolve(null);
          else resolve(JSON.parse(value));
        });
      } else {
        const value = localStorage.getItem(key);
        resolve(value ? JSON.parse(value) : null);
      }
    });
  }
};

const TreeIcon = ({ stage, size = 40 }: { stage: number, size?: number }) => {
  const stages = [
    <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="#F0FDFA"/><circle cx="50" cy="50" r="30" fill="#FEF3C7"/><path d="M50 45C50 45 55 42 55 48C55 54 50 60 50 60C50 60 45 54 45 48C45 42 50 45 50 45Z" fill="#D97706"/></svg>,
    <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="#ECFDF5"/><path d="M50 75V55" stroke="#059669" strokeWidth="5" strokeLinecap="round"/><path d="M50 55C50 55 65 52 65 42C65 32 50 45 50 45" fill="#10B981"/></svg>,
    <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="#F0FDF4"/><path d="M50 75V40" stroke="#059669" strokeWidth="5" strokeLinecap="round"/><path d="M50 55C50 55 68 50 68 40C68 30 50 48 50 48" fill="#34D399"/><path d="M50 45C50 45 32 40 32 30" fill="#10B981"/></svg>,
    <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="#F0F9FF"/><path d="M50 85V50" stroke="#92400E" strokeWidth="6" strokeLinecap="round"/><circle cx="50" cy="35" r="22" fill="#10B981"/></svg>,
    <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="#F5F3FF"/><path d="M50 90V55" stroke="#78350F" strokeWidth="7" strokeLinecap="round"/><circle cx="50" cy="40" r="25" fill="#059669"/><circle cx="35" cy="50" r="16" fill="#10B981"/></svg>,
    <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="#FDF2F8"/><path d="M50 90V60" stroke="#78350F" strokeWidth="9" strokeLinecap="round"/><circle cx="50" cy="38" r="30" fill="#065F46"/><circle cx="30" cy="48" r="20" fill="#059669"/></svg>,
    <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="#EFF6FF"/><path d="M50 92V70" stroke="#451A03" strokeWidth="11" strokeLinecap="round"/><path d="M50 70L25 50M50 70L75 50" stroke="#451A03" strokeWidth="6" strokeLinecap="round"/><circle cx="50" cy="32" r="26" fill="#064E3B"/></svg>,
    <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="#FFF5F5"/><path d="M50 90V75" stroke="#451A03" strokeWidth="9" strokeLinecap="round"/><circle cx="50" cy="42" r="32" fill="#065F46"/><circle cx="40" cy="35" r="6" fill="#FB7185"/></svg>,
    <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="#FEFCE8"/><path d="M50 90V75" stroke="#451A03" strokeWidth="9" strokeLinecap="round"/><circle cx="50" cy="42" r="32" fill="#063B2B"/><circle cx="45" cy="38" r="7" fill="#F59E0B"/></svg>,
    <svg viewBox="0 0 100 100" fill="none"><circle cx="50" cy="50" r="40" fill="#F0FDFA"/><path d="M50 92V65" stroke="#451A03" strokeWidth="13" strokeLinecap="round"/><circle cx="50" cy="42" r="38" fill="#064E3B"/><circle cx="50" cy="42" r="28" fill="#10B981" opacity="0.4"/><circle cx="50" cy="42" r="9" fill="#FDE68A"/></svg>
  ];
  return <div style={{ width: size, height: size }}>{stages[stage] || stages[0]}</div>;
};

const ARCHETYPES: Archetype[] = [
  { id: '1', name: 'Шут', role: 'Мастер игры', motto: 'Живи моментом!', strength: 'Юмор и игривость', weakness: 'Легкомыслие', quote: 'Смех — это кратчайшее расстояние между двумя людьми.', description: 'Вы умеете находить радость в любой ситуации и превращать скуку в праздник.', meaning: 'Учит не принимать жизнь слишком серьезно и видеть абсурдность проблем.' },
  { id: '2', name: 'Славный малый', role: 'Союзник', motto: 'Мы все равны.', strength: 'Эмпатия и реализм', weakness: 'Потеря индивидуальности', quote: 'Быть собой — величайшее достижение в мире, который пытается сделать вас кем-то другим.', description: 'Вы цените честность, приземленность и глубокую связь с обычными людьми.', meaning: 'Символизирует потребность в принадлежности и принятии себя таким, какой ты есть.' },
  { id: '3', name: 'Заботливый', role: 'Опекун', motto: 'Люби ближнего своего.', strength: 'Альтруизм и щедрость', weakness: 'Мученичество', quote: 'Забота о других — это самая высокая форма заботы о собственной душе.', description: 'Ваше призвание — помогать, защищать и создавать безопасное пространство для роста.', meaning: 'Напоминает о важности безусловной поддержки и сострадания.' },
  { id: '4', name: 'Правитель', role: 'Лидер', motto: 'Власть — это ответственность.', strength: 'Лидерство и системность', weakness: 'Авторитаризм', quote: 'Управляй собой, прежде чем пытаться управлять миром.', description: 'Вы стремитесь создать порядок из хаоса и нести ответственность за структуру.', meaning: 'Учит ответственности за результат и умению выстраивать гармоничные системы.' },
  { id: '5', name: 'Творец', role: 'Архитектор', motto: 'Если это можно представить, это можно сделать.', strength: 'Креативность и воображение', weakness: 'Перфекционизм', quote: 'Творчество требует мужества отпустить уверенность в известном.', description: 'Ваша цель — создать нечто вечное и уникальное, выразив свою внутреннюю истину.', meaning: 'Импульс к самовыражению и материализации идей.' },
  { id: '6', name: 'Невинный', role: 'Мечтатель', motto: 'Счастье доступно каждому.', strength: 'Оптимизм и вера', weakness: 'Наивность', quote: 'Чистое сердце видит правду там, где разум видит лишь сложности.', description: 'Вы верите в доброту мира и стремитесь к простоте и гармонии.', meaning: 'Стремление к возвращению к истокам и первозданной радости.' },
  { id: '7', name: 'Мудрец', role: 'Наставник', motto: 'Истина освобождает.', strength: 'Интеллект и анализ', weakness: 'Отстраненность', quote: 'Познание самого себя — это единственный путь к истинному свету.', description: 'Вы ищете истину во всем и стремитесь понять законы мироздания через логику.', meaning: 'Путь объективного знания и глубокого понимания реальности.' },
  { id: '8', name: 'Искатель', role: 'Странник', motto: 'Не ограничивай меня.', strength: 'Автономия и честность', weakness: 'Бесцельность', quote: 'Не все блуждающие потеряны, некоторые просто ищут свой дом внутри.', description: 'Ваша жизнь — это вечный поиск себя и новых горизонтов смысла.', meaning: 'Стремление к индивидуальной свободе и самопознанию вне рамок.' },
  { id: '9', name: 'Бунтарь', role: 'Изгой', motto: 'Правила созданы, чтобы их нарушать.', strength: 'Радикальная свобода', weakness: 'Саморазрушение', quote: 'Чтобы построить новое, нужно иметь смелость разрушить старое.', description: 'Вы — сила трансформации, которая сметает отжившее и несправедливое.', meaning: 'Необходимость перемен через разрушение устаревших структур.' },
  { id: '10', name: 'Маг', role: 'Алхимик', motto: 'Создавай свою реальность.', strength: 'Интуиция и воля', weakness: 'Манипуляция', quote: 'Магия — это просто наука, которую мы еще не до конца осознали.', description: 'Вы понимаете скрытые связи и меняете жизнь через намерение и энергию.', meaning: 'Сила внутренней трансформации и влияния на мир через сознание.' },
  { id: '11', name: 'Герой', role: 'Воин', motto: 'Где есть воля, там есть и путь.', strength: 'Мужество и решимость', weakness: 'Высокомерие', quote: 'Победа над самим собой — единственная победа, которая имеет значение.', description: 'Вы преодолеваете любые препятствия, боретесь за идеалы и доказываете свою силу.', meaning: 'Борьба за справедливость, защита границ и достижение целей.' },
  { id: '12', name: 'Любовник', role: 'Эстет', motto: 'У меня есть только ты.', strength: 'Страсть и преданность', weakness: 'Зависимость', quote: 'Любовь — это единственная реальность, в которой стоит жить.', description: 'Вы стремитесь к глубокой эмоциональной близости, красоте и удовольствию.', meaning: 'Эмоциональная полнота, эстетическое наслаждение и единение с миром.' },
];

const QUESTIONS = [
  { q: 'Что для вас важнее всего в жизни?', options: ['Порядок и успех', 'Свобода и приключения', 'Любовь и близость', 'Знания и мудрость'] },
  { q: 'Как вы обычно реагируете на трудности?', options: ['Беру ответственность', 'Ищу новый путь', 'Помогаю другим', 'Анализирую причины'] },
  { q: 'Ваш идеальный выходной...', options: ['Планирование дел', 'Творчество или поход', 'Время с семьей', 'Чтение и размышления'] },
  { q: 'Чего вы боитесь больше всего?', options: ['Хаоса и слабости', 'Ограничений и скуки', 'Одиночества и предательства', 'Невежества и обмана'] },
  { q: 'Ваша главная цель...', options: ['Оставить след в истории', 'Найти свое истинное Я', 'Сделать мир добрее', 'Понять суть вещей'] },
  { q: 'Как вы ведете себя в компании?', options: ['Беру роль лидера', 'Делюсь открытиями', 'Забочусь о комфорте', 'Наблюдаю за всеми'] },
  { q: 'Что вас больше вдохновляет?', options: ['Крупные проекты', 'Неизвестные горизонты', 'Гармония отношений', 'Глубокие истины'] },
  { q: 'Ваше отношение к правилам?', options: ['Необходимый порядок', 'Они часто ограничивают', 'Они защищают людей', 'Они должны быть разумны'] },
  { q: 'Качество, которое цените в людях?', options: ['Надежность и сила', 'Оригинальность', 'Доброта и тепло', 'Интеллект и глубина'] },
  { q: 'Ваш способ изменить мир?', options: ['Через управление', 'Через личный пример', 'Через помощь нуждающимся', 'Через поиск знаний'] },
  { q: 'Как вы выбираете покупки?', options: ['Статус и качество', 'Уникальный дизайн', 'То, что порадует близких', 'Функциональность'] },
  { q: 'Какую суперсилу вы бы выбрали?', options: ['Власть над временем', 'Создание новых миров', 'Исцеление душ', 'Знание будущего'] },
  { q: 'Где вы чувствуете себя лучше всего?', options: ['В центре событий', 'В пути к цели', 'В кругу любимых людей', 'В тишине и покое'] },
  { q: 'Ваше кредо:', options: ['Победа любой ценой', 'Вечный поиск смысла', 'Любовь спасет мир', 'Истина превыше всего'] },
];

const RANKS = [
  { threshold: 0, title: "Зерно", desc: "Потенциал к пробуждению." },
  { threshold: 100, title: "Росток", desc: "Первые всходы вашего духа." },
  { threshold: 300, title: "Побег", desc: "Стремление к свету." },
  { threshold: 600, title: "Саженец", desc: "Крепкие корни осознанности." },
  { threshold: 1000, title: "Молодое Дерево", desc: "Заметный рост и гибкость." },
  { threshold: 2000, title: "Крепкое Дерево", desc: "Стабильность и уверенность." },
  { threshold: 4000, title: "Ветвистое Древо", desc: "Широта взглядов." },
  { threshold: 8000, title: "Цветущее Древо", desc: "Раскрытие талантов." },
  { threshold: 15000, title: "Плодоносящее Древо", desc: "Ваш опыт приносит пользу другим." },
  { threshold: 30000, title: "Древо Мудрости", desc: "Вершина осознания и покоя." },
];

const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile>({ 
    name: '', avatarUrl: null, isSetup: true, isRegistered: false, archetype: null, xp: 0, 
    lastQuestDate: null, artifacts: [], totalSessions: 0, totalMinutes: 0, rpgMode: false,
    firstRunDate: null, isSubscribed: false
  });

  const [history, setHistory] = useState<ChatSession[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  const [currentView, setCurrentView] = useState<ViewState>('HOME');
  const [selectedMode, setSelectedMode] = useState<JournalMode | null>(null);
  const [testQuestionIdx, setTestQuestionIdx] = useState(0);
  const [testAnswers, setTestAnswers] = useState<number[]>([]);
  const [localSelectedIdx, setLocalSelectedIdx] = useState<number | null>(null);
  
  const [viewingHistorySession, setViewingHistorySession] = useState<ChatSession | null>(null);

  const [gameStatus, setGameStatus] = useState<'IDLE' | 'LOADING' | 'QUEST' | 'RESULT'>('IDLE');
  const [questData, setQuestData] = useState<{ scene: string; optA: string; optB: string } | null>(null);
  const [questOutcome, setQuestOutcome] = useState<{ outcome: string; artifact: string } | null>(null);

  // Load from Telegram CloudStorage on mount
  useEffect(() => {
    const initData = async () => {
      const profile = await cloudStorage.getItem<UserProfile>('mm_profile');
      const hist = await cloudStorage.getItem<ChatSession[]>('mm_history');
      const entries = await cloudStorage.getItem<JournalEntry[]>('mm_journal_entries');

      if (profile) {
        setUserProfile(profile);
      } else {
        // Very first run: initialize firstRunDate
        setUserProfile(prev => ({ ...prev, firstRunDate: Date.now() }));
      }

      if (hist) setHistory(hist);
      if (entries) setJournalEntries(entries);

      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        const user = tg.initDataUnsafe?.user;
        if (user) {
          setUserProfile(prev => ({ 
            ...prev, 
            name: prev.name || user.first_name, 
            avatarUrl: prev.avatarUrl || user.photo_url || null 
          }));
        }
      }
      setIsInitializing(false);
    };

    initData();
  }, []);

  // Sync to CloudStorage on changes
  useEffect(() => {
    if (isInitializing) return;
    cloudStorage.setItem('mm_profile', userProfile);
  }, [userProfile, isInitializing]);

  useEffect(() => {
    if (isInitializing) return;
    cloudStorage.setItem('mm_history', history);
  }, [history, isInitializing]);

  useEffect(() => {
    if (isInitializing) return;
    cloudStorage.setItem('mm_journal_entries', journalEntries);
  }, [journalEntries, isInitializing]);

  const isTrialExpired = useCallback(() => {
    if (userProfile.isSubscribed) return false;
    if (!userProfile.firstRunDate) return false;
    return (Date.now() - userProfile.firstRunDate) > TRIAL_DURATION_MS;
  }, [userProfile]);

  const handlePay = () => {
    if (window.Telegram?.WebApp) {
      // Logic for real payments would require a backend to create an invoice
      // For now, we simulate success for UI demonstration
      window.Telegram.WebApp.showConfirm("Активировать полный доступ за 500 Звезд?", (confirmed: boolean) => {
        if (confirmed) {
          setUserProfile(prev => ({ ...prev, isSubscribed: true }));
          setCurrentView('HOME');
        }
      });
    } else {
      setUserProfile(prev => ({ ...prev, isSubscribed: true }));
      setCurrentView('HOME');
    }
  };

  const currentRank = [...RANKS].reverse().find(r => userProfile.xp >= r.threshold) || RANKS[0];

  const handleTestAnswer = (ansIdx: number) => {
    setLocalSelectedIdx(ansIdx);
    setTimeout(() => {
      const newAnswers = [...testAnswers, ansIdx];
      if (testQuestionIdx + 1 < QUESTIONS.length) {
        setTestAnswers(newAnswers);
        setTestQuestionIdx(testQuestionIdx + 1);
        setLocalSelectedIdx(null);
      } else {
        const archetypeScores: Record<string, number> = {};
        ARCHETYPES.forEach(arc => archetypeScores[arc.id] = 2);
        const groups = [['4', '11', '3'], ['8', '5', '9'], ['12', '2', '1'], ['7', '10', '6']];
        newAnswers.forEach((ans, qIdx) => {
          const group = groups[ans];
          const archetypeId = group[qIdx % 3];
          archetypeScores[archetypeId] += 10;
        });
        const totalPoints = Object.values(archetypeScores).reduce((a, b) => a + b, 0);
        const sortedScores = ARCHETYPES.map(arc => ({ archetype: arc, score: archetypeScores[arc.id] })).sort((a, b) => b.score - a.score);
        const mainArc = sortedScores[0].archetype;
        const secondary = sortedScores.slice(1, 3).map(s => ({ name: s.archetype.name, percent: Math.max(1, Math.round((s.score / totalPoints) * 100)) }));

        setUserProfile(prev => ({ ...prev, archetype: mainArc, secondaryArchetypes: secondary }));
        setCurrentView('ARCHETYPE_RESULT');
        setLocalSelectedIdx(null);
      }
    }, 150);
  };

  const handleStartQuest = async () => {
    if (isTrialExpired()) {
      setCurrentView('SUBSCRIPTION');
      return;
    }
    if (!userProfile.archetype) return;
    setGameStatus('LOADING');
    const data = await generateRPGQuest(userProfile.archetype);
    setQuestData(data);
    setGameStatus('QUEST');
  };

  const handleChoice = async (choice: string) => {
    if (!userProfile.archetype) return;
    setGameStatus('LOADING');
    const result = await processRPGChoice(userProfile.archetype, choice);
    setQuestOutcome(result);
    setGameStatus('RESULT');
  };

  const acceptGift = () => {
    setUserProfile(prev => ({
      ...prev,
      xp: prev.xp + 50,
      artifacts: [questOutcome!.artifact, ...prev.artifacts],
      lastQuestDate: Date.now()
    }));
    setGameStatus('IDLE');
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  };

  const handleUpdateOrder = (newEntries: JournalEntry[]) => {
    setJournalEntries(newEntries);
  };

  const renderSubscriptionScreen = () => (
    <div className={`h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in ${userProfile.rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-white'}`}>
       <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center mb-8 ${userProfile.rpgMode ? 'bg-red-800 text-white' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200'}`}>
          <Lock size={48} />
       </div>
       <h2 className={`text-3xl font-black mb-4 uppercase tracking-tighter italic ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>
         Срок триала истек
       </h2>
       <p className={`mb-10 text-sm leading-relaxed ${userProfile.rpgMode ? 'text-red-900/70' : 'text-slate-500'}`}>
         Ваше 3-дневное путешествие подошло к концу. Чтобы продолжить рост своего Древа и получать ежедневные квесты, активируйте полный доступ.
       </p>
       
       <div className="space-y-4 w-full">
         <button 
           onClick={handlePay}
           className={`w-full py-5 rounded-[24px] font-bold text-lg flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-xl ${userProfile.rpgMode ? 'rpg-button font-display-fantasy' : 'bg-slate-900 text-white'}`}
         >
           <Star size={20} fill="currentColor" />
           <span>Активировать доступ</span>
         </button>
         
         <button 
           onClick={() => setCurrentView('HOME')}
           className={`w-full py-4 rounded-[24px] text-sm font-bold ${userProfile.rpgMode ? 'text-red-800' : 'text-slate-400'}`}
         >
           Вернуться на главную
         </button>
       </div>

       <div className="mt-12 flex items-center space-x-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">
          <ShieldCheck size={14} />
          <span>Безопасная оплата через Telegram Stars</span>
       </div>
    </div>
  );

  const renderQuestOption = (text: string, isA: boolean) => {
    const cleaned = text.replace(/ВАРИАНТ_/gi, 'ВАРИАНТ ');
    const parts = cleaned.split(/(ВАРИАНТ [АБ])/i);
    return (
      <span className="flex items-center text-left">
        {parts.map((p, i) => {
          if (/ВАРИАНТ [АБ]/i.test(p)) {
            return (
              <span key={i} className={`inline-block mr-2 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-widest border transition-all ${
                isA 
                  ? (userProfile.rpgMode ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-50 text-amber-600 border-amber-100')
                  : (userProfile.rpgMode ? 'bg-indigo-100 text-indigo-800 border-indigo-300' : 'bg-indigo-50 text-indigo-600 border-indigo-100')
              }`}>
                {p}
              </span>
            );
          }
          return <span key={i}>{p}</span>;
        })}
      </span>
    );
  };

  const renderArchetypeResult = () => {
    if (!userProfile.archetype) return null;
    const arc = userProfile.archetype;
    return (
      <div className={`p-8 h-full overflow-y-auto animate-fade-in pb-32 transition-colors duration-500 ${userProfile.rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-white'}`}>
        <header className="mb-10 flex items-center justify-between">
          <button onClick={() => setCurrentView('HOME')} className={`p-2 -ml-2 transition-colors rounded-full ${userProfile.rpgMode ? 'text-red-800 hover:bg-red-800/10' : 'text-slate-400 hover:text-slate-800 hover:bg-slate-50'}`}>
            <ArrowLeft size={24} />
          </button>
          <h1 className={`text-xl font-bold uppercase tracking-tighter italic ${userProfile.rpgMode ? 'text-red-900 font-display-fantasy' : 'text-slate-800'}`}>
            {userProfile.rpgMode ? 'Свиток судьбы' : 'Ваш Архетип'}
          </h1>
        </header>

        <div className="text-center mb-10">
          <div className={`inline-block px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 ${userProfile.rpgMode ? 'bg-red-800 text-white border border-red-950' : 'bg-indigo-600 text-white'}`}>
            Путь: {arc.role}
          </div>
          <h2 className={`text-5xl font-black italic uppercase tracking-tighter mb-4 ${userProfile.rpgMode ? 'text-red-900 font-display-fantasy' : 'text-slate-900'}`}>
            {arc.name}
          </h2>
          <p className={`${userProfile.rpgMode ? 'text-red-700 font-bold' : 'text-indigo-400 font-bold'} italic text-sm`}>"{arc.motto}"</p>
        </div>

        <div className={`p-6 rounded-[32px] mb-8 italic text-center leading-relaxed border ${userProfile.rpgMode ? 'bg-white/50 border-red-800/20 text-red-950' : 'bg-slate-50 border-slate-100 text-slate-600'}`}>
          "{arc.quote}"
        </div>

        <div className="space-y-6">
          <div>
            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${userProfile.rpgMode ? 'text-red-800' : 'text-slate-400'}`}>Суть</h4>
            <p className={`leading-relaxed text-sm ${userProfile.rpgMode ? 'text-red-950/80' : 'text-slate-700'}`}>{arc.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-2xl border ${userProfile.rpgMode ? 'bg-white/60 border-red-800' : 'bg-emerald-50 border-emerald-100'}`}>
              <span className={`text-[9px] font-bold uppercase tracking-widest block mb-1 ${userProfile.rpgMode ? 'text-red-800' : 'text-emerald-600'}`}>Сила</span>
              <span className={`text-xs font-bold ${userProfile.rpgMode ? 'text-red-950' : 'text-slate-700'}`}>{arc.strength}</span>
            </div>
            <div className={`p-4 rounded-2xl border ${userProfile.rpgMode ? 'bg-white/60 border-red-800' : 'bg-rose-50 border-rose-100'}`}>
              <span className={`text-[9px] font-bold uppercase tracking-widest block mb-1 ${userProfile.rpgMode ? 'text-red-800' : 'text-rose-500'}`}>Тень</span>
              <span className={`text-xs font-bold ${userProfile.rpgMode ? 'text-red-950' : 'text-slate-700'}`}>{arc.weakness}</span>
            </div>
          </div>
          <div>
            <h4 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${userProfile.rpgMode ? 'text-red-800' : 'text-slate-400'}`}>Смысл</h4>
            <p className={`text-xs italic leading-relaxed ${userProfile.rpgMode ? 'text-red-950/60' : 'text-slate-600'}`}>{arc.meaning}</p>
          </div>
        </div>

        <button 
          onClick={() => setCurrentView('HOME')}
          className={`w-full mt-12 py-5 rounded-[24px] font-bold shadow-xl active:scale-95 transition-all ${userProfile.rpgMode ? 'rpg-button font-display-fantasy' : 'bg-slate-900 text-white'}`}
        >
          Принять путь
        </button>
      </div>
    );
  };

  /**
   * Renders the Archetype Glossary view.
   * This function was missing and caused a compilation error.
   */
  const renderArchetypeGlossary = () => (
    <div className={`p-8 h-full overflow-y-auto animate-fade-in pb-32 transition-colors duration-500 ${userProfile.rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-white'}`}>
      <header className="mb-10 flex items-center space-x-4">
        <button onClick={() => setCurrentView('PROFILE')} className={`p-2 -ml-2 rounded-full ${userProfile.rpgMode ? 'text-red-800 hover:bg-red-800/10' : 'text-slate-400'}`}>
          <ArrowLeft size={24}/>
        </button>
        <h1 className={`text-2xl font-bold italic uppercase tracking-tighter ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>Глоссарий</h1>
      </header>
      <div className="space-y-6">
        {ARCHETYPES.map(arc => (
          <div key={arc.id} className={`p-6 rounded-[28px] border transition-all ${userProfile.rpgMode ? 'rpg-card bg-white/60' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex justify-between items-start mb-4">
              <h3 className={`text-xl font-bold ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>{arc.name}</h3>
              <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full ${userProfile.rpgMode ? 'bg-red-800 text-white' : 'bg-indigo-100 text-indigo-600'}`}>{arc.role}</span>
            </div>
            <p className={`text-sm mb-4 italic ${userProfile.rpgMode ? 'text-red-900/70' : 'text-slate-500'}`}>"{arc.motto}"</p>
            <p className={`text-xs leading-relaxed ${userProfile.rpgMode ? 'text-red-950/80' : 'text-slate-600'}`}>{arc.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderHome = () => (
    <div className={`h-full overflow-y-auto animate-fade-in relative z-10 pb-32 transition-colors duration-500 ${userProfile.rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-[#F8FAFC]'}`}>
      <div className="px-6 pt-6 mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className={`w-11 h-11 rounded-full overflow-hidden bg-white shadow-sm border-2 ${userProfile.rpgMode ? 'border-red-800' : 'border-white'} cursor-pointer`} onClick={() => setCurrentView('PROFILE')}>
            {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon size={22} className="m-2.5 text-slate-300" />}
          </div>
          <div>
            <h4 className={`text-[15px] font-extrabold leading-none ${userProfile.rpgMode ? 'text-red-950' : 'text-slate-800'}`}>{userProfile.name}</h4>
            {userProfile.archetype && <p className={`text-[10px] font-bold uppercase mt-1 tracking-wider ${userProfile.rpgMode ? 'text-red-800' : 'text-slate-400'}`}>{userProfile.archetype.name}</p>}
          </div>
        </div>
        {userProfile.isSubscribed && (
           <div className={`px-3 py-1 rounded-full flex items-center space-x-1 border ${userProfile.rpgMode ? 'bg-amber-100 border-amber-800 text-amber-900' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
              <Star size={12} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest">Premium</span>
           </div>
        )}
      </div>

      <div className="px-6 mb-12 relative z-20">
        <div className="grid grid-cols-3 gap-5">
          {[
            { id: 'DECISION', label: 'Решение', icon: Zap, color: userProfile.rpgMode ? 'text-red-800' : 'text-indigo-500' },
            { id: 'EMOTIONS', label: 'Состояние', icon: Heart, color: userProfile.rpgMode ? 'text-red-800' : 'text-rose-500' },
            { id: 'REFLECTION', label: 'Дневник', icon: BookOpen, color: userProfile.rpgMode ? 'text-red-800' : 'text-emerald-500' }
          ].map(m => (
            <button key={m.id} onClick={() => { 
              if (isTrialExpired()) {
                setCurrentView('SUBSCRIPTION');
                return;
              }
              setSelectedMode(m.id as any); setViewingHistorySession(null); setCurrentView('CHAT'); 
            }} className="flex flex-col items-center space-y-3">
              <div className={`w-full aspect-square rounded-[28px] border flex items-center justify-center active:scale-95 transition-all duration-300 ${
                userProfile.rpgMode 
                  ? 'rpg-card' 
                  : 'bg-white border-slate-100 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06)] shadow-indigo-100/10'
              }`}><m.icon size={30} className={m.color} /></div>
              <span className={`text-[11px] font-bold uppercase tracking-widest ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-400'}`}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 mb-6">
         <button onClick={() => setCurrentView('RANKS_INFO')} className={`w-full text-left rounded-[32px] p-8 shadow-sm border active:scale-[0.98] transition-all relative group ${userProfile.rpgMode ? 'rpg-card' : 'bg-white/70 backdrop-blur-md border-white'}`}>
            <div className="absolute top-8 right-8 transition-transform group-active:translate-x-1">
              <ChevronRight size={24} className={userProfile.rpgMode ? 'text-red-800' : 'text-slate-300'} />
            </div>
            <div className="flex items-center space-x-5 mb-10">
               <div className="w-16 h-16 rounded-3xl bg-[#F0FDFA] flex items-center justify-center"><TreeIcon stage={RANKS.indexOf(RANKS.find(r => r.title === currentRank.title) || RANKS[0])} size={52} /></div>
               <div><p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${userProfile.rpgMode ? 'text-red-800' : 'text-slate-300'}`}>Древо сознания</p><h4 className={`text-2xl font-bold ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>{currentRank.title}</h4></div>
            </div>
            <div className={`h-1.5 w-full rounded-full overflow-hidden mb-6 ${userProfile.rpgMode ? 'bg-red-800/10' : 'bg-slate-50'}`}><div className={`h-full transition-all duration-1000 ${userProfile.rpgMode ? 'bg-red-800' : 'bg-emerald-400'}`} style={{ width: `${Math.min(100, (userProfile.xp / (RANKS[RANKS.indexOf(RANKS.find(r => r.title === currentRank.title) || RANKS[0]) + 1]?.threshold || 50000)) * 100)}%` }}></div></div>
            <div className="grid grid-cols-3 gap-2">
               <div className="text-center"><p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Опыт</p><p className={`font-black text-xl tracking-tighter ${userProfile.rpgMode ? 'text-red-800 font-display-fantasy' : 'text-slate-800'}`}>{userProfile.xp}</p></div>
               <div className={`text-center border-x ${userProfile.rpgMode ? 'border-red-800/20' : 'border-slate-100/50'}`}><p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Сессии</p><p className={`font-black text-xl tracking-tighter ${userProfile.rpgMode ? 'text-red-800 font-display-fantasy' : 'text-slate-800'}`}>{userProfile.totalSessions || 0}</p></div>
               <div className="text-center"><p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Минуты</p><p className={`font-black text-xl tracking-tighter ${userProfile.rpgMode ? 'text-red-800 font-display-fantasy' : 'text-slate-800'}`}>{userProfile.totalMinutes || 0}</p></div>
            </div>
         </button>
      </div>

      <div className="px-6 mb-10">
        {!userProfile.archetype ? (
          <div className={`rounded-[32px] p-8 relative overflow-hidden shadow-sm border group active:scale-[0.98] transition-all ${userProfile.rpgMode ? 'rpg-card' : 'bg-white/40 backdrop-blur-xl border-white/50'}`} onClick={() => { setTestQuestionIdx(0); setTestAnswers([]); setCurrentView('ARCHETYPE_TEST'); }}>
            <div className="flex items-center space-x-2 mb-3">
               <Sparkles size={18} className={userProfile.rpgMode ? 'text-red-800' : 'text-indigo-400'} />
               <p className={`${userProfile.rpgMode ? 'text-red-800' : 'text-indigo-400'} text-[10px] font-bold uppercase tracking-widest`}>Первый шаг</p>
            </div>
            <h2 className={`text-[26px] font-black mb-2 leading-tight ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>Узнать архетип и пройти квест</h2>
            <p className={`text-xs mb-8 max-w-[240px] ${userProfile.rpgMode ? 'text-red-900/70' : 'text-slate-500'}`}>Раскройте свою истинную суть и начните свое легендарное путешествие.</p>
            <div className={`flex items-center space-x-3 font-bold text-sm ${userProfile.rpgMode ? 'text-red-700' : 'text-indigo-600'}`}>
               <span className={userProfile.rpgMode ? 'uppercase font-display-fantasy tracking-widest' : ''}>Начать путь</span>
               <ArrowRight size={18} />
            </div>
          </div>
        ) : (
          <div className="relative">
            {gameStatus === 'LOADING' ? (
              <div className={`rounded-[32px] p-10 flex flex-col items-center justify-center min-h-[200px] shadow-sm border ${userProfile.rpgMode ? 'rpg-card bg-white/40' : 'bg-white/40 backdrop-blur-xl border-white/50'}`}>
                <Loader2 size={32} className={userProfile.rpgMode ? 'text-red-800 animate-spin mb-4' : 'text-indigo-400 animate-spin mb-4'} />
                <p className={`${userProfile.rpgMode ? 'text-red-900' : 'text-slate-400'} text-[10px] font-bold uppercase tracking-widest italic`}>Мастер пишет историю...</p>
              </div>
            ) : gameStatus === 'QUEST' && questData ? (
              <div className={`rounded-[32px] p-8 shadow-sm border animate-fade-in ${userProfile.rpgMode ? 'rpg-card' : 'bg-white/70 backdrop-blur-xl border-white/80'}`}>
                <div className="flex items-center space-x-2 mb-4">
                   <Award size={16} className={userProfile.rpgMode ? 'text-red-800' : 'text-indigo-400'} />
                   <p className={`${userProfile.rpgMode ? 'text-red-800' : 'text-indigo-400'} text-[10px] font-bold uppercase tracking-widest`}>Квест {userProfile.archetype.name}</p>
                </div>
                <h3 className={`text-lg font-bold mb-8 leading-relaxed italic ${userProfile.rpgMode ? 'text-red-950 font-serif-fantasy' : 'text-slate-800'}`}>"{questData.scene}"</h3>
                <div className="space-y-3">
                   <button onClick={() => handleChoice(questData.optA)} className={`w-full p-5 rounded-2xl font-bold text-sm border active:scale-95 transition-all ${userProfile.rpgMode ? 'bg-white border-red-800 text-red-950 font-serif-fantasy shadow-sm' : 'bg-white border-slate-200 text-slate-700 shadow-sm'}`}>
                      {renderQuestOption(questData.optA, true)}
                   </button>
                   <button onClick={() => handleChoice(questData.optB)} className={`w-full p-5 rounded-2xl font-bold text-sm border active:scale-95 transition-all ${userProfile.rpgMode ? 'bg-white border-red-800 text-red-950 font-serif-fantasy shadow-sm' : 'bg-white border-slate-200 text-slate-700 shadow-sm'}`}>
                      {renderQuestOption(questData.optB, false)}
                   </button>
                </div>
              </div>
            ) : gameStatus === 'RESULT' && questOutcome ? (
              <div className={`rounded-[32px] p-8 shadow-2xl animate-fade-in text-center border ${userProfile.rpgMode ? 'rpg-card' : 'bg-white border-slate-50'}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${userProfile.rpgMode ? 'bg-red-50 text-red-900' : 'bg-emerald-50 text-emerald-600'}`}><Trophy size={32} /></div>
                <h4 className={`text-2xl font-black mb-2 ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>+50 XP</h4>
                <p className={`text-sm mb-6 leading-relaxed italic ${userProfile.rpgMode ? 'text-red-900/70' : 'text-slate-400'}`}>"{questOutcome.outcome}"</p>
                <div className={`p-4 rounded-2xl mb-8 border ${userProfile.rpgMode ? 'bg-white border-red-800' : 'bg-slate-50 border-slate-100'}`}>
                   <p className="text-center"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Получен дар</p><p className={`text-lg font-bold ${userProfile.rpgMode ? 'text-red-800' : 'text-indigo-400'}`}>{questOutcome.artifact}</p></div>
                <button onClick={acceptGift} className={`w-full py-4 rounded-2xl font-bold active:scale-95 transition-all shadow-xl ${userProfile.rpgMode ? 'rpg-button font-display-fantasy' : 'bg-slate-900 text-white'}`}>Продолжить рост</button>
              </div>
            ) : userProfile.lastQuestDate && new Date(userProfile.lastQuestDate).toDateString() === new Date().toDateString() ? (
              <div className={`rounded-[32px] p-10 shadow-sm border text-center ${userProfile.rpgMode ? 'rpg-card bg-white/40' : 'bg-white/40 backdrop-blur-md border-white/50'}`}>
                <div className="w-14 h-14 bg-emerald-50/20 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={24} className="text-emerald-500" /></div>
                <h3 className={`text-lg font-bold mb-2 ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>Квест на сегодня пройден</h3>
                <p className={`${userProfile.rpgMode ? 'text-red-900/60' : 'text-slate-400'} text-xs`}>Ваше Древо укрепляется. Возвращайтесь завтра за новым вызовом.</p>
              </div>
            ) : (
              <div className={`rounded-[32px] p-8 shadow-sm border flex justify-between items-center group cursor-pointer active:scale-[0.98] transition-all ${userProfile.rpgMode ? 'rpg-card' : 'bg-white/60 backdrop-blur-xl border-white/80'}`} onClick={handleStartQuest}>
                <div className="flex-1 pr-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sword size={16} className={userProfile.rpgMode ? 'text-red-800' : 'text-indigo-400'} />
                    <p className={`${userProfile.rpgMode ? 'text-red-800' : 'text-indigo-400'} text-[10px] font-bold uppercase tracking-widest`}>Квесты</p>
                  </div>
                  <h3 className={`text-2xl font-black tracking-tight ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>Пройти квест</h3>
                  <p className={`text-xs mt-1 ${userProfile.rpgMode ? 'text-red-900/60' : 'text-slate-400'}`}>Испытание на мудрость и силу</p>
                </div>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm ${userProfile.rpgMode ? 'rpg-button border-none shadow-none' : 'bg-indigo-50 text-indigo-500'}`}>
                   <ArrowRight size={24} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="text-indigo-500 animate-spin" size={48} />
      </div>
    );
  }

  return (
    <div className={`h-screen w-full overflow-hidden flex flex-col font-sans relative transition-colors duration-500 ${userProfile.rpgMode ? 'bg-parchment' : 'bg-[#F8FAFC]'}`}>
      <main className="flex-1 relative overflow-hidden z-10">
        {currentView === 'SUBSCRIPTION' && renderSubscriptionScreen()}
        {currentView === 'HOME' && renderHome()}
        {currentView === 'CHAT' && selectedMode === 'REFLECTION' && <JournalInterface rpgMode={userProfile.rpgMode} entries={journalEntries} onSaveEntry={(e, isNew, dur) => { 
          setJournalEntries(prev => isNew ? [e, ...prev] : prev.map(item => item.id === e.id ? e : item)); 
          setUserProfile(p => ({...p, xp: p.xp + 1, totalSessions: p.totalSessions + 1})); 
        }} onDeleteEntry={(id) => setJournalEntries(prev => prev.filter(e => e.id !== id))} onUpdateOrder={handleUpdateOrder} onBack={() => setCurrentView('HOME')} />}
        {currentView === 'CHAT' && selectedMode !== 'REFLECTION' && selectedMode && <ChatInterface rpgMode={userProfile.rpgMode} mode={selectedMode} readOnly={!!viewingHistorySession} initialMessages={viewingHistorySession?.messages} onBack={() => { setViewingHistorySession(null); setCurrentView('HOME'); }} onSessionComplete={(msgs, dur) => { 
          setHistory(prev => [{id: Date.now().toString(), mode: selectedMode, date: Date.now(), duration: dur, preview: msgs.find(m => m.role === 'user')?.content || '', messages: msgs}, ...prev]); 
          const minutes = Math.floor(dur / 60);
          setUserProfile(p => ({...p, xp: p.xp + 1 + minutes, totalSessions: p.totalSessions + 1, totalMinutes: p.totalMinutes + minutes})); 
        }} />}
        {currentView === 'ARCHETYPE_TEST' && (
           <div className={`h-full p-8 flex flex-col animate-fade-in relative z-[100] transition-colors duration-500 ${userProfile.rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-white'}`}>
             <header className="mb-12 flex items-center justify-between">
                <button onClick={() => setCurrentView('HOME')} className={`p-2 -ml-2 rounded-full ${userProfile.rpgMode ? 'text-red-800 hover:bg-red-800/10' : 'text-slate-400'}`}><X size={24}/></button>
                <div className="flex-1 px-8"><div className={`h-1 rounded-full ${userProfile.rpgMode ? 'bg-red-800/10' : 'bg-slate-100'}`}><div className={`h-full rounded-full transition-all ${userProfile.rpgMode ? 'bg-red-800' : 'bg-indigo-500'}`} style={{ width: `${((testQuestionIdx + 1) / QUESTIONS.length) * 100}%` }}></div></div></div>
                <span className={`text-[10px] font-bold tabular-nums ${userProfile.rpgMode ? 'text-red-800' : 'text-slate-400'}`}>{testQuestionIdx + 1}/{QUESTIONS.length}</span>
             </header>
             <div className="flex-1 flex flex-col justify-center">
                <h2 className={`text-3xl font-black mb-12 leading-tight italic ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>{QUESTIONS[testQuestionIdx].q}</h2>
                <div className="space-y-3" key={testQuestionIdx}>
                   {QUESTIONS[testQuestionIdx].options.map((opt, idx) => {
                     const isSelected = localSelectedIdx === idx;
                     return (
                       <button 
                        key={idx} 
                        onClick={() => handleTestAnswer(idx)} 
                        className={`w-full text-left p-6 rounded-[28px] border-2 shadow-sm transition-all duration-75 group ${
                          isSelected 
                            ? (userProfile.rpgMode ? 'rpg-button border-red-800 shadow-none' : 'bg-slate-900 text-white border-slate-900') 
                            : (userProfile.rpgMode 
                               ? 'bg-white/60 border-red-800/20 text-red-950 hover:border-red-800' 
                               : 'bg-white border-slate-50 text-slate-800 hover:border-slate-800')
                        }`}
                       >
                        <span className="text-lg font-bold">{opt}</span>
                       </button>
                     );
                   })}
                </div>
             </div>
           </div>
        )}
        {currentView === 'ARCHETYPE_RESULT' && renderArchetypeResult()}
        {currentView === 'ARCHETYPE_GLOSSARY' && renderArchetypeGlossary()}
        {currentView === 'PROFILE' && (
           <div className={`p-8 h-full overflow-y-auto pb-32 transition-colors duration-500 ${userProfile.rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-[#F8FAFC]'}`}>
             <header className="mb-10 flex items-center justify-between"><h1 className={`text-3xl font-bold italic uppercase tracking-tighter ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>Профиль</h1></header>
             
             <div className={`p-8 rounded-[32px] mb-6 text-center shadow-sm border transition-all ${userProfile.rpgMode ? 'rpg-card' : 'bg-white border-slate-50'}`}>
                <div className={`w-24 h-24 rounded-[32px] mx-auto mb-6 overflow-hidden border-4 shadow-md transition-all ${userProfile.rpgMode ? 'border-red-800 bg-white/50' : 'border-white bg-slate-50'}`}>
                   {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon size={40} className="m-6 text-slate-200" />}
                </div>
                <h3 className={`text-2xl font-bold mb-1 ${userProfile.rpgMode ? 'text-red-950' : 'text-slate-800'}`}>{userProfile.name}</h3>
                {userProfile.archetype && <p className={`${userProfile.rpgMode ? 'text-red-800' : 'text-emerald-500'} text-[10px] font-bold uppercase tracking-widest`}>{userProfile.archetype.name}</p>}
                
                {userProfile.isSubscribed && (
                  <div className={`mt-4 inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] ${userProfile.rpgMode ? 'bg-amber-100 border-amber-800 text-amber-900' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}>
                    <Star size={12} fill="currentColor" />
                    <span>Premium Доступ</span>
                  </div>
                )}
             </div>

             {!userProfile.isSubscribed && (
                <button onClick={() => setCurrentView('SUBSCRIPTION')} className={`w-full p-6 rounded-[28px] mb-6 border flex items-center justify-between shadow-lg active:scale-95 transition-all ${userProfile.rpgMode ? 'rpg-button border-none shadow-red-900/30' : 'bg-slate-900 text-white shadow-slate-900/20'}`}>
                   <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white"><Star size={20} fill="white" /></div>
                      <div className="text-left">
                        <p className="font-bold text-sm">Активировать Premium</p>
                        <p className="text-[10px] opacity-60 uppercase font-bold tracking-widest">3 дня триала {isTrialExpired() ? 'истекли' : 'активны'}</p>
                      </div>
                   </div>
                   <ChevronRight size={18} />
                </button>
             )}

             <div className={`p-6 rounded-[28px] mb-6 flex items-center justify-between shadow-sm border transition-all ${userProfile.rpgMode ? 'rpg-card' : 'bg-white border-slate-50'}`}>
                <div className="flex items-center space-x-4">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${userProfile.rpgMode ? 'bg-red-800 text-white shadow-[0_0_10px_rgba(185,28,28,0.5)]' : 'bg-indigo-50 text-indigo-500'}`}><Star size={20} /></div>
                   <div>
                      <p className={`font-bold text-sm ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-700'}`}>RPG Режим</p>
                   </div>
                </div>
                <button 
                  onClick={() => setUserProfile(p => ({...p, rpgMode: !p.rpgMode}))}
                  className={`w-12 h-6 rounded-full transition-all relative ${userProfile.rpgMode ? 'bg-red-800' : 'bg-slate-200'}`}
                >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.rpgMode ? 'left-7' : 'left-1'}`}></div>
                </button>
             </div>

             {userProfile.archetype && (
               <div className={`p-8 rounded-[32px] mb-6 shadow-sm border relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all ${userProfile.rpgMode ? 'rpg-card' : 'bg-white/60 backdrop-blur-xl border-white/80'}`} onClick={() => setCurrentView('ARCHETYPE_RESULT')}>
                  <h4 className={`${userProfile.rpgMode ? 'text-red-800' : 'text-indigo-400'} text-[10px] uppercase font-bold mb-2 tracking-widest flex items-center`}><Sparkle size={10} className="mr-2"/> Ваш путь</h4>
                  <h3 className={`text-3xl font-black italic mb-4 uppercase tracking-tighter ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-900'}`}>{userProfile.archetype.name}</h3>
                  <button onClick={(e) => { e.stopPropagation(); setTestQuestionIdx(0); setTestAnswers([]); setCurrentView('ARCHETYPE_TEST'); }} className={`flex items-center space-x-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${userProfile.rpgMode ? 'text-red-800 hover:text-red-600' : 'text-slate-400 hover:text-indigo-500'}`}>
                     <RefreshCw size={12} /><span>Изменить путь</span>
                  </button>
               </div>
             )}

             <div className="space-y-4">
                <button onClick={() => setCurrentView('ARCHETYPE_GLOSSARY')} className={`w-full p-6 rounded-[28px] border flex items-center justify-between shadow-sm active:scale-98 transition-all ${userProfile.rpgMode ? 'rpg-card' : 'bg-white border-slate-50'}`}>
                   <div className="flex items-center space-x-4"><div className={`w-10 h-10 rounded-xl flex items-center justify-center ${userProfile.rpgMode ? 'bg-red-800 text-white' : 'bg-indigo-50 text-indigo-500'}`}><BookOpen size={20} /></div><span className={`font-bold ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy tracking-widest uppercase text-xs' : 'text-slate-700'}`}>Глоссарий архетипов</span></div>
                   <ChevronRight size={18} className={userProfile.rpgMode ? 'text-red-800' : 'text-slate-300'} />
                </button>
             </div>
           </div>
        )}
        {currentView === 'RANKS_INFO' && (
           <div className={`p-8 h-full overflow-y-auto pb-32 transition-colors duration-500 ${userProfile.rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-white'}`}>
             <header className="mb-10 flex items-center space-x-4"><button onClick={() => setCurrentView('HOME')} className={`p-2 -ml-2 rounded-full ${userProfile.rpgMode ? 'text-red-800 hover:bg-red-800/10' : 'text-slate-400'}`}><ArrowLeft size={24}/></button><h1 className={`text-2xl font-bold italic uppercase tracking-tighter ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>Ранги Древа</h1></header>
             <div className="mb-12 px-1">
               <p className={`text-lg leading-relaxed ${userProfile.rpgMode ? 'text-red-950 font-medium' : 'text-slate-600 font-medium'}`}>
                 Древо сознания — это живое отражение вашего пути самопознания. Получайте опыт (XP) за квесты, принятые решения, записи в дневнике и глубокие размышления.
               </p>
             </div>
             <div className="space-y-4">
                {RANKS.map((r, i) => (
                  <div key={i} className={`p-6 rounded-[28px] border transition-all flex items-center space-x-6 ${userProfile.xp >= r.threshold ? (userProfile.rpgMode ? 'rpg-card' : 'bg-emerald-50/50 border-emerald-100 shadow-sm') : 'opacity-30 grayscale'}`}>
                     <TreeIcon stage={i} size={48} />
                     <div className="flex-1">
                        <h4 className={`font-bold ${userProfile.rpgMode ? 'text-red-950' : 'text-slate-800'}`}>{r.title}</h4>
                        <p className={`text-xs ${userProfile.rpgMode ? 'text-red-900/60' : 'text-slate-500'}`}>{r.desc}</p>
                        <span className={`text-[10px] uppercase font-bold mt-2 block ${userProfile.rpgMode ? 'text-red-800' : 'text-emerald-600'}`}>{r.threshold} XP</span>
                     </div>
                  </div>
                ))}
             </div>
           </div>
        )}
        {currentView === 'HISTORY' && (
           <div className={`p-8 h-full overflow-y-auto pb-32 transition-colors duration-500 ${userProfile.rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-[#F8FAFC]'}`}>
             <h1 className={`text-3xl font-bold italic uppercase tracking-tighter mb-8 ${userProfile.rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>История</h1>
             {history.length === 0 ? (<div className="h-[50vh] flex flex-col items-center justify-center text-slate-300"><Compass size={48} className={`mb-4 transition-colors ${userProfile.rpgMode ? 'text-red-800/20' : 'opacity-20'}`} /><p className="text-xs uppercase font-bold tracking-widest">История пуста</p></div>) : (
               <div className="space-y-4">{history.map(s => (<button key={s.id} onClick={() => { setViewingHistorySession(s); setSelectedMode(s.mode); setCurrentView('CHAT'); }} className={`w-full text-left p-6 rounded-[28px] border shadow-sm flex items-center space-x-4 active:scale-98 transition-all ${userProfile.rpgMode ? 'rpg-card' : 'bg-white border-slate-50'}`}><div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.mode === 'DECISION' ? (userProfile.rpgMode ? 'bg-red-800 text-white' : 'bg-indigo-50 text-indigo-500') : (userProfile.rpgMode ? 'bg-red-800 text-white' : 'bg-rose-50 text-rose-500')}`}>{s.mode === 'DECISION' ? <Zap size={20} fill="currentColor"/> : <Heart size={20}/>}</div><div className="flex-1 overflow-hidden"><p className={`font-bold truncate ${userProfile.rpgMode ? 'text-red-950' : 'text-slate-700'}`}>{s.preview || 'Сессия'}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{new Date(s.date).toLocaleDateString('ru-RU')}</p></div></button>))}</div>
             )}
           </div>
        )}
      </main>
      {['HOME', 'PROFILE', 'HISTORY', 'RANKS_INFO', 'ARCHETYPE_GLOSSARY', 'ARCHETYPE_RESULT'].includes(currentView) && <BottomNav rpgMode={userProfile.rpgMode} currentView={currentView} onChangeView={setCurrentView} />}
    </div>
  );
};

export default App;
