import React, { useState, useEffect, useRef } from 'react';
import { ViewState, JournalMode, ChatSession, Message, UserProfile, JournalEntry, SiteConfig, DailyInsightData } from './types';
import { BottomNav } from './components/BottomNav';
import { ChatInterface } from './components/ChatInterface';
import { JournalInterface } from './components/JournalInterface';
import { AdminInterface } from './components/AdminInterface';
import { sendMessageToGemini } from './services/geminiService';
import { Heart, BookOpen, ChevronRight, Settings, Info, User as UserIcon, Activity, Quote, Clock, Zap, Camera, Star, ArrowLeft, MessageSquare, Award, Medal, RefreshCw, Loader2, Cloud, Lock, Moon, Search, Sparkles, Sun, Coffee, Brain, Briefcase, Feather, Compass, Anchor, Target, Battery, X, Shield, Map, Smile, Leaf, Flame, HelpCircle } from 'lucide-react';

declare global {
  interface Window {
    Telegram: any;
  }
}

// Добавляем новые экраны в типы (в рамках файла)
type ExtendedViewState = ViewState | 'ARCHETYPE_REVEAL' | 'TUTORIAL';

const DEFAULT_CONFIG: SiteConfig = {
  appTitle: "Mindful Mirror",
  logoText: "mm",
  customLogoUrl: null,
  customWatermarkUrl: null,
  aboutParagraphs: [
    "Mindful Mirror — это зеркало вашего сознания.",
    "Растите свое внутреннее дерево, уделяя внимание себе."
  ],
  quotes: [],
  adminPasscode: "0000"
};

// --- КОНТЕНТ: АРХЕТИПЫ ПОДРОБНО ---
const ARCHETYPE_DETAILS: Record<string, { desc: string, power: string, shadow: string, advice: string }> = {
  "Творец": {
    desc: "Вы видите мир не таким, какой он есть, а таким, каким он может быть. Ваша жизнь — это холст.",
    power: "Воображение, выразительность, способность создавать новое из хаоса.",
    shadow: "Перфекционизм и страх критики, который может блокировать действия.",
    advice: "Не ждите вдохновения. Садитесь и делайте. Аппетит приходит во время еды."
  },
  "Правитель": {
    desc: "Вы прирожденный лидер. Вы любите структуру, ответственность и видеть реальные результаты.",
    power: "Стратегическое мышление, ответственность, умение наводить порядок.",
    shadow: "Желание контролировать всё и всех, страх потерять авторитет.",
    advice: "Научитесь делегировать. Ваша сила в системе, а не в том, чтобы делать всё самому."
  },
  "Мудрец": {
    desc: "Вы ищете истину. Для вас важно понимать, как устроен мир, и избегать иллюзий.",
    power: "Аналитический ум, мудрость, объективность, спокойствие.",
    shadow: "Бездействие из-за вечного анализа (паралич анализа), отстраненность.",
    advice: "Знания бесполезны без действий. Сделайте шаг, даже если не знаете всего."
  },
  "Хранитель": {
    desc: "Вы — сердце любой компании. Вы заботитесь о других и создаете атмосферу тепла.",
    power: "Эмпатия, щедрость, умение слушать и поддерживать.",
    shadow: "Жертвенность, неумение говорить 'нет', забывание о себе.",
    advice: "Сначала наденьте маску на себя. Вы не сможете помочь другим, если выгорите."
  },
  "Искатель": {
    desc: "Вы не терпите скуку. Ваша жизнь — это путь, поиск новых ощущений и своей истины.",
    power: "Автономность, амбициозность, открытость новому.",
    shadow: "Бесцельное блуждание, страх обязательств и привязанностей.",
    advice: "Найдите якорь. Свобода хороша, когда есть куда возвращаться."
  }
};

