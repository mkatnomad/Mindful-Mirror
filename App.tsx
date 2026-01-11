import React, { useState, useEffect, useRef } from 'react';
import { ViewState, JournalMode, ChatSession, Message, UserProfile, JournalEntry, SiteConfig, DailyInsightData } from './types';
import { BottomNav } from './components/BottomNav';
import { ChatInterface } from './components/ChatInterface';
import { JournalInterface } from './components/JournalInterface';
import { AdminInterface } from './components/AdminInterface';
import { sendMessageToGemini } from './services/geminiService';
// ИМПОРТИРУЕМ ТОЛЬКО БЕЗОПАСНЫЕ ИКОНКИ
import { Heart, BookOpen, ChevronRight, Settings, Info, User as UserIcon, Activity, Quote, Clock, Zap, Camera, Star, ArrowLeft, MessageSquare, Award, Medal, RefreshCw, Loader2, Cloud, Lock, Moon, Search, Sparkles, Sun, Coffee, Brain, Briefcase, Feather, Compass, Anchor, Target, Battery, X, Shield, Map, Smile, Lightbulb } from 'lucide-react';

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
    "Растите свое внутреннее дерево, уделяя внимание себе."
  ],
  quotes: [],
  adminPasscode: "0000"
};

// ЧИСТЫЕ КЛЮЧИ ДЛЯ СТАБИЛЬНОЙ РАБОТЫ
const STORAGE_KEYS = {
  PROFILE: 'mm_profile_stable_final', 
  HISTORY: 'mm_history_stable_final',
  SESSIONS: 'mm_sessions_stable_final',
  TIME: 'mm_time_stable_final',
  ACTIVITY: 'mm_activity_stable_final',
  JOURNAL: 'mm_journal_stable_final',
  CONFIG: 'mm_site_config',
  DAILY_INSIGHT: 'mm_insight_stable_final'
};

const Logo = ({ className = "w-20 h-20" }: { className?: string }) => (
  <img src="/logo.png" alt="Mindful Mirror" className={`${className} object-contain`} onError={(e) => e.currentTarget.style.display = 'none'} />
);

