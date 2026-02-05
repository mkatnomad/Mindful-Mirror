
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
  rpgMode?: boolean;
}

// --- Background Aurora Component (Max Performance) ---
const AuroraBackground = ({ colors, rpgMode }: { colors: string[], rpgMode: boolean }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {colors.map((color, i) => (
      <motion.div
        key={i}
        animate={{
          x: [Math.random() * 30 - 15, Math.random() * 30 - 15],
          y: [Math.random() * 30 - 15, Math.random() * 30 - 15],
          opacity: [0.1, 0.15, 0.1]
        }}
        transition={{
          duration: 20 + i * 10,
          repeat: Infinity,
          ease: "linear"
        }}
        className="absolute w-[150%] h-[150%] rounded-full blur-[40px]"
        style={{
          background: color,
          top: i === 0 ? '-30%' : '20%',
          left: i === 0 ? '-10%' : '40%',
        }}
      />
    ))}
  </div>
);

// --- Particle Field (Max Performance) ---
const ParticleField = ({ type, rpgMode }: { type: string, rpgMode: boolean }) => {
  const particles = Array.from({ length: 8 });
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      {particles.map((_, i) => (
        <motion.div
          key={`${type}-${i}`}
          initial={{ x: Math.random() * 350, y: 900, opacity: 0 }}
          animate={{ y: -200, opacity: [0, 0.3, 0] }}
          transition={{ duration: 20 + Math.random() * 10, repeat: Infinity, delay: i * 2, ease: "linear" }}
          className="absolute"
          style={{ left: `${(i / 8) * 100}%` }}
        >
          <div className={`w-1 h-1 rounded-full blur-[1px] ${rpgMode ? 'bg-red-400/30' : 'bg-white/40'}`} />
        </motion.div>
      ))}
    </div>
  );
};

