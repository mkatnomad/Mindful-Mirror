
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Heart, Sparkles, BookOpen, ArrowRight, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  rpgMode?: boolean;
}

const SLIDES = [
  {
    title: 'Ясность в каждом выборе',
    description: 'Разложите сомнения на атомы. Наша система поможет увидеть скрытые факторы и принять правильное решение.',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'from-amber-500/20 to-orange-500/10',
    iconBg: 'bg-amber-100',
  },
  {
    title: 'Гармония чувств',
    description: 'Прислушайтесь к своему состоянию. Исследуйте природу своих эмоций через глубокий диалог и находите точку покоя внутри себя.',
    icon: Heart,
    color: 'text-rose-500',
    bg: 'from-rose-500/20 to-pink-500/10',
    iconBg: 'bg-rose-100',
  },
  {
    title: 'Ваша истинная суть',
    description: 'Узнайте свой психологический архетип. Проходите ежедневные испытания, собирайте артефакты и взрастите свое Древо Мудрости.',
    icon: Sparkles,
    color: 'text-indigo-500',
    bg: 'from-indigo-500/20 to-blue-500/10',
    iconBg: 'bg-indigo-100',
  },
  {
    title: 'Летопись вашей жизни',
    description: 'Сохраните важные инсайты и моменты благодарности. Создайте личную базу мудрости, которая станет вашей опорой.',
    icon: BookOpen,
    color: 'text-emerald-500',
    bg: 'from-emerald-500/20 to-teal-500/10',
    iconBg: 'bg-emerald-100',
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, rpgMode = false }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    } else {
      onComplete();
    }
  };

  const slide = SLIDES[currentSlide];
  const Icon = slide.icon;

  return (
    <div className={`h-screen w-full flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-1000 ${rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-[#F1F5F9]'}`}>
      {/* Background Glow */}
      <motion.div 
        key={currentSlide}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1 }}
        className={`absolute inset-0 bg-gradient-to-br ${slide.bg} blur-[120px] pointer-events-none`}
      />

      <div className="flex-1 w-full max-w-md px-10 flex flex-col items-center justify-center z-10 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 40, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -40, scale: 0.8 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="flex flex-col items-center"
          >
            <div className={`w-32 h-32 rounded-[48px] ${rpgMode ? 'bg-white border-2 border-red-800 shadow-[8px_8px_0px_#b91c1c]' : `${slide.iconBg} shadow-2xl shadow-slate-200`} flex items-center justify-center mb-12 animate-float`}>
              <Icon size={56} className={rpgMode ? 'text-red-800' : slide.color} strokeWidth={1.5} />
            </div>

            <h2 className={`text-4xl font-black italic tracking-tighter mb-6 leading-tight ${rpgMode ? 'text-red-950 font-display-fantasy uppercase' : 'text-slate-900'}`}>
              {slide.title}
            </h2>

            <p className={`text-base leading-relaxed mb-8 opacity-80 ${rpgMode ? 'text-red-900 font-medium' : 'text-slate-600'}`}>
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-md px-10 pb-16 z-10 flex flex-col items-center">
        {/* Dots */}
        <div className="flex space-x-2.5 mb-10">
          {SLIDES.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 rounded-full transition-all duration-500 ${currentSlide === i ? (rpgMode ? 'w-8 bg-red-800' : 'w-8 bg-indigo-600') : (rpgMode ? 'w-1.5 bg-red-800/20' : 'w-1.5 bg-slate-200')}`}
            />
          ))}
        </div>

        <button 
          onClick={nextSlide}
          className={`w-full py-5 rounded-[32px] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-3 shadow-xl active:scale-95 transition-all ${rpgMode ? 'rpg-button' : 'bg-slate-900 text-white'}`}
        >
          <span>{currentSlide === SLIDES.length - 1 ? 'Начать' : 'Далее'}</span>
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};