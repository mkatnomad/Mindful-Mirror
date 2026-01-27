import React, { useState } from 'react';
import { Share2, Check, Sparkles, Search, AlertTriangle, ArrowRight, Activity, Compass, ShieldAlert } from 'lucide-react';
import { DecisionData } from '../types';
import { motion } from 'framer-motion';

interface InsightCardProps {
  data: DecisionData;
  rpgMode?: boolean;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", damping: 18, stiffness: 110 }
  }
};

export const InsightCard: React.FC<InsightCardProps> = ({ data, rpgMode = false }) => {
  const [isCopied, setIsCopied] = useState(false);
  const analysis = data.analysis;

  if (!analysis) return null;

  const handleShare = async () => {
    let textToShare = `✨ АНАЛИЗ РЕШЕНИЯ: ${data.topic}\n\n`;
    textToShare += `💡 ВЕРДИКТ: «${analysis.verdict}»\n`;
    textToShare += `⚖️ ВЕС: ${analysis.balanceA}% vs ${analysis.balanceB}%\n`;
    textToShare += `🔥 РИСК: ${analysis.riskLevel}/10\n`;
    textToShare += `🔍 ИНСАЙТ: ${analysis.hiddenFactor}\n`;
    textToShare += `🚀 ШАГ: ${analysis.actionStep}\n\n`;
    textToShare += `Mindful Mirror • Путь к ясности`;

    if (navigator.share) {
      try { await navigator.share({ title: 'Мой анализ', text: textToShare }); } catch (e) {}
    } else {
      await navigator.clipboard.writeText(textToShare);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const getRiskColor = (level: number) => {
    if (level <= 3) return rpgMode ? 'bg-emerald-900' : 'bg-emerald-500';
    if (level <= 7) return rpgMode ? 'bg-amber-900' : 'bg-amber-500';
    return rpgMode ? 'bg-rose-900' : 'bg-rose-600';
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full space-y-4 px-2"
    >
      {/* 1. ГЛАВНЫЙ ВЕРДИКТ (Hero Block) */}
      <motion.div 
        variants={itemVariants}
        className={`relative overflow-hidden p-8 rounded-[40px] shadow-2xl ${
          rpgMode 
            ? 'rpg-card bg-slate-950 text-white' 
            : 'bg-slate-900 text-white shadow-indigo-500/10'
        }`}
      >
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px]"></div>
        <div className="flex items-center space-x-3 mb-6 opacity-40">
           <Sparkles size={14} className="text-indigo-400" />
           <span className="text-[9px] font-black uppercase tracking-[0.3em]">Вердикт Синтеза</span>
        </div>
        <h3 className={`text-2xl sm:text-3xl font-black leading-tight tracking-tighter italic ${rpgMode ? 'font-display-fantasy uppercase' : ''}`}>
          «{analysis.verdict}»
        </h3>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {/* 2. БАЛАНС (Dynamic Bar Graph) */}
        <motion.div 
          variants={itemVariants}
          className={`col-span-1 p-6 rounded-[32px] border flex flex-col justify-between aspect-square transition-all ${
            rpgMode ? 'rpg-card' : 'bg-white border-white shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
             <div className={`p-2.5 rounded-2xl ${rpgMode ? 'bg-red-800 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
               <Activity size={18} />
             </div>
             <span className={`text-2xl font-black tracking-tighter ${rpgMode ? 'text-red-950' : 'text-slate-800'}`}>
               {analysis.balanceA}%
             </span>
          </div>
          <div className="space-y-3">
             <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Сила решения</p>
             <div className="relative h-12 w-full flex items-end space-x-1.5">
                {[...Array(6)].map((_, i) => (
                  <motion.div 
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${20 + (i * 15) + (Math.random() * 10)}%` }}
                    className={`flex-1 rounded-full ${i < (analysis.balanceA / 16) ? (rpgMode ? 'bg-red-800' : 'bg-emerald-400') : 'bg-slate-100'}`}
                  />
                ))}
             </div>
          </div>
        </motion.div>

        {/* 3. РИСКОМЕТР (SVG Gauge) */}
        <motion.div 
          variants={itemVariants}
          className={`col-span-1 p-6 rounded-[32px] border flex flex-col justify-between aspect-square transition-all ${
            rpgMode ? 'rpg-card' : 'bg-white border-white shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
             <div className={`p-2.5 rounded-2xl ${rpgMode ? 'bg-red-800 text-white' : 'bg-rose-50 text-rose-500'}`}>
               <AlertTriangle size={18} />
             </div>
             <span className={`text-2xl font-black tracking-tighter ${rpgMode ? 'text-red-950' : 'text-slate-800'}`}>
               {analysis.riskLevel}/10
             </span>
          </div>
          <div className="relative flex flex-col items-center justify-center pt-2">
             <svg viewBox="0 0 100 55" className="w-full max-w-[80px]">
               <path d="M10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#F1F5F9" strokeWidth="12" strokeLinecap="round" />
               <motion.path 
                 d="M10 50 A 40 40 0 0 1 90 50" 
                 fill="none" 
                 stroke="currentColor" 
                 strokeWidth="12" 
                 strokeLinecap="round"
                 className={analysis.riskLevel > 7 ? 'text-rose-500' : analysis.riskLevel > 3 ? 'text-amber-500' : 'text-emerald-500'}
                 initial={{ strokeDasharray: "126, 126", strokeDashoffset: 126 }}
                 animate={{ strokeDashoffset: 126 - (126 * (analysis.riskLevel / 10)) }}
                 transition={{ duration: 1.5, ease: "circOut", delay: 0.5 }}
               />
             </svg>
             <p className="text-[8px] font-black uppercase tracking-widest text-slate-400 mt-3">Угрозы</p>
          </div>
        </motion.div>

        {/* 4. СКРЫТЫЙ ФАКТОР (Insight Card) */}
        <motion.div 
          variants={itemVariants}
          className={`col-span-2 p-8 rounded-[40px] border relative overflow-hidden group transition-all ${
            rpgMode ? 'rpg-card bg-white' : 'bg-indigo-50/40 border-indigo-100/50'
          }`}
        >
          <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 ${rpgMode ? 'bg-red-800' : 'bg-indigo-400'}`}></div>
          <div className="flex items-center space-x-3 mb-4">
             <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${rpgMode ? 'bg-red-800 text-white' : 'bg-indigo-600 text-white'}`}>
               <Search size={14} />
             </div>
             <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${rpgMode ? 'text-red-800' : 'text-indigo-600'}`}>Глубинный Инсайт</span>
          </div>
          <p className={`text-base font-bold leading-relaxed relative z-10 ${rpgMode ? 'text-red-950 italic' : 'text-slate-800'}`}>
            {analysis.hiddenFactor}
          </p>
        </motion.div>

        {/* 5. ПОДРОБНЕЕ О РИСКАХ */}
        <motion.div 
          variants={itemVariants}
          className={`col-span-2 p-6 rounded-[32px] border flex items-start space-x-4 transition-all ${
            rpgMode ? 'bg-white/40 border-red-800/10' : 'bg-white border-slate-50'
          }`}
        >
          <div className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${getRiskColor(analysis.riskLevel)}`}>
             <ShieldAlert size={20} />
          </div>
          <div className="flex-1">
             <h4 className={`text-[8px] font-black uppercase tracking-widest mb-1 ${rpgMode ? 'text-red-800' : 'text-slate-400'}`}>Аналитика весов</h4>
             <p className={`text-[12px] font-bold leading-snug ${rpgMode ? 'text-red-950' : 'text-slate-600'}`}>{analysis.riskDescription}</p>
          </div>
        </motion.div>

        {/* 6. ПЕРВЫЙ ШАГ (Action) */}
        <motion.div 
          variants={itemVariants}
          className="col-span-2 p-1 rounded-[40px] bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 animate-gradient-x shadow-2xl shadow-indigo-200"
        >
          <div className={`m-[2px] p-8 rounded-[38px] flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer ${
            rpgMode ? 'bg-[#fffdfa]' : 'bg-white'
          }`}>
             <div className="flex-1 pr-4">
                <div className="flex items-center space-x-2 mb-2 opacity-40">
                  <Compass size={14} className={rpgMode ? 'text-red-800' : 'text-indigo-600'} />
                  <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${rpgMode ? 'text-red-950' : 'text-slate-800'}`}>Твой Квест</span>
                </div>
                <p className={`text-lg font-black tracking-tight leading-tight ${rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-900'}`}>
                  {analysis.actionStep}
                </p>
             </div>
             <div className={`w-14 h-14 rounded-3xl flex items-center justify-center group-hover:translate-x-1 transition-transform shadow-xl ${
               rpgMode ? 'rpg-button' : 'bg-slate-900 text-white'
             }`}>
                <ArrowRight size={24} strokeWidth={3} />
             </div>
          </div>
        </motion.div>

        {/* 7. SHARE BUTTON */}
        <motion.button 
          variants={itemVariants}
          onClick={handleShare}
          className={`col-span-2 py-5 rounded-[32px] font-black text-[10px] uppercase tracking-[0.4em] flex items-center justify-center space-x-3 transition-all border ${
            isCopied 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
              : (rpgMode ? 'bg-white border-red-800/20 text-red-800' : 'bg-white border-slate-100 text-slate-400 active:scale-95 shadow-sm')
          }`}
        >
          {isCopied ? <Check size={16} strokeWidth={3} /> : <Share2 size={16} />}
          <span>{isCopied ? 'Свиток сохранен' : 'Поделиться анализом'}</span>
        </motion.button>
      </div>

      <div className="pt-8 pb-4 text-center">
         <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full grayscale opacity-30 ${rpgMode ? 'bg-red-800/5' : 'bg-slate-100'}`}>
           <div className={`w-4 h-4 rounded-md flex items-center justify-center text-[7px] text-white font-black ${rpgMode ? 'bg-red-800' : 'bg-slate-900'}`}>M</div>
           <span className="text-[7px] font-black uppercase tracking-widest text-slate-900">Mindful Mirror Synthesis v2.8</span>
         </div>
      </div>
    </motion.div>
  );
};