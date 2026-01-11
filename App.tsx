import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToGemini } from './services/geminiService';
// Используем безопасный набор иконок
import { 
  Heart, BookOpen, ChevronRight, User as UserIcon, Zap, Star, 
  ArrowLeft, Medal, Loader2, Cloud, Moon, Sun, Coffee, Brain, 
  Briefcase, Feather, Compass, Anchor, Target, Battery, X, 
  Shield, Map, Smile, Lightbulb, CheckCircle, Leaf, Sprout, 
  TreeDeciduous, Send, MoreHorizontal, Edit3, Trash2 
} from 'lucide-react';

// --- 1. ВСТРОЕННЫЕ ТИПЫ (Чтобы не зависеть от types.ts) ---
type ViewState = 'ONBOARDING' | 'HOME' | 'CHAT' | 'HISTORY' | 'PROFILE' | 'SETTINGS' | 'ABOUT' | 'READ_HISTORY' | 'RANKS_INFO' | 'DAILY_GUIDE' | 'ARCHETYPE_RESULT' | 'TUTORIAL';
type JournalMode = 'DECISION' | 'EMOTIONS' | 'REFLECTION';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface ChatSession {
  id: string;
  mode: JournalMode;
  date: number;
  duration: number;
  preview: string;
  messages: Message[];
}

interface UserProfile {
  name: string;
  avatarUrl: string | null;
  onboardingCompleted?: boolean;
  archetype?: string; 
  focus?: string;
  struggle?: string;
  chronotype?: string;
  currentMood?: 'high' | 'flow' | 'ok' | 'low';
}

interface DailyInsightData {
  date: string;
  generatedForMood?: string;
  mindset: string;
  action: string;
  health: string;
  insight: string;
}

// --- 2. КОНФИГУРАЦИЯ И КЛЮЧИ ---
const STORAGE_KEYS = {
  PROFILE: 'mm_profile_monolith_v1', 
  HISTORY: 'mm_history_monolith_v1',
  SESSIONS: 'mm_sessions_monolith_v1',
  TIME: 'mm_time_monolith_v1',
  JOURNAL: 'mm_journal_monolith_v1',
  DAILY_INSIGHT: 'mm_insight_monolith_v1'
};

// --- 3. ВЕКТОРНЫЕ ДЕРЕВЬЯ (SVG) ---
const TreeIllustration: React.FC<{ stage: number, className?: string }> = ({ stage, className }) => {
  const c = className || "w-full h-full";
  if (stage <= 1) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#FEF3C7" /><path d="M50 75C50 75 40 75 40 75" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="70" r="6" fill="#B45309" /></svg>;
  if (stage === 2) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#ECFDF5" /><path d="M50 80V60" stroke="#059669" strokeWidth="3" strokeLinecap="round"/><path d="M50 60C50 60 35 55 35 45C35 55 50 60 50 60Z" fill="#10B981" /><path d="M50 60C50 60 65 55 65 45C65 55 50 60 50 60Z" fill="#34D399" /></svg>;
  if (stage === 3) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#D1FAE5" /><path d="M50 85V50" stroke="#059669" strokeWidth="3" strokeLinecap="round"/><path d="M50 65L65 55" stroke="#059669" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="45" r="10" fill="#10B981" /><circle cx="65" cy="55" r="6" fill="#34D399" /></svg>;
  if (stage === 4) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#A7F3D0" /><path d="M50 85V45" stroke="#92400E" strokeWidth="4" strokeLinecap="round"/><path d="M50 65L30 55" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="40" r="15" fill="#10B981" /><circle cx="30" cy="55" r="8" fill="#34D399" /><circle cx="65" cy="50" r="8" fill="#34D399" /></svg>;
  if (stage === 5) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#6EE7B7" /><path d="M50 90V40" stroke="#92400E" strokeWidth="5" strokeLinecap="round"/><path d="M50 60L25 50" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/><path d="M50 50L75 40" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="35" r="20" fill="#059669" /><circle cx="25" cy="50" r="12" fill="#10B981" /><circle cx="75" cy="40" r="12" fill="#10B981" /></svg>;
  if (stage === 6) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#34D399" /><path d="M50 90L50 35" stroke="#78350F" strokeWidth="6" strokeLinecap="round"/><path d="M50 70L20 60" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/><path d="M50 60L80 50" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="30" r="25" fill="#047857" /><circle cx="20" cy="60" r="15" fill="#059669" /><circle cx="80" cy="50" r="15" fill="#059669" /></svg>;
  if (stage === 7) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#10B981" /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="7" strokeLinecap="round"/><path d="M50 70L20 55" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/><path d="M50 60L85 45" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/><circle cx="50" cy="35" r="30" fill="#064E3B" /><circle cx="20" cy="55" r="18" fill="#065F46" /><circle cx="85" cy="45" r="18" fill="#065F46" /><circle cx="35" cy="80" r="5" fill="#064E3B" opacity="0.5"/></svg>;
  // 8: Древо Мудрости
  return (<svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="48" fill="#ECFDF5" /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="10" strokeLinecap="round"/><circle cx="50" cy="40" r="40" fill="#064E3B" /><circle cx="20" cy="65" r="25" fill="#065F46" /><circle cx="80" cy="65" r="25" fill="#065F46" /><circle cx="50" cy="25" r="15" fill="#10B981" /></svg>);
};

