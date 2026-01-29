import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2, Sparkles, Plus, Zap, X, ChevronRight, Target, LayoutGrid, Wand2, MessageSquare, Lightbulb, Compass, Rocket, CheckCircle2, ArrowRightLeft } from 'lucide-react';
import { JournalMode, Message, DecisionData } from '../types';
import { InsightCard } from './InsightCard';
import { sendMessageToGemini, analyzeDecision } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInterfaceProps {
  mode: JournalMode;
  onBack: () => void;
  onSessionComplete?: (messages: Message[], durationSeconds: number, previewOverride?: string) => void;
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

  const handleDecisionStart = () => {
    if (!decisionData.topic.trim()) return;
    const compareRegex = /(.+?)\s+(?:или|vs|против|or)\s+(.+)/i;
    const match = decisionData.topic.match(compareRegex);
    if (match) {
      setDecisionData(prev => ({ ...prev, decisionType: 'COMPARE', optionA: match[1].trim(), optionB: match[2].trim() }));
    } else {
      setDecisionData(prev => ({ ...prev, decisionType: 'SINGLE', optionA: 'За', optionB: 'Против' }));
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

  const removeArgument = (side: 'A' | 'B', index: number) => {
    if (side === 'A') {
      setDecisionData(prev => ({ ...prev, pros: prev.pros.filter((_, i) => i !== index) }));
    } else {
      setDecisionData(prev => ({ ...prev, cons: prev.cons.filter((_, i) => i !== index) }));
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
    const items = side === 'A' ? decisionData.pros : decisionData.cons;
    const title = side === 'A' ? (decisionData.optionA || 'За') : (decisionData.optionB || 'Против');
    
    // Duolingo Visual Weights
    let cardClasses = `flex flex-col rounded-[32px] p-5 border-2 border-b-[6px] transition-all duration-300 cursor-pointer h-full relative overflow-hidden `;
    
    if (rpgMode) {
      cardClasses += isActive 
        ? "bg-white border-red-800 shadow-[0_4px_0_#7f1d1d]" 
        : "bg-white/40 border-red-800/10 opacity-60 grayscale scale-[0.96]";
    } else {
      const sideColor = side === 'A' ? 'indigo' : 'rose';
      cardClasses += isActive
        ? `bg-white border-${sideColor}-500 shadow-[0_4px_0_rgba(99,102,241,0.2)] scale-[1.02] z-10`
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
           <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${isActive ? (side === 'A' ? 'bg-indigo-600 text-white' : 'bg-rose-500 text-white') : 'bg-slate-200 text-slate-400'}`}>
             {items.length}
           </div>
        </div>

        <h4 className={`text-xs font-black uppercase tracking-widest mb-4 truncate ${isActive ? (rpgMode ? 'text-red-950' : 'text-slate-800') : 'text-slate-400'}`}>
          {title}
        </h4>

        <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar pb-20">
          <AnimatePresence>
            {items.map((text, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: side === 'A' ? -20 : 20 }} 
                animate={{ opacity: 1, x: 0 }}
                className={`group relative p-3 rounded-2xl text-[11px] font-bold border ${rpgMode ? 'bg-white border-red-800/10 text-red-950' : 'bg-white bento-border text-slate-700 shadow-sm'}`}
              >
                {text}
                <button 
                  onClick={(e) => { e.stopPropagation(); removeArgument(side, i); }}
                  className="absolute -right-1 -top-1 w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} strokeWidth={4} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {items.length === 0 && isActive && (
            <div className="h-full flex flex-col items-center justify-center py-10 opacity-20 italic text-[10px] text-center">
               <Plus size={24} className="mb-2" />
               <p>Нажмите "Добавить" внизу</p>
            </div>
          )}
        </div>
        
        {/* Fill effect like Duolingo progress */}
        <div 
          className={`absolute bottom-0 left-0 right-0 h-1 transition-all duration-1000 ${side === 'A' ? 'bg-indigo-500' : 'bg-rose-500'}`}
          style={{ height: `${Math.min(items.length * 10, 100)}%`, opacity: 0.03 }}
        />
      </motion.div>
    );
  };

  return (
    <div className={`flex flex-col h-full relative z-10 ${rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-[#F8F9FB]'}`}>
      {/* Header - Hidden for Decision mode to maximize space */}
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
            {decisionStep === 1 && (
              <div className="p-6 space-y-4 animate-fade-in">
                <button onClick={handleBack} className={`mb-2 p-2 -ml-2 rounded-full transition-colors ${rpgMode ? 'text-red-800 hover:bg-red-50' : 'text-slate-400 hover:bg-white shadow-sm hover:text-slate-800'}`}>
                  <ArrowLeft size={24} />
                </button>

                <div className={`p-8 rounded-[40px] border relative overflow-hidden transition-all shadow-xl ${rpgMode ? 'rpg-card' : 'bg-white bento-border bento-shadow shadow-slate-200/40'}`}>
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
                     placeholder="Перед каким выбором вы стоите?"
                     className={`w-full bg-transparent text-2xl font-black tracking-tight focus:outline-none resize-none min-h-[160px] ${rpgMode ? 'text-red-950 font-display-fantasy italic' : 'text-slate-800'}`}
                   />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className={`p-6 rounded-[32px] border transition-all ${rpgMode ? 'bg-white/60 border-red-800/10' : 'bg-white bento-border bento-shadow shadow-slate-100'}`}>
                      <div className="flex items-center space-x-2 mb-3">
                         <Lightbulb size={14} className="text-amber-500" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Совет</span>
                      </div>
                      <p className={`text-[11px] font-bold leading-tight ${rpgMode ? 'text-red-900/60' : 'text-slate-500'}`}>
                        Если есть выбор из двух, напишите через "или".
                      </p>
                   </div>
                   <div className={`p-6 rounded-[32px] border transition-all ${rpgMode ? 'bg-white/60 border-red-800/10' : 'bg-white bento-border bento-shadow shadow-slate-100'}`}>
                      <div className="flex items-center space-x-2 mb-3">
                         <Rocket size={14} className="text-indigo-500" />
                         <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Этап</span>
                      </div>
                      <p className={`text-[11px] font-bold leading-tight ${rpgMode ? 'text-red-900/60' : 'text-slate-500'}`}>
                        Формирование намерения перед анализом.
                      </p>
                   </div>
                </div>

                <button onClick={handleDecisionStart} disabled={!decisionData.topic.trim()} className={`w-full py-7 rounded-[40px] font-black text-[13px] uppercase tracking-[0.3em] flex items-center justify-center space-x-4 transition-all shadow-2xl active:scale-95 disabled:opacity-20 ${rpgMode ? 'rpg-button' : 'bg-slate-900 text-white'}`}>
                   <span>Разложить на факторы</span><ChevronRight size={18} strokeWidth={3} />
                </button>
              </div>
            )}

            {decisionStep === 2 && (
              <div className="p-6 flex-1 flex flex-col space-y-4 animate-fade-in h-full overflow-hidden">
                 <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => setDecisionStep(1)} className={`p-2 -ml-2 rounded-full transition-colors ${rpgMode ? 'text-red-800 hover:bg-red-50' : 'text-slate-400 hover:bg-white shadow-sm hover:text-slate-800'}`}>
                        <ArrowLeft size={20} />
                      </button>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">На чаше весов</span>
                    </div>
                    {decisionData.archetype && (
                       <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border shadow-sm">
                          <div className="w-4 h-4 rounded-full bg-indigo-500" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-600">{decisionData.archetype.name} наблюдает</span>
                       </div>
                    )}
                 </div>

                 {/* VS Area */}
                 <div className="flex-1 flex flex-col min-h-0">
                   <div className="flex-1 flex space-x-3 items-stretch min-h-0 py-2 relative">
                      <div className="flex-1">{renderArgumentCard('A')}</div>
                      
                      {/* VS Badge */}
                      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                         <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm border-4 transition-all duration-300 ${rpgMode ? 'bg-red-800 text-white border-red-950 shadow-lg' : 'bg-white text-slate-300 border-slate-100 shadow-xl'}`}>
                           VS
                         </div>
                      </div>

                      <div className="flex-1">{renderArgumentCard('B')}</div>
                   </div>
                 </div>

                 {/* Duolingo Input Panel */}
                 <div className="space-y-4 pb-6 mt-4">
                    <div className={`p-2 rounded-[28px] border-2 border-b-4 flex items-center space-x-3 transition-all ${
                      rpgMode 
                        ? 'bg-white border-red-800' 
                        : (activeSide === 'A' ? 'bg-white border-indigo-500 ring-4 ring-indigo-50' : 'bg-white border-rose-500 ring-4 ring-rose-50')
                    }`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white transition-colors ${
                        rpgMode ? 'bg-red-800' : (activeSide === 'A' ? 'bg-indigo-500' : 'bg-rose-500')
                      }`}>
                        <Plus size={20} strokeWidth={3} />
                      </div>
                      <input 
                        value={inlineInput}
                        onChange={(e) => setInlineInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addArgument()}
                        placeholder={`Аргумент для: ${activeSide === 'A' ? (decisionData.optionA || 'Варианта А') : (decisionData.optionB || 'Варианта Б')}`}
                        className="flex-1 bg-transparent px-2 py-3 text-[14px] font-bold focus:outline-none"
                      />
                      <button 
                        onClick={addArgument}
                        disabled={!inlineInput.trim()}
                        className={`p-3 rounded-2xl transition-all active:scale-90 ${
                          inlineInput.trim() 
                            ? (rpgMode ? 'bg-red-800 text-white' : (activeSide === 'A' ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white')) 
                            : 'bg-slate-100 text-slate-300'
                        }`}
                      >
                        <ChevronRight size={20} strokeWidth={3} />
                      </button>
                    </div>

                    <button 
                      onClick={performAnalysis} 
                      disabled={decisionData.pros.length === 0 && decisionData.cons.length === 0}
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Результат анализа</span>
                </div>
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
                     : (rpgMode ? 'bg-white border-2 border-red-800/20 text-red-950 rounded-bl-sm' : 'bg-white text-slate-700 bento-border rounded-bl-sm')
                 }`}>
                   {msg.content}
                 </div>
               </div>
             ))}
             {isLoading && <Loader2 className="mx-auto text-indigo-400 animate-spin" />}
          </div>
        )}
      </div>

      {/* Footer Controls for non-Decision or Step 4 */}
      {(decisionStep === 4 && !readOnly) ? (
        <div className={`p-6 safe-area-bottom z-30 transition-all ${rpgMode ? 'bg-parchment' : 'bg-white/80 backdrop-blur-md'}`}>
           <button 
             onClick={handleBack}
             className={`w-full py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.4em] flex items-center justify-center space-x-3 shadow-xl active:scale-95 transition-all ${rpgMode ? 'rpg-button' : 'bg-slate-900 text-white'}`}
           >
              <CheckCircle2 size={20} />
              <span>Завершить и сохранить</span>
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
             <div className="text-center py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 opacity-60">
               Архивная запись сессии
             </div>
           )}
        </div>
      ) : null}
    </div>
  );
};
