
import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2, Sparkles, Plus, Zap, X, ChevronRight, Target, LayoutGrid, Wand2, MessageSquare, Lightbulb, Compass, Rocket } from 'lucide-react';
import { JournalMode, Message, DecisionData } from '../types';
import { InsightCard } from './InsightCard';
import { sendMessageToGemini, analyzeDecision } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInterfaceProps {
  mode: JournalMode;
  onBack: () => void;
  onSessionComplete?: (messages: Message[], durationSeconds: number) => void;
  readOnly?: boolean;
  initialMessages?: Message[];
  rpgMode?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  mode, 
  onBack, 
  onSessionComplete, 
  readOnly = false,
  initialMessages = [],
  rpgMode = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const isInitialized = useRef(false);

  // Decision States
  const [decisionStep, setDecisionStep] = useState<number>(1); 
  const [activeSide, setActiveSide] = useState<'A' | 'B'>('A');
  const [inlineInput, setInlineInput] = useState('');
  const [decisionData, setDecisionData] = useState<DecisionData>({ 
    topic: '', pros: [], cons: [], decisionType: 'SINGLE', optionA: '', optionB: '' 
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
    if (!readOnly && onSessionComplete && (messages.length > 0 || decisionStep > 1)) {
      onSessionComplete(messages, (Date.now() - startTimeRef.current) / 1000);
    }
    onBack();
  };

  const handleDecisionStart = () => {
    if (!decisionData.topic.trim()) return;
    const compareRegex = /(.+?)\s+(?:или|vs|против|or)\s+(.+)/i;
    const match = decisionData.topic.match(compareRegex);
    if (match) {
      setDecisionData(prev => ({ ...prev, decisionType: 'COMPARE', optionA: match[1].trim(), optionB: match[2].trim() }));
    } else {
      setDecisionData(prev => ({ ...prev, decisionType: 'SINGLE' }));
    }
    setDecisionStep(2);
  };

  const addArgument = () => {
    if (!inlineInput.trim()) return;
    if (activeSide === 'A') {
      setDecisionData(prev => ({ ...prev, pros: [...prev.pros, inlineInput] }));
    } else {
      setDecisionData(prev => ({ ...prev, cons: [...prev.cons, inlineInput] }));
    }
    setInlineInput('');
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
  };

  const performAnalysis = async () => {
    setIsLoading(true);
    setDecisionStep(3);
    try {
      const updatedData = await analyzeDecision(decisionData);
      setDecisionData(updatedData);
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

  const renderArgumentColumn = (side: 'A' | 'B') => {
    const isCompare = decisionData.decisionType === 'COMPARE';
    const isActive = activeSide === side;
    const items = side === 'A' ? decisionData.pros : decisionData.cons;
    const title = side === 'A' ? (isCompare ? decisionData.optionA : 'За') : (isCompare ? decisionData.optionB : 'Против');

    return (
      <div 
        onClick={() => setActiveSide(side)}
        className={`flex flex-col rounded-[32px] p-5 border transition-all duration-500 cursor-pointer ${
          isActive 
            ? (rpgMode ? 'rpg-card ring-2 ring-red-800/20' : 'bg-white border-indigo-100 shadow-xl shadow-indigo-100/30 scale-[1.02]') 
            : (rpgMode ? 'bg-white/40 border-red-800/10 opacity-50' : 'bg-slate-50 border-transparent opacity-50')
        }`}
      >
        <div className="flex justify-between items-center mb-4">
           <h4 className={`text-[10px] font-black uppercase tracking-widest ${isActive ? (rpgMode ? 'text-red-800' : 'text-indigo-600') : 'text-slate-400'}`}>
             {title}
           </h4>
           <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
             {items.length}
           </div>
        </div>

        <div className="flex-1 space-y-2 mb-4">
          <AnimatePresence>
            {items.map((text, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: side === 'A' ? -10 : 10 }} 
                animate={{ opacity: 1, x: 0 }}
                className={`p-3 rounded-2xl text-[11px] font-bold border ${rpgMode ? 'bg-white border-red-800/20 text-red-950' : 'bg-white border-slate-50 text-slate-700 shadow-sm'}`}
              >
                {text}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {isActive && (
          <div className="mt-auto animate-fade-in">
             <div className={`relative flex items-center rounded-2xl border p-1 transition-all ${rpgMode ? 'bg-white border-red-800/40' : 'bg-slate-50 border-indigo-100 focus-within:bg-white'}`}>
                <input 
                  autoFocus
                  value={inlineInput}
                  onChange={(e) => setInlineInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addArgument()}
                  placeholder="Пишите прямо здесь..."
                  className="flex-1 bg-transparent px-3 py-2 text-[12px] font-bold focus:outline-none"
                />
                <button onClick={addArgument} className={`p-2 rounded-xl ${rpgMode ? 'bg-red-800 text-white' : 'bg-indigo-600 text-white'}`}>
                  <Plus size={14} />
                </button>
             </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-full relative z-10 ${rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-[#F1F5F9]'}`}>
      {/* Header */}
      <div className={`px-6 py-4 border-b flex items-center justify-between sticky top-0 z-40 transition-all ${rpgMode ? 'bg-white/40 border-red-800/30' : 'bg-white/80 backdrop-blur-xl border-slate-100'}`}>
        <button onClick={handleBack} className={`p-2 -ml-2 rounded-full ${rpgMode ? 'text-red-800' : 'text-slate-500'}`}><ArrowLeft size={20} /></button>
        <h2 className={`text-base font-black uppercase tracking-tighter italic ${rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>
          {mode === 'DECISION' ? 'Архитектор решений' : mode === 'EMOTIONS' ? 'Состояние' : 'Дневник'}
        </h2>
        <div className="w-8"></div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {mode === 'DECISION' ? (
          <div className="h-full flex flex-col">
            {decisionStep === 1 && (
              <div className="p-6 space-y-4 animate-fade-in">
                {/* Hero Bento Input */}
                <div className={`p-8 rounded-[40px] border relative overflow-hidden transition-all shadow-xl ${rpgMode ? 'rpg-card' : 'bg-white border-white shadow-slate-200/40'}`}>
                   <div className="flex items-center space-x-2 mb-6">
                      <div className={`p-2 rounded-xl ${rpgMode ? 'bg-red-800 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                        <Target size={18} />
                      </div>
                      <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${rpgMode ? 'text-red-800' : 'text-slate-400'}`}>Суть дилеммы</p>
                   </div>
                   <textarea 
                     autoFocus
                     value={decisionData.topic}
                     onChange={(e) => setDecisionData(prev => ({ ...prev, topic: e.target.value }))}
                     placeholder="Что вы планируете сделать?"
                     className={`w-full bg-transparent text-2xl font-black tracking-tight focus:outline-none resize-none min-h-[160px] ${rpgMode ? 'text-red-950 font-display-fantasy italic' : 'text-slate-800'}`}
                   />
                </div>

                {/* Sub-Bento Grid */}
                <div className="grid grid-cols-2 gap-4">
                   <div className={`p-6 rounded-[32px] border transition-all ${rpgMode ? 'bg-white/60 border-red-800/10' : 'bg-white border-white shadow-sm'}`}>
                      <div className="flex items-center space-x-2 mb-3">
                         <Lightbulb size={14} className="text-amber-500" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Совет</span>
                      </div>
                      <p className={`text-[11px] font-bold leading-tight ${rpgMode ? 'text-red-900/60' : 'text-slate-500'}`}>
                        Если есть выбор из двух, напишите через "или".
                      </p>
                   </div>
                   <div className={`p-6 rounded-[32px] border transition-all ${rpgMode ? 'bg-white/60 border-red-800/10' : 'bg-white border-white shadow-sm'}`}>
                      <div className="flex items-center space-x-2 mb-3">
                         <Rocket size={14} className="text-indigo-500" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Этап</span>
                      </div>
                      <p className={`text-[11px] font-bold leading-tight ${rpgMode ? 'text-red-900/60' : 'text-slate-500'}`}>
                        Формирование намерения перед анализом.
                      </p>
                   </div>
                </div>

                {/* Start Button */}
                <button onClick={handleDecisionStart} disabled={!decisionData.topic.trim()} className={`w-full py-7 rounded-[40px] font-black text-[13px] uppercase tracking-[0.3em] flex items-center justify-center space-x-4 transition-all shadow-2xl active:scale-95 disabled:opacity-20 ${rpgMode ? 'rpg-button' : 'bg-slate-900 text-white'}`}>
                   <span>Разложить на факторы</span><ChevronRight size={18} strokeWidth={3} />
                </button>
              </div>
            )}

            {decisionStep === 2 && (
              <div className="p-6 flex-1 flex flex-col space-y-4 animate-fade-in">
                 <div className={`p-6 rounded-[32px] border ${rpgMode ? 'rpg-card' : 'bg-white border-white shadow-sm'}`}>
                    <h3 className={`text-lg font-black leading-tight ${rpgMode ? 'text-red-950' : 'text-slate-800'}`}>{decisionData.topic}</h3>
                 </div>
                 <div className="flex-1 grid grid-cols-2 gap-4 min-h-[350px]">
                    {renderArgumentColumn('A')}
                    {renderArgumentColumn('B')}
                 </div>
                 <button 
                  onClick={performAnalysis} 
                  disabled={decisionData.pros.length === 0 && decisionData.cons.length === 0}
                  className={`w-full py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center space-x-5 active:scale-95 transition-all ${rpgMode ? 'rpg-button' : 'bg-slate-900 text-white'}`}
                 >
                   <Wand2 size={20} /><span>Синтезировать истину</span>
                 </button>
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
              <div className="animate-fade-in pb-24">
                <InsightCard data={decisionData} rpgMode={rpgMode} />
              </div>
            )}
          </div>
        ) : (
          <div className="p-5 space-y-6 pb-24">
             {messages.map((msg) => (
               <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`max-w-[85%] px-5 py-4 rounded-[28px] text-[15px] leading-relaxed shadow-sm ${
                   msg.role === 'user' 
                     ? (rpgMode ? 'rpg-button rounded-br-sm' : 'bg-slate-900 text-white rounded-br-sm') 
                     : (rpgMode ? 'bg-white border-2 border-red-800/20 text-red-950 rounded-bl-sm' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm')
                 }`}>
                   {msg.content}
                 </div>
               </div>
             ))}
             {isLoading && <Loader2 className="mx-auto text-indigo-400 animate-spin" />}
          </div>
        )}
      </div>

      {/* Footer Chat Input (Only for Emotions/Reflection or step 4) */}
      {(mode !== 'DECISION' || decisionStep === 4) && (
        <div className={`p-4 safe-area-bottom z-30 transition-all ${rpgMode ? 'bg-parchment' : 'bg-white/80 backdrop-blur-md'}`}>
           <div className={`flex items-center p-1 rounded-[32px] border shadow-2xl ${rpgMode ? 'bg-white border-red-800/40' : 'bg-white border-slate-100 focus-within:border-indigo-300'}`}>
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
        </div>
      )}
    </div>
  );
};