const TREE_STAGES = [
  { threshold: 5000, title: "Древо Мудрости", stageIndex: 8, desc: "Вы достигли вершины." },
  { threshold: 1200, title: "Цветущее Древо", stageIndex: 7, desc: "Потенциал раскрыт." },
  { threshold: 600, title: "Ветвистое Древо", stageIndex: 6, desc: "Знания расширяются." },
  { threshold: 300, title: "Крепкое Древо", stageIndex: 5, desc: "Уверенность." },
  { threshold: 150, title: "Молодое Дерево", stageIndex: 4, desc: "Укрепление." },
  { threshold: 75, title: "Саженец", stageIndex: 3, desc: "Корни." },
  { threshold: 30, title: "Побег", stageIndex: 2, desc: "Шаг к свету." },
  { threshold: 10, title: "Росток", stageIndex: 1, desc: "Первые всходы." },
  { threshold: 0, title: "Семя", stageIndex: 0, desc: "Начало." },
];

const ARCHETYPE_INFO: any = {
  "Творец": { desc: "Вы видите мир как полотно.", strength: "Воображение", shadow: "Перфекционизм", advice: "Создавай!", icon: Feather, color: "text-purple-600", bg: "bg-purple-50" },
  "Правитель": { desc: "Вы создаете порядок.", strength: "Лидерство", shadow: "Контроль", advice: "Делегируй.", icon: Briefcase, color: "text-indigo-600", bg: "bg-indigo-50" },
  "Мудрец": { desc: "Вы ищете истину.", strength: "Интеллект", shadow: "Бездействие", advice: "Действуй.", icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
  "Хранитель": { desc: "Вы — опора.", strength: "Эмпатия", shadow: "Жертвенность", advice: "Береги себя.", icon: Shield, color: "text-emerald-600", bg: "bg-emerald-50" },
  "Искатель": { desc: "Вы — путник.", strength: "Свобода", shadow: "Непостоянство", advice: "Найди дом.", icon: Compass, color: "text-amber-600", bg: "bg-amber-50" }
};

// --- 4. ВНУТРЕННИЕ КОМПОНЕНТЫ (ВМЕСТО ВНЕШНИХ ФАЙЛОВ) ---

// Чат
const InternalChat: React.FC<{ mode: JournalMode, onBack: () => void, onComplete: (msg: any, dur: number) => void }> = ({ mode, onBack, onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([{ id: '1', role: 'assistant', content: 'Привет! О чем хочешь поговорить?', timestamp: Date.now() }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const startTime = useRef(Date.now());

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [userMsg, ...prev]); // Обратный порядок для чата снизу
    setInput('');
    setLoading(true);
    try {
      const response = await sendMessageToGemini(input);
      setMessages(prev => [{ id: (Date.now()+1).toString(), role: 'assistant', content: response, timestamp: Date.now() }, ...prev]);
    } catch {
      setMessages(prev => [{ id: (Date.now()+1).toString(), role: 'assistant', content: "Ошибка связи.", timestamp: Date.now() }, ...prev]);
    } finally { setLoading(false); }
  };

  const finish = () => {
    onComplete(messages, Math.round((Date.now() - startTime.current) / 1000));
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-white z-50 fixed inset-0">
      <div className="p-4 border-b flex justify-between items-center bg-white">
        <button onClick={onBack}><ArrowLeft size={24} className="text-slate-500" /></button>
        <span className="font-bold text-slate-800">{mode === 'DECISION' ? 'Решение' : mode === 'EMOTIONS' ? 'Эмоции' : 'Дневник'}</span>
        <button onClick={finish} className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">Завершить</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse space-y-reverse space-y-4 bg-slate-50">
        {loading && <div className="self-start bg-white p-3 rounded-2xl rounded-tl-none shadow-sm"><Loader2 className="animate-spin text-indigo-500" size={16}/></div>}
        {messages.map(m => (
          <div key={m.id} className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'self-end bg-indigo-600 text-white rounded-tr-none' : 'self-start bg-white text-slate-800 shadow-sm rounded-tl-none'}`}>
            {m.content}
          </div>
        ))}
      </div>
      <div className="p-4 border-t bg-white flex space-x-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Напишите..." className="flex-1 bg-slate-100 rounded-full px-4 py-3 outline-none text-sm" onKeyDown={e => e.key === 'Enter' && send()} />
        <button onClick={send} disabled={loading} className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Send size={20} /></button>
      </div>
    </div>
  );
};

// Нижнее меню
const InternalBottomNav: React.FC<{ currentView: string, onChangeView: (v: string) => void }> = ({ currentView, onChangeView }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 px-6 py-4 flex justify-between items-center z-40 safe-area-pb">
    {[
      { id: 'HOME', icon: Zap, label: 'Путь' },
      { id: 'HISTORY', icon: BookOpen, label: 'История' },
      { id: 'PROFILE', icon: UserIcon, label: 'Профиль' }
    ].map(item => (
      <button key={item.id} onClick={() => onChangeView(item.id)} className={`flex flex-col items-center space-y-1 transition-all ${currentView === item.id ? 'text-indigo-600 scale-110' : 'text-slate-400 hover:text-slate-600'}`}>
        <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} />
        {currentView === item.id && <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>}
      </button>
    ))}
  </div>
);

// --- 5. ЭКРАНЫ ПРИЛОЖЕНИЯ ---

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
    { title: "Древо Сознания", desc: "Ваш прогресс визуализируется в виде дерева. Чем больше практик, тем выше оно растет.", icon: Sprout, color: "text-amber-500", bg: "bg-amber-50" }
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
    { title: "Новизна?", type: 'archetype', options: [{ label: "Восторг", type: 'EXPLORER', icon: Flame }, { label: "Любопытство", type: 'SAGE', icon: Search }, { label: "Польза", type: 'RULER', icon: Briefcase }, { label: "Осторожность", type: 'CAREGIVER', icon: Lock }] },
    { title: "Подарок?", type: 'archetype', options: [{ label: "Hand-made", type: 'CAREGIVER', icon: Heart }, { label: "Билет", type: 'EXPLORER', icon: Map }, { label: "Книга", type: 'SAGE', icon: BookOpen }, { label: "Бренд", type: 'RULER', icon: Star }] },
    { title: "Идеальное утро?", type: 'archetype', options: [{ label: "Спорт", type: 'RULER', icon: Activity }, { label: "Мечты", type: 'CREATOR', icon: Coffee }, { label: "Сразу в путь", type: 'EXPLORER', icon: Cloud }, { label: "Семья", type: 'CAREGIVER', icon: Smile }] },
    { title: "Наследие?", type: 'archetype', options: [{ label: "Искусство", type: 'CREATOR', icon: Feather }, { label: "Бизнес", type: 'RULER', icon: Briefcase }, { label: "Знания", type: 'SAGE', icon: BookOpen }, { label: "Память", type: 'CAREGIVER', icon: Heart }] },
    { title: "Главный фокус?", key: 'focus', options: [{ label: "Финансы", value: "Рост доходов", icon: Zap }, { label: "Спокойствие", value: "Снижение стресса", icon: Cloud }, { label: "Дисциплина", value: "Режим", icon: Brain }, { label: "Отношения", value: "Семья", icon: Heart }] },
    { title: "Что мешает?", key: 'struggle', options: [{ label: "Лень", value: "Прокрастинация", icon: Clock }, { label: "Страх", value: "Неуверенность", icon: Lock }, { label: "Усталость", value: "Выгорание", icon: Battery }, { label: "Хаос", value: "Расфокус", icon: Activity }] },
    { title: "Биоритмы?", key: 'chronotype', options: [{ label: "Жаворонок", value: "Утро", icon: Sun }, { label: "Сова", value: "Вечер", icon: Moon }, { label: "По-разному", value: "Плавающий", icon: Activity }] }
  ];

  const currentStepData = steps[step];
  if (!currentStepData) return null;

  const handleSelect = (option: any) => {
    if (currentStepData.type === 'archetype') setScores(prev => ({ ...prev, [option.type]: (prev[option.type as keyof typeof scores] || 0) + 1 }));
    if (currentStepData.key) setFinalData(prev => ({ ...prev, [currentStepData.key!]: option.value }));

    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
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
      <div className="flex justify-start mb-6"><button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600"><ArrowLeft size={24} /></button></div>
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="mb-10">
          <div className="flex space-x-1 mb-8 justify-center flex-wrap gap-y-2">{steps.map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all duration-500 mx-0.5 ${i <= step ? 'w-4 bg-indigo-500' : 'w-2 bg-slate-100'}`} />))}</div>
          <h2 className="text-2xl font-black text-slate-800 text-center leading-tight mb-2">{currentStepData.title}</h2>
        </div>
        <div className="space-y-3" key={step}>
          {currentStepData.options.map((option: any, idx: number) => {
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

// --- ОСНОВНОЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ ---
const App: React.FC = () => {
  // АВТО-СБРОС ПРИ ПЕРВОМ ЗАПУСКЕ (Чтобы всё заработало)
  useEffect(() => {
    const hasReset = localStorage.getItem('mm_monolith_reset_v2');
    if (!hasReset) {
      localStorage.clear();
      localStorage.setItem('mm_monolith_reset_v2', 'true');
      window.location.reload();
    }
  }, []);

  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG) || 'null') || DEFAULT_CONFIG; } catch { return DEFAULT_CONFIG; }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? { onboardingCompleted: false, currentMood: 'ok', ...JSON.parse(saved) } : { name: '', avatarUrl: null, onboardingCompleted: false, currentMood: 'ok' };
    } catch { return { name: '', avatarUrl: null, onboardingCompleted: false, currentMood: 'ok' }; }
  });

  const [currentView, setCurrentView] = useState<string>(userProfile.onboardingCompleted ? 'HOME' : 'ONBOARDING');
  const [selectedMode, setSelectedMode] = useState<JournalMode | null>(null);
  const [dailyInsight, setDailyInsight] = useState<DailyInsightData | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_INSIGHT) || 'null'); } catch { return null; }
  });
  
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [isBatteryModalOpen, setIsBatteryModalOpen] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]'); } catch { return []; }});
  const [totalSessions, setTotalSessions] = useState<number>(() => { try { return parseInt(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '0'); } catch { return 0; } });
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(() => { try { return parseInt(localStorage.getItem(STORAGE_KEYS.TIME) || '0'); } catch { return 0; } });

  // SAVE EFFECTS
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SESSIONS, totalSessions.toString()); }, [totalSessions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TIME, totalTimeSeconds.toString()); }, [totalTimeSeconds]);

  const totalMinutes = Math.round(totalTimeSeconds / 60);
  const totalSteps = totalSessions + totalMinutes; 
  const currentTree = TREE_STAGES.find(r => totalSteps >= r.threshold) || TREE_STAGES[8]; // Безопасный выбор дерева

  const startMode = (m: JournalMode) => { setSelectedMode(m); setCurrentView('CHAT'); };
  
  const handleSessionComplete = (messages: Message[], duration: number) => {
    const newSession: ChatSession = { id: Date.now().toString(), mode: selectedMode!, date: Date.now(), duration, preview: messages.find(m=>m.role==='user')?.content.substring(0,30) || '...', messages };
    setHistory(p => [newSession, ...p]); setTotalSessions(p => p+1); setTotalTimeSeconds(p => p+duration);
  };

  // GENERATION
  useEffect(() => {
    const gen = async () => {
      if (!userProfile.onboardingCompleted || !userProfile.name) return;
      const today = new Date().toDateString();
      if (dailyInsight?.date === today && dailyInsight?.generatedForMood === userProfile.currentMood) return;

      setIsInsightLoading(true);
      try {
        const userName = userProfile.name || "Друг";
        const prompt = `Ты — ментор. Клиент: ${userName}. Архетип: "${userProfile.archetype}". Цель: "${userProfile.focus}". Настроение: ${userProfile.currentMood}. 4 совета (Мышление, Действие, Тело, Инсайт) через |||.`;
        const res = await sendMessageToGemini(prompt);
        const p = res.split('|||');
        const ni = { date: today, generatedForMood: userProfile.currentMood, mindset: p[0]||"Фокус", action: p[1]||"Действие", health: p[2]||"Дыши", insight: p[3]||"Мудрость" };
        setDailyInsight(ni); localStorage.setItem(STORAGE_KEYS.DAILY_INSIGHT, JSON.stringify(ni));
      } catch(e) {} finally { setIsInsightLoading(false); }
    };
    gen();
  }, [userProfile.name, userProfile.currentMood, userProfile.onboardingCompleted]);

  // RENDERERS
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
              <button key={item.val} onClick={() => { setIsBatteryModalOpen(false); setUserProfile(prev => ({ ...prev, currentMood: item.val as any })); }} className="p-4 rounded-2xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-100 font-bold text-slate-700 transition-all active:scale-95 text-sm">{item.label}</button>
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
         <div className="w-10 h-10 flex items-center justify-center"><Logo /></div>
      </header>

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
         <button onClick={() => setCurrentView('RANKS_INFO')} className="w-full bg-gradient-to-br from-white to-slate-50 border border-slate-100 p-5 rounded-[24px] shadow-sm active:scale-95 transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full blur-2xl opacity-60"></div>
            <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center space-x-4">
                   <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center overflow-hidden"><TreeIllustration stage={currentTree.stageIndex} className="w-10 h-10" /></div>
                   <div className="text-left"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Древо сознания</p><h4 className="text-base font-bold text-slate-800">{currentTree.title}</h4></div>
                </div>
                <ChevronRight size={20} className="text-slate-300" />
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100 relative z-10">
               <div className="text-center border-r border-slate-100"><p className="text-lg font-bold text-slate-800">{totalSessions}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Сессий</p></div>
               <div className="text-center"><p className="text-lg font-bold text-slate-800">{totalMinutes}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Минут</p></div>
            </div>
         </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col font-sans relative bg-[#F8FAFC]">
      <main className="flex-1 relative overflow-hidden z-10">
        {renderBatteryModal()}
        {currentView === 'ONBOARDING' && <OnboardingScreen onComplete={(data) => { setUserProfile(prev => ({ ...prev, ...data, onboardingCompleted: true })); localStorage.removeItem(STORAGE_KEYS.DAILY_INSIGHT); setDailyInsight(null); setCurrentView('ARCHETYPE_RESULT'); }} onBack={() => setCurrentView('HOME')} />}
        {currentView === 'ARCHETYPE_RESULT' && <ArchetypeResultScreen archetype={userProfile.archetype || 'Искатель'} onContinue={() => setCurrentView('TUTORIAL')} />}
        {currentView === 'ARCHETYPE_RESULT_VIEW' && <ArchetypeResultScreen archetype={userProfile.archetype || 'Искатель'} isReadOnly={true} onBack={() => setCurrentView('PROFILE')} onContinue={() => {}} />}
        {currentView === 'TUTORIAL' && <TutorialScreen onFinish={() => setCurrentView('HOME')} />}
        {currentView === 'DAILY_GUIDE' && renderDailyGuide()}
        {currentView === 'HOME' && renderHome()}
        {/* Используем встроенный чат, чтобы исключить ошибки импорта */}
        {currentView === 'CHAT' && <InternalChat mode={selectedMode!} onBack={() => setCurrentView('HOME')} onComplete={handleSessionComplete as any} />}
        
        {/* Простые экраны истории/профиля/настроек */}
        {currentView === 'HISTORY' && <div className="p-6 pt-12"><h1 className="text-2xl font-bold mb-4">История</h1><div className="space-y-3">{history.map(s => <button key={s.id} onClick={() => { /* View logic */ }} className="w-full bg-white p-4 rounded-2xl text-left shadow-sm"><p className="font-bold text-slate-800">{new Date(s.date).toLocaleDateString()}</p><p className="text-xs text-slate-500">{s.preview}</p></button>)}</div></div>}
        {currentView === 'PROFILE' && <div className="p-6 pt-12"><div className="bg-white p-8 rounded-[32px] text-center shadow-sm"><div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 overflow-hidden">{userProfile.avatarUrl && <img src={userProfile.avatarUrl} className="w-full h-full object-cover" />}</div><h2 className="text-xl font-bold">{userProfile.name}</h2><p className="text-indigo-500 font-medium mb-4">{userProfile.archetype}</p><button onClick={() => setCurrentView('ARCHETYPE_RESULT_VIEW')} className="text-xs font-bold text-slate-400 bg-slate-50 px-4 py-2 rounded-full">Инфографика архетипа</button></div></div>}
        {currentView === 'SETTINGS' && <div className="p-6 pt-12"><h1 className="text-2xl font-bold mb-6">Настройки</h1><div className="bg-white p-6 rounded-[32px] shadow-sm"><button onClick={() => { if(window.confirm('Сбросить данные?')) { localStorage.clear(); window.location.reload(); } }} className="w-full py-4 bg-red-50 text-red-500 font-bold rounded-2xl">Сбросить всё</button></div></div>}
      </main>
      
      {['HOME', 'HISTORY', 'PROFILE', 'SETTINGS'].includes(currentView) && <InternalBottomNav currentView={currentView} onChangeView={setCurrentView} />}
    </div>
  );
};

export default App;
