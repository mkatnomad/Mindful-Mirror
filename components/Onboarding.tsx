
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  rpgMode?: boolean;
}

// Artifact Illustration Components
const LightningArtifact = ({ rpgMode }: { rpgMode: boolean }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.div 
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={`absolute inset-0 blur-2xl rounded-full ${rpgMode ? 'bg-red-500/30' : 'bg-amber-400/40'}`} 
    />
    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 overflow-visible">
      <defs>
        <filter id="glowLightning">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="45" fill="none" stroke={rpgMode ? "#B91C1C" : "#F59E0B"} strokeWidth="0.5" strokeDasharray="4 4" opacity="0.3" />
      <motion.path 
        animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        d="M50 15 L35 55 L50 55 L40 85 L70 40 L50 40 L60 15 Z" 
        fill={rpgMode ? "#7F1D1D" : "#F59E0B"} 
        filter="url(#glowLightning)"
      />
      {[...Array(4)].map((_, i) => (
        <motion.line 
          key={i}
          x1="50" y1="50" x2={50 + Math.cos(i * Math.PI/2) * 40} y2={50 + Math.sin(i * Math.PI/2) * 40}
          stroke={rpgMode ? "#B91C1C" : "#FBBF24"} strokeWidth="1" strokeLinecap="round" opacity="0.2"
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
        />
      ))}
    </svg>
  </div>
);

const HeartArtifact = ({ rpgMode }: { rpgMode: boolean }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.div 
      animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 3, repeat: Infinity }}
      className={`absolute inset-0 blur-2xl rounded-full ${rpgMode ? 'bg-red-600/30' : 'bg-rose-400/40'}`} 
    />
    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 overflow-visible">
      <circle cx="50" cy="50" r="48" fill="none" stroke={rpgMode ? "#B91C1C" : "#FB7185"} strokeWidth="1" opacity="0.1" />
      {[1, 0.7, 0.4].map((s, i) => (
        <motion.path
          key={i}
          animate={{ scale: [s, s * 1.1, s], opacity: [1 - i*0.3, 0.5, 1 - i*0.3] }}
          transition={{ duration: 3, delay: i * 0.4, repeat: Infinity }}
          d="M50 82C30 72 12 55 12 35C12 22 25 15 40 22C45 25 50 30 50 30C50 30 55 25 60 22C75 15 88 22 88 35C88 55 70 72 50 82Z"
          fill="none"
          stroke={rpgMode ? (i === 0 ? "#7F1D1D" : "#B91C1C") : (i === 0 ? "#E11D48" : "#FB7185")}
          strokeWidth={2 + i}
          transform-origin="center"
        />
      ))}
    </svg>
  </div>
);

const SparkleArtifact = ({ rpgMode }: { rpgMode: boolean }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.div 
      animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 4, repeat: Infinity }}
      className={`absolute inset-0 blur-3xl rounded-full ${rpgMode ? 'bg-amber-600/30' : 'bg-indigo-500/30'}`} 
    />
    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 overflow-visible">
      <defs>
        <filter id="prismGlow">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Orbital Rings */}
      <motion.circle 
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        cx="50" cy="50" r="42" fill="none" stroke={rpgMode ? "#B91C1C" : "#818CF8"} strokeWidth="0.5" strokeDasharray="2 6" opacity="0.3" 
      />
      <motion.circle 
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        cx="50" cy="50" r="35" fill="none" stroke={rpgMode ? "#B91C1C" : "#818CF8"} strokeWidth="0.5" strokeDasharray="10 5" opacity="0.2" 
      />

      {/* Main Faceted Star Body */}
      <g transform="translate(50, 50)" filter="url(#prismGlow)">
        <motion.g
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Broad Vertical/Horizontal Facets */}
          <path d="M0 -40 L10 -10 L0 0 L-10 -10 Z" fill={rpgMode ? "#7F1D1D" : "#6366F1"} />
          <path d="M0 40 L10 10 L0 0 L-10 10 Z" fill={rpgMode ? "#B91C1C" : "#818CF8"} opacity="0.8" />
          <path d="M40 0 L10 10 L0 0 L10 -10 Z" fill={rpgMode ? "#7F1D1D" : "#4F46E5"} opacity="0.9" />
          <path d="M-40 0 L-10 10 L0 0 L-10 -10 Z" fill={rpgMode ? "#B91C1C" : "#4338CA"} opacity="0.7" />
          
          {/* Diamond Center Overlay */}
          <path d="M0 -15 L15 0 L0 15 L-15 0 Z" fill="white" opacity="0.2" />
        </motion.g>

        {/* Central Glowing Core */}
        <motion.circle 
          animate={{ scale: [1, 1.2, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity }}
          r="6" fill="white" 
        />
        <circle r="3" fill={rpgMode ? "#FDE68A" : "#C7D2FE"} />
      </g>
      
      {/* Subtle floating sparks (dots, not legs) */}
      {[...Array(4)].map((_, i) => (
        <motion.circle
          key={i}
          animate={{ 
            y: [-2, 2, -2],
            opacity: [0.2, 0.6, 0.2]
          }}
          transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
          cx={30 + i * 15} cy={25 + (i % 2) * 10} r="1.5"
          fill="white"
        />
      ))}
    </svg>
  </div>
);

