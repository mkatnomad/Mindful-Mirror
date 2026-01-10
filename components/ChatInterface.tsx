import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, ArrowLeft } from 'lucide-react';
import { Message, JournalMode } from '../types';
// 👇 СМОТРИ СЮДА: Мы импортируем наш сервис, а не библиотеку Google
import { sendMessageToGemini } from '../services/geminiService';

interface ChatInterfaceProps {
  mode: JournalMode;
  onBack: () => void;
  onSessionComplete?: (messages: Message[], duration: number) => void;
  readOnly?: boolean;
  initialMessages?: Message[];
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  mode, 
  onBack, 
  onSessionComplete,
  readOnly = false,
  initialMessages = []
}) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStartTime] = useState(Date.now());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0 && !readOnly) {
      let initialText = '';
      switch (mode) {
        case 'DECISION': initialText = 'Привет! Опиши ситуацию выбора.'; break;
        case 'EMOTIONS': initialText = 'Здравствуй. Что ты сейчас чувствуешь?'; break;
        case 'REFLECTION': initialText = 'Привет! О чем хочешь поразмышлять?'; break;
        default: initialText = 'Привет!';
      }
      setMessages([{ id: 'init', role: 'assistant', content: initialText, timestamp: Date.now() }]);
    }
  }, [mode, messages.length, readOnly]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // 👇 ЗДЕСЬ мы вызываем наш сервис OpenRouter
      const historyForAi = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const responseText = await sendMessageToGemini(userMsg.content, historyForAi);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Chat Error:', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Ошибка связи. Попробуй позже.',
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndSession = () => {
    if (onSessionComplete && messages.length > 1) {
      onSessionComplete(messages, Math.round((Date.now() - sessionStartTime) / 1000));
    }
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative z-20">
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100 shadow-sm z-30">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 text-slate-500">
          <ArrowLeft size={24} />
        </button>
        <span className="font-bold text-slate-800">
          {mode === 'DECISION' ? 'Решение' : mode === 'EMOTIONS' ? 'Эмоции' : 'Дневник'}
        </span>
        {!readOnly ? (
          <button onClick={handleEndSession} className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
            Завершить
          </button>
        ) : <div className="w-10" />}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 bg-slate-50/50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex items-end max-w-[85%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-white border text-indigo-500'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-[15px] shadow-sm ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-100 text-slate-700'}`}>
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-sm ml-10">
            <Loader2 size={14} className="animate-spin" /> Печатает...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {!readOnly && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 z-30">
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-[24px] border border-slate-200 focus-within:border-indigo-300 transition-all">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Напиши сообщение..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-3"
              rows={1}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
            />
            <button onClick={handleSendMessage} disabled={!inputText.trim() || isLoading} className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center disabled:opacity-50">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