const TREE_STAGES = [
  { threshold: 1500, title: "Мудрое Древо", icon: Award, color: "text-emerald-700", desc: "Глубокие корни и мощная крона." },
  { threshold: 500, title: "Крепкое Древо", icon: Shield, color: "text-emerald-600", desc: "Вы уверенно стоите на ногах." },
  { threshold: 200, title: "Молодое Дерево", icon: Leaf, color: "text-emerald-500", desc: "Вы быстро растете." },
  { threshold: 50, title: "Росток", icon: Leaf, color: "text-emerald-400", desc: "Первые всходы ваших усилий." },
  { threshold: 0, title: "Семя", icon: Sun, color: "text-amber-400", desc: "Потенциал, готовый к пробуждению." },
];

const STORAGE_KEYS = {
  PROFILE: 'mm_profile',
  HISTORY: 'mm_history',
  SESSIONS: 'mm_total_sessions',
  TIME: 'mm_total_time',
  ACTIVITY: 'mm_weekly_activity',
  JOURNAL: 'mm_journal_entries',
  CONFIG: 'mm_site_config',
  DAILY_INSIGHT: 'mm_daily_insight_v12'
};

const StylizedMMText = ({ text = "mm", className = "", color = "white", opacity = "1" }: { text?: string, className?: string, color?: string, opacity?: string }) => (
  <span className={`${className} font-extrabold italic select-none pointer-events-none uppercase`} style={{ color, opacity, fontFamily: 'Manrope, sans-serif' }}>{text}</span>
);

const Logo = ({ className = "w-20 h-20" }: { className?: string, color?: string, bg?: string }) => (
  <img src="/logo.png" alt="Mindful Mirror" className={`${className} object-contain`} />
);

