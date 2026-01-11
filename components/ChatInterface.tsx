import React, { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft, Loader2 } from 'lucide-react';
import { JournalMode, Message, DecisionData } from '../types';
import { InsightCard } from './InsightCard';
// Импортируем нашу единственную рабочую функцию
import { sendMessageToGemini } from '../services/geminiService';

interface ChatInterfaceProps {
  mode: JournalMode;
  onBack: () => void;
  onSessionComplete?: (messages: Message[], durationSeconds: number) => void;
  readOnly?: boolean;
  initialMessages?: Message[];
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

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ РЕШЕНИЙ (Адаптированы под OpenRouter) ---

const analyzeDecisionAI = async (data: DecisionData): Promise<string> => {
  const prompt = `
    Проанализируй данные по решению:
    Тема: ${data.topic}
    Плюсы: ${data.pros.join(', ')}
    Минусы: ${data.cons.join(', ')}
    
    Дай краткий, взвешенный совет. Какой вариант выглядит предпочтительнее? На что обратить внимание?
  `;
  return await sendMessageToGemini(prompt);
};

const refineDecisionAI = async (data: DecisionData, userMessage: string): Promise<{ text: string, data: DecisionData }> => {
  // Простая логика обработки уточнений
  const newData = { ...data };
  const lowerMsg = userMessage.toLowerCase();
  
  let responseText = "Принято.";

  if (lowerMsg.includes("плюс") || lowerMsg.includes("добавь")) {
     newData.pros.push(userMessage);
     responseText = "Добавил новый аргумент в плюсы. Что-то еще?";
  } else if (lowerMsg.includes("минус") || lowerMsg.includes("риск")) {
     newData.cons.push(userMessage);
     responseText = "Добавил этот риск в минусы. Еще что-то?";
  } else {
     // Если просто текст, спросим ИИ
     const prompt = `Пользователь уточнил по поводу решения "${data.topic}": "${userMessage}". Как это влияет на ситуацию? Ответь кратко.`;
     responseText = await sendMessageToGemini(prompt);
  }

  return { text: responseText, data: newData };
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  mode, 
  onBack, 
  onSessionComplete, 
  readOnly = false,
  initialMessages = EMPTY_MESSAGES
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Decision Flow State
  const [decisionStep, setDecisionStep] = useState<number>(0); 
  const [decisionData, setDecisionData] = useState<DecisionData>({ topic: '', pros: [], cons: [] });

  // Initial Greeting
  useEffect(() => {
    if (readOnly && initialMessages.length > 0) {
      setMessages(initialMessages);
      return;
    }

    let greeting = '';
    if (mode === 'DECISION') {
      greeting = "Сложный выбор? Давайте разложим всё по полочкам. Какое решение вы пытаетесь принять?";
    } else if (mode === 'EMOTIONS') {
      greeting = "Привет. Какие эмоции вы испытываете сейчас? Опишите свое состояние, и мы вместе попробуем его понять.";
    } else {
      greeting = "Давайте немного замедлимся. Расскажите, как прошел ваш день или что важного вы сегодня осознали?";
    }

    setMessages([{
      id: 'init',
      role: 'assistant',
      content: greeting,
      timestamp: Date.now()
    }]);
    
    startTimeRef.current = Date.now();
  }, [mode, readOnly, initialMessages]);

  // Auto-scroll
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
        text: `Хорошо. Давайте начнем с плюсов. Какие преимущества у этого варианта?\n\n(Напишите 'далее', когда перечислите всё)`, 
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
          text: `Понял. Теперь давайте честно посмотрим на минусы и риски. Что вас смущает?\n\n(Напишите 'готово', когда перечислите всё)`, 
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
    if (!input.trim()) return;

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
        // Режим уточнения (Шаг 4)
        if (decisionStep === 4) {
           await new Promise(r => setTimeout(r, 600));
           // Используем нашу новую локальную функцию
           const { text, data } = await refineDecisionAI(decisionData, userMsg.content);
           
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

        // Обычные шаги (0-3)
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
          // Финализация
          const analysisMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: "Анализирую ваши данные... Минутку.",
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, analysisMsg]);
          
          // Вызываем ИИ через наш сервис
          const analysisText = await analyzeDecisionAI(latestData);
          
          setDecisionStep(4);

          setMessages(prev => {
             const newArr = [...prev];
             newArr.pop(); // удаляем "analyzing..."
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
                 content: "Если хотите что-то добавить, просто напишите.",
                 timestamp: Date.now() + 200
               }
             ];
          });
        }
      } else {
        // Обычный чат (Эмоции, Дневник)
        // Формируем историю для контекста
        const historyForAi = messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content
        }));
        
        const botResponseText = await sendMessageToGemini(userMsg.content, historyForAi);
        
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
        content: "Произошла ошибка связи. Пожалуйста, попробуйте еще раз.",
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
    <div className="flex flex-col h-full bg-white/50 backdrop-blur-sm animate-fade-in relative z-10">
      {/* Header */}
      <div className="flex items-center px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <button onClick={handleBack} className="p-2 -ml-2 text-slate-500 hover:text-slate-800 transition-colors rounded-full hover:bg-slate-100">
          <ArrowLeft size={20} />
        </button>
        <div className="ml-4">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">
            {readOnly ? 'Просмотр истории' : (
              mode === 'DECISION' ? 'Сложное решение' : mode === 'EMOTIONS' ? 'Эмоции' : 'Рефлексия'
            )}
          </h2>
          {!readOnly && (
            <div className="flex items-center space-x-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
               <p className="text-xs text-slate-400 font-medium">Онлайн</p>
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
                    px-5 py-4 rounded-[20px] text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap
                    ${msg.role === 'user' 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-br-sm shadow-indigo-200' 
                      : 'bg-white text-slate-700 rounded-bl-sm border border-slate-100 shadow-slate-200'}
                  `}
                >
                  {formatMessage(msg.content)}
                </div>
              )}
              <span className="text-[10px] text-slate-400 mt-1.5 px-2 font-medium">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white px-5 py-4 rounded-[20px] rounded-bl-sm border border-slate-100 shadow-sm">
              <div className="flex space-x-1.5">
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Only show if not Read Only */}
      {!readOnly && (
        <div className="absolute bottom-0 w-full p-4 safe-area-bottom z-20 bg-gradient-to-t from-white via-white/95 to-transparent">
          <div className="relative flex items-center bg-white rounded-[24px] border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] transition-all focus-within:shadow-[0_4px_20px_-4px_rgba(99,102,241,0.15)] focus-within:border-indigo-200">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                decisionStep === 1 ? "Добавить плюс..." : 
                decisionStep === 2 ? "Добавить минус..." : 
                decisionStep === 4 ? "Добавить плюс/минус или уточнить..." : 
                "Напишите сообщение..."
              }
              className="flex-1 bg-transparent text-slate-800 text-[15px] px-6 py-4 focus:outline-none placeholder:text-slate-400"
              disabled={isLoading}
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="p-3 mr-2 text-indigo-500 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-full hover:bg-indigo-50"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
