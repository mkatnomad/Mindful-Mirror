import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Loader2, ArrowLeft, MoreVertical, Trash2 } from 'lucide-react';
import { Message, JournalMode, ChatSession } from '../types';
// 👇 Самая важная строка: Импортируем нашу функцию OpenRouter
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

  // Автопрокрутка вниз
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Приветственное сообщение, если чат пустой
  useEffect(() => {
    if (messages.length === 0 && !readOnly) {
      let initialText = '';
      switch (mode) {
        case 'DECISION':
          initialText = 'Привет! Я помогу тебе принять сложное решение. Опиши ситуацию: между чем и чем ты выбираешь?';
          break;
        case 'EMOTIONS':
          initialText = 'Здравствуй. Я здесь, чтобы выслушать. Что ты сейчас чувствуешь? Поделись своими эмоциями.';
          break;
        case 'REFLECTION':
          initialText = 'Привет! Давай подведем итоги или просто поразмышляем. О чем ты думаешь прямо сейчас?';
          break;
        default:
          initialText = 'Привет! Я готов слушать.';
      }
      setMessages([{
        id: 'init-1',
        role: 'assistant',
        content: initialText,
        timestamp: Date.now()
      }]);
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
      // 👇 ЗДЕСЬ мы вызываем OpenRouter через наш сервис
      // Формируем историю для контекста (последние 10 сообщений)
      const historyForAi = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));

      const responseText = await sendMessageToGemini(userMsg.content, historyForAi);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error('Ошибка отправки:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Извини, связь с космосом прервалась. Попробуй еще раз.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEndSession = () => {
    if (onSessionComplete && messages.length > 1) {
      const duration = Math.round((Date.now() - sessionStartTime) / 1000);
      onSessionComplete(messages, duration);
    }
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative z-20">
      {/* Шапка чата */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100 shadow-sm z-30">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-800">
            {mode === 'DECISION' ? 'Решение' : mode === 'EMOTIONS' ? 'Эмоции' : 'Размышление'}
          </span>
          <span className="text-xs text-slate-400">Ментор осознанности</span>
        </div>
        {!readOnly ? (
          <button onClick={handleEndSession} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1 bg-indigo-50 rounded-lg">
            Завершить
          </button>
        ) : (
          <div className="w-10" /> 
        )}
      </div>

      {/* Список сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-24 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex items-end max-w-[85%] gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-white border border-slate-100 text-indigo-500'}`}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              
              <div
                className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-500 text-white rounded-br-none'
                    : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <div className="w-8 h-8 rounded-full bg-white border border-slate-100 text-indigo-500 flex items-center justify-center shrink-0">
                <Loader2 size={16} className="animate-spin" />
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-bl-none text-slate-500 text-sm italic">
                Печатает...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода (скрыто в режиме чтения) */}
      {!readOnly && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-100 z-30">
          <div className="flex items-center gap-3 bg-slate-50 p-2 pr-2 rounded-[24px] border border-slate-200 focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 transition-all shadow-sm">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Напиши сообщение..."
              className="flex-1 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-3 text-slate-700 placeholder:text-slate-400"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${
                !inputText.trim() || isLoading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-indigo-500 text-white hover:bg-indigo-600 active:scale-95'
              }`}
            >
              <Send size={18} className={inputText.trim() && !isLoading ? 'ml-0.5' : ''} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
