
import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2, Sparkles, Plus, Zap, X, ChevronRight, Target, LayoutGrid, Wand2, MessageSquare, Lightbulb, Compass, Rocket, CheckCircle2, ArrowRightLeft, MessageCircle, MinusCircle, PlusCircle, Check } from 'lucide-react';
import { JournalMode, Message, DecisionData, Archetype, DecisionArgument } from '../types';
import { InsightCard } from './InsightCard';
import { sendMessageToGemini, analyzeDecision, identifyDecisionIntent } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { TreeIcon, RANKS } from '../App';

interface ChatInterfaceProps {
  mode: JournalMode;
  onBack: () => void;
  onSessionComplete?: (messages: Message[], durationSeconds: number, previewOverride?: string) => void;
  readOnly?: boolean;
  initialMessages?: Message[];
  rpgMode?: boolean;
  archetype?: Archetype | null;
}

const QUICK_STARTERS = [
  "Уволиться или остаться?",
  "Купить это сейчас или подождать?",
  "Сказать правду или промолчать?",
  "Пойти на риск или стабильность?",
  "Взять паузу или продолжать?"
];

// Иллюстрация весов для режима решений
const DecisionIllustration = ({ rpgMode, size = 32, opacity = 1 }: { rpgMode: boolean, size?: number, opacity?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="overflow-visible">
    <circle cx="50" cy="50" r="48" fill={rpgMode ? "#B91C1C" : "#F59E0B"} fillOpacity="0.05" />
    <path 
      d="M50 10L20 55H45L30 90L80 40H55L70 10H50Z" 
      fill={rpgMode ? "#B91C1C" : "#F59E0B"} 
      fillOpacity={opacity}
    />
  </svg>
);

// Мини-версия анимации кристалла для загрузки
const MiniPrism = ({ rpgMode }: { rpgMode: boolean }) => (
  <div className="relative w-24 h-24 flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      className={`absolute inset-0 rounded-full border-2 border-dashed opacity-20 ${rpgMode ? 'border-red-800' : 'border-indigo-400'}`}
    />
    <motion.div
      animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={`w-12 h-12 rounded-2xl rotate-45 flex items-center justify-center ${rpgMode ? 'bg-red-800' : 'bg-indigo-600'}`}
    >
      <Sparkles className="text-white -rotate-45" size={20} />
    </motion.div>
  </div>
);

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  mode, 
  onBack, 
  onSessionComplete, 
  readOnly = false,
  initialMessages = [],
  rpgMode = false,
  archetype = null
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const isInitialized = useRef(false);

  // Decision States
  const [decisionStep, setDecisionStep] = useState<number>(1); 
  const [activeSide, setActiveSide] = useState<'A' | 'B'>('A');
  const [inlineInput, setInlineInput] = useState('');
  const [decisionData, setDecisionData] = useState<DecisionData>({ 
    topic: '', argsA: [], argsB: [], decisionType: 'SINGLE', optionA: 'Вариант А', optionB: 'Вариант Б' 
  });

  useEffect(() => {
    if (isInitialized.current) return;
    if (readOnly && initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
      const cardMsg = initialMessages.find(m => m.type === 'decision-card');
      if (cardMsg?.decisionData) {
        setDecisionData(cardMsg.decisionData);
        setDecisionStep(4);
      }
      isInitialized.current = true;
      return;
    }
    if (mode === 'DECISION') {
      setDecisionStep(1);
    } else {
      setMessages([{
        id: 'init', role: 'assistant',
        content: mode === 'EMOTIONS' 
          ? (rpgMode ? "Какая буря бушует в вашей душе?" : "Какие эмоции вы испытываете сейчас?")
          : (rpgMode ? "Расскажите о своих подвигах за день." : "Как прошел ваш день?"),
        timestamp: Date.now()
      }]);
    }
    isInitialized.current = true;
  }, [mode, readOnly, initialMessages, rpgMode]);

  const handleBack = () => {
    const hasUserInteraction = mode === 'DECISION' 
      ? (decisionStep >= 2) 
      : messages.some(m => m.role === 'user'); 

    if (!readOnly && onSessionComplete && hasUserInteraction) {
      onSessionComplete(
        messages, 
        (Date.now() - startTimeRef.current) / 1000,
        mode === 'DECISION' ? decisionData.topic : undefined
      );
    }
    onBack();
  };

  const handleDecisionStart = async () => {
    if (!decisionData.topic.trim()) return;
    
    // Ритуал прозрения
    setIsIdentifying(true);
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');

    try {
      // ИИ определяет интент и названия колонок
      const intent = await identifyDecisionIntent(decisionData.topic);
      setDecisionData(prev => ({
        ...prev,
        decisionType: intent.type,
        optionA: intent.optionA,
        optionB: intent.optionB
      }));
      
      // Искусственная пауза для "магии" и плавности
      await new Promise(r => setTimeout(r, 1000));
      
      setDecisionStep(2);
    } catch (e) {
      setDecisionStep(2);
    } finally {
      setIsIdentifying(false);
    }
  };

  const addArgument = () => {
    if (!inlineInput.trim()) return;
    const newArg: DecisionArgument = { text: inlineInput.trim(), type: 'pro' };
    
    if (activeSide === 'A') {
      setDecisionData(prev => ({ ...prev, argsA: [...prev.argsA, newArg] }));
    } else {
      setDecisionData(prev => ({ ...prev, argsB: [...prev.argsB, newArg] }));
    }
    
    setInlineInput('');
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  };

  const removeArgument = (side: 'A' | 'B', index: number) => {
    if (side === 'A') {
      setDecisionData(prev => ({ ...prev, argsA: prev.argsA.filter((_, i) => i !== index) }));
    } else {
      setDecisionData(prev => ({ ...prev, argsB: prev.argsB.filter((_, i) => i !== index) }));
    }
  };

  const performAnalysis = async () => {
    setIsLoading(true);
    setDecisionStep(3);
    try {
      const updatedData = await analyzeDecision(decisionData);
      setDecisionData(updatedData);
      const cardMsg: Message = {
        id: 'decision-res-' + Date.now(),
        role: 'assistant',
        content: `Анализ решения: ${updatedData.topic}`,
        type: 'decision-card',
        decisionData: updatedData,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, cardMsg]);
      setDecisionStep(4);
    } catch (e) {
      setDecisionStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const resp = await sendMessageToGemini(messages, userMsg.content, mode as 'EMOTIONS' | 'REFLECTION');
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: resp, timestamp: Date.now() }]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Ошибка связи.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderArgumentCard = (side: 'A' | 'B') => {
    const isActive = activeSide === side;
    const items = side === 'A' ? decisionData.argsA : decisionData.argsB;
    const title = side === 'A' ? decisionData.optionA : decisionData.optionB;
    
    let cardClasses = `flex flex-col rounded-[32px] p-5 border-2 border-b-[6px] transition-all duration-300 cursor-pointer h-full relative overflow-hidden `;
    
    if (rpgMode) {
      cardClasses += isActive 
        ? "bg-white border-red-800 shadow-[0_4px_0_#7f1d1d]" 
        : "bg-white/40 border-red-800/10 opacity-60 grayscale scale-[0.96]";
    } else {
      cardClasses += isActive
        ? `bg-white border-indigo-500 shadow-[0_10px_25px_-5px_rgba(99,102,241,0.2)] scale-[1.02] z-10`
        : `bg-slate-50 border-slate-200 opacity-50 scale-[0.96] z-0`;
    }

    return (
      <motion.div 
        layout
        onClick={() => {
          setActiveSide(side);
          if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('soft');
        }}
        className={cardClasses}
      >
        <div className="flex justify-between items-start mb-4">
           <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
             {items.length}
           </div>
        </div>

        <h4 className={`text-xs font-black uppercase tracking-widest mb-4 truncate ${isActive ? (rpgMode ? 'text-red-950' : 'text-slate-800') : 'text-slate-400'}`}>
          {title}
        </h4>

        <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar pb-20">
          <AnimatePresence>
            {items.map((arg, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.8 }} 
                animate={{ opacity: 1, scale: 1 }}
                className={`group relative p-3 rounded-2xl text-[11px] font-bold border break-words overflow-hidden flex items-start space-x-2 ${
                  rpgMode ? 'bg-white/40 border-red-800/10 text-red-950' : 'bg-white border-slate-100 text-slate-700'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  <Sparkles size={10} className="text-indigo-400" />
                </div>
                <span className="flex-1">{arg.text}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeArgument(side, i); }}
                  className="absolute -right-1 -top-1 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} strokeWidth={4} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {items.length === 0 && isActive && (
            <div className="h-full flex flex-col items-center justify-center py-10 opacity-20 italic text-[10px] text-center">
               <Plus size={24} className="mb-2" />
               <p>Запишите мысли ниже</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderProgress = (step: number) => {
    return (
      <div className="flex space-x-1.5 px-6 pt-4 mb-4">
        {[1, 2, 4].map((s, idx) => (
          <div 
            key={s} 
            className={`h-1.5 rounded-full flex-1 transition-all duration-700 ${
              step >= s 
                ? (rpgMode ? 'bg-red-800' : 'bg-indigo-600') 
                : (rpgMode ? 'bg-red-800/10' : 'bg-slate-200')
            }`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full relative z-10 ${rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-[#F8F9FB]'}`}>
      {/* Header logic */}
      {mode !== 'DECISION' && (
        <div className={`px-6 py-4 border-b flex items-center justify-between sticky top-0 z-40 transition-all ${rpgMode ? 'bg-white/40 border-red-800/30' : 'bg-white/80 backdrop-blur-xl border-slate-100'}`}>
          <button onClick={handleBack} className={`p-2 -ml-2 rounded-full ${rpgMode ? 'text-red-800' : 'text-slate-500'}`}><ArrowLeft size={20} /></button>
          <h2 className={`text-base font-black uppercase tracking-tighter ${rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>
            {mode === 'EMOTIONS' ? 'Состояние' : 'Дневник'}
          </h2>
          <div className="w-8"></div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {mode === 'DECISION' ? (
          <div className="h-full flex flex-col">
            {decisionStep === 1 && !isIdentifying && (
              <div className="flex-1 flex flex-col animate-fade-in relative">
                <div className="flex items-center px-4 pt-4">
                  <button onClick={handleBack} className={`p-3 rounded-full transition-colors ${rpgMode ? 'text-red-800' : 'text-slate-400 hover:text-slate-800'}`}>
                    <ArrowLeft size={24} />
                  </button>
                  <div className="flex-1">{renderProgress(1)}</div>
                  <div className="w-10"></div>
                </div>

                <div className="px-6 py-6 flex flex-col items-center text-center">
                   <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="mb-4">
                     <DecisionIllustration rpgMode={rpgMode} size={80} />
                   </motion.div>
                   
                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`px-6 py-3 rounded-[24px] rounded-tl-none border shadow-sm max-w-[280px] relative ${rpgMode ? 'bg-white border-red-800 text-red-950 font-serif-fantasy italic' : 'bg-white bento-border text-slate-600 shadow-md ring-4 ring-indigo-50/30'}`}>
                     <p className="text-[14px] leading-tight font-black uppercase tracking-tighter">
                       Какое решение требует ясности прямо сейчас?
                     </p>
                   </motion.div>
                </div>

                <div className="px-6 flex-1 flex flex-col">
                   <div className="flex-1 flex flex-col items-center justify-center min-h-[160px] relative group">
                      <div className={`absolute inset-0 transition-all duration-500 rounded-[48px] ${decisionData.topic.trim() ? (rpgMode ? 'bg-red-800/5 ring-4 ring-red-800/10' : 'bg-indigo-50/30 ring-4 ring-indigo-50') : 'bg-transparent'}`} />
                      <textarea 
                        autoFocus
                        value={decisionData.topic}
                        onChange={(e) => setDecisionData(prev => ({ ...prev, topic: e.target.value }))}
                        placeholder="Опишите вашу дилемму..."
                        className={`w-full bg-transparent text-center text-2xl font-black tracking-tight focus:outline-none resize-none px-4 relative z-10 transition-all duration-300 ${rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'} ${decisionData.topic.length > 50 ? 'text-xl' : 'text-3xl'}`}
                      />
                   </div>
                   <div className="mt-8 mb-6 overflow-x-auto no-scrollbar flex space-x-2 py-2">
                     {QUICK_STARTERS.map((s, i) => (
                       <button key={i} onClick={() => { setDecisionData(prev => ({ ...prev, topic: s })); if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); }} className={`shrink-0 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${rpgMode ? 'bg-white border-red-800 text-red-800 hover:bg-red-50' : 'bg-white bento-border text-slate-400 hover:text-slate-800 hover:border-slate-300'}`}>{s}</button>
                     ))}
                   </div>
                </div>

                <div className="p-6 pb-10">
                   <button onClick={handleDecisionStart} disabled={!decisionData.topic.trim() || isIdentifying} className={`w-full py-7 rounded-[40px] font-black text-[13px] uppercase tracking-[0.3em] flex items-center justify-center space-x-5 transition-all shadow-2xl active:scale-95 border-b-[8px] disabled:opacity-20 disabled:grayscale ${rpgMode ? 'rpg-button border-red-950' : 'bg-slate-900 text-white border-slate-950'}`}>
                     <span>Взвесить факторы</span><ChevronRight size={18} strokeWidth={4} />
                   </button>
                </div>
              </div>
            )}

            {isIdentifying && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 animate-fade-in">
                 <MiniPrism rpgMode={rpgMode} />
                 <div className="text-center space-y-2">
                   <p className={`text-[11px] font-black uppercase tracking-[0.4em] ${rpgMode ? 'text-red-800' : 'text-indigo-600'}`}>Ритуал прозрения</p>
                   <p className={`text-[14px] font-bold italic ${rpgMode ? 'text-red-950' : 'text-slate-500'}`}>Мастер вникает в суть дилеммы...</p>
                 </div>
              </div>
            )}

            {decisionStep === 2 && !isIdentifying && (
              <div className="p-6 flex-1 flex flex-col space-y-4 animate-fade-in h-full overflow-hidden">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <button onClick={() => setDecisionStep(1)} className={`p-2 -ml-2 rounded-full transition-colors ${rpgMode ? 'text-red-800 hover:bg-red-50' : 'text-slate-400 hover:bg-white shadow-sm hover:text-slate-800'}`}>
                        <ArrowLeft size={20} />
                      </button>
                      <div className="flex-1 pr-6">{renderProgress(2)}</div>
                    </div>
                 </div>

                 <div className="mb-2">
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`px-6 py-3 rounded-[24px] border-2 border-b-4 text-center transition-all ${rpgMode ? 'bg-red-50 border-red-800' : 'bg-indigo-600 border-indigo-900 text-white shadow-lg'}`}
                    >
                      <p className={`text-[11px] font-black uppercase tracking-widest leading-tight`}>
                        <Sparkles size={12} className="inline mr-2 -mt-0.5" />
                        Записывай любые доводы: плюсы и минусы. Мастер сам взвесит их ценность.
                      </p>
                    </motion.div>
                 </div>

                 <div className="flex-1 flex flex-col min-h-0">
                   <div className="flex-1 flex space-x-3 items-stretch min-h-0 py-2 relative">
                      <div className="flex-1 min-w-0">{renderArgumentCard('A')}</div>
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-4 transition-all duration-300 ${rpgMode ? 'bg-red-800 text-white border-red-950 shadow-lg' : 'bg-white text-slate-300 border-slate-100 shadow-xl'}`}>VS</div>
                      </div>
                      <div className="flex-1 min-w-0">{renderArgumentCard('B')}</div>
                   </div>
                 </div>

                 <div className="space-y-4 pb-6 mt-4">
                    <div className={`p-2 rounded-[28px] border-2 border-b-4 flex items-center space-x-2 transition-all ${rpgMode ? 'bg-white border-red-800' : 'bg-white border-indigo-500 ring-4 ring-indigo-50'}`}>
                      <div className={`p-3 rounded-full ${rpgMode ? 'text-red-800' : 'text-indigo-600'}`}>
                        <MessageCircle size={20} />
                      </div>
                      <input 
                        value={inlineInput}
                        onChange={(e) => setInlineInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addArgument()}
                        placeholder={`Аргумент для: ${activeSide === 'A' ? decisionData.optionA : decisionData.optionB}`}
                        className="flex-1 bg-transparent px-2 py-3 text-[14px] font-bold focus:outline-none"
                      />
                      <button 
                        onClick={addArgument}
                        disabled={!inlineInput.trim()}
                        className={`p-3 rounded-2xl transition-all active:scale-90 ${inlineInput.trim() ? (rpgMode ? 'bg-red-800 text-white' : 'bg-indigo-600 text-white') : 'bg-slate-100 text-slate-300'}`}
                      >
                        <ChevronRight size={20} strokeWidth={3} />
                      </button>
                    </div>

                    <button 
                      onClick={performAnalysis} 
                      disabled={decisionData.argsA.length === 0 && decisionData.argsB.length === 0}
                      className={`w-full py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center space-x-5 active:scale-95 transition-all border-b-8 disabled:opacity-20 disabled:grayscale ${rpgMode ? 'rpg-button border-[#7f1d1d]' : 'bg-slate-900 text-white border-slate-950'}`}
                    >
                      <Wand2 size={20} /><span>Синтезировать истину</span>
                    </button>
                 </div>
              </div>
            )}

            {decisionStep === 3 && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
                 <div className="relative">
                   <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
                   <Loader2 size={56} strokeWidth={1.5} className="text-indigo-600 animate-spin relative z-10" />
                 </div>
                 <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Вычисляем вероятности...</p>
              </div>
            )}

            {decisionStep === 4 && (
              <div className="animate-fade-in pb-32">
                <div className="px-6 pt-6 flex items-center space-x-2 mb-2">
                    <button onClick={handleBack} className={`p-2 -ml-2 rounded-full transition-colors ${rpgMode ? 'text-red-800 hover:bg-red-50' : 'text-slate-400 hover:bg-white shadow-sm hover:text-slate-800'}`}>
                      <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1 pr-12">{renderProgress(4)}</div>
                </div>
                <InsightCard data={decisionData} rpgMode={rpgMode} />
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 space-y-6 pb-24">
             {messages.map((msg) => (
               <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] px-5 py-4 rounded-[28px] text-[15px] leading-relaxed shadow-sm ${msg.role === 'user' ? (rpgMode ? 'rpg-button rounded-br-sm' : 'bg-slate-900 text-white rounded-br-sm') : (rpgMode ? 'bg-white border-2 border-red-800/20 text-red-950 rounded-bl-sm' : 'bg-white text-slate-700 bento-border rounded-bl-sm')}`}>
                   {msg.content}
                 </div>
               </div>
             ))}
             {isLoading && <Loader2 className="mx-auto text-indigo-400 animate-spin" />}
          </div>
        )}
      </div>

      {(decisionStep === 4 && !readOnly) ? (
        <div className={`p-6 safe-area-bottom z-30 transition-all ${rpgMode ? 'bg-parchment' : 'bg-white/80 backdrop-blur-md'}`}>
           <button onClick={handleBack} className={`w-full py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center space-x-3 shadow-xl active:scale-95 transition-all ${rpgMode ? 'rpg-button' : 'bg-slate-900 text-white'}`}>
              <CheckCircle2 size={20} /><span>Завершить и сохранить</span>
           </button>
        </div>
      ) : (mode !== 'DECISION' || (decisionStep === 4 && readOnly)) ? (
        <div className={`p-4 safe-area-bottom z-30 transition-all ${rpgMode ? 'bg-parchment' : 'bg-white/80 backdrop-blur-md'}`}>
           {!readOnly ? (
             <div className={`flex items-center p-1 rounded-[32px] border shadow-2xl ${rpgMode ? 'bg-white border-red-800/40' : 'bg-white bento-border focus-within:border-indigo-300'}`}>
                <div className="pl-5 text-slate-300"><MessageSquare size={18} /></div>
                <input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ваша мысль..."
                  className="flex-1 bg-transparent px-4 py-4 text-[15px] font-medium focus:outline-none"
                />
                <button onClick={handleSendChat} disabled={!input.trim() || isLoading} className={`w-12 h-12 flex items-center justify-center rounded-2xl ${rpgMode ? 'bg-red-800 text-white' : 'bg-slate-900 text-white'}`}>
                  <Send size={20} />
                </button>
             </div>
           ) : (
             <div className="text-center py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-60">Архивная запись сессии</div>
           )}
        </div>
      ) : null}
    </div>
  );
};