// --- 10 СТАДИЙ РОСТА ДЕРЕВА (SVG) ---
const TreeIllustration: React.FC<{ stage: number, className?: string }> = ({ stage, className }) => {
  // 0: Семя
  if (stage === 0) return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#FEF3C7" />
      <path d="M50 75C50 75 40 75 40 75" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="50" cy="70" r="6" fill="#B45309" />
    </svg>
  );
  // 1: Росток
  if (stage === 1) return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#ECFDF5" />
      <path d="M50 80V60" stroke="#059669" strokeWidth="3" strokeLinecap="round"/>
      <path d="M50 60C50 60 35 55 35 45C35 55 50 60 50 60Z" fill="#10B981" />
      <path d="M50 60C50 60 65 55 65 45C65 55 50 60 50 60Z" fill="#34D399" />
    </svg>
  );
  // 2: Побег
  if (stage === 2) return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#D1FAE5" />
      <path d="M50 85V50" stroke="#059669" strokeWidth="3" strokeLinecap="round"/>
      <path d="M50 65L65 55" stroke="#059669" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="50" cy="45" r="10" fill="#10B981" />
      <circle cx="65" cy="55" r="6" fill="#34D399" />
    </svg>
  );
  // 3: Саженец
  if (stage === 3) return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#A7F3D0" />
      <path d="M50 85V45" stroke="#92400E" strokeWidth="4" strokeLinecap="round"/>
      <path d="M50 65L30 55" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="50" cy="40" r="15" fill="#10B981" />
      <circle cx="30" cy="55" r="8" fill="#34D399" />
      <circle cx="65" cy="50" r="8" fill="#34D399" />
    </svg>
  );
  // 4: Молодое дерево
  if (stage === 4) return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#6EE7B7" />
      <path d="M50 90V40" stroke="#92400E" strokeWidth="5" strokeLinecap="round"/>
      <path d="M50 60L25 50" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/>
      <path d="M50 50L75 40" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="50" cy="35" r="20" fill="#059669" />
      <circle cx="25" cy="50" r="12" fill="#10B981" />
      <circle cx="75" cy="40" r="12" fill="#10B981" />
    </svg>
  );
  // 5: Крепкое дерево
  if (stage === 5) return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#34D399" />
      <path d="M50 90L50 35" stroke="#78350F" strokeWidth="6" strokeLinecap="round"/>
      <path d="M50 70L20 60" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/>
      <path d="M50 60L80 50" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="50" cy="30" r="25" fill="#047857" />
      <circle cx="20" cy="60" r="15" fill="#059669" />
      <circle cx="80" cy="50" r="15" fill="#059669" />
    </svg>
  );
  // 6: Ветвистое дерево
  if (stage === 6) return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#10B981" />
      <path d="M50 95L50 40" stroke="#451A03" strokeWidth="7" strokeLinecap="round"/>
      <path d="M50 70L20 55" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/>
      <path d="M50 60L85 45" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/>
      <circle cx="50" cy="35" r="30" fill="#064E3B" />
      <circle cx="20" cy="55" r="18" fill="#065F46" />
      <circle cx="85" cy="45" r="18" fill="#065F46" />
      <circle cx="35" cy="80" r="5" fill="#064E3B" opacity="0.5"/>
    </svg>
  );
  // 7: Цветущее дерево
  if (stage === 7) return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#FCE7F3" />
      <path d="M50 95L50 40" stroke="#451A03" strokeWidth="8" strokeLinecap="round"/>
      <circle cx="50" cy="40" r="35" fill="#065F46" />
      <circle cx="25" cy="55" r="20" fill="#047857" />
      <circle cx="75" cy="55" r="20" fill="#047857" />
      {/* Flowers */}
      <circle cx="40" cy="30" r="5" fill="#F472B6" />
      <circle cx="60" cy="30" r="5" fill="#F472B6" />
      <circle cx="25" cy="55" r="5" fill="#F472B6" />
      <circle cx="75" cy="55" r="5" fill="#F472B6" />
      <circle cx="50" cy="15" r="5" fill="#F472B6" />
    </svg>
  );
  // 8: Плодоносящее древо
  if (stage === 8) return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill="#FEF3C7" />
      <path d="M50 95L50 40" stroke="#451A03" strokeWidth="9" strokeLinecap="round"/>
      <circle cx="50" cy="40" r="38" fill="#14532D" />
      <circle cx="20" cy="60" r="22" fill="#166534" />
      <circle cx="80" cy="60" r="22" fill="#166534" />
      {/* Fruits */}
      <circle cx="40" cy="40" r="6" fill="#F59E0B" />
      <circle cx="60" cy="30" r="6" fill="#F59E0B" />
      <circle cx="20" cy="60" r="6" fill="#F59E0B" />
      <circle cx="80" cy="60" r="6" fill="#F59E0B" />
      <circle cx="50" cy="20" r="6" fill="#F59E0B" />
    </svg>
  );
  // 9: Древо Мудрости
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{stopColor:'rgb(255,255,255)', stopOpacity:0.8}} />
          <stop offset="100%" style={{stopColor:'rgb(16, 185, 129)', stopOpacity:0}} />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="url(#grad1)" />
      <path d="M50 95L50 40" stroke="#451A03" strokeWidth="10" strokeLinecap="round"/>
      <circle cx="50" cy="40" r="40" fill="#064E3B" />
      <circle cx="20" cy="65" r="25" fill="#065F46" />
      <circle cx="80" cy="65" r="25" fill="#065F46" />
      <circle cx="50" cy="25" r="15" fill="#10B981" />
      {/* Magic particles */}
      <circle cx="30" cy="40" r="2" fill="#FCD34D" />
      <circle cx="70" cy="40" r="2" fill="#FCD34D" />
      <circle cx="50" cy="10" r="3" fill="#FCD34D" />
      <path d="M20 20L25 25" stroke="#FCD34D" strokeWidth="2" />
      <path d="M80 20L75 25" stroke="#FCD34D" strokeWidth="2" />
    </svg>
  );
};

