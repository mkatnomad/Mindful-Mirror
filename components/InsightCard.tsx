
import React, { useRef, useState } from 'react';
import { Share2, Check, TrendingUp, ShieldAlert, Zap, Search, Info, Award, Sparkles } from 'lucide-react';
import { DecisionData } from '../types';

interface InsightCardProps {
  data: DecisionData;
}

export const InsightCard: React.FC<InsightCardProps> = ({ data }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isCopied, setIsCopied] = useState(false);

  const isCompare = data.decisionType === 'COMPARE';
  const analysis = data.analysis;

  const handleShare = async () => {
    let textToShare = `Mindful Mirror • ${data.topic || (isCompare ? `${data.optionA} vs ${data.optionB}` : 'Анализ решения')}\n\n`;
    
    if (analysis) {
      textToShare += `✨ Озарение: ${analysis.verdict}\n`;
      textToShare += `🔥 Риск: ${analysis.riskLevel}/10\n`;
      textToShare += `🔍 Скрытый фактор: ${analysis.hiddenFactor}\n`;
      textToShare += `🚀 Первый шаг: ${analysis.actionStep}\n\n`;
    }

    textToShare += `Mindful Mirror • Твой путь к осознанности`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Анализ моего решения', text: textToShare });
      } catch (error) { console.log('Error sharing', error); }
    } else {
      try {
        await navigator.clipboard.writeText(textToShare);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) { console.error('Failed to copy!', err); }
    }
  };

  const getRiskColor = (level: number) => {
    if (level <= 3) return 'bg-emerald-500';
    if (level <= 7) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getRiskText = (level: number) => {
    if (level <= 3) return 'Низкий';
    if (level <= 7) return 'Умеренный';
    return 'Высокий';
  };

  return (
    <div className="w-full my-6 animate-fade-in-up">
      <div 
        ref={cardRef}
        className="relative overflow-hidden rounded-[40px] bg-white border border-slate-100 shadow-[0_30px_60px_-15px_rgba(15,23,42,0.12)]"
      >
        {/* Decorative background element */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl"></div>
        
        {/* Header */}
        <div className="p-8 pb-4 relative z-10">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
            <p className="text-[10px] text-indigo-400 uppercase tracking-[0.2em] font-black">Персональный Анализ</p>
          </div>
          <h3 className="text-2xl font-black text-slate-900 leading-tight tracking-tighter italic">
            {data.topic || (isCompare ? `${data.optionA} или ${data.optionB}` : 'Ваше решение')}
          </h3>
        </div>

        <div className="px-8 pb-8 space-y-6 relative z-10">
          {/* Analysis Result (Verdict / Insight) */}
          {analysis && (
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-[32px] p-6 border border-indigo-100/50 shadow-sm shadow-indigo-100/20 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Sparkles size={40} className="text-indigo-600" />
               </div>
               <div className="flex items-center space-x-3 mb-3">
                  <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                    <Sparkles size={16} strokeWidth={2.5} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Озарение</span>
               </div>
               <p className="text-[15px] font-extrabold text-slate-800 leading-relaxed italic">
                 «{analysis.verdict}»
               </p>
            </div>
          )}

          {/* Progress / Balance Bars */}
          <div className="space-y-4">
            <div className="flex justify-between items-end mb-1 px-1">
               <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Баланс факторов</span>
               <span className="text-[10px] font-black text-indigo-600">{analysis ? `${analysis.balanceA}% / ${analysis.balanceB}%` : '50% / 50%'}</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
               <div 
                 className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 transition-all duration-1000" 
                 style={{ width: `${analysis?.balanceA || 50}%` }}
               ></div>
               <div 
                 className="h-full bg-slate-200 transition-all duration-1000" 
                 style={{ width: `${analysis?.balanceB || 50}%` }}
               ></div>
            </div>
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tighter px-1">
               <span>{isCompare ? (data.optionA || 'А') : 'Логика'}</span>
               <span>{isCompare ? (data.optionB || 'Б') : 'Эмоции'}</span>
            </div>
          </div>

          {/* Risk Meter */}
          {analysis && (
            <div className="grid grid-cols-1 gap-4">
              <div className="p-5 rounded-[28px] bg-slate-50 border border-slate-100">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                       <ShieldAlert size={16} className="text-slate-400" />
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Уровень риска</span>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full text-white shadow-sm ${getRiskColor(analysis.riskLevel)}`}>
                       {getRiskText(analysis.riskLevel)}
                    </span>
                 </div>
                 <div className="flex space-x-1 mb-3">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                       <div 
                         key={i} 
                         className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${i <= analysis.riskLevel ? getRiskColor(analysis.riskLevel) : 'bg-slate-200'}`}
                       ></div>
                    ))}
                 </div>
                 <p className="text-[11px] text-slate-500 font-medium leading-tight">{analysis.riskDescription}</p>
              </div>
            </div>
          )}

          {/* Insight Blocks */}
          {analysis && (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start space-x-4 p-5 rounded-[28px] border border-indigo-50 bg-indigo-50/30">
                 <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <Search size={20} />
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Скрытый фактор</h4>
                    <p className="text-[13px] font-bold text-slate-700 leading-snug">{analysis.hiddenFactor}</p>
                 </div>
              </div>

              <div className="flex items-start space-x-4 p-5 rounded-[28px] border border-emerald-50 bg-emerald-50/30">
                 <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <Zap size={20} />
                 </div>
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Первый шаг</h4>
                    <p className="text-[13px] font-bold text-slate-700 leading-snug">{analysis.actionStep}</p>
                 </div>
              </div>
            </div>
          )}

          {/* Footer with Watermark */}
          <div className="pt-6 border-t border-slate-50 flex flex-col items-center">
            <button 
              onClick={handleShare}
              className={`w-full py-4 rounded-[24px] font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center space-x-3 transition-all mb-4 ${isCopied ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600 active:scale-95'}`}
            >
              {isCopied ? <Check size={16} strokeWidth={3} /> : <Share2 size={16} strokeWidth={2.5} />}
              <span>{isCopied ? 'Результат скопирован' : 'Поделиться отчетом'}</span>
            </button>
            
            <div className="flex items-center space-x-2 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default group">
               <div className="w-5 h-5 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[8px] font-black">M</div>
               <span className="text-[9px] font-black uppercase tracking-[0.1em] text-slate-900">Mindful Mirror • Твой путь к осознанности</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
