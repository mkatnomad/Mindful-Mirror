import React, { useState } from 'react';
import { Share2, Check, Sparkles, Search, AlertTriangle, Activity, Compass, ShieldAlert } from 'lucide-react';
import { DecisionData } from '../types';
import { motion } from 'framer-motion';

interface InsightCardProps {
  data: DecisionData;
  rpgMode?: boolean;
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

export const InsightCard: React.FC<InsightCardProps> = ({ data, rpgMode = false }) => {
  const [isCopied, setIsCopied] = useState(false);
  const analysis = data.analysis;

  if (!analysis) return null;

  const handleShare = async () => {
    let textToShare = `✨ АНАЛИЗ РЕШЕНИЯ: ${data.topic}\n\n💡 ВЕРДИКТ: ${analysis.verdict}\n⚖️ БАЛАНС: ${analysis.balanceA}% / ${analysis.balanceB}%\n🚀 ПЕРВЫЙ ШАГ: ${analysis.actionStep}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Мой анализ', text: textToShare }); } catch (e) {}
    } else {
      await navigator.clipboard.writeText(textToShare);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return (
    <motion.div 
      initial="hidden" animate="visible"
      className="w-full space-y-4 px-4 pt-4 pb-12"
    >
      {/* 1. ВЕРДИКТ - УБРАНА ТЕНЬ */}
      <motion.div variants={itemVariants} className={`p-10 rounded-[44px] border text-center relative overflow-hidden shadow-sm ${rpgMode ? 'rpg-card bg-slate-950 text-white border-red-800/30' : 'bg-slate-900 text-white border-slate-800'}`}>
        <div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={100} /></div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-4">Вердикт</p>
        <h3 className={`text-2xl sm:text-3xl font-black leading-tight italic ${rpgMode ? 'font-display-fantasy' : ''}`}>
          «{analysis.verdict}»
        </h3>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {/* 2. БАЛАНС СИЛ */}
        <motion.div variants={itemVariants} className={`col-span-2 p-8 rounded-[40px] border ${rpgMode ? 'bg-white/60 border-red-800/10' : 'bg-white border-white shadow-sm'}`}>
          <div className="flex justify-between items-center mb-6">
             <div className="flex items-center space-x-2">
                <Activity size={18} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Баланс Факторов</span>
             </div>
             <div className="flex space-x-4 text-xs font-black">
                <span className="text-indigo-600">{analysis.balanceA}%</span>
                <span className="text-slate-300">vs</span>
                <span className="text-rose-500">{analysis.balanceB}%</span>
             </div>
          </div>
          <div className="h-5 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
             <motion.div 
              initial={{ width: 0 }} animate={{ width: `${analysis.balanceA}%` }}
              className={`h-full ${rpgMode ? 'bg-red-800' : 'bg-indigo-600'} rounded-r-full shadow-lg`}
             />
             <div className="flex-1" />
          </div>
          <div className="flex justify-between mt-4 text-[9px] font-black uppercase tracking-widest text-slate-300">
             <span>Вариант А</span>
             <span>Вариант Б</span>
          </div>
        </motion.div>

        {/* 3. УРОВЕНЬ РИСКА */}
        <motion.div variants={itemVariants} className={`col-span-2 p-8 rounded-[40px] border flex flex-col items-center ${rpgMode ? 'bg-white/60 border-red-800/10' : 'bg-white border-white shadow-sm'}`}>
           <div className="w-full flex justify-between items-start mb-6">
              <div className="p-3.5 rounded-2xl bg-rose-50 text-rose-500"><AlertTriangle size={24} /></div>
              <div className="text-right">
                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Рискованность</p>
                 <p className="text-3xl font-black text-slate-800">{analysis.riskLevel}/10</p>
              </div>
           </div>
           
           <div className="w-full relative py-6">
              <svg viewBox="0 0 100 50" className="w-full max-w-[220px] mx-auto">
                 <path d="M10 45 A 40 40 0 0 1 90 45" fill="none" stroke="#F1F5F9" strokeWidth="12" strokeLinecap="round" />
                 <motion.path 
                    d="M10 45 A 40 40 0 0 1 90 45" fill="none" 
                    stroke={analysis.riskLevel > 7 ? '#E11D48' : analysis.riskLevel > 4 ? '#F59E0B' : '#10B981'} 
                    strokeWidth="12" strokeLinecap="round"
                    initial={{ strokeDasharray: "126, 126", strokeDashoffset: 126 }}
                    animate={{ strokeDashoffset: 126 - (126 * (analysis.riskLevel / 10)) }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                 />
              </svg>
           </div>
           
           <p className="text-sm font-bold text-slate-600 text-center leading-relaxed max-w-[280px]">
             {analysis.riskDescription}
           </p>
        </motion.div>

        {/* 4. СКРЫТЫЙ ФАКТОР */}
        <motion.div variants={itemVariants} className={`col-span-2 p-10 rounded-[44px] border relative overflow-hidden ${rpgMode ? 'bg-white/80 border-red-800/20' : 'bg-indigo-50/50 border-indigo-100/50'}`}>
           <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center"><Search size={14} /></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600">Скрытый фактор</span>
           </div>
           <p className={`text-base font-bold leading-relaxed ${rpgMode ? 'text-red-950 italic' : 'text-slate-800'}`}>
             {analysis.hiddenFactor}
           </p>
        </motion.div>

        {/* 5. ПЕРВЫЙ ШАГ */}
        <motion.div 
          variants={itemVariants}
          className="col-span-2 p-1 rounded-[44px] bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 shadow-xl shadow-indigo-100"
        >
          <div className={`bg-white m-[2px] p-10 rounded-[42px] flex flex-col transition-all ${rpgMode ? 'bg-[#fffdfa]' : ''}`}>
             <div className="flex items-center space-x-3 mb-3 opacity-40">
                <Compass size={18} className="text-indigo-600" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Первый шаг</span>
             </div>
             <p className="text-xl font-black text-slate-900 tracking-tight leading-tight">
               {analysis.actionStep}
             </p>
          </div>
        </motion.div>

        {/* 6. SHARE */}
        <motion.button 
          variants={itemVariants}
          onClick={handleShare}
          className={`col-span-2 py-6 rounded-[36px] font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center space-x-3 border transition-all ${isCopied ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-inner' : 'bg-white border-slate-100 text-slate-400 active:scale-95 shadow-sm'}`}
        >
          {isCopied ? <Check size={18} strokeWidth={3} /> : <Share2 size={18} />}
          <span>{isCopied ? 'Сохранено' : 'Поделиться результатом'}</span>
        </motion.button>
      </div>
    </motion.div>
  );
};