// --- ВЕКТОРНЫЕ ДЕРЕВЬЯ (SVG) ---
// Рисуем графику кодом, чтобы не зависеть от иконок
const TreeIllustration: React.FC<{ stage: number, className?: string }> = ({ stage, className }) => {
  // 0: Семя
  if (stage === 0) return (
    <svg viewBox="0 0 100 100" className={className} fill="none"><circle cx="50" cy="50" r="45" fill="#FEF3C7" /><path d="M50 75C50 75 40 75 40 75" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="70" r="6" fill="#B45309" /></svg>
  );
  // 1: Росток
  if (stage === 1) return (
    <svg viewBox="0 0 100 100" className={className} fill="none"><circle cx="50" cy="50" r="45" fill="#ECFDF5" /><path d="M50 80V60" stroke="#059669" strokeWidth="3" strokeLinecap="round"/><path d="M50 60C50 60 35 55 35 45C35 55 50 60 50 60Z" fill="#10B981" /><path d="M50 60C50 60 65 55 65 45C65 55 50 60 50 60Z" fill="#34D399" /></svg>
  );
  // 2: Побег
  if (stage === 2) return (
    <svg viewBox="0 0 100 100" className={className} fill="none"><circle cx="50" cy="50" r="45" fill="#D1FAE5" /><path d="M50 85V50" stroke="#059669" strokeWidth="3" strokeLinecap="round"/><path d="M50 65L65 55" stroke="#059669" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="45" r="10" fill="#10B981" /><circle cx="65" cy="55" r="6" fill="#34D399" /></svg>
  );
  // 3: Саженец
  if (stage === 3) return (
    <svg viewBox="0 0 100 100" className={className} fill="none"><circle cx="50" cy="50" r="45" fill="#A7F3D0" /><path d="M50 85V45" stroke="#92400E" strokeWidth="4" strokeLinecap="round"/><path d="M50 65L30 55" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="40" r="15" fill="#10B981" /><circle cx="30" cy="55" r="8" fill="#34D399" /><circle cx="65" cy="50" r="8" fill="#34D399" /></svg>
  );
  // 4: Молодое дерево
  if (stage === 4) return (
    <svg viewBox="0 0 100 100" className={className} fill="none"><circle cx="50" cy="50" r="45" fill="#6EE7B7" /><path d="M50 90V40" stroke="#92400E" strokeWidth="5" strokeLinecap="round"/><path d="M50 60L25 50" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/><path d="M50 50L75 40" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="35" r="20" fill="#059669" /><circle cx="25" cy="50" r="12" fill="#10B981" /><circle cx="75" cy="40" r="12" fill="#10B981" /></svg>
  );
  // 5: Крепкое дерево
  if (stage === 5) return (
    <svg viewBox="0 0 100 100" className={className} fill="none"><circle cx="50" cy="50" r="45" fill="#34D399" /><path d="M50 90L50 35" stroke="#78350F" strokeWidth="6" strokeLinecap="round"/><path d="M50 70L20 60" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/><path d="M50 60L80 50" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="30" r="25" fill="#047857" /><circle cx="20" cy="60" r="15" fill="#059669" /><circle cx="80" cy="50" r="15" fill="#059669" /></svg>
  );
  // 6: Ветвистое дерево
  if (stage === 6) return (
    <svg viewBox="0 0 100 100" className={className} fill="none"><circle cx="50" cy="50" r="45" fill="#10B981" /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="7" strokeLinecap="round"/><path d="M50 70L20 55" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/><path d="M50 60L85 45" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/><circle cx="50" cy="35" r="30" fill="#064E3B" /><circle cx="20" cy="55" r="18" fill="#065F46" /><circle cx="85" cy="45" r="18" fill="#065F46" /><circle cx="35" cy="80" r="5" fill="#064E3B" opacity="0.5"/></svg>
  );
  // 7: Цветущее дерево
  if (stage === 7) return (
    <svg viewBox="0 0 100 100" className={className} fill="none"><circle cx="50" cy="50" r="45" fill="#FCE7F3" /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="8" strokeLinecap="round"/><circle cx="50" cy="40" r="35" fill="#065F46" /><circle cx="25" cy="55" r="20" fill="#047857" /><circle cx="75" cy="55" r="20" fill="#047857" /><circle cx="40" cy="30" r="5" fill="#F472B6" /><circle cx="60" cy="30" r="5" fill="#F472B6" /><circle cx="25" cy="55" r="5" fill="#F472B6" /><circle cx="75" cy="55" r="5" fill="#F472B6" /><circle cx="50" cy="15" r="5" fill="#F472B6" /></svg>
  );
  // 8: Плодоносящее древо
  if (stage === 8) return (
    <svg viewBox="0 0 100 100" className={className} fill="none"><circle cx="50" cy="50" r="45" fill="#FEF3C7" /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="9" strokeLinecap="round"/><circle cx="50" cy="40" r="38" fill="#14532D" /><circle cx="20" cy="60" r="22" fill="#166534" /><circle cx="80" cy="60" r="22" fill="#166534" /><circle cx="40" cy="40" r="6" fill="#F59E0B" /><circle cx="60" cy="30" r="6" fill="#F59E0B" /><circle cx="20" cy="60" r="6" fill="#F59E0B" /><circle cx="80" cy="60" r="6" fill="#F59E0B" /><circle cx="50" cy="20" r="6" fill="#F59E0B" /></svg>
  );
  // 9: Древо Мудрости
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none"><defs><radialGradient id="grad1" cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" style={{stopColor:'rgb(255,255,255)', stopOpacity:0.8}} /><stop offset="100%" style={{stopColor:'rgb(16, 185, 129)', stopOpacity:0}} /></radialGradient></defs><circle cx="50" cy="50" r="48" fill="url(#grad1)" /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="10" strokeLinecap="round"/><circle cx="50" cy="40" r="40" fill="#064E3B" /><circle cx="20" cy="65" r="25" fill="#065F46" /><circle cx="80" cy="65" r="25" fill="#065F46" /><circle cx="50" cy="25" r="15" fill="#10B981" /><circle cx="30" cy="40" r="2" fill="#FCD34D" /><circle cx="70" cy="40" r="2" fill="#FCD34D" /><circle cx="50" cy="10" r="3" fill="#FCD34D" /><path d="M20 20L25 25" stroke="#FCD34D" strokeWidth="2" /><path d="M80 20L75 25" stroke="#FCD34D" strokeWidth="2" /></svg>
  );
};