// --- Layered Artifact Animations ---
const LightningArtifact = ({ rpgMode }: { rpgMode: boolean }) => (
  <motion.g
    animate={{ 
      y: [0, -8, 0]
    }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  >
    <motion.path 
      animate={{ 
        opacity: [1, 0.7, 1],
        scale: [1, 1.04, 1]
      }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      d="M50 15 L35 55 L50 55 L40 85 L70 40 L50 40 L60 15 Z" 
      fill={rpgMode ? "#FBBF24" : "#F59E0B"} 
    />
  </motion.g>
);

const SphereArtifact = ({ rpgMode }: { rpgMode: boolean }) => (
  <motion.g 
    animate={{ y: [0, -4, 0] }}
    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    transform="translate(50, 50)"
  >
    <g>
      {[0, 60, 120].map((angle, i) => (
        <g key={angle} transform={`rotate(${angle})`}>
          <ellipse
            cx="0" cy="0" rx="14" ry="42"
            fill="none"
            stroke={rpgMode ? "#FBBF24" : "#22D3EE"}
            strokeWidth="1.2"
            opacity="0.15"
          />
          <motion.ellipse
            cx="0" cy="0" rx="14" ry="42"
            fill="none"
            stroke={rpgMode ? "#B91C1C" : "#22D3EE"}
            strokeWidth="1.8"
            strokeDasharray="30 150"
            animate={{ 
              strokeDashoffset: [0, -180],
              opacity: [0.3, 0.6, 0.3],
              scale: [1, 1.02, 1]
            }}
            transition={{ 
              strokeDashoffset: { duration: 4 + i * 1.5, repeat: Infinity, ease: "linear" },
              opacity: { duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 },
              scale: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }
            }}
          />
        </g>
      ))}
      <motion.circle 
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.8, 1, 0.8],
          filter: ["blur(0px)", "blur(3px)", "blur(0px)"]
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        r="14" 
        fill={rpgMode ? "#B91C1C" : "#0891B2"} 
      />
      <motion.circle 
        animate={{ scale: [0.8, 1.8, 0.8], opacity: [0.2, 0, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
        r="18"
        fill="none"
        stroke={rpgMode ? "#B91C1C" : "#22D3EE"}
        strokeWidth="0.8"
      />
    </g>
  </motion.g>
);

const SparkleArtifact = ({ rpgMode }: { rpgMode: boolean }) => (
  <motion.g
    animate={{ 
      y: [0, -10, 0],
      scale: [1, 1.05, 1]
    }}
    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
    transform="translate(50, 50)"
  >
    <motion.g 
      animate={{ rotate: 360 }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
    >
      <path 
        d="M0 -46 L14 -14 L46 0 L14 14 L0 46 L-14 14 L-46 0 L-14 -14 Z" 
        fill={rpgMode ? "#FBBF24" : "#7C3AED"} 
      />
      <motion.path 
        animate={{ opacity: [0.2, 0.6, 0.2], scale: [1, 1.02, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        d="M0 -46 L14 -14 L46 0 L14 14 L0 46 L-14 14 L-46 0 L-14 -14 Z" 
        fill="white" 
        opacity="0.2"
      />
    </motion.g>
    <motion.circle 
      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 2, repeat: Infinity }}
      r="8" 
      fill="white" 
    />
    {[0, 120, 240].map((rot, i) => (
      <motion.circle
        key={i}
        animate={{ 
          rotate: [rot, rot + 360],
          scale: [0.8, 1.2, 0.8]
        }}
        transition={{ 
          rotate: { duration: 4 + i, repeat: Infinity, ease: "linear" },
          scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
        cx="32" cy="0" r="2"
        fill="white"
        style={{ originX: "0px", originY: "0px" }}
      />
    ))}
  </motion.g>
);

const BookArtifact = ({ rpgMode }: { rpgMode: boolean }) => (
  <motion.g
    animate={{ y: [0, -8, 0] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  >
    <rect x="20" y="30" width="60" height="40" rx="6" fill="white" fillOpacity="0.1" stroke={rpgMode ? "#B91C1C" : "#10B981"} strokeWidth="2.5" />
    <motion.path 
      animate={{ opacity: [0.3, 0.6, 0.3] }}
      transition={{ duration: 3, repeat: Infinity }}
      d="M50 30 V70 M25 45 H45 M25 55 H45 M55 45 H75 M55 55 H75" 
      stroke={rpgMode ? "#FBBF24" : "#059669"} 
      strokeWidth="2.5" 
      strokeLinecap="round" 
    />
    <motion.path 
      animate={{ d: ["M20 30 Q35 25 50 30", "M20 30 Q35 35 50 30"] }}
      transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
      stroke={rpgMode ? "#B91C1C" : "#10B981"}
      strokeWidth="2"
      fill="none"
    />
  </motion.g>
);

const SLIDES = [
  {
    title: 'Мучаешься выбором?',
    description: 'Введи все «за» и «против», а наша система подсветит новые факторы, скрытые риски и подскажет первый шаг.',
    Artifact: LightningArtifact,
    aurora: ['rgba(245, 158, 11, 0.15)', 'rgba(251, 191, 36, 0.08)'],
    glowColor: 'from-amber-400/20 to-transparent',
    mainBg: '#FFFBEB',
    cardBg: 'rgba(255, 252, 240, 0.95)',
    accentColor: 'text-amber-600'
  },
  {
    title: 'Гармония чувств',
    description: 'Общайся с эмпатичным помощником в моменты грусти, радости или неопределенности. Он поможет найти точку покоя внутри себя.',
    Artifact: SphereArtifact,
    aurora: ['rgba(6, 182, 212, 0.15)', 'rgba(34, 211, 238, 0.08)'],
    glowColor: 'from-cyan-400/20 to-transparent',
    mainBg: '#ECFEFF',
    cardBg: 'rgba(240, 253, 250, 0.95)',
    accentColor: 'text-cyan-600'
  },
  {
    title: 'Истинная суть',
    description: 'Узнай свой архетип. Проходи ежедневные квесты, собирай артефакты и взрасти свое Древо Мудрости.',
    Artifact: SparkleArtifact,
    aurora: ['rgba(139, 92, 246, 0.15)', 'rgba(216, 180, 254, 0.08)'],
    glowColor: 'from-violet-400/20 to-transparent',
    mainBg: '#F5F3FF',
    cardBg: 'rgba(249, 245, 255, 0.95)',
    accentColor: 'text-violet-600'
  },
  {
    title: 'Дневник мудрости',
    description: 'Записывай инсайты, моменты благодарности и намерения на день. Твои мысли — это фундамент твоего роста.',
    Artifact: BookArtifact,
    aurora: ['rgba(16, 185, 129, 0.15)', 'rgba(20, 184, 166, 0.08)'],
    glowColor: 'from-emerald-400/20 to-transparent',
    mainBg: '#ECFDF5',
    cardBg: 'rgba(240, 255, 249, 0.95)',
    accentColor: 'text-emerald-600'
  }
];

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, rpgMode = false }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const nextSlide = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
      }
    } else {
      setIsExiting(true);
      if (window.Telegram?.WebApp?.HapticFeedback) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
      }
      setTimeout(onComplete, 900);
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      animate={{ 
        opacity: isExiting ? 0 : 1, 
        scale: isExiting ? 1.05 : 1,
        filter: isExiting ? 'blur(10px)' : 'blur(0px)'
      }}
      transition={{ duration: 0.9, ease: "easeInOut" }}
      className={`h-screen w-full flex flex-col items-center justify-center relative overflow-hidden transition-all duration-1000 ${rpgMode ? 'bg-parchment font-serif-fantasy' : ''}`}
      style={{ backgroundColor: !rpgMode ? slide.mainBg : undefined }}
    >
      <AuroraBackground colors={slide.aurora} rpgMode={rpgMode} />
      <ParticleField type={slide.title} rpgMode={rpgMode} />

      {/* Main Content Area */}
      <div className="flex-1 w-full max-w-md px-6 flex flex-col items-center justify-evenly z-10 text-center py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center w-full"
          >
            {/* Artifact Container */}
            <div className={`w-44 h-44 xs:w-48 xs:h-48 rounded-[56px] relative flex items-center justify-center mb-6 xs:mb-8 overflow-hidden transition-all duration-700 ${
              rpgMode 
                ? 'bg-slate-800/50 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50'
                : 'bento-border ring-4 ring-white shadow-[0_20px_50px_-10px_rgba(0,0,0,0.08)]'
            }`}
            style={{ backgroundColor: !rpgMode ? slide.cardBg : undefined }}
            >
              <motion.div 
                animate={{ 
                  opacity: [0.2, 0.5, 0.2], 
                  scale: [1, 1.4, 1],
                  rotate: [0, 90, 180, 270, 360]
                }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className={`absolute inset-4 rounded-full blur-3xl bg-gradient-to-r ${slide.glowColor}`} 
              />
              
              <div className="w-24 h-24 xs:w-28 xs:h-28 relative z-10">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                   <slide.Artifact rpgMode={rpgMode} />
                </svg>
              </div>

              {!rpgMode && <div className="absolute inset-0 border border-white/60 rounded-[56px] pointer-events-none" />}
            </div>

            {/* Typography */}
            <div
              className={`w-full p-8 rounded-[40px] border transition-all duration-700 text-left ${
                rpgMode 
                  ? 'bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40'
                  : 'backdrop-blur-3xl bento-border bento-shadow shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)]'
              }`}
              style={{ backgroundColor: !rpgMode ? slide.cardBg : undefined }}
            >
              <h2 className={`text-2xl xs:text-3xl font-black tracking-tighter mb-4 xs:mb-6 leading-tight ${rpgMode ? 'text-slate-100  uppercase' : 'text-slate-900'}`}>
                {slide.title}
              </h2>
              <p className={`text-base xs:text-lg leading-relaxed font-semibold opacity-90 ${rpgMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {slide.description}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Layer */}
      <div className={`w-full max-w-md px-6 pb-12 z-20 flex flex-col items-center transition-opacity duration-700 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
        <div className="flex space-x-3 mb-8 xs:mb-10">
          {SLIDES.map((_, i) => (
            <motion.div 
              key={i} 
              animate={{ 
                width: currentSlide === i ? 48 : 10,
                backgroundColor: currentSlide === i 
                  ? (rpgMode ? '#fbbf24' : '#0F172A') 
                  : (rpgMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.08)')
              }}
              className="h-2 rounded-full transition-all duration-500"
            />
          ))}
        </div>

        <motion.button 
          whileTap={{ scale: 0.96 }}
          onClick={nextSlide}
          className={`w-full py-5 xs:py-6 rounded-[32px] font-black text-xs xs:text-sm uppercase tracking-[0.3em] flex items-center justify-center space-x-4 shadow-2xl transition-all duration-300 ${
            rpgMode ? 'rpg-button' : 'bg-slate-900 text-white shadow-slate-900/10'
          }`}
        >
          <span>{currentSlide === SLIDES.length - 1 ? 'Начать путь' : 'Далее'}</span>
          <ArrowRight size={22} strokeWidth={3} className="transition-transform group-hover:translate-x-1" />
        </motion.button>
      </div>
      
      {/* Texture Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.015] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />
    </motion.div>
  );
};