// --- КОМПОНЕНТ ОПРОСА (12 ВОПРОСОВ) ---
const OnboardingScreen: React.FC<{ onComplete: (data: Partial<UserProfile>) => void, onBack: () => void }> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ CREATOR: 0, RULER: 0, SAGE: 0, CAREGIVER: 0, EXPLORER: 0 });
  const [finalData, setFinalData] = useState<{ focus?: string, struggle?: string, chronotype?: string, aiTone?: string }>({});
  
  const steps = [
    { title: "Что вас больше всего вдохновляет?", type: 'archetype', options: [{ label: "Создание нового", type: 'CREATOR', icon: Feather }, { label: "Управление и успех", type: 'RULER', icon: Target }, { label: "Познание мира", type: 'SAGE', icon: BookOpen }, { label: "Забота о людях", type: 'CAREGIVER', icon: Heart }] },
    { title: "Ваш главный страх?", type: 'archetype', options: [{ label: "Посредственность", type: 'CREATOR', icon: Activity }, { label: "Хаос", type: 'RULER', icon: Lock }, { label: "Обман", type: 'SAGE', icon: Search }, { label: "Ловушка", type: 'EXPLORER', icon: Map }] },
    { title: "Идеальный выходной?", type: 'archetype', options: [{ label: "Путешествие", type: 'EXPLORER', icon: Compass }, { label: "Дома с семьей", type: 'CAREGIVER', icon: Coffee }, { label: "Учеба", type: 'SAGE', icon: Zap }, { label: "Планирование", type: 'RULER', icon: Briefcase }] },
    { title: "В сложной ситуации вы...", type: 'archetype', options: [{ label: "Креативите", type: 'CREATOR', icon: Sparkles }, { label: "Руководите", type: 'RULER', icon: Shield }, { label: "Анализируете", type: 'SAGE', icon: Brain }, { label: "Помогаете", type: 'CAREGIVER', icon: Heart }] },
    { title: "Ради чего работаете?", type: 'archetype', options: [{ label: "Самовыражение", type: 'CREATOR', icon: Feather }, { label: "Власть/Успех", type: 'RULER', icon: Award }, { label: "Истина", type: 'SAGE', icon: Search }, { label: "Впечатления", type: 'EXPLORER', icon: Map }] },
    { title: "В отношениях цените...", type: 'archetype', options: [{ label: "Новизну", type: 'CREATOR', icon: Sparkles }, { label: "Надежность", type: 'CAREGIVER', icon: Anchor }, { label: "Ум", type: 'SAGE', icon: MessageSquare }, { label: "Приключения", type: 'EXPLORER', icon: Compass }] },
    { title: "Решения принимаете...", type: 'archetype', options: [{ label: "Интуитивно", type: 'CREATOR', icon: Zap }, { label: "Логично", type: 'SAGE', icon: Brain }, { label: "Быстро", type: 'RULER', icon: Target }, { label: "Сердцем", type: 'CAREGIVER', icon: Heart }] },
    { title: "Какой вы лидер?", type: 'archetype', options: [{ label: "Вдохновитель", type: 'CREATOR', icon: Sun }, { label: "Стратег", type: 'RULER', icon: Target }, { label: "Наставник", type: 'SAGE', icon: BookOpen }, { label: "Защитник", type: 'CAREGIVER', icon: Shield }] },
    { title: "Реакция на новизну?", type: 'archetype', options: [{ label: "Восторг!", type: 'EXPLORER', icon: Flame }, { label: "Любопытство", type: 'SAGE', icon: Search }, { label: "Польза", type: 'RULER', icon: Briefcase }, { label: "Осторожность", type: 'CAREGIVER', icon: Lock }] },
    { title: "Лучший подарок?", type: 'archetype', options: [{ label: "Hand-made", type: 'CAREGIVER', icon: Heart }, { label: "Билет", type: 'EXPLORER', icon: Map }, { label: "Книга", type: 'SAGE', icon: BookOpen }, { label: "Статус", type: 'RULER', icon: Star }] },
    { title: "Идеальное утро?", type: 'archetype', options: [{ label: "Спорт", type: 'RULER', icon: Activity }, { label: "Кофе и мечты", type: 'CREATOR', icon: Coffee }, { label: "В дорогу", type: 'EXPLORER', icon: Cloud }, { label: "Семья", type: 'CAREGIVER', icon: Smile }] },
    { title: "Ваше наследие?", type: 'archetype', options: [{ label: "Творчество", type: 'CREATOR', icon: Feather }, { label: "Система", type: 'RULER', icon: Briefcase }, { label: "Знания", type: 'SAGE', icon: BookOpen }, { label: "Доброта", type: 'CAREGIVER', icon: Heart }] },
    { title: "Главный фокус?", key: 'focus', options: [{ label: "Деньги", value: "Рост доходов", icon: Zap }, { label: "Спокойствие", value: "Снижение стресса", icon: Cloud }, { label: "Дисциплина", value: "Режим", icon: Brain }, { label: "Отношения", value: "Семья", icon: Heart }] },
    { title: "Главная проблема?", key: 'struggle', options: [{ label: "Лень", value: "Прокрастинация", icon: Clock }, { label: "Страх", value: "Неуверенность", icon: Lock }, { label: "Усталость", value: "Выгорание", icon: Battery }, { label: "Хаос", value: "Расфокус", icon: Activity }] },
    { title: "Биоритмы?", key: 'chronotype', options: [{ label: "Жаворонок", value: "Утро", icon: Sun }, { label: "Сова", value: "Вечер", icon: Moon }, { label: "По-разному", value: "Плавающий", icon: Activity }] }
  ];

  const currentStepData = steps[step];
  if (!currentStepData) return null;

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
      onComplete({ archetype: archMap[winner] || "Искатель", ...finalData, [currentStepData.key!]: option.value });
    }
  };

  const questions = steps as any; 

  return (
    <div className="h-full flex flex-col bg-white px-6 py-10 animate-fade-in relative z-50">
      <div className="flex justify-start mb-6"><button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600"><ArrowLeft size={24} /></button></div>
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="mb-10">
          <div className="flex space-x-1 mb-8 justify-center flex-wrap gap-y-2">{steps.map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all duration-500 mx-0.5 ${i <= step ? 'w-4 bg-indigo-500' : 'w-2 bg-slate-100'}`} />))}</div>
          <h2 className="text-2xl font-black text-slate-800 text-center leading-tight mb-2">{questions[step].title}</h2>
        </div>
        <div className="space-y-3" key={step}>
          {questions[step].options.map((option: any, idx: number) => {
            const Icon = option.icon;
            return (
            <button key={idx} onClick={() => handleSelect(option)} className="w-full p-5 rounded-[24px] border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-lg transition-all active:scale-[0.98] flex items-center text-left group focus:outline-none">
              {Icon && (<div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm mr-4 group-hover:scale-110 transition-transform"><Icon size={20} /></div>)}
              <span className="font-bold text-slate-700 text-base group-hover:text-indigo-700">{option.label}</span>
            </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- КОМПОНЕНТ РЕЗУЛЬТАТА ТЕСТА (НОВЫЙ) ---
const ArchetypeRevealScreen: React.FC<{ archetype: string, onContinue: () => void }> = ({ archetype, onContinue }) => {
  const info = ARCHETYPE_DETAILS[archetype] || ARCHETYPE_DETAILS["Искатель"];
  
  return (
    <div className="h-full flex flex-col bg-white px-6 py-10 animate-fade-in relative z-50 overflow-y-auto">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-6 shadow-sm animate-bounce-slow">
          <Feather size={48} />
        </div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Ваш Архетип</h2>
        <h1 className="text-4xl font-black text-slate-800 mb-6">{archetype}</h1>
        
        <div className="space-y-6 w-full max-w-sm text-left">
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
            <p className="text-slate-700 font-medium leading-relaxed">{info.desc}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
               <div className="flex items-center space-x-2 mb-2 text-emerald-600"><Zap size={16} /><span className="text-xs font-bold uppercase">Сила</span></div>
               <p className="text-xs text-slate-700">{info.power}</p>
             </div>
             <div className="bg-rose-50 p-4 rounded-2xl border border-rose-100">
               <div className="flex items-center space-x-2 mb-2 text-rose-500"><Lock size={16} /><span className="text-xs font-bold uppercase">Тень</span></div>
               <p className="text-xs text-slate-700">{info.shadow}</p>
             </div>
          </div>

          <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
             <div className="flex items-center space-x-2 mb-2 text-indigo-600"><Star size={16} /><span className="text-xs font-bold uppercase">Совет</span></div>
             <p className="text-sm text-slate-700 italic">"{info.advice}"</p>
          </div>
        </div>
      </div>
      <button onClick={onContinue} className="mt-8 w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-xl shadow-indigo-200 active:scale-95 transition-all">Далее</button>
    </div>
  );
};

// --- КОМПОНЕНТ ОБУЧЕНИЯ (TUTORIAL) ---
const TutorialScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [slide, setSlide] = useState(0);
  
  const slides = [
    { title: "Карта Дня", text: "Каждое утро ИИ создает для вас персональный план из 4 сфер: Мышление, Действие, Тело и Инсайт.", icon: Map, color: "text-indigo-500" },
    { title: "Заряд Батарейки", text: "Меняйте свое состояние, нажав на иконку батарейки. План дня адаптируется под ваши силы.", icon: Battery, color: "text-emerald-500" },
    { title: "Древо Сознания", text: "Каждая сессия и минута практики питают ваше дерево. Наблюдайте, как оно растет от семени до могучего дуба.", icon: TreeDeciduous, color: "text-amber-500" }
  ];

  const current = slides[slide];
  const Icon = current.icon;

  const next = () => {
    if (slide < slides.length - 1) setSlide(s => s + 1);
    else onFinish();
  };

  return (
    <div className="h-full flex flex-col bg-white px-8 py-12 animate-fade-in relative z-50 justify-center items-center text-center">
       <div className={`w-32 h-32 rounded-[40px] bg-slate-50 flex items-center justify-center mb-8 shadow-sm ${current.color}`}>
         <Icon size={64} />
       </div>
       <h2 className="text-3xl font-black text-slate-800 mb-4">{current.title}</h2>
       <p className="text-slate-500 leading-relaxed text-lg mb-12 max-w-xs">{current.text}</p>
       
       <div className="flex space-x-2 mb-8">
         {slides.map((_, i) => (<div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-slate-800' : 'w-2 bg-slate-200'}`} />))}
       </div>

       <button onClick={next} className="w-full py-4 rounded-2xl bg-slate-900 text-white font-bold text-lg active:scale-95 transition-all">
         {slide === slides.length - 1 ? "Начать практику" : "Далее"}
       </button>
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

  const [currentView, setCurrentView] = useState<ExtendedViewState>('HOME');
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

  const longPressTimer = useRef<number | null>(null);
  const resetClicks = useRef<number>(0);

  // --- GENERATE ADVICE ---
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
        
        const prompt = `
          Ты — ментор. Клиент: ${userName}. Архетип: "${userProfile.archetype}".
          Цель: "${userProfile.focus}". Состояние: ${moodInstruction}.
          
          Карта дня (4 блока). Разделитель "|||". Без заголовков.
          1. МЫШЛЕНИЕ (Установка). 2. ДЕЙСТВИЕ (Шаг к цели). 3. ТЕЛО (Энергия). 4. ИНСАЙТ (Мысль).
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
      } catch (e) { } finally { setIsInsightLoading(false); }
    };
    generateDailyAdvice();
  }, [userProfile.name, userProfile.currentMood, journalEntries, userProfile.onboardingCompleted]);

  // Effects
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SESSIONS, totalSessions.toString()); }, [totalSessions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TIME, totalTimeSeconds.toString()); }, [totalTimeSeconds]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.JOURNAL, JSON.stringify(journalEntries)); }, [journalEntries]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(siteConfig)); }, [siteConfig]);

  // Telegram Init
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
          const isManual = prev.avatarUrl?.startsWith('data:');
          const shouldUpdateAvatar = !isManual && prev.avatarUrl !== tgPhoto;
          return { ...prev, name: prev.name || fullName, avatarUrl: shouldUpdateAvatar ? tgPhoto : prev.avatarUrl, isRegistered: true };
        });
      }
    }
  }, []);

  const totalMinutes = Math.round(totalTimeSeconds / 60);
  const totalSteps = totalSessions + totalMinutes; 
  
  const getTreeStage = (steps: number) => {
    const safeSteps = isNaN(steps) ? 0 : steps;
    // 10 levels logic based on threshold
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
  const handleVersionClick = () => {
    resetClicks.current += 1;
    if (resetClicks.current >= 5) {
      if (window.confirm("ПОЛНЫЙ СБРОС ДАННЫХ?")) { localStorage.clear(); window.location.reload(); }
      resetClicks.current = 0;
    }
  };

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

      <div className="px-6 mb-8">
        {!userProfile.onboardingCompleted ? (
          <button onClick={() => setCurrentView('ONBOARDING')} className="w-full relative overflow-hidden rounded-[32px] bg-slate-900 p-8 text-left shadow-xl shadow-slate-200 group active:scale-95 transition-all">
             <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 rounded-full blur-[60px] opacity-30 group-hover:opacity-50 transition-opacity"></div>
             <div className="relative z-10"><div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6"><Compass size={24} /></div><h2 className="text-2xl font-bold text-white mb-2 leading-tight">Найти свой путь</h2><p className="text-slate-400 text-sm mb-6 leading-relaxed max-w-[200px]">Узнайте свой архетип и получите карту развития.</p><div className="inline-flex items-center space-x-2 bg-white text-slate-900 px-5 py-2.5 rounded-full text-xs font-bold"><span>Начать тест</span><ArrowLeft className="rotate-180" size={14} /></div></div>
          </button>
        ) : (
          <div className="w-full relative overflow-hidden rounded-[32px] bg-white border border-slate-100 p-6 text-left shadow-lg shadow-indigo-100/50">
             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-4">
                 <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">Фокус дня</span>
                 <button onClick={(e) => { e.stopPropagation(); setIsBatteryModalOpen(true); }} className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors active:scale-90"><Battery size={14} className={userProfile.currentMood === 'low' ? "text-rose-500" : "text-emerald-500"} /><span className="text-[10px] font-bold text-slate-600">{userProfile.currentMood === 'high' ? 'На пике' : userProfile.currentMood === 'low' ? 'На нуле' : userProfile.currentMood === 'flow' ? 'В потоке' : 'Норм'}</span></button>
               </div>
               
               {/* ПОСТОЯННАЯ ПОДСКАЗКА ПРО НАСТРОЕНИЕ */}
               <div className="mb-2 text-[9px] text-slate-400 font-medium flex items-center space-x-1"><HelpCircle size={10} /><span>Нажми на заряд, чтобы адаптировать план</span></div>

               <div className="mb-6 min-h-[60px]">
                 {isInsightLoading ? (<div className="flex items-center space-x-2 text-slate-400 animate-pulse"><Loader2 size={18} className="animate-spin" /><span>Синхронизация...</span></div>) : (<h2 className="text-xl font-bold text-slate-800 leading-snug line-clamp-3">{dailyInsight?.mindset || "Загрузка..."}</h2>)}
               </div>
               <button onClick={() => setCurrentView('DAILY_GUIDE')} className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center space-x-2 group"><Map size={16} /><span>Открыть карту дня</span><ChevronRight size={16} className="opacity-60 group-hover:translate-x-1 transition-transform" /></button>
             </div>
          </div>
        )}
      </div>

      <div className="px-6 mb-8">
        <div className="grid grid-cols-3 gap-4">
          {[ { id: 'DECISION', label: 'Решение', icon: Zap, color: 'text-indigo-500', bg: 'bg-indigo-50' }, { id: 'EMOTIONS', label: 'Эмоции', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50' }, { id: 'REFLECTION', label: 'Дневник', icon: BookOpen, color: 'text-emerald-500', bg: 'bg-emerald-50' } ].map((m) => (
            <button key={m.id} onClick={() => startMode(m.id as JournalMode)} className="flex flex-col items-center p-4 rounded-[24px] bg-white border border-slate-50 shadow-sm active:scale-95 transition-all group">
              <div className={`w-12 h-12 rounded-2xl ${m.bg} flex items-center justify-center ${m.color} mb-3 group-hover:scale-110 transition-transform`}><m.icon size={24} fill={m.id === 'DECISION' ? "currentColor" : "none"} strokeWidth={m.id === 'DECISION' ? 0 : 2} /></div><span className="text-[11px] font-bold text-slate-500">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 mb-6">
         <button onClick={() => setCurrentView('RANKS_INFO')} className="w-full bg-white border border-slate-100 p-5 rounded-[24px] shadow-sm active:scale-95 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 opacity-10 pointer-events-none translate-x-4 -translate-y-4"><TreeIllustration stage={currentTree.stageIndex} className="w-full h-full" /></div>
            <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center space-x-4">
                   <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center overflow-hidden"><TreeIllustration stage={currentTree.stageIndex} className="w-10 h-10" /></div>
                   <div className="text-left"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Древо сознания</p><h4 className="text-base font-bold text-slate-800">{currentTree.title}</h4></div>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50 relative z-10">
               <div className="text-center border-r border-slate-50"><p className="text-lg font-bold text-slate-800">{totalSessions}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Сессий</p></div>
               <div className="text-center"><p className="text-lg font-bold text-slate-800">{totalMinutes}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Минут</p></div>
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
          <div key={stage.title} className={`p-5 rounded-[24px] border transition-all flex items-center space-x-4 ${totalSteps >= stage.threshold ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-slate-50/50 border-slate-100 opacity-50'}`}>
            <div className="w-12 h-12 shrink-0"><TreeIllustration stage={stage.stageIndex} className="w-full h-full" /></div>
            <div><h4 className={`font-bold ${totalSteps >= stage.threshold ? 'text-emerald-800' : 'text-slate-400'}`}>{stage.title}</h4><p className="text-xs leading-relaxed text-slate-500 mt-1">{stage.desc}</p><div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-60">Требуется: {stage.threshold} очков</div></div>
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
          {history.map((session) => (
            <button key={session.id} onClick={() => { setSelectedSession(session); setCurrentView('READ_HISTORY'); }} className="w-full text-left p-4 rounded-[24px] bg-white border-slate-50 shadow-sm border flex items-start space-x-4 active:scale-98">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${session.mode === 'DECISION' ? 'bg-indigo-50 text-indigo-500' : session.mode === 'EMOTIONS' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>{session.mode === 'DECISION' ? <Zap size={20} fill="currentColor" /> : session.mode === 'EMOTIONS' ? <Heart size={20} /> : <BookOpen size={20} />}</div>
              <div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-1"><h4 className="font-semibold text-slate-700 text-sm">{session.mode === 'DECISION' ? 'Решение' : session.mode === 'EMOTIONS' ? 'Эмоции' : 'Дневник'}</h4><span className="text-[10px] text-slate-400">{new Date(session.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span></div><p className="text-xs text-slate-500 line-clamp-2">{session.preview || 'Нет описания'}</p></div>
            </button>
          ))}
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
        <button onClick={() => setCurrentView('ARCHETYPE_REVEAL')} className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold active:scale-95 transition-transform">Подробнее об архетипе</button>
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
            {window.Telegram?.WebApp?.initDataUnsafe?.user?.photo_url && (<button onClick={resetToTelegramAvatar} className="mt-4 flex items-center space-x-2 text-xs font-bold text-indigo-500 bg-indigo-50 px-4 py-2 rounded-full active:scale-95 transition-all"><RefreshCw size={12} /><span>Фото из Telegram</span></button>)}
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
          <div className="w-full pt-8 mt-10 border-t border-slate-100 flex justify-around"><div className="text-center cursor-pointer active:scale-95 transition-transform" onClick={() => { if (window.confirm("ПОЛНЫЙ СБРОС?")) { localStorage.clear(); window.location.reload(); } }}><p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Версия</p><p className="text-base font-semibold text-slate-700">2.1.0</p></div><div className="text-center"><p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Сборка</p><p className="text-base font-semibold text-slate-700">09-2025</p></div></div>
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
        {currentView === 'ONBOARDING' && <OnboardingScreen onComplete={(data) => { setUserProfile(prev => ({ ...prev, ...data, onboardingCompleted: true })); localStorage.removeItem(STORAGE_KEYS.DAILY_INSIGHT); setDailyInsight(null); setCurrentView('ARCHETYPE_REVEAL'); }} onBack={() => setCurrentView('HOME')} />}
        {currentView === 'ARCHETYPE_REVEAL' && userProfile.archetype && <ArchetypeRevealScreen archetype={userProfile.archetype} onContinue={() => setCurrentView('TUTORIAL')} />}
        {currentView === 'TUTORIAL' && <TutorialScreen onFinish={() => setCurrentView('HOME')} />}
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