const TREE_STAGES = [
  { threshold: 5000, title: "Древо Мудрости", stageIndex: 9, desc: "Вы достигли вершины." },
  { threshold: 2500, title: "Плодоносящее Древо", stageIndex: 8, desc: "Ваша практика приносит плоды." },
  { threshold: 1200, title: "Цветущее Древо", stageIndex: 7, desc: "Вы раскрываете свой потенциал." },
  { threshold: 600, title: "Ветвистое Древо", stageIndex: 6, desc: "Ваши знания расширяются." },
  { threshold: 300, title: "Крепкое Древо", stageIndex: 5, desc: "Вы уверенно стоите на ногах." },
  { threshold: 150, title: "Молодое Дерево", stageIndex: 4, desc: "Заметный рост и укрепление." },
  { threshold: 75, title: "Саженец", stageIndex: 3, desc: "Корни становятся глубже." },
  { threshold: 30, title: "Побег", stageIndex: 2, desc: "Второй шаг к свету." },
  { threshold: 10, title: "Росток", stageIndex: 1, desc: "Первые всходы ваших усилий." },
  { threshold: 0, title: "Семя", stageIndex: 0, desc: "Потенциал, готовый к пробуждению." },
];

const ARCHETYPE_INFO: any = {
  "Творец": { desc: "Вы видите мир как полотно. Ваша суть — созидание.", strength: "Воображение", shadow: "Перфекционизм", advice: "Создавайте, не ожидая идеала.", icon: Feather, color: "text-purple-600", bg: "bg-purple-50" },
  "Правитель": { desc: "Вы создаете порядок из хаоса.", strength: "Лидерство", shadow: "Контроль", advice: "Доверяйте процессу.", icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50" },
  "Мудрец": { desc: "Вы ищете истину и понимание.", strength: "Интеллект", shadow: "Бездействие", advice: "Знание требует действий.", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
  "Хранитель": { desc: "Вы — опора и забота.", strength: "Эмпатия", shadow: "Самопожертвование", advice: "Сначала маску на себя.", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
  "Искатель": { desc: "Вы — вечный путник.", strength: "Свобода", shadow: "Непостоянство", advice: "Найдите дом внутри себя.", icon: Compass, color: "text-amber-600", bg: "bg-amber-50" }
};

// --- КОМПОНЕНТЫ ---

const ArchetypeResultScreen: React.FC<{ archetype: string, onContinue: () => void, isReadOnly?: boolean, onBack?: () => void }> = ({ archetype, onContinue, isReadOnly, onBack }) => {
  const info = ARCHETYPE_INFO[archetype] || ARCHETYPE_INFO["Искатель"];
  const Icon = info.icon;
  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto animate-fade-in relative z-50">
      <div className="p-6 pb-0">{isReadOnly && <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 mb-4"><ArrowLeft size={24} /></button>}</div>
      <div className="flex-1 px-6 pb-12 flex flex-col items-center text-center">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl ${info.bg} ${info.color}`}><Icon size={64} strokeWidth={1.5} /></div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Ваш Архетип</h2>
        <h1 className="text-4xl font-black text-slate-800 mb-6">{archetype}</h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-10">{info.desc}</p>
        <div className="w-full space-y-4 mb-10 text-left">
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100"><div className="flex items-center space-x-3 mb-2 text-emerald-700 font-bold"><Star size={20} /><span>Суперсила</span></div><p className="text-emerald-900/80 font-medium">{info.strength}</p></div>
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100"><div className="flex items-center space-x-3 mb-2 text-rose-700 font-bold"><Cloud size={20} /><span>Тень</span></div><p className="text-rose-900/80 font-medium">{info.shadow}</p></div>
          <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100"><div className="flex items-center space-x-3 mb-2 text-indigo-700 font-bold"><Lightbulb size={20} /><span>Совет</span></div><p className="text-indigo-900/80 font-medium">{info.advice}</p></div>
        </div>
        {!isReadOnly && <button onClick={onContinue} className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-xl active:scale-95 transition-all">Далее</button>}
      </div>
    </div>
  );
};

const TutorialScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [slide, setSlide] = useState(0);
  const slides = [
    { title: "Карта Дня", desc: "Каждое утро ИИ создает для вас персональный план на основе вашего архетипа.", icon: Map, color: "text-indigo-500", bg: "bg-indigo-50" },
    { title: "Настроение", desc: "Нажмите на кнопку 'Как ты?' на главной, чтобы адаптировать план под ваш уровень энергии.", icon: Battery, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Древо Сознания", desc: "Ваш прогресс визуализируется в виде дерева. Чем больше практик, тем выше оно растет.", icon: Activity, color: "text-amber-500", bg: "bg-amber-50" }
  ];
  return (
    <div className="h-full flex flex-col bg-white px-6 py-10 animate-fade-in relative z-50">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className={`w-32 h-32 rounded-[32px] flex items-center justify-center mb-8 shadow-sm ${slides[slide].bg} ${slides[slide].color}`}>{React.createElement(slides[slide].icon, { size: 64 })}</div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">{slides[slide].title}</h2>
        <p className="text-slate-500 text-lg leading-relaxed max-w-xs">{slides[slide].desc}</p>
      </div>
      <div className="flex flex-col items-center space-y-8">
        <div className="flex space-x-2">{slides.map((_, i) => <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`} />)}</div>
        <button onClick={() => { if (slide < slides.length - 1) setSlide(s => s + 1); else onFinish(); }} className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-lg active:scale-95 transition-all">{slide < slides.length - 1 ? "Далее" : "Начать"}</button>
      </div>
    </div>
  );
};

