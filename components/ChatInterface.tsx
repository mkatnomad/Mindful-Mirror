import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2, Sparkles, Scale, Columns, Trash2, CheckCircle2, Wand2, Plus, Zap, Heart, Info, X, ChevronRight, BarChart3, Target, AlertTriangle, LayoutGrid, Layers, HelpCircle, MessageSquare } from 'lucide-react';
import { JournalMode, Message, DecisionData } from '../types';
import { InsightCard } from './InsightCard';
import { sendMessageToGemini, analyzeDecision, refineDecision } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatInterfaceProps {
  mode: JournalMode;
  onBack: () => void;
  onSessionComplete?: (messages: Message[], durationSeconds: number) => void;
  readOnly?: boolean;
  initialMessages?: Message[];
  rpgMode?: boolean;
}

const formatMessage = (content: string) => {
  const parts = content.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const isInitialized = useRef(false);

  // Decision States
  const [decisionStep, setDecisionStep] = useState<number>(1); 
  const [activeSide, setActiveSide] = useState<'A' | 'B'>('A');
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
      let greeting = mode === 'EMOTIONS' 
        ? (rpgMode ? "Приветствую. Какая буря бушует в вашей душе?" : "Привет. Какие эмоции вы испытываете сейчас?")
        : (rpgMode ? "Присядьте у очага. Расскажите о своих подвигах за день." : "Давайте немного замедлимся. Как прошел ваш день?");
      
      setMessages([{
        id: 'init',
        role: 'assistant',
        content: greeting,
        timestamp: Date.now()
      }]);
    }
    
    startTimeRef.current = Date.now();
    isInitialized.current = true;
  }, [mode, readOnly, initialMessages, rpgMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading, decisionStep]);

  const handleBack = () => {
    if (!readOnly && onSessionComplete && (messages.length > 1 || decisionStep > 2)) {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      onSessionComplete(messages, duration);
    }
    onBack();
  };

  const handleDecisionStart = () => {
    if (!decisionData.topic.trim()) return;
    
    const compareRegex = /(.+?)\s+(?:или|vs|против|or|или же)\s+(.+)/i;
    const match = decisionData.topic.match(compareRegex);
    
    if (match) {
      setDecisionData(prev => ({ 
        ...prev, 
        decisionType: 'COMPARE', 
        optionA: match[1].trim(), 
        optionB: match[2].trim()
      }));
    } else {
      setDecisionData(prev => ({ 
        ...prev, 
        decisionType: 'SINGLE'
      }));
    }
    setDecisionStep(2);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || readOnly) return;

    if (mode === 'DECISION') {
      if (decisionStep === 2) {
        if (activeSide === 'A') {
          setDecisionData(prev => ({ ...prev, pros: [...prev.pros, text] }));
        } else {
          setDecisionData(prev => ({ ...prev, cons: [...prev.cons, text] }));
        }
        setInput('');
        return;
      }

      if (decisionStep === 4) {
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);
        try {
          const { text: analysisMsg, data: updatedData } = await refineDecision(decisionData, userMsg.content);
          setDecisionData(updatedData);
          setMessages(prev => [...prev, 
            { id: Date.now().toString(), role: 'assistant', content: analysisMsg, timestamp: Date.now() }, 
            { id: (Date.now()+1).toString(), role: 'assistant', content: '', type: 'decision-card', decisionData: updatedData, timestamp: Date.now() }
          ]);
        } catch (e) { console.error(e); }
        finally { setIsLoading(false); }
        return;
      }
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const botResponseText = await sendMessageToGemini(messages, userMsg.content, mode as 'EMOTIONS' | 'REFLECTION');
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: botResponseText, timestamp: Date.now() }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: "Ошибка связи с ИИ. Попробуйте снова.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const removeBubble = (side: 'A' | 'B', index: number) => {
    setDecisionData(prev => {
      const newData = { ...prev };
      if (side === 'A') newData.pros = newData.pros.filter((_, i) => i !== index);
      else newData.cons = newData.cons.filter((_, i) => i !== index);
      return newData;
    });
  };

  const performAnalysis = async () => {
    setIsLoading(true);
    setDecisionStep(3);
    try {
      const updatedData = await analyzeDecision(decisionData);
      setDecisionData(updatedData);
      
      const resultMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: updatedData.analysis?.verdict || "Анализ завершен.",
        timestamp: Date.now()
      };
      const cardMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        type: 'decision-card',
        decisionData: updatedData,
        timestamp: Date.now() + 10
      };
      setMessages(prev => [...prev, resultMsg, cardMsg]);
      setDecisionStep(4);
    } catch (e) {
      console.error(e);
      setDecisionStep(2);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDecisionSetup = () => (
    <div className="flex-1 flex flex-col p-6 animate-fade-in overflow-y-auto no-scrollbar">
      <div className="grid grid-cols-2 gap-4">
        {/* Main Bento Input Card */}
        <div className={`col-span-2 p-8 rounded-[40px] border relative overflow-hidden group transition-all duration-700 ${rpgMode ? 'rpg-card' : 'bg-white border-white shadow-xl shadow-slate-200/40'}`}>
           <div className="absolute top-0 right-0 p-8 opacity-5"><Zap size={120} /></div>
           <div className="flex items-center space-x-3 mb-6">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${rpgMode ? 'bg-red-800 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
                <HelpCircle size={20} />
              </div>
              <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${rpgMode ? 'text-red-800' : 'text-slate-400'}`}>Центр размышлений</p>
           </div>
           
           <h3 className={`text-xl font-black mb-4 ${rpgMode ? 'text-red-950 font-display-fantasy uppercase tracking-tighter' : 'text-slate-800 tracking-tight'}`}>
             О чем вы думаете?
           </h3>
           
           <textarea 
             autoFocus
             value={decisionData.topic}
             onChange={(e) => setDecisionData(prev => ({ ...prev, topic: e.target.value }))}
             placeholder="Напишите вашу дилемму..."
             className={`w-full bg-transparent text-2xl font-black tracking-tight focus:outline-none resize-none min-h-[160px] placeholder:text-slate-200 ${rpgMode ? 'text-red-950 font-display-fantasy italic' : 'text-slate-800'}`}
           />
        </div>

        {/* Info Bento Blocks */}
        <div className={`col-span-1 p-6 rounded-[32px] border flex flex-col justify-between transition-all duration-500 ${rpgMode ? 'bg-white/40 border-red-800/10' : 'bg-white border-white shadow-sm'}`}>
           <div className="flex items-center space-x-2 mb-4">
              <Columns size={16} className={rpgMode ? 'text-red-800' : 'text-amber-500'} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${rpgMode ? 'text-red-950/60' : 'text-slate-400'}`}>Подсказка</span>
           </div>
           <p className={`text-[11px] leading-relaxed font-bold ${rpgMode ? 'text-red-950' : 'text-slate-600'}`}>
             Напр: «Работа или фриланс». Мы разделим это на колонки.
           </p>
        </div>

        <div className={`col-span-1 p-6 rounded-[32px] border flex flex-col justify-between transition-all duration-500 ${rpgMode ? 'bg-white/40 border-red-800/10' : 'bg-white border-white shadow-sm'}`}>
           <div className="flex items-center space-x-2 mb-4">
              <Sparkles size={16} className={rpgMode ? 'text-red-800' : 'text-indigo-500'} />
              <span className={`text-[9px] font-black uppercase tracking-widest ${rpgMode ? 'text-red-950/60' : 'text-slate-400'}`}>Прогресс</span>
           </div>
           <p className={`text-[11px] leading-relaxed font-bold ${rpgMode ? 'text-red-950' : 'text-slate-600'}`}>
             Шаг 1 из 3: Определение сути пути.
           </p>
        </div>

        {/* Main Action Block */}
        <button 
          onClick={handleDecisionStart}
          disabled={!decisionData.topic.trim()}
          className={`col-span-2 py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center space-x-4 transition-all duration-300 active:scale-95 disabled:opacity-20 shadow-2xl ${rpgMode ? 'rpg-button' : 'bg-slate-900 text-white'}`}
        >
           <span>Начать сбор аргументов</span>
           <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );

  const totalPros = decisionData.pros.length;
  const totalCons = decisionData.cons.length;
  const totalArguments = totalPros + totalCons || 1;
  const balanceWidth = (totalPros / totalArguments) * 100;

  const renderBubbleCollector = () => (
    <div className="flex-1 flex flex-col animate-fade-in overflow-hidden no-scrollbar">
      <div className="px-6 pt-6 pb-2 shrink-0">
        {/* Compact Topic Header */}
        <div className={`p-6 rounded-[32px] border transition-all mb-4 ${rpgMode ? 'rpg-card' : 'bg-white border-white shadow-sm'}`}>
            <div className="flex items-center space-x-2 mb-2 opacity-40">
              <Target size={14} className={rpgMode ? 'text-red-800' : 'text-indigo-400'} />
              <p className="text-[9px] font-black uppercase tracking-[0.2em]">Фокус анализа</p>
            </div>
            <h3 className={`text-xl font-black tracking-tight leading-tight ${rpgMode ? 'text-red-950 font-display-fantasy italic' : 'text-slate-800'}`}>
              {decisionData.topic}
            </h3>
        </div>

        {/* Dynamic Balance Meter */}
        <div className={`p-5 rounded-3xl border mb-2 transition-all duration-700 ${rpgMode ? 'bg-white/40 border-red-800/10' : 'bg-white/80 border-white shadow-sm'}`}>
            <div className="flex justify-between items-center mb-3 px-1">
               <span className={`text-[8px] font-black uppercase tracking-widest ${rpgMode ? 'text-red-800' : 'text-slate-400'}`}>Матрица баланса</span>
               <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-center">
                    <span className={`text-[12px] font-black leading-none ${rpgMode ? 'text-red-900' : 'text-emerald-500'}`}>{totalPros}</span>
                    <span className="text-[7px] font-bold text-slate-300 uppercase">Да</span>
                  </div>
                  <div className="w-[1px] h-4 bg-slate-100"></div>
                  <div className="flex flex-col items-center">
                    <span className={`text-[12px] font-black leading-none ${rpgMode ? 'text-red-950' : 'text-rose-500'}`}>{totalCons}</span>
                    <span className="text-[7px] font-bold text-slate-300 uppercase">Нет</span>
                  </div>
               </div>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
               <motion.div 
                 initial={{ width: '50%' }}
                 animate={{ width: `${balanceWidth}%` }}
                 className={`h-full transition-all duration-1000 ${rpgMode ? 'bg-red-800 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.2)]' : 'bg-emerald-400 shadow-[inset_-2px_0_4px_rgba(0,0,0,0.1)]'}`}
               ></motion.div>
               <div className="h-full bg-slate-200 flex-1"></div>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 no-scrollbar">
        <div className="grid grid-cols-2 gap-4 h-full min-h-[300px]">
          {/* Side A / Option A Card */}
          <div 
            onClick={() => setActiveSide('A')}
            className={`flex flex-col rounded-[32px] p-6 border transition-all duration-500 text-left relative overflow-hidden cursor-pointer ${
              activeSide === 'A' 
                ? (rpgMode ? 'rpg-card ring-2 ring-red-800/20' : 'bg-white border-emerald-100 shadow-2xl shadow-emerald-200/20 scale-[1.02]') 
                : (rpgMode ? 'bg-white/40 border-red-800/10 opacity-50 blur-[0.5px]' : 'bg-slate-50 border-transparent opacity-50')
            }`}
          >
            <div className="flex justify-between items-start mb-6">
               <div className={`p-2 rounded-xl ${activeSide === 'A' ? (rpgMode ? 'bg-red-800 text-white' : 'bg-emerald-50 text-emerald-600') : 'bg-slate-200/50 text-slate-400'}`}>
                 <Plus size={14} strokeWidth={3} />
               </div>
               <h4 className={`text-[10px] font-black uppercase tracking-widest ${activeSide === 'A' ? (rpgMode ? 'text-red-800' : 'text-emerald-600') : 'text-slate-400'}`}>
                 {decisionData.decisionType === 'COMPARE' ? (decisionData.optionA || 'Вар. А') : 'За'}
               </h4>
            </div>
            
            <div className="flex-1 flex flex-col space-y-3">
              <AnimatePresence>
                {decisionData.pros.map((p, i) => (
                  <motion.div 
                    key={`a-${i}`}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`group relative p-4 rounded-2xl text-[12px] font-bold border transition-all ${rpgMode ? 'bg-white border-red-800 text-red-950' : 'bg-white border-emerald-50 text-slate-700 shadow-sm'}`}
                  >
                    {p}
                    <button onClick={(e) => { e.stopPropagation(); removeBubble('A', i); }} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {activeSide === 'A' && decisionData.pros.length === 0 && (
                 <p className={`text-[11px] font-bold italic mt-4 opacity-30 ${rpgMode ? 'text-red-950' : 'text-slate-400'}`}>
                   Добавьте аргументы ЗА...
                 </p>
              )}
            </div>
            
            {activeSide === 'A' && (
              <div className="absolute bottom-6 right-6 opacity-20 group-hover:opacity-100 transition-opacity">
                 <Wand2 size={24} className={rpgMode ? 'text-red-800' : 'text-emerald-400'} />
              </div>
            )}
          </div>

          {/* Side B / Option B Card */}
          <div 
            onClick={() => setActiveSide('B')}
            className={`flex flex-col rounded-[32px] p-6 border transition-all duration-500 text-left relative overflow-hidden cursor-pointer ${
              activeSide === 'B' 
                ? (rpgMode ? 'rpg-card ring-2 ring-red-800/20' : 'bg-white border-rose-100 shadow-2xl shadow-rose-200/20 scale-[1.02]') 
                : (rpgMode ? 'bg-white/40 border-red-800/10 opacity-50 blur-[0.5px]' : 'bg-slate-50 border-transparent opacity-50')
            }`}
          >
            <div className="flex justify-between items-start mb-6">
               <div className={`p-2 rounded-xl ${activeSide === 'B' ? (rpgMode ? 'bg-red-800 text-white' : 'bg-rose-50 text-rose-600') : 'bg-slate-200/50 text-slate-400'}`}>
                 <Plus size={14} strokeWidth={3} />
               </div>
               <h4 className={`text-[10px] font-black uppercase tracking-widest ${activeSide === 'B' ? (rpgMode ? 'text-red-800' : 'text-rose-600') : 'text-slate-400'}`}>
                 {decisionData.decisionType === 'COMPARE' ? (decisionData.optionB || 'Вар. Б') : 'Против'}
               </h4>
            </div>

            <div className="flex-1 flex flex-col space-y-3">
              <AnimatePresence>
                {decisionData.cons.map((c, i) => (
                  <motion.div 
                    key={`b-${i}`}
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className={`group relative p-4 rounded-2xl text-[12px] font-bold border transition-all ${rpgMode ? 'bg-white border-red-800 text-red-950' : 'bg-white border-rose-50 text-slate-700 shadow-sm'}`}
                  >
                    {c}
                    <button onClick={(e) => { e.stopPropagation(); removeBubble('B', i); }} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {activeSide === 'B' && decisionData.cons.length === 0 && (
                 <p className={`text-[11px] font-bold italic mt-4 opacity-30 ${rpgMode ? 'text-red-950' : 'text-slate-400'}`}>
                   Добавьте аргументы ПРОТИВ...
                 </p>
              )}
            </div>
            
            {activeSide === 'B' && (
              <div className="absolute bottom-6 right-6 opacity-20 group-hover:opacity-100 transition-opacity">
                 <Wand2 size={24} className={rpgMode ? 'text-red-800' : 'text-rose-400'} />
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Analyze Block */}
        {(totalPros > 0 || totalCons > 0) && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-6 pb-20"
          >
            <button 
              onClick={performAnalysis} 
              className={`w-full py-7 rounded-[40px] font-black text-[13px] uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center space-x-5 active:scale-[0.97] transition-all overflow-hidden relative group ${rpgMode ? 'rpg-button' : 'bg-slate-900 text-white'}`}
            >
               <Wand2 size={22} className="group-hover:rotate-12 transition-transform duration-500" />
               <span>Синтезировать</span>
               <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-[-30deg]"></div>
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full animate-fade-in relative z-10 transition-all duration-500 ${rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-white/50 backdrop-blur-sm'}`}>
      <div className={`px-6 py-4 border-b sticky top-0 z-20 transition-all duration-500 ${rpgMode ? 'bg-white/40 border-red-800/30' : 'bg-white/80 backdrop-blur-xl border-slate-100'}`}>
        <div className="flex items-center justify-between mb-1">
          <button onClick={handleBack} className={`p-2 -ml-2 transition-colors rounded-full ${rpgMode ? 'text-red-800 hover:bg-red-800/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}><ArrowLeft size={20} /></button>
          {mode === 'DECISION' && !readOnly && (
            <div className="flex items-center space-x-2">
               <span className={`text-[8px] font-black uppercase tracking-widest ${rpgMode ? 'text-red-950/40' : 'text-slate-400'}`}>Сборка</span>
               <div className="flex space-x-1.5">
                  {[1, 2, 4].map((s) => (
                    <div key={s} className={`h-1 rounded-full transition-all duration-700 ${decisionStep === s ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-200'}`}></div>
                  ))}
               </div>
            </div>
          )}
          <div className="w-8"></div>
        </div>
        <h2 className={`text-base font-black tracking-tight uppercase tracking-tighter italic ${rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>
          {mode === 'DECISION' ? 'Архитектор решений' : mode === 'EMOTIONS' ? 'Океан чувств' : 'Летопись'}
        </h2>
      </div>

      <div className="flex-1 overflow-hidden relative flex flex-col">
        {mode === 'DECISION' ? (
           <>
             {decisionStep === 1 && renderDecisionSetup()}
             {decisionStep === 2 && renderBubbleCollector()}
             {decisionStep === 3 && (
               <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8 animate-fade-in">
                 <div className="relative">
                   <motion.div 
                     animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                     transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                     className="absolute inset-0 bg-indigo-100/50 rounded-full blur-3xl"
                   ></motion.div>
                   <Loader2 size={64} strokeWidth={1} className="text-indigo-600 animate-spin relative z-10" />
                 </div>
                 <div className="text-center space-y-2">
                   <p className="text-base font-black text-slate-900 uppercase tracking-[0.3em]">Синтез данных</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] italic max-w-[200px] mx-auto leading-relaxed">
                     Складываем пазл вероятностей в единый вектор истины...
                   </p>
                 </div>
               </div>
             )}
             {decisionStep === 4 && (
               <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 pb-24 space-y-8 scroll-smooth no-scrollbar">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.type === 'decision-card' ? 'w-full -mx-5' : msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`${msg.type === 'decision-card' ? 'w-full' : 'max-w-[85%]'} flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {msg.type === 'decision-card' && msg.decisionData ? (
                          <div className="w-full">
                            <InsightCard data={msg.decisionData} rpgMode={rpgMode} />
                          </div>
                        ) : (
                          <div className={`px-5 py-4 rounded-[28px] text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? (rpgMode ? 'rpg-button rounded-br-sm' : 'bg-slate-900 text-white rounded-br-sm') : (rpgMode ? 'bg-white border-2 border-red-800/20 text-red-950 rounded-bl-sm' : 'bg-white text-slate-700 rounded-bl-sm border border-slate-100 shadow-sm')}`}>{formatMessage(msg.content)}</div>
                        )}
                      </div>
                    </div>
                  ))}
               </div>
             )}
           </>
        ) : (
          <div ref={scrollRef} className="h-full overflow-y-auto p-5 pb-24 space-y-6 scroll-smooth no-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`px-5 py-4 rounded-[28px] text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? (rpgMode ? 'rpg-button rounded-br-sm' : 'bg-slate-900 text-white rounded-br-sm') : (rpgMode ? 'bg-white border-2 border-red-800/20 text-red-950 rounded-bl-sm' : 'bg-white text-slate-700 rounded-bl-sm border border-slate-100 shadow-sm')}`}>{formatMessage(msg.content)}</div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-fade-in">
                <div className={`px-5 py-4 rounded-[24px] rounded-bl-sm border shadow-sm ${rpgMode ? 'bg-white border-red-800/20' : 'bg-white border-slate-100'}`}>
                  <div className="flex items-center space-x-1.5 h-4">
                    <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${rpgMode ? 'bg-red-800' : 'bg-indigo-300'}`} style={{ animationDelay: '0ms' }}></div>
                    <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${rpgMode ? 'bg-red-800' : 'bg-indigo-300'}`} style={{ animationDelay: '150ms' }}></div>
                    <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${rpgMode ? 'bg-red-800' : 'bg-indigo-300'}`} style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!readOnly && (decisionStep !== 3) && (decisionStep !== 1) && (
        <div className={`p-4 safe-area-bottom z-30 bg-gradient-to-t ${rpgMode ? 'from-[#fdf6e3]' : 'from-white'} via-white/95 to-transparent`}>
          <div className={`relative flex items-center p-1 rounded-[32px] border shadow-2xl transition-all overflow-hidden ${rpgMode ? 'bg-white border-red-800/40' : 'bg-white border-slate-100 focus-within:border-indigo-300'}`}>
            <div className={`pl-5 pr-2 ${rpgMode ? 'text-red-800' : 'text-slate-300'}`}>
               <MessageSquare size={18} />
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={
                mode === 'DECISION' && decisionStep === 2 ? `Аргумент для «${activeSide === 'A' ? (decisionData.decisionType === 'COMPARE' ? 'А' : 'ЗА') : (decisionData.decisionType === 'COMPARE' ? 'Б' : 'ПРОТИВ')}»...` :
                mode === 'DECISION' && decisionStep === 4 ? "Есть вопросы к ИИ?" :
                "Поделитесь мыслью..."
              }
              className="flex-1 bg-transparent text-[15px] font-medium px-2 py-4 focus:outline-none"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`w-12 h-12 flex items-center justify-center transition-all rounded-2xl ${rpgMode ? 'bg-red-800 text-white' : 'bg-slate-900 text-white disabled:bg-slate-100 disabled:text-slate-300'}`}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          {decisionStep === 2 && (
            <p className="text-[10px] text-center mt-3 text-slate-400 font-black uppercase tracking-[0.2em] animate-pulse">
               Переключите карту, чтобы изменить колонку
            </p>
          )}
        </div>
      )}
    </div>
  );
};