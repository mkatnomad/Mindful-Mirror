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

const MiniPrism = ({ rpgMode }: { rpgMode: boolean }) => (
  <div className="relative w-24 h-24 flex items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      className={`absolute inset-0 rounded-full border-2 border-dashed opacity-20 ${rpgMode ? 'border-red-800' : 'border-white'}`}
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

const TypingIndicator = ({ rpgMode }: { rpgMode: boolean }) => (
  <div className={`flex items-center space-x-1.5 px-5 py-3.5 rounded-[24px] rounded-bl-sm w-fit ${rpgMode ? 'bg-white border-2 border-red-800/10 shadow-sm shadow-red-900/5' : 'bg-white bento-border shadow-sm shadow-slate-200/40'}`}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        animate={{ 
          y: [0, -5, 0],
          opacity: [0.4, 1, 0.4]
        }}
        transition={{ 
          duration: 0.9, 
          repeat: Infinity, 
          delay: i * 0.15,
          ease: "easeInOut"
        }}
        className={`w-2 h-2 rounded-full ${rpgMode ? 'bg-red-800' : 'bg-indigo-400'}`}
      />
    ))}
  </div>
);

const QUICK_STARTERS = [
  "Уволиться или остаться?",
  "Купить это сейчас или подождать?",
  "Сказать правду или промолчать?",
  "Пойти на риск или стабильность?",
  "Взять паузу или продолжать?"
];

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
  
  const activeInputRef = useRef<HTMLTextAreaElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const [decisionStep, setDecisionStep] = useState<number>(1); 
  const [activeSide, setActiveSide] = useState<'A' | 'B'>('A');
  const [inlineInput, setInlineInput] = useState('');
  const [isEditingNew, setIsEditingNew] = useState(false);
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
          ? (rpgMode ? "Какая буря бушует в вашей душе?" : "Я здесь, чтобы выслушать. Как вы себя чувствуете в этот момент?")
          : (rpgMode ? "Расскажите о своих подвигах за день." : "Как прошел ваш день?"),
        timestamp: Date.now()
      }]);
    }
    isInitialized.current = true;
  }, [mode, readOnly, initialMessages, rpgMode]);

  useEffect(() => {
    if (isEditingNew && activeInputRef.current) {
      activeInputRef.current.focus();
      activeInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [isEditingNew, activeSide]);

  useEffect(() => {
    if (listContainerRef.current) {
      if (decisionStep === 4) {
        listContainerRef.current.scrollTop = 0;
      } else {
        listContainerRef.current.scrollTop = listContainerRef.current.scrollHeight;
      }
    }
  }, [messages, isLoading, decisionStep]);

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
    setIsIdentifying(true);
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');

    try {
      const intent = await identifyDecisionIntent(decisionData.topic);
      setDecisionData(prev => ({
        ...prev,
        decisionType: intent.type,
        optionA: intent.optionA,
        optionB: intent.optionB
      }));
      await new Promise(r => setTimeout(r, 800));
      setDecisionStep(2);
      setIsEditingNew(true);
      setActiveSide('A');
    } catch (e) {
      setDecisionStep(2);
      setIsEditingNew(true);
    } finally {
      setIsIdentifying(false);
    }
  };

  const addArgument = () => {
    if (!inlineInput.trim()) {
      setIsEditingNew(false);
      return;
    }
    const newArg: DecisionArgument = { text: inlineInput.trim(), type: 'pro' };
    
    if (activeSide === 'A') {
      setDecisionData(prev => ({ ...prev, argsA: [...prev.argsA, newArg] }));
    } else {
      setDecisionData(prev => ({ ...prev, argsB: [...prev.argsB, newArg] }));
    }
    
    setInlineInput('');
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    
    setTimeout(() => {
      if (activeInputRef.current) {
        activeInputRef.current.focus();
        activeInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 50);
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

  const renderSideColumn = (side: 'A' | 'B') => {
    const isActive = activeSide === side;
    const items = side === 'A' ? decisionData.argsA : decisionData.argsB;
    const title = side === 'A' ? decisionData.optionA : decisionData.optionB;
    
    return (
      <div 
        className={`flex flex-col space-y-2 transition-all duration-500 ease-out min-w-0 overflow-hidden ${isActive ? 'flex-[2]' : 'flex-[1] opacity-40 grayscale-[0.8]'}`}
        onClick={() => {
          if (!isActive) {
            setActiveSide(side);
            setIsEditingNew(true);
            if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('soft');
          }
        }}
      >
        <div className={`flex items-center justify-between px-2 py-1.5 rounded-xl transition-all duration-500 mb-1 ${
          isActive 
            ? (rpgMode ? 'bg-red-800/10 border border-red-800/20' : 'bg-indigo-50 border border-indigo-200 shadow-sm shadow-indigo-100/30') 
            : 'bg-transparent border border-transparent'
        }`}>
          <h4 className={`text-[11px] font-black uppercase tracking-widest truncate ${
            isActive ? (rpgMode ? 'text-red-900' : 'text-indigo-600') : 'text-slate-500'
          }`}>
            {title}
          </h4>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-lg transition-all ${
            isActive ? (rpgMode ? 'bg-red-800 text-white' : 'bg-slate-900 text-white') : 'bg-slate-200 text-slate-500'
          }`}>
            {items.length}
          </span>
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {items.map((arg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: side === 'A' ? -20 : 20 }}
                className={`relative p-3 rounded-[20px] border-2 border-b-4 group shadow-sm transition-all ${
                  rpgMode ? 'bg-white border-red-800/20 text-red-950' : 'bg-white border-slate-200 text-slate-800 font-bold'
                }`}
              >
                <p className={`text-[13px] font-bold leading-tight break-words ${!isActive && 'line-clamp-1'}`}>
                  {arg.text}
                </p>
                {isActive && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeArgument(side, i); }}
                    className="absolute -right-1.5 -top-1.5 w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                  >
                    <X size={10} strokeWidth={4} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isActive && isEditingNew ? (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-3 rounded-[20px] border-2 border-b-[4px] shadow-xl relative z-30 ${
                rpgMode ? 'bg-white border-red-800' : 'bg-white border-indigo-500'
              }`}
            >
              <textarea
                ref={activeInputRef}
                value={inlineInput}
                onChange={(e) => setInlineInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addArgument();
                  }
                }}
                placeholder="Плюс или минус..."
                className={`w-full bg-transparent text-[15px] font-black leading-tight focus:outline-none resize-none min-h-[50px] ${rpgMode ? 'text-red-950 placeholder:text-red-900/30' : 'text-slate-900 placeholder:text-slate-400'}`}
                rows={2}
              />
              <div className="flex justify-end mt-1">
                <button 
                  onClick={addArgument}
                  className={`p-1.5 rounded-lg transition-all active:scale-90 ${inlineInput.trim() ? (rpgMode ? 'bg-red-800 text-white' : 'bg-indigo-600 text-white') : 'bg-slate-300 text-white'}`}
                >
                  <Check size={20} strokeWidth={4} />
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setActiveSide(side);
                setIsEditingNew(true);
              }}
              className={`w-full py-5 rounded-[20px] border-2 border-dashed flex flex-col items-center justify-center transition-all ${
                isActive 
                  ? (rpgMode ? 'border-red-800 bg-red-50 text-red-800' : 'border-indigo-400 bg-indigo-50/30 text-indigo-600 shadow-sm') 
                  : 'border-white/20 text-white/30'
              }`}
            >
              <Plus size={isActive ? 22 : 18} strokeWidth={3} />
            </motion.button>
          )}
        </div>
      </div>
    );
  };

  const renderProgress = (step: number) => {
    return (
      <div className="flex space-x-1.5 px-6 pt-4 mb-3">
        {[1, 2, 4].map((s) => (
          <div 
            key={s} 
            className={`h-1.5 rounded-full flex-1 transition-all duration-700 ${
              step >= s 
                ? (rpgMode ? 'bg-red-800' : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]') 
                : (rpgMode ? 'bg-red-800/10' : 'bg-white/20')
            }`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full relative z-10 ${rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-transparent'}`}>
      {mode !== 'DECISION' && (
        <div className={`px-6 py-4 flex items-center justify-between sticky top-0 z-40 transition-all ${rpgMode ? 'bg-white/40 border-b border-red-800/30' : 'bg-transparent'}`}>
          <button onClick={handleBack} className={`p-2 -ml-2 rounded-full ${rpgMode ? 'text-red-950' : 'text-white'}`}><ArrowLeft size={20} /></button>
          <h2 className={`text-base font-black uppercase tracking-tighter ${rpgMode ? 'text-red-950 font-display-fantasy' : 'text-white shadow-sm'}`}>
            {mode === 'EMOTIONS' ? 'Состояние' : 'Дневник'}
          </h2>
          <div className="w-8"></div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar" ref={listContainerRef}>
        {mode === 'DECISION' ? (
          <div className={`flex flex-col ${decisionStep === 4 ? 'min-h-full' : 'h-full overflow-hidden'}`}>
            {decisionStep === 1 && !isIdentifying && (
              <div className="flex-1 flex flex-col animate-fade-in relative h-full overflow-hidden">
                <div className="flex items-center px-4 pt-2 shrink-0">
                  <button onClick={handleBack} className={`p-3 rounded-full transition-colors ${rpgMode ? 'text-red-950' : 'text-white'} hover:text-white/80`}>
                    <ArrowLeft size={24} />
                  </button>
                  <div className="flex-1">{renderProgress(1)}</div>
                  <div className="w-10"></div>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
                  <div className="px-6 py-2 flex flex-col items-center text-center shrink-0">
                    <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="mb-2">
                      <DecisionIllustration rpgMode={rpgMode} size={60} />
                    </motion.div>
                    
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`px-4 py-2 rounded-[20px] rounded-tl-none border shadow-sm max-w-[240px] relative ${rpgMode ? 'bg-white border-red-800 text-red-950 font-serif-fantasy italic' : 'bg-white bento-border border-slate-800/20 text-slate-800 shadow-md shadow-white/5 ring-4 ring-white/10'}`}>
                      <p className="text-[12px] leading-tight font-black uppercase tracking-tighter">
                        Какое решение требует ясности прямо сейчас?
                      </p>
                    </motion.div>
                  </div>

                  <div className="px-6 flex-1 flex flex-col min-h-0 mt-8">
                    <div className="flex-1 flex flex-col items-center justify-center min-h-[120px] relative group">
                        <div className={`absolute inset-0 transition-all duration-500 rounded-[32px] ${decisionData.topic.trim() ? (rpgMode ? 'bg-red-800/5 ring-4 ring-red-800/10' : 'bg-white/20 border-2 border-white/60 ring-4 ring-white/10 shadow-lg shadow-white/10') : (rpgMode ? 'bg-red-800/5 border-2 border-dashed border-red-800/20' : 'bg-white/10 border-2 border-dashed border-white/40 shadow-inner')}`} />
                        <textarea 
                          value={decisionData.topic}
                          onChange={(e) => setDecisionData(prev => ({ ...prev, topic: e.target.value }))}
                          placeholder="Опишите вашу дилемму..."
                          className={`w-full bg-transparent text-center text-xl font-black tracking-tight focus:outline-none resize-none px-4 relative z-10 transition-all duration-300 ${rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-900 placeholder:text-slate-600/50'} ${decisionData.topic.length > 50 ? 'text-lg' : 'text-2xl'}`}
                          rows={3}
                        />
                    </div>
                    <div className="mt-4 mb-4 overflow-x-auto no-scrollbar flex space-x-2 py-1 shrink-0">
                      {QUICK_STARTERS.map((s, i) => (
                        <button key={i} onClick={() => { setDecisionData(prev => ({ ...prev, topic: s })); if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light'); }} className={`shrink-0 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all active:scale-95 ${rpgMode ? 'bg-white border-red-800 text-red-800' : 'bg-white bento-border border-slate-200 text-slate-800 font-bold shadow-sm'}`}>{s}</button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={`p-4 pb-6 shrink-0 z-20 transition-colors ${rpgMode ? 'bg-parchment' : 'bg-transparent'}`}>
                   <button onClick={handleDecisionStart} disabled={!decisionData.topic.trim() || isIdentifying} className={`w-full py-5 rounded-[32px] font-black text-[12px] uppercase tracking-[0.2em] flex items-center justify-center space-x-4 transition-all shadow-xl border-b-[6px] disabled:opacity-20 disabled:grayscale ${rpgMode ? 'rpg-button border-red-950' : 'bg-white text-slate-900 border-slate-800/30'}`}>
                     <span>Взвесить факторы</span><ChevronRight size={16} strokeWidth={4} />
                   </button>
                </div>
              </div>
            )}

            {isIdentifying && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6 animate-fade-in">
                 <MiniPrism rpgMode={rpgMode} />
                 <div className="text-center space-y-2">
                   <p className={`text-[11px] font-black uppercase tracking-[0.4em] ${rpgMode ? 'text-red-800' : 'text-black'}`}>Ритуал прозрения</p>
                   <p className={`text-[14px] font-bold italic ${rpgMode ? 'text-red-950' : 'text-black/60'}`}>Мастер вникает в суть дилеммы...</p>
                 </div>
              </div>
            )}

            {decisionStep === 2 && !isIdentifying && (
              <div className="px-4 pb-4 flex-1 flex flex-col animate-fade-in h-full overflow-hidden">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1">
                      <button onClick={() => setDecisionStep(1)} className={`p-2 -ml-2 rounded-full transition-colors ${rpgMode ? 'text-red-950' : 'text-white'} hover:text-white/80`}>
                        <ArrowLeft size={20} />
                      </button>
                      <div className="flex-1 pr-6">{renderProgress(2)}</div>
                    </div>
                 </div>

                 <div className="mb-2 px-2">
                    <div className="flex items-center space-x-2">
                      <Sparkles size={14} className={rpgMode ? 'text-red-800' : 'text-white shadow-sm'} />
                      <p className={`text-[10px] font-black uppercase tracking-widest leading-tight ${rpgMode ? 'text-red-900' : 'text-white shadow-sm'}`}>
                        Напишите плюсы и минусы для вариантов
                      </p>
                    </div>
                 </div>

                 <div className="flex-1 flex space-x-1.5 items-stretch min-h-0 py-2 relative w-full overflow-hidden">
                   {renderSideColumn('A')}
                   
                   <div className="flex flex-col items-center justify-center px-0.5 shrink-0">
                      <div className={`w-[1px] flex-1 ${rpgMode ? 'bg-red-800/10' : 'bg-white/10'}`}></div>
                      <div className={`my-2 w-6 h-6 rounded-full flex items-center justify-center font-black text-[8px] border-2 transition-all duration-500 ${activeSide === 'A' ? '-rotate-12' : 'rotate-12'} ${rpgMode ? 'bg-white border-red-800 text-red-800' : 'bg-white/20 border-white text-white'}`}>VS</div>
                      <div className={`w-[1px] flex-1 ${rpgMode ? 'bg-red-800/10' : 'bg-white/10'}`}></div>
                   </div>

                   {renderSideColumn('B')}
                 </div>

                 <div className="mt-2 pb-4">
                    <button 
                      onClick={performAnalysis} 
                      disabled={decisionData.argsA.length === 0 && decisionData.argsB.length === 0}
                      className={`w-full py-5 rounded-[28px] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl flex items-center justify-center space-x-4 active:scale-95 transition-all border-b-6 disabled:opacity-20 disabled:grayscale ${rpgMode ? 'rpg-button border-[#7f1d1d]' : 'bg-white text-slate-900 border-slate-800/30'}`}
                    >
                      <Wand2 size={18} /><span>Синтезировать</span>
                    </button>
                 </div>
              </div>
            )}

            {decisionStep === 3 && (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
                 <div className="relative">
                   <div className="absolute inset-0 bg-white/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
                   <Loader2 size={56} strokeWidth={1.5} className="text-yellow animate-spin relative z-10" />
                 </div>
                 <p className="text-xs font-black uppercase tracking-[0.4em] text-yellow animate-pulse">Вычисляем вероятности...</p>
              </div>
            )}

            {decisionStep === 4 && (
              <div className="animate-fade-in pb-32">
                <div className="px-6 pt-6 flex items-center space-x-2 mb-2">
                    <button onClick={handleBack} className={`p-2 -ml-2 rounded-full transition-colors ${rpgMode ? 'text-red-950' : 'text-white'} hover:bg-white/10`}>
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
                 <div className={`max-w-[85%] px-5 py-4 rounded-[28px] text-[15px] font-bold leading-relaxed shadow-sm ${msg.role === 'user' ? (rpgMode ? 'rpg-button rounded-br-sm' : 'bg-slate-900 text-white rounded-br-sm shadow-md') : (rpgMode ? 'bg-white border-2 border-red-800/20 text-red-950 rounded-bl-sm' : 'bg-white text-slate-800 bento-border rounded-bl-sm shadow-sm')}`}>
                   {msg.content}
                 </div>
               </div>
             ))}
             {isLoading && (
               <div className="flex justify-start">
                  <TypingIndicator rpgMode={rpgMode} />
               </div>
             )}
          </div>
        )}
      </div>

      {(decisionStep === 4 && !readOnly) ? (
        <div className={`p-6 safe-area-bottom z-30 transition-all ${rpgMode ? 'bg-parchment' : 'bg-transparent'}`}>
           <button onClick={handleBack} className={`w-full py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center space-x-3 shadow-xl active:scale-95 transition-all ${rpgMode ? 'rpg-button' : 'bg-white text-slate-900 shadow-white/10'}`}>
              <CheckCircle2 size={20} /><span>Завершить и сохранить</span>
           </button>
        </div>
      ) : (mode !== 'DECISION' || (decisionStep === 4 && readOnly)) ? (
        <div className={`p-4 safe-area-bottom z-30 transition-all ${rpgMode ? 'bg-parchment' : 'bg-transparent'}`}>
           {!readOnly ? (
             <div className={`flex items-center p-1 rounded-[32px] border shadow-2xl ${rpgMode ? 'bg-white border-red-800/40' : 'bg-white bento-border border-white focus-within:border-indigo-400 shadow-white/10'}`}>
                <div className="pl-5 text-slate-400"><MessageSquare size={18} /></div>
                <input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                  placeholder="Ваша мысль..."
                  className="flex-1 bg-transparent px-4 py-4 text-[15px] font-bold focus:outline-none"
                />
                <button onClick={handleSendChat} disabled={!input.trim() || isLoading} className={`w-12 h-12 flex items-center justify-center rounded-2xl ${rpgMode ? 'bg-red-800 text-white' : 'bg-slate-900 text-white'}`}>
                  <Send size={20} />
                </button>
             </div>
           ) : (
             <div className="text-center py-2 text-[10px] font-bold uppercase tracking-widest text-white/50 opacity-60">Архивная запись сессии</div>
           )}
        </div>
      ) : null}
    </div>
  );
};