const OnboardingScreen: React.FC<{ onComplete: (data: Partial<UserProfile>) => void, onBack: () => void }> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ CREATOR: 0, RULER: 0, SAGE: 0, CAREGIVER: 0, EXPLORER: 0 });
  const [finalData, setFinalData] = useState<{ focus?: string, struggle?: string, chronotype?: string }>({});
  
  const steps = [
    { title: "Что вас вдохновляет?", type: 'archetype', options: [{ label: "Создание нового", type: 'CREATOR', icon: Feather }, { label: "Управление и успех", type: 'RULER', icon: Target }, { label: "Познание мира", type: 'SAGE', icon: BookOpen }, { label: "Забота о людях", type: 'CAREGIVER', icon: Heart }] },
    { title: "Чего вы избегаете?", type: 'archetype', options: [{ label: "Скуки и рутины", type: 'CREATOR', icon: Activity }, { label: "Хаоса", type: 'RULER', icon: Lock }, { label: "Незнания", type: 'SAGE', icon: Search }, { label: "Застоя", type: 'EXPLORER', icon: Map }] },
    { title: "Идеальный выходной?", type: 'archetype', options: [{ label: "Путешествие", type: 'EXPLORER', icon: Compass }, { label: "Уют с семьей", type: 'CAREGIVER', icon: Coffee }, { label: "Изучение нового", type: 'SAGE', icon: Zap }, { label: "Планирование", type: 'RULER', icon: Briefcase }] },
    { title: "В сложной ситуации...", type: 'archetype', options: [{ label: "Креативите", type: 'CREATOR', icon: Sparkles }, { label: "Берете ответственность", type: 'RULER', icon: Shield }, { label: "Анализируете", type: 'SAGE', icon: Brain }, { label: "Помогаете", type: 'CAREGIVER', icon: Heart }] },
    { title: "Мотивация?", type: 'archetype', options: [{ label: "Самовыражение", type: 'CREATOR', icon: Feather }, { label: "Статус", type: 'RULER', icon: Award }, { label: "Истина", type: 'SAGE', icon: Search }, { label: "Свобода", type: 'EXPLORER', icon: Map }] },
    { title: "Ценность в людях?", type: 'archetype', options: [{ label: "Уникальность", type: 'CREATOR', icon: Sparkles }, { label: "Верность", type: 'CAREGIVER', icon: Anchor }, { label: "Ум", type: 'SAGE', icon: MessageSquare }, { label: "Легкость", type: 'EXPLORER', icon: Compass }] },
    { title: "Решения?", type: 'archetype', options: [{ label: "Интуиция", type: 'CREATOR', icon: Zap }, { label: "Логика", type: 'SAGE', icon: Brain }, { label: "Расчет", type: 'RULER', icon: Target }, { label: "Сердце", type: 'CAREGIVER', icon: Heart }] },
    { title: "Лидерство?", type: 'archetype', options: [{ label: "Вдохновитель", type: 'CREATOR', icon: Sun }, { label: "Стратег", type: 'RULER', icon: Target }, { label: "Учитель", type: 'SAGE', icon: BookOpen }, { label: "Опекун", type: 'CAREGIVER', icon: Shield }] },
    { title: "Новизна?", type: 'archetype', options: [{ label: "Восторг", type: 'EXPLORER', icon: Activity }, { label: "Любопытство", type: 'SAGE', icon: Search }, { label: "Польза", type: 'RULER', icon: Briefcase }, { label: "Осторожность", type: 'CAREGIVER', icon: Lock }] },
    { title: "Подарок?", type: 'archetype', options: [{ label: "Hand-made", type: 'CAREGIVER', icon: Heart }, { label: "Билет", type: 'EXPLORER', icon: Map }, { label: "Книга", type: 'SAGE', icon: BookOpen }, { label: "Бренд", type: 'RULER', icon: Star }] },
    { title: "Идеальное утро?", type: 'archetype', options: [{ label: "Спорт", type: 'RULER', icon: Activity }, { label: "Мечты", type: 'CREATOR', icon: Coffee }, { label: "Сразу в путь", type: 'EXPLORER', icon: Cloud }, { label: "Семья", type: 'CAREGIVER', icon: Smile }] },
    { title: "Наследие?", type: 'archetype', options: [{ label: "Искусство", type: 'CREATOR', icon: Feather }, { label: "Бизнес", type: 'RULER', icon: Briefcase }, { label: "Знания", type: 'SAGE', icon: BookOpen }, { label: "Память", type: 'CAREGIVER', icon: Heart }] },
    // Настройки
    { title: "Главный фокус?", key: 'focus', options: [{ label: "Финансы", value: "Рост доходов", icon: Zap }, { label: "Спокойствие", value: "Снижение стресса", icon: Cloud }, { label: "Дисциплина", value: "Режим", icon: Brain }, { label: "Отношения", value: "Семья", icon: Heart }] },
    { title: "Что мешает?", key: 'struggle', options: [{ label: "Лень", value: "Прокрастинация", icon: Clock }, { label: "Страх", value: "Неуверенность", icon: Lock }, { label: "Усталость", value: "Выгорание", icon: Battery }, { label: "Хаос", value: "Расфокус", icon: Activity }] },
    { title: "Биоритмы?", key: 'chronotype', options: [{ label: "Жаворонок", value: "Утро", icon: Sun }, { label: "Сова", value: "Вечер", icon: Moon }, { label: "По-разному", value: "Плавающий", icon: Activity }] }
  ];

  const currentStep = steps[step];
  if (!currentStep) return null;

  const handleSelect = (option: any) => {
    if (currentStep.type === 'archetype') setScores(prev => ({ ...prev, [option.type]: (prev[option.type as keyof typeof scores] || 0) + 1 }));
    if (currentStep.key) setFinalData(prev => ({ ...prev, [currentStep.key!]: option.value }));

    if (step < steps.length - 1) {
      setStep(s => s + 1);
    } else {
      let winner = 'SAGE';
      let max = -1;
      Object.entries(scores).forEach(([k, v]) => { if (v > max) { max = v; winner = k; } });
      const archMap: any = { CREATOR: "Творец", RULER: "Правитель", SAGE: "Мудрец", CAREGIVER: "Хранитель", EXPLORER: "Искатель" };
      onComplete({ archetype: archMap[winner] || "Искатель", ...finalData });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white px-6 py-10 animate-fade-in relative z-50">
      <div className="flex justify-start mb-6"><button onClick={onBack} className="p-2 -ml-2 text-slate-400"><ArrowLeft size={24} /></button></div>
      <div className="mb-8"><div className="flex space-x-1 mb-4">{steps.map((_, i) => (<div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-indigo-500' : 'bg-slate-100'}`} />))}</div><h2 className="text-2xl font-bold text-slate-800">{currentStep.title}</h2></div>
      <div className="space-y-3">{currentStep.options.map((opt: any, i: number) => { const Icon = opt.icon; return (<button key={i} onClick={() => handleSelect(opt)} className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center hover:bg-indigo-50"><Icon size={20} className="text-indigo-500 mr-3" /><span className="font-semibold text-slate-700">{opt.label}</span></button>) })}</div>
    </div>
  );
};

// --- APP ---
const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try { const s = localStorage.getItem(STORAGE_KEYS.PROFILE); return s ? JSON.parse(s) : { onboardingCompleted: false }; } catch { return { onboardingCompleted: false }; }
  });
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_CONFIG);
  
  const [currentView, setCurrentView] = useState<string>(userProfile.onboardingCompleted ? 'HOME' : 'ONBOARDING');
  const [selectedMode, setSelectedMode] = useState<JournalMode | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [dailyInsight, setDailyInsight] = useState<DailyInsightData | null>(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_INSIGHT) || 'null'); } catch { return null; }});
  
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [isBatteryModalOpen, setIsBatteryModalOpen] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]'); } catch { return []; }});
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(0);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);

  // Load Data
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.SESSIONS); if(s) setTotalSessions(parseInt(s) || 0);
      const t = localStorage.getItem(STORAGE_KEYS.TIME); if(t) setTotalTimeSeconds(parseInt(t) || 0);
      const j = localStorage.getItem(STORAGE_KEYS.JOURNAL); if(j) setJournalEntries(JSON.parse(j));
    } catch(e) {}
  }, []);

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
  const getTreeStage = (s: number) => TREE_STAGES.find(r => s >= r.threshold) || TREE_STAGES[7];
  const currentTree = getTreeStage(totalSteps);

  const startMode = (m: JournalMode) => { setSelectedMode(m); setCurrentView('CHAT'); };
  
  const handleSessionComplete = (messages: Message[], duration: number) => {
    const newSession: ChatSession = { id: Date.now().toString(), mode: selectedMode!, date: Date.now(), duration, preview: messages.find(m=>m.role==='user')?.content.substring(0,30) || '...', messages };
    setHistory(p => [newSession, ...p]); setTotalSessions(p => p+1); setTotalTimeSeconds(p => p+duration);
  };
  
  // Generation
  useEffect(() => {
    const gen = async () => {
      if (!userProfile.onboardingCompleted || !userProfile.name) return;
      const today = new Date().toDateString();
      if (dailyInsight?.date === today && dailyInsight?.generatedForMood === userProfile.currentMood) return;
      
      setIsInsightLoading(true);
      try {
        const prompt = `Ментор для ${userProfile.name}. Архетип ${userProfile.archetype}, Цель ${userProfile.focus}, Настроение ${userProfile.currentMood}. 4 совета (Мышление, Действие, Тело, Инсайт) через |||.`;
        const res = await sendMessageToGemini(prompt);
        const p = res.split('|||');
        const ni = { date: today, generatedForMood: userProfile.currentMood, mindset: p[0]||"Фокус", action: p[1]||"Действие", health: p[2]||"Дыши", insight: p[3]||"Мудрость" };
        setDailyInsight(ni); localStorage.setItem(STORAGE_KEYS.DAILY_INSIGHT, JSON.stringify(ni));
      } catch(e) {} finally { setIsInsightLoading(false); }
    };
    gen();
  }, [userProfile, journalEntries]);

  // --- RENDER ---
  const renderHome = () => (
    <div className="h-full overflow-y-auto px-6 pt-4 pb-32">
       <div className="flex justify-between items-center mb-6">
         <div>
           <h1 className="text-xl font-bold text-slate-800">Привет, {userProfile.name || 'Странник'}</h1>
           <p className="text-xs text-slate-500">{userProfile.archetype || 'Начало пути'}</p>
         </div>
         <div className="w-8 h-8 opacity-20"><Logo /></div>
       </div>

       {!userProfile.onboardingCompleted ? (
         <button onClick={() => setCurrentView('ONBOARDING')} className="w-full bg-slate-900 rounded-3xl p-6 text-white text-left shadow-lg mb-8">
           <Compass className="mb-4" />
           <h2 className="text-xl font-bold mb-2">Найти свой путь</h2>
           <p className="text-sm opacity-80 mb-4">Пройдите тест, чтобы получить карту дня.</p>
           <span className="bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold">Начать</span>
         </button>
       ) : (
         <div className="w-full bg-white border border-slate-100 rounded-3xl p-6 shadow-lg shadow-indigo-100/50 mb-8">
            <div className="flex justify-between mb-4">
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded">Фокус дня</span>
              <button onClick={() => setIsBatteryModalOpen(true)} className="flex items-center space-x-1 bg-slate-100 px-2 py-1 rounded-full"><Battery size={12} /><span className="text-[10px]">{userProfile.currentMood || 'Норм'}</span></button>
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 line-clamp-3">{isInsightLoading ? "Загрузка..." : (dailyInsight?.mindset || "...")}</h2>
            <button onClick={() => setCurrentView('DAILY_GUIDE')} className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm">Открыть карту</button>
         </div>
       )}

       <div className="grid grid-cols-3 gap-3 mb-8">
         <button onClick={() => startMode('DECISION')} className="p-4 bg-indigo-50 rounded-2xl flex flex-col items-center"><Zap size={24} className="text-indigo-500 mb-2" /><span className="text-[10px] font-bold text-slate-600">Решение</span></button>
         <button onClick={() => startMode('EMOTIONS')} className="p-4 bg-rose-50 rounded-2xl flex flex-col items-center"><Heart size={24} className="text-rose-500 mb-2" /><span className="text-[10px] font-bold text-slate-600">Эмоции</span></button>
         <button onClick={() => startMode('REFLECTION')} className="p-4 bg-emerald-50 rounded-2xl flex flex-col items-center"><BookOpen size={24} className="text-emerald-500 mb-2" /><span className="text-[10px] font-bold text-slate-600">Дневник</span></button>
       </div>

       <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm flex items-center justify-between" onClick={() => setCurrentView('RANKS_INFO')}>
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center overflow-hidden"><TreeIllustration stage={currentTree.stageIndex} className="w-10 h-10" /></div>
            <div><p className="text-[10px] uppercase text-slate-400 font-bold">Древо</p><h4 className="font-bold text-slate-800">{currentTree.title}</h4></div>
          </div>
          <div className="text-right"><p className="font-bold text-slate-800">{totalSessions}</p><p className="text-[9px] text-slate-400 uppercase">Сессий</p></div>
       </div>
    </div>
  );

  const renderBattery = () => {
    if (!isBatteryModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
          <h3 className="text-xl font-bold text-center mb-4">Заряд?</h3>
          <div className="grid grid-cols-2 gap-2">
            {['high','flow','ok','low'].map(m => (
              <button key={m} onClick={() => { setUserProfile(p=>({...p, currentMood: m as any})); setIsBatteryModalOpen(false); }} className="p-3 bg-slate-50 rounded-xl font-bold text-slate-700">{m}</button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderDailyGuide = () => (
    <div className="h-full bg-slate-50 px-6 pt-6 pb-32 overflow-y-auto">
      <button onClick={() => setCurrentView('HOME')} className="mb-6 flex items-center text-slate-500 font-bold"><ArrowLeft className="mr-2" /> Назад</button>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Карта дня</h1>
      {isInsightLoading ? <Loader2 className="animate-spin mx-auto text-indigo-500" /> : (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm"><div className="flex items-center mb-2 text-indigo-500 font-bold"><Brain size={18} className="mr-2" />МЫШЛЕНИЕ</div><p>{dailyInsight?.mindset}</p></div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-6 rounded-3xl shadow-lg"><div className="flex items-center mb-2 font-bold opacity-80"><Target size={18} className="mr-2" />ДЕЙСТВИЕ</div><p className="text-lg font-medium">{dailyInsight?.action}</p></div>
          <div className="bg-white p-6 rounded-3xl shadow-sm"><div className="flex items-center mb-2 text-emerald-500 font-bold"><Battery size={18} className="mr-2" />ТЕЛО</div><p>{dailyInsight?.health}</p></div>
          <div className="bg-slate-900 text-slate-200 p-6 rounded-3xl shadow-sm"><div className="flex items-center mb-2 text-amber-400 font-bold"><Sparkles size={18} className="mr-2" />ИНСАЙТ</div><p className="italic">"{dailyInsight?.insight}"</p></div>
        </div>
      )}
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
            <div key={session.id} onClick={() => { setSelectedSession(session); setCurrentView('READ_HISTORY'); }} className="w-full text-left p-4 rounded-[24px] bg-white border-slate-50 shadow-sm border flex items-start space-x-4 active:scale-98">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${session.mode === 'DECISION' ? 'bg-indigo-50 text-indigo-500' : session.mode === 'EMOTIONS' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>{session.mode === 'DECISION' ? <Zap size={20} fill="currentColor" /> : session.mode === 'EMOTIONS' ? <Heart size={20} /> : <BookOpen size={20} />}</div>
              <div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-1"><h4 className="font-semibold text-slate-700 text-sm">{session.mode === 'DECISION' ? 'Решение' : session.mode === 'EMOTIONS' ? 'Эмоции' : 'Дневник'}</h4><span className="text-[10px] text-slate-400">{new Date(session.date).toLocaleDateString()}</span></div><p className="text-xs text-slate-500 line-clamp-2">{session.preview || 'Нет описания'}</p></div>
            </div>
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
        {userProfile.archetype && (
          <button onClick={() => setCurrentView('ARCHETYPE_RESULT_VIEW')} className="mt-4 px-4 py-2 rounded-full bg-white/50 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-white transition-all">Подробнее об архетипе</button>
        )}
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
            <div className="relative"><div className="w-28 h-28 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-md active:scale-95">{userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300 bg-slate-50"><UserIcon size={40} /></div>}</div><label className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-full text-white cursor-pointer shadow-md"><Camera size={16} /><input type="file" accept="image/*" className="hidden" onChange={(e) => { if(e.target.files?.[0]) { const r = new FileReader(); r.onloadend = () => setUserProfile(p => ({...p, avatarUrl: r.result as string})); r.readAsDataURL(e.target.files[0]); } }} /></label></div>
          </div>
          <div className="space-y-2"><label className="text-sm font-bold text-slate-700">Имя</label><input type="text" value={userProfile.name} onChange={(e) => setUserProfile(prev => ({ ...prev, name: e.target.value }))} className="w-full px-5 py-4 rounded-2xl bg-slate-50 border-slate-100 border focus:outline-none focus:border-indigo-500 font-semibold" /></div>
          <div className="pt-4 border-t border-slate-100"><label className="text-sm font-bold text-slate-700 mb-2 block">Тест личности</label><button onClick={() => setCurrentView('ONBOARDING')} className="w-full py-4 rounded-2xl bg-slate-50 text-slate-600 font-bold border border-slate-100 active:scale-95 transition-all flex items-center justify-center space-x-2 hover:bg-slate-100"><Compass size={18} /><span>Пройти тест заново</span></button></div>
          <button onClick={() => setCurrentView('PROFILE')} className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-bold shadow-lg mt-4 active:scale-98 transition-transform">Сохранить</button>
        </div>
    </div>
  );

  const renderAbout = () => (
    <div className="p-6 pt-12 h-full overflow-y-auto animate-fade-in relative z-10 pb-24">
      <header className="mb-8 flex items-center space-x-4 text-left"><button onClick={() => setCurrentView('PROFILE')} className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-500"><ArrowLeft size={24} /></button><h1 className="text-3xl font-bold text-slate-800">О приложении</h1></header>
      <div className="bg-white shadow-sm border-slate-100 rounded-[32px] p-8 border flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0"><StylizedMMText text={siteConfig.logoText} className="text-[200px]" color="#A78BFA" opacity="0.05" /></div>
        <div className="relative z-10 flex flex-col items-center w-full">
          <div className="mb-10 p-6 rounded-3xl bg-indigo-500/10 flex items-center justify-center min-w-[120px] min-h-[120px]">{siteConfig.customLogoUrl ? <img src={siteConfig.customLogoUrl} className="w-24 h-24 object-contain" /> : <StylizedMMText text={siteConfig.logoText} className="text-7xl" color="#6366f1" />}</div>
          <h2 className="text-2xl font-bold mb-6 text-slate-800">{siteConfig.appTitle}</h2>
          <div className="space-y-6 text-left w-full px-2">{siteConfig.aboutParagraphs.map((p, i) => (<p key={i} className="text-[16px] leading-relaxed text-slate-600">{p}</p>))}</div>
          <div className="w-full pt-8 mt-10 border-t border-slate-100 flex justify-around cursor-pointer" onClick={() => { if(window.confirm("Сброс?")) { localStorage.clear(); window.location.reload(); } }}><div className="text-center"><p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Версия</p><p className="text-base font-semibold text-slate-700">7.0.0 (FINAL STABLE)</p></div></div>
          <p className="text-[12px] text-slate-400 font-medium italic mt-12">"Познай самого себя, и ты познаешь мир."</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col font-sans bg-[#F8FAFC]">
      <main className="flex-1 relative overflow-hidden z-10">
        {renderBatteryModal()}
        {currentView === 'ONBOARDING' && <OnboardingScreen onComplete={(d) => { setUserProfile(p => ({...p, ...d, onboardingCompleted: true})); setCurrentView('ARCHETYPE_RESULT'); }} onBack={() => setCurrentView('HOME')} />}
        {currentView === 'ARCHETYPE_RESULT' && <ArchetypeResultScreen archetype={userProfile.archetype || 'Искатель'} onContinue={() => setCurrentView('TUTORIAL')} />}
        {currentView === 'ARCHETYPE_RESULT_VIEW' && <ArchetypeResultScreen archetype={userProfile.archetype || 'Искатель'} isReadOnly={true} onBack={() => setCurrentView('PROFILE')} onContinue={() => {}} />}
        {currentView === 'TUTORIAL' && <TutorialScreen onFinish={() => setCurrentView('HOME')} />}
        {currentView === 'DAILY_GUIDE' && renderDailyGuide()}
        {currentView === 'HOME' && renderHome()}
        {currentView === 'CHAT' && <ChatInterface mode={selectedMode!} onBack={() => setCurrentView('HOME')} onSessionComplete={handleSessionComplete as any} />}
        {currentView === 'READ_HISTORY' && selectedSession && <ChatInterface mode={selectedSession.mode} onBack={() => setCurrentView('HISTORY')} readOnly={true} initialMessages={selectedSession.messages} />}
        {currentView === 'HISTORY' && renderHistory()}
        {currentView === 'PROFILE' && renderProfile()}
        {currentView === 'SETTINGS' && renderSettings()}
        {currentView === 'ABOUT' && renderAbout()}
        {currentView === 'RANKS_INFO' && renderRanksInfo()}
        {currentView === 'ADMIN' && <AdminInterface config={siteConfig} onSave={(newCfg) => setSiteConfig(newCfg)} onBack={() => setCurrentView('ABOUT')} />}
      </main>
      {['HOME', 'HISTORY', 'PROFILE', 'SETTINGS'].includes(currentView) && <BottomNav currentView={currentView as any} onChangeView={(v) => setCurrentView(v)} />}
    </div>
  );
};

export default App;
