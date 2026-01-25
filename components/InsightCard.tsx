
import React, { useRef, useState } from 'react';
import { Share2, Check, VS } from 'lucide-react';
import { DecisionData } from '../types';

interface InsightCardProps {
  data: DecisionData;
}

export const InsightCard: React.FC<InsightCardProps> = ({ data }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const isCompare = data.decisionType === 'COMPARE';

  const handleShare = async () => {
    let textToShare = `Mindful Mirror: ${isCompare ? 'Выбор из двух' : 'Сложное решение'}\n\n`;
    
    if (isCompare) {
      textToShare += `Вариант А: ${data.optionA}\nАргументы:\n${data.pros.map(p => `• ${p}`).join('\n')}\n\n`;
      textToShare += `Вариант Б: ${data.optionB}\nАргументы:\n${data.cons.map(c => `• ${c}`).join('\n')}`;
    } else {
      textToShare += `Тема: ${data.topic}\n\nПлюсы:\n${data.pros.map(p => `+ ${p}`).join('\n')}\n\nМинусы:\n${data.cons.map(c => `- ${c}`).join('\n')}`;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Мое решение',
          text: textToShare,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(textToShare);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy!', err);
      }
    }
  };

  return (
    <div className="w-full my-4 animate-fade-in-up">
      <div 
        ref={cardRef}
        className="relative overflow-hidden rounded-[28px] bg-white border border-slate-100 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.08)]"
      >
        <div className="h-28 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/60 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3"></div>
             
             <div className="absolute inset-0 flex items-center px-6">
                <div>
                  <p className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">
                    {isCompare ? 'Ваша развилка' : 'Ваш вопрос'}
                  </p>
                  <h3 className="text-xl font-bold text-slate-800 mt-1 leading-tight line-clamp-2">
                    {isCompare ? `${data.optionA} или ${data.optionB}` : data.topic}
                  </h3>
                </div>
             </div>
        </div>

        <div className="p-6 relative z-10">
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl border ${isCompare ? 'bg-blue-50/50 border-blue-100/50' : 'bg-emerald-50/50 border-emerald-100/50'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isCompare ? 'text-blue-600' : 'text-emerald-600'}`}>
                {isCompare ? `За: ${data.optionA}` : 'Плюсы'}
              </h4>
              <ul className="text-sm text-slate-600 space-y-2">
                 {data.pros.length > 0 ? (
                   data.pros.map((p, i) => <li key={i} className="flex items-start"><span className={`mr-2 text-lg leading-none ${isCompare ? 'text-blue-400' : 'text-emerald-400'}`}>•</span>{p}</li>)
                 ) : (
                   <li className="text-slate-400 italic">Нет данных</li>
                 )}
              </ul>
            </div>
            
            <div className={`p-4 rounded-2xl border ${isCompare ? 'bg-purple-50/50 border-purple-100/50' : 'bg-rose-50/50 border-rose-100/50'}`}>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isCompare ? 'text-purple-600' : 'text-rose-500'}`}>
                {isCompare ? `За: ${data.optionB}` : 'Минусы'}
              </h4>
              <ul className="text-sm text-slate-600 space-y-2">
                 {data.cons.length > 0 ? (
                   data.cons.map((c, i) => <li key={i} className="flex items-start"><span className={`mr-2 text-lg leading-none ${isCompare ? 'text-purple-400' : 'text-rose-300'}`}>•</span>{c}</li>)
                 ) : (
                   <li className="text-slate-400 italic">Нет данных</li>
                 )}
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between items-center">
            <p className="text-[10px] text-slate-400 font-medium">{new Date().toLocaleDateString('ru-RU')}</p>
            <button 
              onClick={handleShare}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full text-xs font-bold transition-all ${isCopied ? 'bg-green-100 text-green-700' : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'}`}
            >
              {isCopied ? <Check size={12} strokeWidth={3} /> : <Share2 size={12} strokeWidth={2.5} />}
              <span>{isCopied ? 'Скопировано!' : 'Поделиться'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
