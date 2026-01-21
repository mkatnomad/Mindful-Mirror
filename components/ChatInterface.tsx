import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
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

const PRO_VARIANTS = [
  "Отлично. Что еще хорошего вы видите?",
  "Принято. Какие еще есть плюсы?",
  "Звучит убедительно. Есть ли что-то еще?",
  "Хороший пункт. Продолжайте.",
  "Записал. Что еще говорит 'за'?"
];

const CON_VARIANTS = [
  "Понимаю. Что вас беспокоит?",
  "Справедливо. Какие еще есть риски?",
  "Это важный момент. Что еще смущает?",
  "Учел. Есть ли другие минусы?",
  "Ясно. Какие еще аргументы 'против'?"
];

const EMPTY_MESSAGES: Message[] = [];

const getRandomResponse = (variants: string[]) => {
  return variants[Math.floor(Math.random() * variants.length)];
};

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
  initialMessages = EMPTY_MESSAGES,
  rpgMode = false
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  const [decisionStep, setDecisionStep] = useState<number>(0); 
  const [decisionData, setDecisionData] = useState<DecisionData>({ topic: '', pros: [], cons: [] });

  useEffect(() => {
    if (readOnly && initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
      // Try to extract decision data if it's a decision card session
      const cardMsg = initialMessages.find(m => m.type === 'decision-card');
      if (cardMsg?.decisionData) {
        setDecisionData(cardMsg.decisionData);
      }
      return;
    }

    let greeting = '';
    if (mode === 'DECISION') {
      greeting = rpgMode 
        ? "Вас терзают сомнения? Давайте воззовем к мудрости и разберем этот выбор. О чем вы просите совета?"
        : "Сложный выбор? Давайте разложим всё по полочкам. Какое решение вы пытаетесь принять?";
    } else if (mode === 'EMOTIONS') {
      greeting = rpgMode
        ? "Приветствую. Какая буря бушует в вашей душе? Опишите свои чувства, и мы найдем в них скрытую силу."
        : "Привет. Какие эмоции вы испытываете сейчас? Опишите свое состояние, и мы вместе попробуем его понять.";
    } else {
      greeting = rpgMode
        ? "Присядьте у очага. Расскажите о своих подвигах за день или об откровениях, что посетили вас."
        : "Давайте немного замедлимся. Расскажите, как прошел ваш день или что важного вы сегодня осознали?";
    }

    setMessages([{
      id: 'init',
      role: 'assistant',
      content: greeting,
      timestamp: Date.now()
    }]);
    
    startTimeRef.current = Date.now();
  }, [mode, readOnly, initialMessages, rpgMode]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);

  const handleBack = () => {
    if (!readOnly && onSessionComplete && messages.length > 1) {
      const duration = (Date.now() - startTimeRef.current) / 1000;
      onSessionComplete(messages, duration);
    }
    onBack();
  };

  const handleDecisionFlowStep = (userText: string, currentData: DecisionData): { text: string, done: boolean, latestData: DecisionData } => {
    let nextData = { ...currentData };

    if (decisionStep === 0) {
      nextData.topic = userText;
      setDecisionData(nextData);
      setDecisionStep(1);
      return { 
        text: rpgMode 
          ? `Ясно. Начнем со Светлых сторон. Какие дары принесет этот выбор?\n\n(Напишите 'далее', когда закончите список)` 
          : `Хорошо. Давайте начнем с плюсов. Какие преимущества у этого варианта?\n\n(Напишите 'далее', когда перечислите всё)`, 
        done: false,
        latestData: nextData
      };
    }
    
    if (decisionStep === 1) {
      const lower = userText.toLowerCase();
      const isCommand = lower.includes('далее') || lower.includes('все') || lower.includes('готово');
      const cleanText = userText.replace(/далее|все|всё|готово/gi, '').trim();
      
      if (cleanText.length > 0) {
        nextData.pros = [...nextData.pros, cleanText];
        setDecisionData(nextData);
      }

      if (isCommand) {
        setDecisionStep(2);
        return { 
          text: rpgMode
            ? `Вижу. А теперь взглянем в Тень. Какие риски или потери таятся за этим шагом?\n\n(Напишите 'готово', когда закончите)`
            : `Понял. Теперь давайте честно посмотрим на минусы и риски. Что вас смущает?\n\n(Напишите 'готово', когда перечислите всё)`, 
          done: false,
          latestData: nextData
        };
      } else {
        const response = getRandomResponse(PRO_VARIANTS);
        return { 
          text: `${response}\n\n(Напишите 'далее', когда перечислите всё)`, 
          done: false,
          latestData: nextData
        };
      }
    }

    if (decisionStep === 2) {
      const lower = userText.toLowerCase();
      const isCommand = lower.includes('готово') || lower.includes('всё') || lower.includes('все') || lower.includes('закончил');
      const cleanText = userText.replace(/готово|всё|все|закончил/gi, '').trim();

      if (cleanText.length > 0) {
        nextData.cons = [...nextData.cons, cleanText];
        setDecisionData(nextData);
      }

      if (isCommand) {
        setDecisionStep(3);
        return { text: "", done: true, latestData: nextData }; 
      } else {
        const response = getRandomResponse(CON_VARIANTS);
        return { 
          text: `${response}\n\n(Напишите 'готово', когда перечислите всё)`, 
          done: false,
          latestData: nextData
        };
      }
    }
    
    return { text: "", done: true, latestData: nextData };
  };

  const handleSend = async () => {
    if (!input.trim() || readOnly) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (mode === 'DECISION') {
        if (decisionStep === 4) {
           await new Promise(r => setTimeout(r, 600));
           const { text, data } = await refineDecision(decisionData, userMsg.content);
           setDecisionData(data);
           setMessages(prev => [
             ...prev,
             {
               id: (Date.now() + 1).toString(),
               role: 'assistant',
               content: text,
               timestamp: Date.now()
             },
             {
               id: (Date.now() + 2).toString(),
               role: 'assistant',
               content: '',
               type: 'decision-card',
               decisionData: data,
               timestamp: Date.now() + 100
             }
           ]);
           setIsLoading(false);
           return;
        }

        await new Promise(r => setTimeout(r, 600)); 
        const { text, done, latestData } = handleDecisionFlowStep(userMsg.content, decisionData);
        
        if (!done) {
          const botMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: text,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, botMsg]);
        } else {
          const analysisMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: rpgMode ? "Собираю крупицы мудрости..." : "Анализирую ваши данные... Минутку.",
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, analysisMsg]);
          
          const analysisText = await analyzeDecision(latestData);
          setDecisionStep(4);

          setMessages(prev => {
             const newArr = [...prev];
             newArr.pop();
             return [
               ...newArr,
               {
                 id: (Date.now() + 2).toString(),
                 role: 'assistant',
                 content: analysisText,
                 timestamp: Date.now()
               },
               {
                 id: (Date.now() + 3).toString(),
                 role: 'assistant',
                 content: '',
                 type: 'decision-card',
                 decisionData: latestData,
                 timestamp: Date.now() + 100
               },
               {
                 id: (Date.now() + 4).toString(),
                 role: 'assistant',
                 content: rpgMode 
                  ? "Если ваше видение изменилось, просто поведайте мне об этом (например, 'добавь в светлое...')."
                  : "Если хотите что-то добавить или изменить, просто напишите мне об этом (например, 'добавь плюс...').",
                 timestamp: Date.now() + 200
               }
             ];
          });
        }
      } else {
        const botResponseText = await sendMessageToGemini(messages, userMsg.content, mode as 'EMOTIONS' | 'REFLECTION');
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: botResponseText,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, botMsg]);
      }

    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Магия дала сбой. Пожалуйста, повторите свой запрос.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col h-full animate-fade-in relative z-10 transition-all duration-500 ${rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-white/50 backdrop-blur-sm'}`}>
      {/* Header */}
      <div className={`flex items-center px-6 py-4 border-b sticky top-0 z-20 shadow-sm transition-all duration-500 ${
        rpgMode ? 'bg-white/40 border-red-800/30' : 'bg-white/80 backdrop-blur-xl border-slate-100'
      }`}>
        <button onClick={handleBack} className={`p-2 -ml-2 transition-colors rounded-full ${
          rpgMode ? 'text-red-800 hover:bg-red-800/10' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
        }`}>
          <ArrowLeft size={20} />
        </button>
        <div className="ml-4">
          <h2 className={`text-base font-bold tracking-tight ${rpgMode ? 'text-red-950 font-display-fantasy italic uppercase' : 'text-slate-800'}`}>
            {readOnly ? (rpgMode ? 'Летопись' : 'Просмотр истории') : (
              mode === 'DECISION' ? (rpgMode ? 'Алхимия выбора' : 'Сложное решение') : 
              mode === 'EMOTIONS' ? (rpgMode ? 'Свиток чувств' : 'Состояние') : 
              (rpgMode ? 'Дневник странника' : 'Рефлексия')
            )}
          </h2>
          {!readOnly && (
            <div className="flex items-center space-x-1.5">
               <div className={`w-1.5 h-1.5 rounded-full ${rpgMode ? 'bg-red-800 animate-pulse shadow-[0_0_8px_rgba(185,28,28,0.8)]' : 'bg-green-400'}`}></div>
               <p className={`text-[10px] font-bold uppercase tracking-widest ${rpgMode ? 'text-red-800/70 font-display-fantasy' : 'text-slate-400'}`}>
                 {rpgMode ? 'Эфир открыт' : 'Онлайн'}
               </p>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className={`flex-1 overflow-y-auto p-5 space-y-6 scroll-smooth ${readOnly ? 'pb-10' : 'pb-24'}`}>
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              {msg.type === 'decision-card' && msg.decisionData ? (
                <InsightCard data={msg.decisionData} />
              ) : (
                <div 
                  className={`
                    px-5 py-4 rounded-[20px] text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap transition-all duration-300
                    ${msg.role === 'user' 
                      ? (rpgMode 
                          ? 'rpg-button rounded-br-sm lowercase' 
                          : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm shadow-indigo-200')
                      : (rpgMode
                          ? 'bg-white border-2 border-red-800/20 text-red-950 rounded-bl-sm shadow-inner'
                          : 'bg-white text-slate-700 rounded-bl-sm border border-slate-100 shadow-slate-200')}
                  `}
                >
                  {formatMessage(msg.content)}
                </div>
              )}
              <span className={`text-[10px] mt-1.5 px-2 font-bold uppercase tracking-wider ${rpgMode ? 'text-red-800/40 font-display-fantasy' : 'text-slate-400'}`}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className={`px-5 py-4 rounded-[20px] rounded-bl-sm border shadow-sm transition-all duration-500 ${
              rpgMode ? 'bg-white border-red-800/20' : 'bg-white border-slate-100'
            }`}>
              <div className="flex space-x-1.5">
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${rpgMode ? 'bg-red-800' : 'bg-slate-300'}`} style={{ animationDelay: '0ms' }}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${rpgMode ? 'bg-red-800' : 'bg-slate-300'}`} style={{ animationDelay: '150ms' }}></div>
                <div className={`w-1.5 h-1.5 rounded-full animate-bounce ${rpgMode ? 'bg-red-800' : 'bg-slate-300'}`} style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      {!readOnly && (
        <div className={`absolute bottom-0 w-full p-4 safe-area-bottom z-20 transition-all duration-500 ${
          rpgMode ? 'bg-gradient-to-t from-[#fdf6e3] via-[#fdf6e3]/95 to-transparent' : 'bg-gradient-to-t from-white via-white/95 to-transparent'
        }`}>
          <div className={`relative flex items-center rounded-[24px] border shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all ${
            rpgMode 
              ? 'bg-white border-red-800/30 focus-within:border-red-800' 
              : 'bg-white border-slate-200 focus-within:shadow-[0_4px_20px_-4px_rgba(99,102,241,0.15)] focus-within:border-indigo-200'
          }`}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                decisionStep === 1 ? (rpgMode ? "Записать в Светлое..." : "Добавить плюс...") : 
                decisionStep === 2 ? (rpgMode ? "Записать в Темное..." : "Добавить минус...") : 
                "Ваш голос..."
              }
              className={`flex-1 bg-transparent text-[15px] px-6 py-4 focus:outline-none placeholder:text-slate-400 ${
                rpgMode ? 'text-red-950' : 'text-slate-800'
              }`}
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`p-3 mr-2 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-full ${
                rpgMode 
                  ? 'text-red-800 hover:bg-red-100' 
                  : 'text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : (rpgMode ? <Sparkles size={20} /> : <Send size={20} />)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};