const BookArtifact = ({ rpgMode }: { rpgMode: boolean }) => (
  <div className="relative w-full h-full flex items-center justify-center">
    <motion.div 
      animate={{ y: [-10, 0, -10], opacity: [0.2, 0.4, 0.2] }}
      transition={{ duration: 5, repeat: Infinity }}
      className={`absolute top-0 w-16 h-32 blur-2xl ${rpgMode ? 'bg-red-500' : 'bg-emerald-400'}`} 
    />
    <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 overflow-visible">
      <rect x="20" y="30" width="60" height="45" rx="4" fill="none" stroke={rpgMode ? "#B91C1C" : "#10B981"} strokeWidth="2" opacity="0.4" />
      <path d="M50 30 V75" stroke={rpgMode ? "#B91C1C" : "#10B981"} strokeWidth="2" strokeLinecap="round" />
      <motion.g animate={{ y: [0, -3, 0] }} transition={{ duration: 4, repeat: Infinity }}>
        <path d="M25 40 H45 M25 50 H45 M25 60 H35" stroke={rpgMode ? "#7F1D1D" : "#059669"} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
        <path d="M55 40 H75 M55 50 H75 M55 60 H65" stroke={rpgMode ? "#7F1D1D" : "#059669"} strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      </motion.g>
      <motion.path 
        animate={{ opacity: [0, 0.8, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
        d="M50 30 L50 10" stroke="white" strokeWidth="1" strokeDasharray="2 2"
      />
      <motion.circle 
        animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 3, repeat: Infinity }}
        cx="50" cy="30" r="4" fill={rpgMode ? "#B91C1C" : "#34D399"} 
      />
    </svg>
  </div>
);

const SLIDES = [
  {
    title: 'Ясность в каждом выборе',
    description: 'Разложите сомнения на атомы. Наша система поможет увидеть скрытые факторы и принять правильное решение.',
    Artifact: LightningArtifact,
    color: 'text-amber-500',
    bg: 'from-amber-500/20 to-orange-500/10',
    iconBg: 'bg-amber-100',
  },
  {
    title: 'Гармония чувств',
    description: 'Прислушайтесь к своему состоянию. Исследуйте природу своих эмоций через глубокий диалог и находите точку покоя внутри себя.',
    Artifact: HeartArtifact,
    color: 'text-rose-500',
    bg: 'from-rose-500/20 to-pink-500/10',
    iconBg: 'bg-rose-100',
  },
  {
    title: 'Ваша истинная суть',
    description: 'Узнайте свой психологический архетип. Проходите ежедневные испытания, собирайте артефакты и взрастите свое Древо Мудрости.',
    Artifact: SparkleArtifact,
    color: 'text-indigo-500',
    bg: 'from-indigo-500/20 to-blue-500/10',
    iconBg: 'bg-indigo-100',
  },
  {
    title: 'Летопись вашей жизни',
    description: 'Сохраните важные инсайты и моменты благодарности. Создайте личную базу мудрости, которая станет вашей опорой.',
    Artifact: BookArtifact,
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

  return (
    <div className={`h-screen w-full flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-1000 ${rpgMode ? 'bg-parchment font-serif-fantasy' : 'bg-[#F8F9FB]'}`}>
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
            className="flex flex-col items-center w-full"
          >
            {/* Artifact Container */}
            <div className={`w-40 h-40 rounded-[56px] relative flex items-center justify-center mb-12 animate-float ${
              rpgMode 
                ? 'bg-white border-2 border-red-800 shadow-[10px_10px_0px_#b91c1c]' 
                : `${slide.iconBg} shadow-2xl shadow-slate-200 ring-4 ring-white/50`
            }`}>
              <div className="w-24 h-24">
                <slide.Artifact rpgMode={rpgMode} />
              </div>
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
