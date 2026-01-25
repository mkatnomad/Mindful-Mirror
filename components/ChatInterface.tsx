
import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2, Sparkles, Scale, Columns, Trash2, CheckCircle2, Wand2, Plus, Zap, Heart, Info, X } from 'lucide-react';
import { JournalMode, Message, DecisionData } from '../types';
import { InsightCard } from './InsightCard';
import { sendMessageToGemini, analyzeDecision, refineDecision } from '../services/geminiService';

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

    let greeting = "";
    if (mode === 'DECISION') {
      setDecisionStep(1);
      greeting = rpgMode 
        ? "Что стоит на кону? Опишите дилемму или два пути, между которыми колеблетесь."
        : "О чем вы размышляете? Опишите ситуацию или варианты для сравнения (например: «Работа или Фриланс»).";
    } else {
      greeting = mode === 'EMOTIONS' 
        ? (rpgMode ? "Приветствую. Какая буря бушует в вашей душе?" : "Привет. Какие эмоции вы испытываете сейчас?")
        : (rpgMode ? "Присядьте у очага. Расскажите о своих подвигах за день." : "Давайте немного замедлимся. Как прошел ваш день?");
    }

    setMessages([{
      id: 'init',
      role: 'assistant',
      content: greeting,
      timestamp: Date.now()
    }]);
    
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

  useEffect(() => {
    if (!readOnly && inputRef.current) {
      inputRef.current.focus();
    }
  }, [decisionStep, readOnly]);

  const handleBack = () => {
    if (!readOnly && onSessionComplete && (messages.length > 1 || decisionStep > 2)) {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      onSessionComplete(messages, duration);
    }
    onBack();
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || readOnly) return;

    if (mode === 'DECISION') {
      if (decisionStep === 1) {
        const compareRegex = /(.+?)\s+(?:или|vs|против|or|или же)\s+(.+)/i;
        const match = text.match(compareRegex);
        
        const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInput('');

        if (match) {
          setDecisionData(prev => ({ 
            ...prev, 
            decisionType: 'COMPARE', 
            optionA: match[1].trim(), 
            optionB: match[2].trim(),
            topic: text
          }));
        } else {
          setDecisionData(prev => ({ 
            ...prev, 
            decisionType: 'SINGLE', 
            topic: text 
          }));
        }
        
        setDecisionStep(2);
        return;
      }

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
        content: updatedData.analysis?.verdict || "Анализ завершен. Ознакомьтесь с отчетом ниже.",
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

  const renderBubbleCollector = () => (
    <div className="flex flex-col h-full animate-fade-in overflow-hidden">
      <div className="p-6 pb-2 shrink-0">
        <div className="flex items-center space-x-2 mb-2">
          <Info size={14} className="text-indigo-400" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Сбор аргументов</p>
        </div>
        <h3 className={`text-2xl font-black italic tracking-tighter leading-tight line-clamp-2 ${rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>
          {decisionData.topic}
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className={`flex flex-col rounded-3xl p-4 transition-all min-h-[160px] ${activeSide === 'A' ? (rpgMode ? 'bg-red-50 ring-1 ring-red-800 shadow-lg' : 'bg-emerald-50/50 ring-1 ring-emerald-100 shadow-md') : 'bg-slate-50 opacity-60'}`} onClick={() => setActiveSide('A')}>
            <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center justify-between ${activeSide === 'A' ? 'text-emerald-600' : 'text-slate-400'}`}>
              <span>{decisionData.decisionType === 'COMPARE' ? (decisionData.optionA || 'Вар. А') : 'Плюсы'}</span>
              {activeSide === 'A' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>}
            </h4>
            <div className="flex flex-wrap gap-2">
              {decisionData.pros.map((p, i) => (
                <div key={i} className={`group relative px-3 py-2 rounded-xl text-xs font-bold animate-fade-in-up border shadow-sm ${rpgMode ? 'bg-white border-red-800 text-red-950' : 'bg-white border-emerald-100 text-emerald-800'}`}>
                  {p}
                  <button onClick={(e) => { e.stopPropagation(); removeBubble('A', i); }} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center"><X size={10} /></button>
                </div>
              ))}
              {activeSide === 'A' && <div className="px-3 py-2 rounded-xl text-xs font-bold border border-dashed border-emerald-300 text-emerald-400 animate-pulse">Пишите...</div>}
            </div>
          </div>

          <div className={`flex flex-col rounded-3xl p-4 transition-all min-h-[160px] ${activeSide === 'B' ? (rpgMode ? 'bg-red-50 ring-1 ring-red-800 shadow-lg' : 'bg-rose-50/50 ring-1 ring-rose-100 shadow-md') : 'bg-slate-50 opacity-60'}`} onClick={() => setActiveSide('B')}>
            <h4 className={`text-[10px] font-black uppercase tracking-widest mb-4 flex items-center justify-between ${activeSide === 'B' ? 'text-rose-600' : 'text-slate-400'}`}>
              <span>{decisionData.decisionType === 'COMPARE' ? (decisionData.optionB || 'Вар. Б') : 'Минусы'}</span>
              {activeSide === 'B' && <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>}
            </h4>
            <div className="flex flex-wrap gap-2">
              {decisionData.cons.map((c, i) => (
                <div key={i} className={`group relative px-3 py-2 rounded-xl text-xs font-bold animate-fade-in-up border shadow-sm ${rpgMode ? 'bg-white border-red-800 text-red-950' : 'bg-white border-rose-100 text-rose-800'}`}>
                  {c}
                  <button onClick={(e) => { e.stopPropagation(); removeBubble('B', i); }} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center"><X size={10} /></button>
                </div>
              ))}
              {activeSide === 'B' && <div className="px-3 py-2 rounded-xl text-xs font-bold border border-dashed border-rose-300 text-rose-400 animate-pulse">Пишите...</div>}
            </div>
          </div>
        </div>

        {(decisionData.pros.length > 0 || decisionData.cons.length > 0) && (
          <div className="pt-4 pb-12">
            <button onClick={performAnalysis} className={`w-full py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-xl flex items-center justify-center space-x-3 active:scale-95 transition-all ${rpgMode ? 'rpg-button' : 'bg-slate-900 text-white'}`}>
               <Wand2 size={18} />
               <span>Провести анализ</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className={`flex flex-col h-full animate-fade-in relative z-10 transition-all duration-500 ${rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-white/50 backdrop-blur-sm'}`}>
      <div className={`px-6 py-4 border-b sticky top-0 z-20 transition-all duration-500 ${rpgMode ? 'bg-white/40 border-red-800/30' : 'bg-white/80 backdrop-blur-xl border-slate-100'}`}>
        <div className="flex items-center justify-between mb-2">
          <button onClick={handleBack} className={`p-2 -ml-2 transition-colors rounded-full ${rpgMode ? 'text-red-800 hover:bg-red-800/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}><ArrowLeft size={20} /></button>
          {mode === 'DECISION' && !readOnly && (
            <div className="flex space-x-1.5">
               {[1, 2, 4].map((s) => (
                 <div key={s} className={`h-1 rounded-full transition-all duration-500 ${decisionStep === s ? 'w-6 bg-indigo-600' : 'w-2 bg-slate-200'}`}></div>
               ))}
            </div>
          )}
          <div className="w-8"></div>
        </div>
        <h2 className={`text-base font-black tracking-tight uppercase tracking-tighter italic ${rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-800'}`}>
          {mode === 'DECISION' ? 'Принятие решения' : mode === 'EMOTIONS' ? 'Состояние' : 'Рефлексия'}
        </h2>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {mode === 'DECISION' && decisionStep === 2 ? renderBubbleCollector() : (
          <div ref={scrollRef} className="h-full overflow-y-auto p-5 pb-24 space-y-6 scroll-smooth">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${msg.type === 'decision-card' ? 'w-full px-0' : ''}`}>
                <div className={`${msg.type === 'decision-card' ? 'w-full' : 'max-w-[85%]'} flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.type === 'decision-card' && msg.decisionData ? (
                    <div className="w-full -mx-5 px-5 lg:px-0">
                      <InsightCard data={msg.decisionData} />
                    </div>
                  ) : (
                    <div className={`px-5 py-4 rounded-[24px] text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${msg.role === 'user' ? (rpgMode ? 'rpg-button rounded-br-sm' : 'bg-slate-900 text-white rounded-br-sm') : (rpgMode ? 'bg-white border-2 border-red-800/20 text-red-950 rounded-bl-sm' : 'bg-white text-slate-700 rounded-bl-sm border border-slate-100 shadow-slate-200 shadow-sm')}`}>{formatMessage(msg.content)}</div>
                  )}
                </div>
              </div>
            ))}
            
            {decisionStep === 3 && (
              <div className="flex flex-col items-center justify-center p-8 space-y-4 animate-fade-in">
                <Loader2 size={32} className="text-indigo-500 animate-spin" />
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Анализирую нити судьбы...</p>
              </div>
            )}
            {isLoading && decisionStep === 4 && <Loader2 className="mx-auto text-indigo-400 animate-spin mt-4" />}
          </div>
        )}
      </div>

      {!readOnly && (decisionStep !== 3) && (
        <div className={`p-4 safe-area-bottom z-30 bg-gradient-to-t ${rpgMode ? 'from-[#fdf6e3]' : 'from-white'} via-white/95 to-transparent`}>
          <div className={`relative flex items-center rounded-[28px] border shadow-sm transition-all overflow-hidden ${rpgMode ? 'bg-white border-red-800/30' : 'bg-white border-slate-100 focus-within:border-indigo-200 focus-within:shadow-md'}`}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
              placeholder={
                mode === 'DECISION' && decisionStep === 1 ? "Твое сомнение..." :
                mode === 'DECISION' && decisionStep === 2 ? `Аргумент ${activeSide === 'A' ? (decisionData.decisionType === 'COMPARE' ? '«А»' : '«ЗА»') : (decisionData.decisionType === 'COMPARE' ? '«Б»' : '«ПРОТИВ»')}...` :
                "Ваша мысль..."
              }
              className="flex-1 bg-transparent text-[15px] px-6 py-4 focus:outline-none"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-3 mr-2 transition-all rounded-full ${rpgMode ? 'text-red-800' : 'text-indigo-600 disabled:opacity-30'}`}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
          {decisionStep === 2 && (
            <p className="text-[10px] text-center mt-3 text-slate-400 font-bold uppercase tracking-widest animate-pulse">
               Нажми на другую колонку, чтобы сменить сторону
            </p>
          )}
        </div>
      )}
    </div>
  );
};
