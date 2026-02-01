
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  rpgMode?: boolean;
}

// --- Background Aurora Component ---
const AuroraBackground = ({ colors, rpgMode }: { colors: string[], rpgMode: boolean }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {colors.map((color, i) => (
      <motion.div
        key={i}
        animate={{
          x: [Math.random() * 80 - 40, Math.random() * 80 - 40, Math.random() * 80 - 40],
          y: [Math.random() * 80 - 40, Math.random() * 80 - 40, Math.random() * 80 - 40],
          scale: [1, 1.3, 0.8, 1],
          opacity: [0.1, 0.25, 0.15, 0.1]
        }}
        transition={{
          duration: 25 + i * 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute w-[180%] h-[180%] rounded-full blur-[120px]"
        style={{
          background: color,
          top: i === 0 ? '-30%' : '20%',
          left: i === 0 ? '-10%' : '40%',
        }}
      />
    ))}
    <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px] opacity-20 pointer-events-none" />
  </div>
);

// --- Sacred Geometry Background Layer ---
const SacredGeometry = ({ rpgMode, colorClass }: { rpgMode: boolean, colorClass: string }) => (
  <motion.div 
    animate={{ rotate: 360 }}
    transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
    className={`absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none mix-blend-overlay ${colorClass}`}
  >
    <svg width="260" height="260" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8">
      <circle cx="50" cy="50" r="18" />
      <circle cx="50" cy="32" r="18" />
      <circle cx="50" cy="68" r="18" />
      <circle cx="34.4" cy="41" r="18" />
      <circle cx="65.6" cy="41" r="18" />
      <circle cx="34.4" cy="59" r="18" />
      <circle cx="65.6" cy="59" r="18" />
      <circle cx="50" cy="50" r="36" />
    </svg>
  </motion.div>
);

// --- Particle Field Component ---
const ParticleField = ({ type, rpgMode }: { type: string, rpgMode: boolean }) => {
  const particles = Array.from({ length: 20 });
  
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {particles.map((_, i) => (
        <motion.div
          key={`${type}-${i}`}
          initial={{ 
            x: Math.random() * window.innerWidth, 
            y: window.innerHeight + 50,
            opacity: 0,
            scale: 0.5
          }}
          animate={{ 
            y: -100, 
            opacity: [0, 0.4, 0],
            rotate: 360,
            scale: [0.5, 0.8, 0.5],
            x: `calc(${Math.random() * 100}vw + ${Math.sin(i) * 60}px)`
          }}
          transition={{ 
            duration: 15 + Math.random() * 10, 
            repeat: Infinity, 
            delay: Math.random() * 10,
            ease: "linear"
          }}
          className="absolute"
        >
          {type === 'gold' && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full blur-[1px]" />}
          {type === 'cyan' && <div className="w-1 h-3 bg-cyan-300 rounded-full blur-[1px] opacity-40" />}
          {type === 'magic' && <Sparkles size={10} className="text-violet-300 opacity-25" />}
          {type === 'leaves' && (
            <div 
              className={`w-3 h-3 rounded-tr-full rounded-bl-full ${rpgMode ? 'bg-red-900/10' : 'bg-emerald-400/20'}`} 
              style={{ transform: `rotate(${Math.random() * 360}deg)` }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
};

// --- Artifacts ---
const LightningArtifact = ({ rpgMode }: { rpgMode: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 overflow-visible">
    <motion.path 
      animate={{ filter: ["drop-shadow(0 0 5px #F59E0B)", "drop-shadow(0 0 12px #F59E0B)", "drop-shadow(0 0 5px #F59E0B)"] }}
      transition={{ duration: 4, repeat: Infinity }}
      d="M50 15 L35 55 L50 55 L40 85 L70 40 L50 40 L60 15 Z" 
      fill={rpgMode ? "#7F1D1D" : "#F59E0B"} 
    />
  </svg>
);

const SphereArtifact = ({ rpgMode }: { rpgMode: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 overflow-visible">
    <g transform="translate(50, 50)">
      {[0, 45, 90, 135].map((angle, i) => (
        <motion.ellipse
          key={angle}
          animate={{ rx: [10, 14, 10], ry: [35, 42, 35], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 6, delay: i * 1, repeat: Infinity }}
          cx="0" cy="0" rx="12" ry="40"
          fill="none"
          stroke={rpgMode ? "#7F1D1D" : "#22D3EE"}
          strokeWidth="1.5"
          transform={`rotate(${angle})`}
        />
      ))}
      <motion.circle animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 4, repeat: Infinity }} r="10" fill={rpgMode ? "#B91C1C" : "#0891B2"} />
      <circle r="4" fill="white" opacity="0.8" />
    </g>
  </svg>
);

const SparkleArtifact = ({ rpgMode }: { rpgMode: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 overflow-visible">
    <g transform="translate(50, 50)">
      <motion.g animate={{ rotate: [0, 15, -15, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}>
        <path d="M0 -42 L12 -12 L42 0 L12 12 L0 42 L-12 12 L-42 0 L-12 -12 Z" fill={rpgMode ? "#7F1D1D" : "#8B5CF6"} />
      </motion.g>
      <motion.circle animate={{ scale: [1, 1.3, 1], opacity: [0.7, 0.9, 0.7] }} transition={{ duration: 3, repeat: Infinity }} r="6" fill="white" />
    </g>
  </svg>
);

const BookArtifact = ({ rpgMode }: { rpgMode: boolean }) => (
  <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 overflow-visible">
    <motion.g animate={{ y: [0, -4, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
      <rect x="20" y="30" width="60" height="45" rx="5" fill="none" stroke={rpgMode ? "#B91C1C" : "#10B981"} strokeWidth="3" opacity="0.4" />
      <path d="M50 30 V75" stroke={rpgMode ? "#B91C1C" : "#10B981"} strokeWidth="3" />
      <path d="M25 42 H45 M25 52 H45 M25 62 H35" stroke={rpgMode ? "#7F1D1D" : "#059669"} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <path d="M55 42 H75 M55 52 H75 M55 62 H65" stroke={rpgMode ? "#7F1D1D" : "#059669"} strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
    </motion.g>
  </svg>
);

const SLIDES = [
  {
    title: 'Ясность в каждом выборе',
    description: 'Разложите сомнения на атомы. Наша система поможет увидеть скрытые факторы и принять правильное решение.',
    Artifact: LightningArtifact,
    particles: 'gold',
    aurora: ['rgba(245, 158, 11, 0.25)', 'rgba(251, 191, 36, 0.1)'],
    haptic: 'light',
    glowColor: 'from-amber-400/20 to-transparent',
    geomColor: 'text-amber-900'
  },
  {
    title: 'Гармония чувств',
    description: 'Прислушайтесь к своему состоянию. Исследуйте природу своих эмоций через глубокий диалог и находите точку покоя внутри себя.',
    Artifact: SphereArtifact,
    particles: 'cyan',
    aurora: ['rgba(6, 182, 212, 0.25)', 'rgba(34, 211, 238, 0.1)'],
    haptic: 'medium',
    glowColor: 'from-cyan-400/20 to-transparent',
    geomColor: 'text-cyan-900'
  },
  {
    title: 'Ваша истинная суть',
    description: 'Узнайте свой психологический архетип. Проходите ежедневные испытания, собирайте артефакты и взрастите свое Древо Мудрости.',
    Artifact: SparkleArtifact,
    particles: 'magic',
    aurora: ['rgba(139, 92, 246, 0.25)', 'rgba(216, 180, 254, 0.1)'],
    haptic: 'impact',
    glowColor: 'from-violet-400/20 to-transparent',
    geomColor: 'text-violet-900'
  },
  {
    title: 'Летопись вашей жизни',
    description: 'Сохраните важные инсайты и моменты благодарности. Создайте личную базу мудрости, которая станет вашей опорой.',
    Artifact: BookArtifact,
    particles: 'leaves',
    aurora: ['rgba(16, 185, 129, 0.25)', 'rgba(20, 184, 166, 0.1)'],
    haptic: 'success',
    glowColor: 'from-emerald-400/20 to-transparent',
    geomColor: 'text-emerald-900'
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
      
      {/* Background Atmosphere */}
      <AuroraBackground colors={slide.aurora} rpgMode={rpgMode} />

      {/* Global Particles (Persistent on all slides) */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={`particles-${currentSlide}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 pointer-events-none"
        >
          <ParticleField type={slide.particles} rpgMode={rpgMode} />
        </motion.div>
      </AnimatePresence>

      <div className="flex-1 w-full max-w-md px-10 flex flex-col items-center justify-center z-10 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="flex flex-col items-center w-full"
          >
            {/* Artifact Container */}
            <div className={`w-56 h-56 rounded-[64px] relative flex items-center justify-center mb-16 animate-float ${
              rpgMode 
                ? 'bg-white border-2 border-red-800 shadow-[10px_10px_0px_#b91c1c]' 
                : 'bg-white bento-border bento-shadow ring-8 ring-white/50'
            }`}>
              
              {/* Layer 1: Sacred Geometry */}
              <SacredGeometry rpgMode={rpgMode} colorClass={slide.geomColor} />

              {/* Layer 2: Breathing Glow */}
              <motion.div 
                animate={{ 
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className={`absolute inset-4 rounded-full blur-3xl bg-gradient-to-r ${slide.glowColor}`}
              />

              {/* Layer 3: Main Icon */}
              <div className="w-32 h-32 relative z-10">
                <slide.Artifact rpgMode={rpgMode} />
              </div>
            </div>

            {/* Typography */}
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`text-3xl font-black italic tracking-tighter mb-5 leading-tight ${rpgMode ? 'text-red-950 font-display-fantasy uppercase' : 'text-slate-900'}`}
            >
              {slide.title}
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.6 }}
              className={`text-[15px] leading-relaxed mb-8 px-2 font-medium ${rpgMode ? 'text-red-900' : 'text-slate-600'}`}
            >
              {slide.description}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-md px-10 pb-16 z-20 flex flex-col items-center">
        {/* Progress System */}
        <div className="flex space-x-3 mb-10">
          {SLIDES.map((_, i) => (
            <motion.div 
              key={i} 
              animate={{ 
                width: currentSlide === i ? 44 : 10,
                backgroundColor: currentSlide === i 
                  ? (rpgMode ? '#991B1B' : '#0F172A') 
                  : (rpgMode ? 'rgba(153, 27, 27, 0.1)' : 'rgba(15, 23, 42, 0.1)')
              }}
              className="h-1.5 rounded-full transition-all duration-500"
            />
          ))}
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={nextSlide}
          className={`w-full py-5 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center space-x-4 shadow-2xl transition-all ${
            rpgMode ? 'rpg-button' : 'bg-slate-900 text-white shadow-slate-900/30'
          }`}
        >
          <span>{currentSlide === SLIDES.length - 1 ? 'Начать путь' : 'Далее'}</span>
          <ArrowRight size={18} strokeWidth={3} />
        </motion.button>
      </div>
      
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
    </div>
  );
};
