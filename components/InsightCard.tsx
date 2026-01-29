import React, { useState, useEffect } from 'react';
import { Share2, Check, Sparkles, Search, AlertTriangle, Activity, Compass, ShieldAlert, Trophy, ArrowRight, Zap, Target } from 'lucide-react';
import { DecisionData } from '../types';
import { motion, AnimatePresence, Variants } from 'framer-motion';

interface InsightCardProps {
  data: DecisionData;
  rpgMode?: boolean;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 } 
  }
};

export const InsightCard: React.FC<InsightCardProps> = ({ data, rpgMode = false }) => {
  const [isCopied, setIsCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const analysis = data.analysis;

  useEffect(() => {
    // Trigger celebration effect on mount
    setShowConfetti(true);
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
  }, []);

  if (!analysis) return null;

  const winner = analysis.balanceA >= analysis.balanceB ? 'A' : 'B';
  const winnerTitle = winner === 'A' ? (data.optionA || 'Вариант А') : (data.optionB || 'Вариант Б');
  const winnerPercent = winner === 'A' ? analysis.balanceA : analysis.balanceB;
  const winnerColor = winner === 'A' ? 'indigo' : 'rose';

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
      variants={containerVariants}
      initial="hidden" 
      animate="visible"
      className="w-full space-y-6 px-5 pt-4 pb-20"
    >
      {/* 1. CELEBRATORY VERDICT HEADER */}
      <motion.div variants={itemVariants} className="text-center space-y-4 mb-8">
        <div className="relative inline-block">
          <motion.div 
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", bounce: 0.5, delay: 0.3 }}
            className={`w-20 h-20 mx-auto rounded-[28px] flex items-center justify-center shadow-2xl relative z-10 ${rpgMode ? 'bg-red-800 text-white' : 'bg-indigo-600 text-white'}`}
          >
            <Trophy size={40} strokeWidth={2.5} />
          </motion.div>
          {/* Decorative Sparkles */}
          <AnimatePresence>
            {showConfetti && [1,2,3,4,5].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1, x: (i-3)*40, y: -40 - Math.random()*20 }}
                className="absolute left-1/2 top-1/2 text-amber-400"
              >
                <Sparkles size={16} fill="currentColor" />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        <div className="space-y-2">
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${rpgMode ? 'text-red-800' : 'text-slate-400'}`}>
            Истина найдена
          </p>
          <h3 className={`text-3xl font-black leading-tight tracking-tight ${rpgMode ? 'text-red-950 font-display-fantasy' : 'text-slate-900'}`}>
            {analysis.verdict}
          </h3>
        </div>
      </motion.div>

      {/* 2. THE WINNER CARD (Duolingo Style Focus) */}
      <motion.div variants={itemVariants} className={`p-8 rounded-[40px] border-2 border-b-8 relative overflow-hidden transition-all ${
        rpgMode 
          ? 'bg-white border-red-800 shadow-xl' 
          : `bg-white border-${winnerColor}-500 shadow-xl shadow-${winnerColor}-500/10`
      }`}>
        <div className="flex justify-between items-center mb-6 relative z-10">
           <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
             rpgMode ? 'bg-red-800 text-white' : `bg-${winnerColor}-500 text-white`
           }`}>
             Рекомендуемый путь
           </div>
           <div className={`text-2xl font-black ${rpgMode ? 'text-red-900' : `text-${winnerColor}-600`}`}>
             {winnerPercent}%
           </div>
        </div>
        
        <h4 className={`text-2xl font-black mb-4 tracking-tight ${rpgMode ? 'text-red-950 italic' : 'text-slate-900'}`}>
          {winnerTitle}
        </h4>
        
        <div className={`h-4 w-full rounded-full overflow-hidden mb-2 p-1 ${rpgMode ? 'bg-red-900/10' : 'bg-slate-100'}`}>
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${winnerPercent}%` }}
             transition={{ duration: 1.5, ease: "circOut" }}
             className={`h-full rounded-full ${rpgMode ? 'bg-red-800' : `bg-${winnerColor}-500 shadow-lg shadow-${winnerColor}-500/20`}`}
           />
        </div>
        
        <p className={`text-[10px] font-bold uppercase tracking-widest opacity-40 mt-3 ${rpgMode ? 'text-red-800' : 'text-slate-500'}`}>
           Против: {100 - winnerPercent}%
        </p>
      </motion.div>

      {/* 3. RISK & HIDDEN FACTOR (Two Columns) */}
      <div className="grid grid-cols-2 gap-4">
        {/* RISK METER */}
        <motion.div variants={itemVariants} className={`p-6 rounded-[32px] border-2 border-b-4 flex flex-col items-center justify-center ${rpgMode ? 'rpg-card' : 'bg-white bento-border'}`}>
           <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-3">Опасность</p>
           <div className="relative mb-3">
              <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center text-lg font-black ${
                analysis.riskLevel > 7 ? 'text-rose-600 border-rose-100' : 
                analysis.riskLevel > 4 ? 'text-amber-600 border-amber-100' : 'text-emerald-600 border-emerald-100'
              }`}>
                {analysis.riskLevel}
              </div>
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                className={`absolute inset-[-4px] border-t-4 rounded-full ${
                  analysis.riskLevel > 7 ? 'border-rose-500' : 
                  analysis.riskLevel > 4 ? 'border-amber-500' : 'border-emerald-500'
                }`}
              />
           </div>
           <p className={`text-[10px] font-bold leading-tight text-center ${rpgMode ? 'text-red-900/60' : 'text-slate-500'}`}>
             {analysis.riskDescription}
           </p>
        </motion.div>

        {/* HIDDEN FACTOR CARD */}
        <motion.div variants={itemVariants} className={`p-6 rounded-[32px] border-2 border-b-4 relative overflow-hidden flex flex-col items-center justify-center text-center ${rpgMode ? 'rpg-card' : 'bg-white bento-border'}`}>
           <div className={`mb-3 p-2 rounded-xl ${rpgMode ? 'bg-red-800 text-white' : 'bg-indigo-50 text-indigo-600'}`}>
             <Search size={18} />
           </div>
           <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Инсайт</p>
           <p className={`text-[11px] font-bold leading-tight ${rpgMode ? 'text-red-950 italic' : 'text-slate-700'}`}>
             {analysis.hiddenFactor}
           </p>
        </motion.div>
      </div>

      {/* 4. THE ACTION STEP - "QUEST" STYLE */}
      <motion.div variants={itemVariants} className="relative group">
         <div className={`absolute inset-0 blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${rpgMode ? 'bg-red-800' : 'bg-indigo-600'}`}></div>
         <div className={`relative p-8 rounded-[44px] border-2 border-b-[10px] overflow-hidden transition-all active:scale-[0.98] ${
           rpgMode 
             ? 'bg-white border-red-800 shadow-[0_4px_0_#7f1d1d]' 
             : 'bg-white border-slate-900 shadow-xl'
         }`}>
            <div className="flex items-center space-x-3 mb-6">
               <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${rpgMode ? 'bg-red-800' : 'bg-slate-900'}`}>
                 <Zap size={20} fill="currentColor" />
               </div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Ваше задание</span>
            </div>
            
            <h5 className={`text-xl font-black mb-4 leading-tight ${rpgMode ? 'text-red-950' : 'text-slate-900'}`}>
              {analysis.actionStep}
            </h5>
            
            <div className={`flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest transition-all ${rpgMode ? 'text-red-800' : 'text-indigo-600'}`}>
               <span>Я сделаю это</span>
               <ArrowRight size={14} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </div>
         </div>
      </motion.div>

      {/* 5. SHARE BUTTON */}
      <motion.button 
        variants={itemVariants}
        onClick={handleShare}
        className={`w-full py-5 rounded-[32px] font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center space-x-3 border-2 border-b-4 transition-all ${
          isCopied 
            ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-inner' 
            : `bg-white ${rpgMode ? 'border-red-800 text-red-800' : 'border-slate-200 text-slate-400'} active:scale-95`
        }`}
      >
        {isCopied ? <Check size={18} strokeWidth={3} /> : <Share2 size={18} />}
        <span>{isCopied ? 'Сохранено' : 'Поделиться'}</span>
      </motion.button>
    </motion.div>
  );
};
