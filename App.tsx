
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ViewState, JournalMode, ChatSession, Message, UserProfile, JournalEntry, Archetype, SiteConfig } from './types';
import { BottomNav } from './components/BottomNav';
import { ChatInterface } from './components/ChatInterface';
import { JournalInterface } from './components/JournalInterface';
import { AdminInterface } from './components/AdminInterface';
import { Onboarding } from './components/Onboarding';
// Fixed: Removed non-existent import processRPGQuest
import { generateRPGQuest, processRPGChoice } from './services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, BookOpen, User as UserIcon, Zap, Star, ArrowLeft, ArrowRight, Compass, Check, X, Quote, Loader2, Trophy, Wand2, ChevronRight, Sparkles, Sword, ShieldCheck, Lock, Settings2, History as HistoryIcon, RefreshCcw, ShieldAlert, Flame, Shield, RotateCcw, ChevronDown, ChevronUp, Package, Plus, Send, Clock, Circle, Trash2, Moon } from 'lucide-react';

const WELCOME_ENERGY_DECISIONS = 5;
const WELCOME_ENERGY_EMOTIONS = 3;
const WELCOME_ENERGY_QUESTS = 3;

const ADMIN_ID = 379881747; 

const SUBSCRIPTION_TEXTS = {
  normal: {
    title: 'Расширь границы',
    subTitle: '',
    description: 'Premium открывает безлимитный доступ на 30 дней. Без автопродления и неожиданных списаний.',
    mentorSpeech: 'Твой путь осознанности требует больше пространства для маневра.',
    balanceTitle: 'Ваш текущий баланс',
  },
  rpg: {
    title: 'Пробудить полную силу',
    subTitle: 'Станьте Мастером своей судьбы',
    description: 'Энергия артефактов на исходе. Premium открывает источники силы и убирает все преграды на 30 дней.',
    mentorSpeech: 'Ваше древо упирается в свод... Чтобы расти дальше, нужны Звездные Ключи.',
    balanceTitle: 'Запас магической энергии',
  }
};

const QUEST_CALLS = [
  "Нити судьбы переплелись...",
  "Звезды указывают путь",
  "Ваше испытание созрело",
  "Голос предков зовет",
  "Тайная дверь приоткрылась",
  "Путь мудрости ждет вас"
];

declare global {
  interface Window {
    Telegram: any;
  }
}

const cloudStorage = {
  setItem: (key: string, value: any): Promise<void> => {
    return new Promise((resolve) => {
      const tg = window.Telegram?.WebApp;
      if (tg?.isVersionAtLeast?.('6.9') && tg?.CloudStorage) {
        tg.CloudStorage.setItem(key, JSON.stringify(value), (err: any) => {
          if (err) console.error(`CloudStorage Set Error [${key}]:`, err);
          resolve();
        });
      } else {
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      }
    });
  },
  getItem: <T,>(key: string): Promise<T | null> => {
    return new Promise((resolve) => {
      const tg = window.Telegram?.WebApp;
      if (tg?.isVersionAtLeast?.('6.9') && tg?.CloudStorage) {
        tg.CloudStorage.getItem(key, (err: any, value: string) => {
          if (err || !value) resolve(null);
          else {
            try {
              resolve(JSON.parse(value));
            } catch {
              resolve(null);
            }
          }
        });
      } else {
        const value = localStorage.getItem(key);
        resolve(value ? JSON.parse(value) : null);
      }
    });
  }
};

const ArtifactBase = ({ children, rpgMode, colorStart, colorEnd, size, idPrefix = "art", isOutline = false }: { children?: React.ReactNode, rpgMode: boolean, colorStart: string, colorEnd: string, size: number, idPrefix?: string, isOutline?: boolean }) => {
  const gradId = `${idPrefix}-${colorStart.replace('#','')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" className="overflow-visible">
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={rpgMode ? "#B91C1C" : colorStart} />
          <stop offset="100%" stopColor={rpgMode ? "#7F1D1D" : colorEnd} />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={rpgMode ? "#312E81" : colorStart} fillOpacity={isOutline ? "0.03" : "0.05"} />
      <circle cx="50" cy="50" r="40" fill={rpgMode ? "#312E81" : colorStart} fillOpacity={isOutline ? "0.1" : "0.08"} />
      <g transform="translate(10, 10) scale(0.8)">
        {children}
      </g>
      <path 
        d="M25 40C25 40 40 20 75 35" 
        stroke="white" 
        strokeWidth="5" 
        strokeLinecap="round" 
        opacity={isOutline ? "0.15" : "0.25"} 
      />
      <circle cx="75" cy="30" r="4" fill="white" opacity={isOutline ? "0.1" : "0.3"} />
      {rpgMode && (
        <circle cx="50" cy="50" r="46" stroke="#FDE68A" strokeWidth="1" strokeDasharray="2 4" opacity="0.3" />
      )}
    </svg>
  );
};

export const TreeIcon = ({ stage, size = 40, rpgMode = false }: { stage: number, size?: number, rpgMode?: boolean }) => {
  const treeConfigs = [
    { start: "#FEF3C7", end: "#D97706", label: "seed" },
    { start: "#ECFDF5", end: "#10B981", label: "sprout" },
    { start: "#D1FAE5", end: "#059669", label: "shoot" },
    { start: "#A7F3D0", end: "#047857", label: "sapling" },
    { start: "#6EE7B7", end: "#065F46", label: "young" },
    { start: "#34D399", end: "#064E3B", label: "strong" },
    { start: "#10B981", end: "#164E63", label: "branchy" },
    { start: "#F472B6", end: "#BE185D", label: "blooming" },
    { start: "#FBBF24", end: "#B45309", label: "fruiting" },
    { start: "#818CF8", end: "#4338CA", label: "wisdom" },
  ];
  const cfg = treeConfigs[stage] || treeConfigs[0];
  const strokeColor = rpgMode ? "#FFFBEB" : `url(#tree-${cfg.start.replace('#','')})`;
  const fillColor = rpgMode ? "#FFFBEB" : `url(#tree-${cfg.start.replace('#','')})`;
  const trunkColor = rpgMode ? "#78350F" : "#78350F";

  const renderTreeContent = () => {
    switch(stage) {
      case 0:
        return (
          <g>
            <path d="M50 78C56 78 60 72 60 65C60 58 50 48 50 48C50 48 40 58 40 65C40 72 44 78 50 78Z" fill={fillColor} />
            <path d="M35 82H65" stroke={fillColor} strokeWidth="3" strokeLinecap="round" opacity="0.3" />
          </g>
        );
      case 1:
        return (
          <g>
            <path d="M50 82V75C50 75 50 68 58 64" stroke={strokeColor} strokeWidth="6" strokeLinecap="round" fill="none" />
            <ellipse cx="58" cy="64" rx="5" ry="3" transform="rotate(-25 58 64)" fill={fillColor} />
          </g>
        );
      case 2:
        return (
          <g>
            <path d="M50 82V55" stroke={strokeColor} strokeWidth="7" strokeLinecap="round" />
            <path d="M50 68C50 68 38 64 32 58" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" fill="none" />
            <path d="M50 62C50 62 62 58 68 52" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" fill="none" />
            <ellipse cx="32" cy="58" rx="6" ry="3.5" transform="rotate(20 32 58)" fill={fillColor} />
            <ellipse cx="68" cy="52" rx="6" ry="3.5" transform="rotate(-20 68 52)" fill={fillColor} />
          </g>
        );
      case 3:
        return (
          <g>
            <path d="M50 82V62" stroke={trunkColor} strokeWidth="8" strokeLinecap="round" />
            <circle cx="50" cy="48" r="22" fill={fillColor} />
          </g>
        );
      case 4:
        return (
          <g>
            <path d="M50 82V58" stroke={trunkColor} strokeWidth="11" strokeLinecap="round" />
            <circle cx="50" cy="42" r="30" fill={fillColor} />
            <circle cx="35" cy="48" r="12" fill={fillColor} opacity="0.8" />
            <circle cx="65" cy="48" r="12" fill={fillColor} opacity="0.8" />
          </g>
        );
      case 5:
        return (
          <g>
            <path d="M50 85L50 60M42 85L50 65M58 85L50 65" stroke={trunkColor} strokeWidth="12" strokeLinecap="round" />
            <circle cx="50" cy="40" r="36" fill={fillColor} />
          </g>
        );
      case 6:
        return (
          <g>
            <path d="M50 85V60L25 40M50 60L75 40M50 70L65 55" stroke={trunkColor} strokeWidth="10" strokeLinecap="round" />
            <circle cx="50" cy="35" r="32" fill={fillColor} />
            <circle cx="25" cy="40" r="24" fill={fillColor} opacity="0.9" />
            <circle cx="75" cy="40" r="24" fill={fillColor} opacity="0.9" />
          </g>
        );
      case 7:
        return (
          <g>
            <path d="M50 85V60" stroke={trunkColor} strokeWidth="12" strokeLinecap="round" />
            <circle cx="50" cy="40" r="38" fill={fillColor} />
            <circle cx="30" cy="45" r="26" fill={fillColor} opacity="0.9" />
            <circle cx="70" cy="45" r="26" fill={fillColor} opacity="0.9" />
            <circle cx="50" cy="25" r="4" fill="#FB7185" />
            <circle cx="35" cy="38" r="4" fill="#FB7185" />
            <circle cx="65" cy="38" r="4" fill="#FB7185" />
            <circle cx="42" cy="52" r="4" fill="#FB7185" />
            <circle cx="58" cy="52" r="4" fill="#FB7185" />
          </g>
        );
      case 8:
        return (
          <g>
            <path d="M50 85V55L15 45M50 55L85 45" stroke={trunkColor} strokeWidth="14" strokeLinecap="round" />
            <circle cx="50" cy="35" r="40" fill={fillColor} />
            <circle cx="20" cy="45" r="28" fill={fillColor} />
            <circle cx="80" cy="45" r="28" fill={fillColor} />
            <circle cx="30" cy="30" r="5" fill="#F59E0B" />
            <circle cx="70" cy="30" r="5" fill="#F59E0B" />
            <circle cx="50" cy="45" r="5" fill="#F59E0B" />
            <circle cx="15" cy="50" r="5" fill="#F59E0B" />
            <circle cx="85" cy="50" r="5" fill="#F59E0B" />
          </g>
        );
      case 9:
        return (
          <g>
            <circle cx="50" cy="45" r="48" stroke={fillColor} strokeWidth="1" strokeDasharray="4 4" opacity="0.3" />
            <circle cx="50" cy="45" r="42" fill={fillColor} opacity="0.1" />
            <path d="M50 85V50L20 30M50 50L80 30M50 65L70 45M50 65L30 45" stroke={trunkColor} strokeWidth="10" strokeLinecap="round" />
            <circle cx="50" cy="35" r="35" fill={fillColor} />
            <circle cx="20" cy="35" r="25" fill={fillColor} opacity="0.9" />
            <circle cx="80" cy="35" r="25" fill={fillColor} opacity="0.9" />
            <path d="M50 15L54 24H46L50 15Z" fill="#FDE68A" />
            <circle cx="50" cy="40" r="10" fill="#FDE68A" opacity="0.6" />
            <circle cx="20" cy="30" r="4" fill="#FDE68A" />
            <circle cx="80" cy="30" r="4" fill="#FDE68A" />
          </g>
        );
      default: return <circle cx="50" cy="50" r="20" fill="gray" />;
    }
  };
  return (
    <ArtifactBase rpgMode={rpgMode} colorStart={cfg.start} colorEnd={cfg.end} size={size} idPrefix="tree">
      {renderTreeContent()}
    </ArtifactBase>
  );
};

const BackgroundEffects = ({ rpgMode }: { rpgMode: boolean }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {rpgMode ? (
        <>
          <div className="absolute top-[10%] left-[-5%] opacity-[0.03] rotate-12 scale-[2]">
            <Compass size={120} />
          </div>
          <div className="absolute bottom-[15%] right-[-5%] opacity-[0.02] -rotate-12 scale-[2.5]">
            <BookOpen size={150} />
          </div>
          <div className="absolute top-[40%] right-[10%] opacity-[0.015] rotate-45">
             <Wand2 size={80} />
          </div>
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: '110vh', x: `${Math.random() * 100}vw`, opacity: 0 }}
              animate={{ 
                y: '-10vh', 
                opacity: [0, 0.2, 0],
                x: `${(Math.random() * 100)}vw` 
              }}
              transition={{ 
                duration: 15 + Math.random() * 20, 
                repeat: Infinity, 
                delay: Math.random() * 10,
                ease: "linear"
              }}
              className="absolute w-1 h-1 bg-white rounded-full blur-[1px]"
            />
          ))}
        </>
      ) : (
        <>
          <div className="absolute inset-0 opacity-[0.05]" style={{ 
            backgroundImage: 'radial-gradient(#94a3b8 0.5px, transparent 0.5px)', 
            backgroundSize: '24px 24px' 
          }} />
          <motion.div 
            animate={{ 
              x: [0, 50, -30, 0],
              y: [0, -40, 60, 0],
              scale: [1, 1.2, 0.9, 1]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-200/20 blur-[100px]"
          />
          <motion.div 
            animate={{ 
              x: [0, -60, 40, 0],
              y: [0, 50, -30, 0],
              scale: [1, 0.8, 1.1, 1]
            }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-200/20 blur-[100px]"
          />
        </>
      )}
    </div>
  );
};

const DecisionIllustration = ({ rpgMode, size = 32, opacity = 1 }: { rpgMode: boolean, size?: number, opacity?: number }) => (
  <ArtifactBase rpgMode={rpgMode} colorStart="#F59E0B" colorEnd="#D97706" size={size} idPrefix="dec">
    <path 
      d="M50 10L20 55H45L30 90L80 40H55L70 10H50Z" 
      fill={rpgMode ? "white" : `url(#dec-F59E0B)`} 
      fillOpacity={opacity}
      className={opacity === 1 ? "animate-pulse" : ""}
    />
  </ArtifactBase>
);

const EmotionsIllustration = ({ rpgMode, size = 26, opacity = 1 }: { rpgMode: boolean, size?: number, opacity?: number }) => (
  <ArtifactBase rpgMode={rpgMode} colorStart="#0891B2" colorEnd="#22D3EE" size={size} idPrefix="emo" isOutline={opacity < 1}>
    <motion.g 
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      transform="translate(50, 50)"
      opacity={opacity}
    >
      <g>
        {[0, 60, 120].map((angle, i) => (
          <g key={angle} transform={`rotate(${angle})`}>
            <ellipse
              cx="0" cy="0" rx="14" ry="42"
              fill="none"
              stroke={rpgMode ? "white" : "#22D3EE"}
              strokeWidth="1.2"
              opacity="0.15"
            />
            <motion.ellipse
              cx="0" cy="0" rx="14" ry="42"
              fill="none"
              stroke={rpgMode ? (i === 0 ? "white" : "#FDE68A") : "#22D3EE"}
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
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          r="14" 
          fill={rpgMode ? "white" : "#0891B2"} 
        />
      </g>
    </motion.g>
  </ArtifactBase>
);

const ReflectionIllustration = ({ rpgMode, size = 26, opacity = 1 }: { rpgMode: boolean, size?: number, opacity?: number }) => (
  <ArtifactBase rpgMode={rpgMode} colorStart="#10B981" colorEnd="#059669" size={size} idPrefix="ref" isOutline={opacity < 1}>
    <motion.g
      animate={{ y: [0, -8, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      opacity={opacity}
    >
      <rect x="20" y="30" width="60" height="40" rx="6" fill="white" fillOpacity="0.1" stroke={rpgMode ? "white" : "#10B981"} strokeWidth="2.5" />
      <motion.path 
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
        d="M50 30 V70 M25 45 H45 M25 55 H45 M55 45 H75 M55 55 H75" 
        stroke={rpgMode ? "white" : "#059669"} 
        strokeWidth="2.5" 
        strokeLinecap="round" 
      />
      <motion.path 
        animate={{ d: ["M20 30 Q35 25 50 30", "M20 30 Q35 35 50 30"] }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
        stroke={rpgMode ? "white" : "#10B981"}
        strokeWidth="2"
        fill="none"
      />
    </motion.g>
  </ArtifactBase>
);

const PrismAnimation = ({ rpgMode }: { rpgMode: boolean }) => (
  <div className="relative w-full flex flex-col items-center justify-center mb-4 mt-1 overflow-visible">
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
       {[...Array(6)].map((_, i) => (
         <motion.div
           key={i}
           animate={{ rotate: 360 }}
           transition={{ duration: 30 + i * 5, repeat: Infinity, ease: "linear" }}
           className="absolute w-[400px] h-[400px] opacity-[0.03]"
           style={{
             background: `conic-gradient(from 0deg, transparent 0deg, ${rpgMode ? '#F59E0B' : '#818CF8'} 45deg, transparent 90deg)`
           }}
         />
       ))}
    </div>

    <motion.div
      animate={{ 
        y: [0, -15, 0],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className="relative z-10 flex items-center justify-center overflow-visible"
    >
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
        className={`absolute w-48 h-48 rounded-full border-[0.5px] border-dashed opacity-[0.12] ${rpgMode ? 'border-amber-400' : 'border-blue-400'}`}
      />
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
        className={`absolute w-40 h-40 rounded-full border-[1px] opacity-[0.16] ${rpgMode ? 'border-amber-50' : 'border-blue-500'}`}
      />

      <div className="relative w-32 h-32 flex items-center justify-center overflow-visible">
        <svg width="120" height="120" viewBox="0 0 100 100" className="overflow-visible">
          <defs>
            <radialGradient id="highKeyGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="40%" stopColor={rpgMode ? "#FFFBEB" : "#F0F9FF"} />
              <stop offset="100%" stopColor={rpgMode ? "#FCD34D" : "#BAE6FD"} />
            </radialGradient>
            
            <linearGradient id="facetShimmer" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="white" stopOpacity="0.8" />
              <stop offset="50%" stopColor="white" stopOpacity="0" />
              <stop offset="100%" stopColor="white" stopOpacity="0.4" />
            </linearGradient>

            <filter id="bloomSpread">
              <feGaussianBlur stdDeviation="8" result="blur"/>
              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
          </defs>
          
          <motion.path
            animate={{ 
              scale: [1, 1.03, 1],
              filter: ["drop-shadow(0 0 12px rgba(255,255,255,0.4))", "drop-shadow(0 0 35px rgba(255,255,255,0.8))", "drop-shadow(0 0 12px rgba(255,255,255,0.4))"]
            }}
            transition={{ duration: 5, repeat: Infinity }}
            d="M50 5 L85 20 L95 50 L85 80 L50 95 L15 80 L5 50 L15 20 Z" 
            fill="url(#highKeyGrad)" 
            stroke="white"
            strokeWidth="0.8"
            strokeOpacity="0.6"
          />

          <g opacity="0.35" stroke="white" strokeWidth="0.4">
            <path d="M50 5 L50 95" />
            <path d="M5 50 L95 50" />
            <path d="M15 20 L85 80" />
            <path d="M15 80 L85 20" />
          </g>

          <motion.path 
            animate={{ opacity: [0.1, 0.4, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            d="M50 5 L85 20 L95 50 L85 80 L50 95 L15 80 L5 50 L15 20 Z" 
            fill="url(#facetShimmer)"
          />

          <motion.circle 
            animate={{ 
              r: [12, 20, 12],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            cx="50" cy="50" r="14" 
            fill="white" 
            filter="url(#bloomSpread)"
          />
        </svg>
      </div>
    </motion.div>
  </div>
);

const ARCHETYPES: Archetype[] = [
  { id: '1', name: 'Шут', role: 'Мастер игры', motto: 'Живи моментом!', strength: 'Юмор и игривость', weakness: 'Легкомыслие', quote: 'Смех — это кратчайшее расстояние между двумя людьми.', description: 'Вы умеете находить радость в любой ситуации и превращать скуку в праздник.', meaning: 'Учит не принимать жизнь слишком серьезно и видеть абсурдность проблем.' },
  { id: '2', name: 'Славный малый', role: 'Союзник', motto: 'Мы все равны.', strength: 'Эмпатия и реализм', weakness: 'Потеря индивидуальности', quote: 'Быть собой — величайшее достижение в мире, который пытается сделать вас кем-то другим.', description: 'Вы цените честность, приземленность и глубокую связь с обычными людьми.', meaning: 'Символизирует потребность в принадлежности и принятии себя таким, какой ты есть.' },
  { id: '3', name: 'Заботливый', role: 'Опекун', motto: 'Люби ближнего своего.', strength: 'Альтруизм и щеาะдростью', weakness: 'Мученичество', quote: 'Забота о других — это самая высокая форма заботы о собственной душе.', description: 'Ваше призвание — помогать, защищать и создавать безопасное пространство для роста.', meaning: 'Символизирует потребность в безусловной поддержке и сострадании.' },
  { id: '4', name: 'Правитель', role: 'Лидер', motto: 'Власть — это ответственность.', strength: 'Лидерство и системность', weakness: 'Авторитаризм', quote: 'Управляй собой, прежде чем пытаться управлять миром.', description: 'Вы стремитесь создать порядок из хаоса и нести ответственность за структуру.', meaning: 'Учит ответственности за результат и умению выстраивать гармоничные системы.' },
  { id: '5', name: 'Творец', role: 'Архитектор', motto: 'Если это можно представить, это можно сделать.', strength: 'Креативность и воображение', weakness: 'Перфекционизм', quote: 'Творчество требует мужества отпустить уверенность в известном.', description: 'Ваша цель — создать нечто вечное и уникальное, выразив свою внутреннюю истину.', meaning: 'Импульс к самовыражению и материализации идей.' },
  { id: '6', name: 'Невинный', role: 'Мечтатель', motto: 'Счастье доступно каждому.', strength: 'Оптимизм и вера', weakness: 'Наивность', quote: 'Чистое сердце видит правду там, где разум видит лишь сложности.', description: 'Вы верите в доброту мира и стремитесь к простоте и гармонии.', meaning: 'Стремление к возвращению к истокам и первозданной радости.' },
  { id: '7', name: 'Мудрец', role: 'Наставник', motto: 'Истина освобождает.', strength: 'Инттеллект и анализ', weakness: 'Отстраненность', quote: 'Познание самого себя — это единственный путь к истинному свету.', description: 'Вы ищете истину во всем и стремитесь понять законы мироздания через логику.', meaning: 'Путь объективного знания и глубокого понимания реальности.' },
  { id: '8', name: 'Искатель', role: 'Странник', motto: 'Не ограничивай меня.', strength: 'Автономия и честность', weakness: 'Бесцельность', quote: 'Не все блуждающие потеряны, некоторые просто ищут свой дом внутри.', description: 'Ваша жизнь — это вечный поиск себя и новых горизовнтов смысла.', meaning: 'Стремление к индивидуальной свободе и самопознанию вне рамок.' },
  { id: '9', name: 'Бунтарь', role: 'Изгой', motto: 'Правила созданы, чтобы их нарушать.', strength: 'Радикальная свобода', weakness: 'Саморазрушение', quote: 'Чтобы построить новое, нужно иметь смелость разрушить старое.', description: 'Вы — сила трансформации, которая сметает отжившее и несправедливое.', meaning: 'Необходимость перемен через разрушение устаревших структур.' },
  { id: '10', name: 'Маг', role: 'Алхимик', motto: 'Создавай свою реальность.', strength: 'Интуиция и воля', weakness: 'Манипуляция', quote: 'Магия — это просто наука, которую мы еще не до конца осознали.', description: 'Вы понимаете скрытые связи и меняете жизнь через намерение и энергию.', meaning: 'Сила внутренней трансформации и влияния на мир через сознание.' },
  { id: '11', name: 'Герой', role: 'Воин', motto: 'Где есть воля, там есть и путь.', strength: 'Мужество и решимость', weakness: 'Высокомерие', quote: 'Победа над самим собой — единственная победа, которая имеет значение.', description: 'Вы преодолеваете любые препятствия, боретесь за идеалы и доказываете свою силу.', meaning: 'Борьба за справедливость, защита границ и достижение целей.' },
  { id: '12', name: 'Любовник', role: 'Эстет', motto: 'У меня есть только ты.', strength: 'Страсть и преданность', weakness: 'Зависимость', quote: 'Любовь — это единственная реальность, в которой стоит жить.', description: 'Вы стремитесь к глубокой эмоциональной близости, красоте и удовольствию.', meaning: 'Эмоциональная полнота, эстетическое наслаждение и единение с миром.' },
];

export const RANKS = [
  { threshold: 0, title: "Зерно", desc: "Потенциал к пробуждению." },
  { threshold: 100, title: "Росток", desc: "Первые всходы вашего духа." },
  { threshold: 300, title: "Побег", desc: "Стремление к свету." },
  { threshold: 600, title: "Саженец", desc: "Крепкие корни осознанности." },
  { threshold: 1000, title: "Молодое Дерево", desc: "Заметный рост и гибкость." },
  { threshold: 2000, title: "Крепкое Дерево", desc: "Стабильность и уверенность." },
  { threshold: 4000, title: "Ветвистое Древо", desc: "Широта взглядов." },
  { threshold: 8000, title: "Цветущее Древо", desc: "Раскрытие талантов." },
  { threshold: 15000, title: "Плодоносящее Древо", desc: "Ваш опыт приносит пользу другим." },
  { threshold: 30000, title: "Древо Мудрости", desc: "Вершина осознания и покоя." },
];

const QUESTIONS = [
  { q: 'Что для вас важнее всего в жизни?', options: ['Порядок и успех', 'Свобода и приключения', 'Любовь и близость', 'Знания и мудрость'] },
  { q: 'Как вы обычно реагируете на трудности?', options: ['Беру ответственность', 'Ищу новый путь', 'Помогаю другим', 'Анализирую причины'] },
  { q: 'Ваш идеальный выходной...', options: ['Планирование дел', 'Творчество или поход', 'Время с семьей', 'Чтение и размышления'] },
  { q: 'Чего вы боитесь больше всего?', options: ['Хаоса и слабости', 'Ограничений и скуки', 'Одиночества и предательства', 'Невежества и обмана'] },
  { q: 'Ваша главная цель...', options: ['Оставить след в истории', 'Найти свое истинное Я', 'Сделать мир добрее', 'Понять суть вещей'] },
  { q: 'Как вы ведете себя в компании?', options: ['Беру роль лидера', 'Делюсь открытиями', 'Забочусь о комфорте', 'Наблюдаю за всеми'] },
  { q: 'Что вас больше вдохновляет?', options: ['Крупные проекты', 'Неизвестные горизонты', 'Гармония отношений', 'Глубокие истины'] },
  { q: 'Ваше отношение к правилам?', options: ['Необходимый порядок', 'Они часто ограничивают', 'Они защищают людей', 'Они должны быть разумны'] },
  { q: 'Качество, которое цените в людях?', options: ['Надежность и сила', 'Оригинальность', 'Доброта и тепло', 'Интеллект и глубина'] },
  { q: 'Ваш способ изменить мир?', options: ['Через управление', 'Через личный пример', 'Через помощь нуждающимся', 'Через поиск знаний'] },
  { q: 'Как вы выбираете покупки?', options: ['Статус и качество', 'Уникальный дизайн', 'То, что порадует близких', 'Функциональность'] },
  { q: 'Какую суперсилу вы бы выбрали?', options: ['Власть над временем', 'Создание новых миров', 'Исцеление душ', 'Знание будущего'] },
  { q: 'Где вы чувствуете себя лучше всего?', options: ['В центре событий', 'В пути к цели', 'В кругу любимых людей', 'В тишине и покое'] },
  { q: 'Ваше кредо:', options: ['Победа любой ценой', 'Вечный поиск смысла', 'Любовь спасет мир', 'Истина превыше всего'] },
  { q: 'Что для вас является истинным богатством?', options: ['Стабильность и наследие', 'Свобода и новые открытия', 'Глубина человеческих связей', 'Внутренняя сила и влияние'] },
];

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [isBuyingEnergy, setIsBuyingEnergy] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [appStats, setAppStats] = useState<any>({ total: 0, premium: 0, sessions: 0, minutes: 0, archetypes: {} });
  
  const [userProfile, setUserProfile] = useState<UserProfile>({ 
    name: '', avatarUrl: null, isSetup: true, isRegistered: false, onboardingDone: false, archetype: null, xp: 0, 
    lastQuestDate: null, artifacts: [], totalSessions: 0, totalMinutes: 0, totalDecisions: 0, rpgMode: false,
    firstRunDate: null, isSubscribed: false, subscriptionExpiry: null,
    lastUsageDate: null, dailyDecisionCount: 0, dailyEmotionsCount: 0, totalQuestsDone: 0, totalEmotionsDone: 0,
    energyDecisions: WELCOME_ENERGY_DECISIONS,
    energyEmotions: WELCOME_ENERGY_EMOTIONS,
    energyQuests: WELCOME_ENERGY_QUESTS
  });

  const [history, setHistory] = useState<ChatSession[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('ONBOARDING');
  const [selectedMode, setSelectedMode] = useState<JournalMode | null>(null);
  const [testQuestionIdx, setTestQuestionIdx] = useState(0);
  const [testAnswers, setTestAnswers] = useState<number[]>([]);
  const [localSelectedIdx, setLocalSelectedIdx] = useState<number | null>(null);
  const [viewingHistorySession, setViewingHistorySession] = useState<ChatSession | null>(null);
  const [gameStatus, setGameStatus] = useState<'IDLE' | 'LOADING' | 'QUEST' | 'RESULT'>('IDLE');
  const [questData, setQuestData] = useState<{ scene: string; optA: string; optB: string } | null>(null);
  const [questOutcome, setQuestOutcome] = useState<{ outcome: string; artifact: string } | null>(null);
  const [arcExpanded, setArcExpanded] = useState(false);

  const getTelegramUserId = () => window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

  const reportEvent = async (type: string, value: any) => {
    try {
      await fetch('/api/report-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, value, userId: getTelegramUserId() })
      });
    } catch (e) {
      console.error("Event reporting error", e);
    }
  };

  const syncSubscription = useCallback(async (userId: number) => {
    try {
      const resp = await fetch(`/api/check-sub?userId=${userId}`);
      if (!resp.ok) return;
      const data = await resp.json();
      
      setUserProfile(prev => ({
        ...prev,
        isSubscribed: data.isSubscribed || prev.isSubscribed,
        energyDecisions: data.energy?.decisions ?? prev.energyDecisions,
        energyEmotions: data.energy?.emotions ?? prev.energyEmotions,
        energyQuests: data.energy?.quests ?? prev.energyQuests
      }));
    } catch (e) {
      console.error("Sub check error", e);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const resp = await fetch('/api/get-stats');
      if (resp.ok) {
        const data = await resp.json();
        setAppStats(data);
      }
    } catch (e) {
      console.error("Stats error", e);
    }
  }, []);

  useEffect(() => {
    const initData = async () => {
      try {
        const profile = await cloudStorage.getItem<UserProfile>('mm_profile');
        const localHistRaw = localStorage.getItem('mm_history');
        const localEntriesRaw = localStorage.getItem('mm_journal_entries');
        
        let localHist: ChatSession[] = [];
        let localEntries: JournalEntry[] = [];
        
        try { if (localHistRaw) localHist = JSON.parse(localHistRaw); } catch(e) { console.error("History parse fail"); }
        try { if (localEntriesRaw) localEntries = JSON.parse(localEntriesRaw); } catch(e) { console.error("Entries parse fail"); }

        if (profile) {
            setUserProfile(prev => ({ 
              ...prev, 
              ...profile,
              totalEmotionsDone: profile.totalEmotionsDone || 0
            }));
            if (!profile.onboardingDone) {
              setCurrentView('ONBOARDING');
            } else {
              setCurrentView('HOME');
            }
        } else {
            const now = Date.now();
            setUserProfile(prev => ({ 
              ...prev, 
              firstRunDate: now
            }));
            setCurrentView('ONBOARDING');
        }

        if (localHist.length > 0) setHistory(localHist);
        if (localEntries.length > 0) setJournalEntries(localEntries);

        if (window.Telegram?.WebApp) {
          const tg = window.Telegram.WebApp;
          tg.ready();
          tg.expand();
          const user = tg.initDataUnsafe?.user;
          if (user) {
            setUserProfile(prev => ({ 
              ...prev, 
              name: prev.name || user.first_name, 
              avatarUrl: prev.avatarUrl || user.photo_url || null 
            }));
            await syncSubscription(user.id);
          }
        }
        if (getTelegramUserId() === ADMIN_ID) {
          await fetchStats();
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    initData();
  }, [syncSubscription, fetchStats]);

  useEffect(() => {
    if (!isInitializing) {
      const { energyDecisions, energyEmotions, energyQuests, ...safeProfile } = userProfile;
      cloudStorage.setItem('mm_profile', safeProfile);
    }
  }, [userProfile, isInitializing]);

  useEffect(() => {
    if (!isInitializing) {
      try {
        localStorage.setItem('mm_history', JSON.stringify(history));
      } catch (e) {
        console.error("Failed to save history locally (too big?):", e);
      }
    }
  }, [history, isInitializing]);

  useEffect(() => {
    if (!isInitializing) {
      try {
        localStorage.setItem('mm_journal_entries', JSON.stringify(journalEntries));
      } catch (e) {
        console.error("Failed to save journal locally:", e);
      }
    }
  }, [journalEntries, isInitializing]);

  const handleOnboardingComplete = () => {
    setUserProfile(prev => ({ ...prev, onboardingDone: true }));
    setCurrentView('HOME');
  };

  const handleModeSelection = (mode: JournalMode) => {
    if (!checkModeLimit(mode)) {
      setCurrentView('SUBSCRIPTION');
      return;
    }
    setSelectedMode(mode); 
    setViewingHistorySession(null); 
    setCurrentView('CHAT');
  };

  const handleClearHistory = useCallback(() => {
    const tg = window.Telegram?.WebApp;
    const confirmText = "Удалить всю историю чатов? (Записи в дневнике сохранятся)";
    
    if (tg?.showConfirm) {
      tg.showConfirm(confirmText, (isConfirmed: boolean) => {
        if (isConfirmed) {
          setHistory([]);
          localStorage.removeItem('mm_history');
          if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        }
      });
    } else {
      if (window.confirm(confirmText)) {
        setHistory([]);
        localStorage.removeItem('mm_history');
      }
    }
  }, []);

  const handleDeleteHistorySession = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    const tg = window.Telegram?.WebApp;
    const confirmText = "Удалить эту сессию из истории?";
    
    const executeDeletion = () => {
      setHistory(prev => prev.filter(s => s.id !== id));
      if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    };

    if (tg?.showConfirm) {
      tg.showConfirm(confirmText, (isConfirmed: boolean) => {
        if (isConfirmed) executeDeletion();
      });
    } else {
      if (window.confirm(confirmText)) executeDeletion();
    }
  }, []);

  const handlePay = async () => {
    if (isPaying) return;
    const tg = window.Telegram?.WebApp;
    const userId = getTelegramUserId();
    if (!userId) { alert("Ошибка: ID пользователя не найден"); return; }
    setIsPaying(true);
    try {
      const response = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'premium' })
      });
      const data = await response.json();
      if (!data.ok || !data.result) throw new Error(data.description || "Ошибка");
      tg.openInvoice(data.result, (status: string) => {
        if (status === 'paid') {
          setUserProfile(prev => ({ ...prev, isSubscribed: true }));
          setCurrentView('HOME');
          if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
          fetchStats();
        }
      });
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setIsPaying(false);
    }
  };

  const handleBuyEnergy = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isBuyingEnergy) return;
    const tg = window.Telegram?.WebApp;
    const userId = getTelegramUserId();
    if (!userId) return;
    setIsBuyingEnergy(true);
    try {
      const response = await fetch('/api/create-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type: 'energy' })
      });
      const data = await response.json();
      if (!data.ok || !data.result) throw new Error(data.description || "Ошибка");
      tg.openInvoice(data.result, (status: string) => {
        if (status === 'paid') {
          setTimeout(() => syncSubscription(userId), 3000);
          if (tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        }
      });
    } catch (e: any) {
      alert("Ошибка: " + e.message);
    } finally {
      setIsBuyingEnergy(false);
    }
  };

  const handleResetSub = async () => {
    const userId = getTelegramUserId();
    if (!userId) return;
    if (!confirm("Вы уверены, что хотите сбросить Premium?")) return;
    setIsResetting(true);
    try {
      const resp = await fetch(`/api/reset-sub?userId=${userId}`);
      const data = await resp.json();
      if (resp.ok && data.success) {
        setUserProfile(prev => ({ ...prev, isSubscribed: false }));
        alert("Статус успешно сброшен.");
        fetchStats();
      } else {
        alert("Ошибка сервера при сбросе.");
      }
    } catch (e) {
      alert("Ошибка соединения с API.");
    } finally {
      setIsResetting(false);
    }
  };

  const handleGiftSub = async (targetId: string) => {
    if (!targetId) return;
    try {
        const resp = await fetch('/api/grant-sub', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: targetId })
        });
        const data = await resp.json();
        if (resp.ok && data.success) {
            alert(`Пользователь ${targetId} теперь Premium на 30 дней!`);
            fetchStats();
        } else {
            alert("Ошибка при активации дара.");
        }
    } catch (e) {
        alert("Сбой связи с эфиром.");
    }
  };

  const currentRank = [...RANKS].reverse().find(r => userProfile.xp >= r.threshold) || RANKS[0];

  const handleTestAnswer = (ansIdx: number) => {
    setLocalSelectedIdx(ansIdx);
    setTimeout(() => {
      const newAnswers = [...testAnswers, ansIdx];
      if (testQuestionIdx + 1 < QUESTIONS.length) {
        setTestAnswers(newAnswers);
        setTestQuestionIdx(testQuestionIdx + 1);
        setLocalSelectedIdx(null);
      } else {
        const archetypeScores: Record<string, number> = {};
        ARCHETYPES.forEach(arc => archetypeScores[arc.id] = 0);
        const quadrantMap = [
          ['4', '3', '5'],
          ['8', '7', '6'],
          ['1', '2', '12'],
          ['11', '10', '9']
        ];
        newAnswers.forEach((ans, qIdx) => {
          const mainQuadrant = quadrantMap[ans % 4];
          const primaryId = mainQuadrant[qIdx % 3];
          archetypeScores[primaryId] += 12;
          mainQuadrant.forEach(id => {
            if (id !== primaryId) archetypeScores[id] += 4;
          });
          const siblingQuadrant = quadrantMap[(ans + 1) % 4];
          archetypeScores[siblingQuadrant[0]] += 2;
        });
        const totalPoints = Object.values(archetypeScores).reduce((a, b) => a + b, 0) || 1;
        const sortedScores = ARCHETYPES.map(arc => ({ archetype: arc, score: archetypeScores[arc.id] })).sort((a, b) => b.score - a.score);
        const mainArc = sortedScores[0].archetype;
        const secondary = sortedScores.slice(1, 4).map(s => ({ 
          name: s.archetype.name, 
          percent: Math.max(1, Math.round((s.score / totalPoints) * 100)) 
        }));
        setUserProfile(prev => ({ ...prev, archetype: mainArc, secondaryArchetypes: secondary }));
        reportEvent('test_finished', { name: mainArc.name });
        setCurrentView('ARCHETYPE_RESULT');
        setLocalSelectedIdx(null);
      }
    }, 150);
  };

  const isQuestAvailable = () => {
    const now = Date.now();
    const lastQuest = userProfile.lastQuestDate || 0;
    const cooldownPeriod = 24 * 60 * 60 * 1000; 
    const isCooldownOver = (now - lastQuest) >= cooldownPeriod;

    if (!isCooldownOver) return false;

    if (userProfile.isSubscribed) return true;
    
    return (userProfile.totalQuestsDone || 0) < 3;
  };

  const handleStartQuest = async () => {
    const now = Date.now();
    const lastQuest = userProfile.lastQuestDate || 0;
    const isCooldownOver = (now - lastQuest) >= 24 * 60 * 60 * 1000;

    if (!isCooldownOver) {
      const remaining = 24 - (now - lastQuest) / (1000 * 60 * 60);
      alert(`Новый квест будет доступен через ${Math.ceil(remaining)}ч.`);
      return;
    }

    if (!userProfile.isSubscribed && (userProfile.totalQuestsDone || 0) >= 3) {
      setCurrentView('SUBSCRIPTION');
      return;
    }

    if (!userProfile.archetype) return;
    setGameStatus('LOADING');
    const data = await generateRPGQuest(userProfile.archetype);
    setQuestData(data);
    setGameStatus('QUEST');
  };

  const handleChoice = async (choice: string) => {
    if (!userProfile.archetype) return;
    setGameStatus('LOADING');
    const result = await processRPGChoice(userProfile.archetype, choice);
    setQuestOutcome(result);
    setGameStatus('RESULT');
  };

  const spendEnergyOnServer = async (type: string) => {
    const userId = getTelegramUserId();
    if (!userId || userProfile.isSubscribed) return;
    try {
      fetch('/api/spend-energy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, type })
      });
    } catch (e) {
      console.error("Spend energy API error", e);
    }
  };

  const acceptGift = () => {
    const userId = getTelegramUserId();
    setUserProfile(prev => ({
      ...prev,
      xp: prev.xp + 50,
      artifacts: [questOutcome!.artifact, ...prev.artifacts],
      lastQuestDate: Date.now(),
      totalQuestsDone: (prev.totalQuestsDone || 0) + 1,
      energyQuests: prev.isSubscribed ? prev.energyQuests : Math.max(0, prev.energyQuests - 1)
    }));
    spendEnergyOnServer('quests');
    setGameStatus('IDLE');
    if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
  };

  const checkModeLimit = (mode: JournalMode): boolean => {
    if (userProfile.isSubscribed) return true;
    if (mode === 'DECISION') return (userProfile.energyDecisions > 0);
    if (mode === 'EMOTIONS') return (userProfile.totalEmotionsDone || 0) < 3;
    return true; 
  };

  const ArchetypeCard = ({ archetype, expanded, onToggle, showReset, isProfile = false }: { archetype: Archetype, expanded: boolean, onToggle: () => void, showReset?: boolean, isProfile?: boolean }) => {
    return (
      <div 
        onClick={onToggle}
        className={`p-6 rounded-[32px] mb-8 border relative overflow-hidden transition-all duration-700 cursor-pointer ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-white bento-border bento-shadow'} ${isProfile ? 'shadow-sm' : 'shadow-xl'}`}
      >
         <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Wand2 size={80} className={userProfile.rpgMode ? 'text-indigo-400' : 'text-indigo-400'} /></div>
         <div className="flex items-center justify-center space-x-3 mb-6 opacity-60">
            <div className="h-[1px] w-8 bg-slate-300"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Свиток Судьбы</p>
            <div className="h-[1px] w-8 bg-slate-300"></div>
            {expanded ? <ChevronUp size={16} className="text-slate-300 ml-2" /> : <ChevronDown size={16} className="text-slate-300 ml-2" />}
         </div>
         <h2 className={`text-5xl font-black italic uppercase tracking-tighter mb-2 ${userProfile.rpgMode ? 'text-white ' : 'text-slate-800'}`}>{archetype.name}</h2>
         <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-6 ${userProfile.rpgMode ? 'text-indigo-400' : 'text-indigo-50'}`}>{archetype.role}</p>
         
         {expanded && userProfile.secondaryArchetypes && userProfile.secondaryArchetypes.length > 0 && (
           <div className="mb-6 flex flex-wrap gap-2">
              {userProfile.secondaryArchetypes.map((sa, i) => (
                <div key={i} className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${userProfile.rpgMode ? 'bg-slate-900/40 border-slate-700 text-slate-300' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                  {sa.name} {sa.percent}%
                </div>
              ))}
           </div>
         )}

         <div className={`p-5 rounded-3xl mb-6 italic text-[13px] leading-relaxed border transition-all ${userProfile.rpgMode ? 'bg-white/10 border-slate-700 text-white' : 'bg-slate-50 bento-border text-slate-600'}`}>
            <Quote size={18} className="mb-2 opacity-30 mx-auto" />
            "{archetype.quote}"
         </div>
         <div className={`space-y-4 text-left transition-all duration-500 overflow-hidden ${expanded ? 'max-h-[1000px] opacity-100 mb-6' : 'max-h-0 opacity-0 mb-0'}`}>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Ваша природа</p>
              <p className={`text-[13px] leading-relaxed font-medium ${userProfile.rpgMode ? 'text-white' : 'text-slate-600'}`}>{archetype.description}</p>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Высший смысл</p>
              <p className={`text-[13px] leading-relaxed font-medium ${userProfile.rpgMode ? 'text-white' : 'text-slate-600'}`}>{archetype.meaning}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className={`p-4 rounded-2xl border text-left ${userProfile.rpgMode ? 'bg-white/10 border-slate-700' : 'bg-emerald-50/30 border-emerald-50'}`}>
                 <div className="flex items-center space-x-2 mb-1.5"><Flame size={14} className="text-emerald-500" /><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Свет</span></div>
                 <p className="text-[11px] font-bold text-slate-300 leading-tight">{archetype.strength}</p>
              </div>
              <div className={`p-4 rounded-2xl border text-left ${userProfile.rpgMode ? 'bg-white/10 border-slate-700' : 'bg-rose-50/30 border-rose-50'}`}>
                 <div className="flex items-center space-x-2 mb-1.5"><Shield size={14} className="text-rose-400" /><span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Тень</span></div>
                 <p className="text-[11px] font-bold text-slate-300 leading-tight">{archetype.weakness}</p>
              </div>
            </div>
            {showReset && (
              <button onClick={(e) => { e.stopPropagation(); setTestQuestionIdx(0); setTestAnswers([]); setCurrentView('ARCHETYPE_TEST'); }} className={`w-full py-4 rounded-[28px] mt-6 font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center space-x-2 border-2 active:scale-95 transition-all ${userProfile.rpgMode ? 'bg-white/10 border-slate-700 text-indigo-400' : 'bg-slate-900 border-slate-950 text-white shadow-md'}`}>
                <RotateCcw size={14} /><span>Перепройти тест</span>
              </button>
            )}
         </div>
         {!expanded && (
           <div className="flex items-center justify-center space-x-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest animate-pulse mt-2">
              <Sparkles size={12} /><span>Нажмите для подробной информации</span>
           </div>
         )}
      </div>
    );
  };

  const renderHome = () => {
    const nextThreshold = RANKS[RANKS.indexOf(currentRank) + 1]?.threshold || 50000;
    const progress = Math.min(100, (userProfile.xp / nextThreshold) * 100);
    const questAvailable = isQuestAvailable();
    const isFreeLimitReached = !userProfile.isSubscribed && (userProfile.totalQuestsDone || 0) >= 3;

    return (
      <div className={`h-full overflow-y-auto animate-fade-in relative z-10 pb-40 transition-colors duration-500 ${userProfile.rpgMode ? 'bg-parchment ' : 'bg-transparent'}`}>
        <div className="px-6 pt-6 mb-8 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className={`w-11 h-11 rounded-full overflow-hidden bg-white shadow-sm border-2 ${userProfile.rpgMode ? 'border-slate-700' : 'bento-border'} cursor-pointer`} onClick={() => setCurrentView('PROFILE')}>
              {userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon size={22} className="m-2.5 text-slate-300" />}
            </div>
            <div>
              <h4 className={`text-[15px] font-extrabold leading-none ${userProfile.rpgMode ? 'text-white' : 'text-white shadow-sm'}`}>{userProfile.name}</h4>
              {userProfile.archetype && <p className={`text-[10px] font-bold uppercase mt-1 tracking-wider ${userProfile.rpgMode ? 'text-indigo-400' : 'text-white/70 shadow-sm'}`}>{userProfile.archetype.name}</p>}
            </div>
          </div>
        </div>
        <div className="px-6 mb-5 relative z-20">
          <button onClick={() => handleModeSelection('DECISION')} className={`w-full mb-4 p-10 rounded-[44px] border flex flex-col active:scale-95 transition-all duration-300 relative overflow-hidden text-left ${userProfile.rpgMode ? 'rpg-card border-slate-700 shadow-xl' : 'bg-white bento-border bento-shadow shadow-slate-200/40'}`}>
            <div className="absolute top-0 right-0 -translate-y-4 translate-x-4 opacity-10 pointer-events-none scale-150 transform rotate-12"><DecisionIllustration rpgMode={userProfile.rpgMode} size={180} /></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start mb-12">
                 <div className={`w-20 h-20 rounded-[30px] flex items-center justify-center shrink-0 ${userProfile.rpgMode ? 'bg-indigo-600 text-white shadow-xl' : 'bg-amber-50 text-amber-500'}`}><DecisionIllustration rpgMode={userProfile.rpgMode} size={50} /></div>
                 <div className="text-right">
                    <span className={`block text-5xl font-black tracking-tighter leading-none ${userProfile.rpgMode ? 'text-slate-100' : 'text-slate-900'}`}>{userProfile.totalDecisions || 0}</span>
                    <span className={`text-[10px] font-black uppercase tracking-[0.3em] opacity-40 ${userProfile.rpgMode ? 'text-indigo-400' : 'text-slate-50'}`}>решений</span>
                 </div>
              </div>
              <div>
                <h3 className={`text-3xl font-black uppercase tracking-tighter leading-none mb-3 ${userProfile.rpgMode ? 'text-white ' : 'text-slate-800'}`}>Принять решение</h3>
                <p className={`text-[11px] font-bold uppercase tracking-[0.2em] leading-snug opacity-40 ${userProfile.rpgMode ? 'text-indigo-400' : 'text-slate-500'}`}>Выбор верного пути через анализ</p>
              </div>
            </div>
          </button>
          
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'EMOTIONS', label: 'Состояние', icon: EmotionsIllustration },
              { id: 'REFLECTION', label: 'Дневник', icon: ReflectionIllustration }
            ].map(m => (
              <button 
                key={m.id} 
                onClick={() => handleModeSelection(m.id as JournalMode)} 
                className={`w-full h-16 rounded-[28px] border relative overflow-hidden active:scale-95 transition-all duration-300 flex items-center justify-center ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-white bento-border bento-shadow'}`}
              >
                {/* Watermark Icon */}
                <div className="absolute -bottom-5 -right-5 opacity-[0.18] pointer-events-none transform -rotate-12 scale-[1.8]">
                   <m.icon rpgMode={userProfile.rpgMode} size={90} />
                </div>

                {/* Button Content */}
                <span className={`relative z-10 text-[14px] font-black uppercase tracking-wider text-center px-2 drop-shadow-sm ${userProfile.rpgMode ? 'text-white ' : 'text-slate-800'}`}>
                  {m.label}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="px-6 mb-4">
           <button onClick={() => setCurrentView('RANKS_INFO')} className={`w-full text-left rounded-[32px] p-6 bento-shadow border active:scale-[0.98] transition-all relative ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-white bento-border'}`}>
              <div className="absolute top-6 right-6"><ChevronRight size={18} className={userProfile.rpgMode ? 'text-white' : 'text-slate-300'} /></div>
              <div className="flex items-center space-x-4 mb-6">
                 <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"><TreeIcon stage={RANKS.indexOf(currentRank)} size={48} rpgMode={userProfile.rpgMode} /></div>
                 <div className="ml-2">
                   <p className={`text-[8px] font-black uppercase tracking-widest mb-0.5 ${userProfile.rpgMode ? 'text-indigo-400' : 'text-slate-400'}`}>Прогресс роста</p>
                   <h4 className={`text-lg font-bold tracking-tight ${userProfile.rpgMode ? 'text-white ' : 'text-slate-800'}`}>{currentRank.title}</h4>
                 </div>
              </div>
              
              <div className={`h-3.5 w-full rounded-full overflow-hidden mb-5 relative ${userProfile.rpgMode ? 'bg-slate-900/40 border border-slate-700' : 'bg-slate-100 progress-inner-shadow'}`}>
                 <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: 'spring', damping: 20, stiffness: 60 }}
                    className={`h-full relative overflow-hidden transition-all duration-1000 ${userProfile.rpgMode ? 'rpg-energy-bar-gradient' : 'energy-bar-gradient'}`}
                 >
                    <div className="shimmer-layer" />
                 </motion.div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                 <div><p className="text-[7px] uppercase font-black text-slate-400 mb-0.5 tracking-widest">XP</p><p className={`font-black text-lg ${userProfile.rpgMode ? 'text-indigo-400' : 'text-slate-900'}`}>{userProfile.xp}</p></div>
                 <div className={`border-x ${userProfile.rpgMode ? 'border-slate-700' : 'border-slate-100'}`}><p className="text-[7px] uppercase font-black text-slate-400 mb-0.5 tracking-widest">Сессии</p><p className={`font-black text-lg ${userProfile.rpgMode ? 'text-indigo-400' : 'text-slate-900'}`}>{userProfile.totalSessions}</p></div>
                 <div><p className="text-[7px] uppercase font-black text-slate-400 mb-0.5 tracking-widest">Мин.</p><p className={`font-black text-lg ${userProfile.rpgMode ? 'text-indigo-400' : 'text-slate-900'}`}>{userProfile.totalMinutes}</p></div>
              </div>
           </button>
        </div>

        <div className="px-6 mb-10">
          {!userProfile.archetype ? (
            <div className={`rounded-[32px] p-8 bento-shadow border active:scale-[0.98] transition-all ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-white bento-border'}`} onClick={() => { setTestQuestionIdx(0); setTestAnswers([]); reportEvent('test_started', {}); setCurrentView('ARCHETYPE_TEST'); }}>
              <div className="flex items-center space-x-2 mb-3"><Sparkles size={18} className={userProfile.rpgMode ? 'text-indigo-400' : 'text-indigo-400'} /><p className={`${userProfile.rpgMode ? 'text-indigo-400' : 'text-indigo-400'} text-[10px] font-bold uppercase tracking-widest`}>Первый шаг</p></div>
              <h2 className={`text-[26px] font-black mb-2 leading-tight ${userProfile.rpgMode ? 'text-white ' : 'text-slate-800'}`}>Узнать архетип и пройти квест</h2>
              <p className={`text-xs ${userProfile.rpgMode ? 'text-slate-400' : 'text-slate-500'}`}>Раскройте свою истинную суть и начните свое легендарное путешествие.</p>
            </div>
          ) : (
            <div className="relative">
              {gameStatus === 'LOADING' ? (
                <div className={`rounded-[32px] p-10 flex flex-col items-center justify-center min-h-[140px] bento-shadow border overflow-hidden relative ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-white bento-border shadow-xl shadow-slate-200/20'}`}>
                  <Loader2 size={32} className={`${userProfile.rpgMode ? 'text-indigo-400' : 'text-indigo-400'} animate-spin mb-4 relative z-10`} />
                  <p className={`${userProfile.rpgMode ? 'text-white' : 'text-slate-400'} text-[9px] font-black uppercase tracking-[0.4em] italic text-center`}>
                     Мастер пишет историю...
                  </p>
                </div>
              ) : gameStatus === 'QUEST' && questData ? (
                <div className={`rounded-[32px] p-8 shadow-2xl border animate-fade-in relative overflow-hidden ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-white bento-border shadow-xl shadow-slate-200/20'}`}>
                  <h3 className={`text-lg font-bold mb-8 leading-relaxed italic text-center ${userProfile.rpgMode ? 'text-white ' : 'text-slate-800'}`}>"{questData.scene}"</h3>
                  <div className="space-y-3">
                     <button onClick={() => handleChoice(questData.optA)} className={`group w-full p-4 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2 active:scale-95 transition-all flex items-center justify-between ${userProfile.rpgMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700 shadow-sm font-bold'}`}>
                       <span>{questData.optA}</span>
                       <ChevronRight size={16} className="opacity-30 group-hover:opacity-100" />
                     </button>
                     <button onClick={() => handleChoice(questData.optB)} className={`group w-full p-4 rounded-2xl font-black text-[11px] uppercase tracking-widest border-2 active:scale-95 transition-all flex items-center justify-between ${userProfile.rpgMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-700 shadow-sm font-bold'}`}>
                       <span>{questData.optB}</span>
                       <ChevronRight size={16} className="opacity-30 group-hover:opacity-100" />
                     </button>
                  </div>
                </div>
              ) : gameStatus === 'RESULT' && questOutcome ? (
                <div className={`rounded-[32px] p-8 shadow-2xl animate-fade-in text-center border relative overflow-hidden ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-white bento-border shadow-xl shadow-slate-200/20'}`}>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${userProfile.rpgMode ? 'bg-indigo-600 text-white' : 'bg-emerald-50 text-emerald-600'}`}><Trophy size={28} /></motion.div>
                  <h4 className={`text-3xl font-black mb-2 tracking-tighter ${userProfile.rpgMode ? 'text-white ' : 'text-slate-800'}`}>+50 XP</h4>
                  <p className={`text-base mb-8 leading-relaxed italic px-2 ${userProfile.rpgMode ? 'text-white ' : 'text-slate-400'}`}>"{questOutcome.outcome}"</p>
                  <div className={`p-4 rounded-2xl mb-8 border relative ${userProfile.rpgMode ? 'bg-slate-900 border-indigo-500 shadow-xl' : 'bg-slate-50 border-slate-100'}`}>
                     <p className={`text-xl font-black tracking-tight ${userProfile.rpgMode ? 'text-white ' : 'text-indigo-400'}`}>{questOutcome.artifact}</p>
                  </div>
                  <button onClick={acceptGift} className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] active:scale-95 transition-all shadow-xl ${userProfile.rpgMode ? 'rpg-button border-slate-700' : 'bg-slate-900 text-white'}`}>Продолжить путь</button>
                </div>
              ) : (
                <div 
                  className={`w-full p-6 rounded-[32px] border flex items-center justify-between active:scale-[0.98] transition-all duration-300 relative overflow-hidden text-left cursor-pointer ${userProfile.rpgMode ? 'rpg-card border-slate-700 shadow-xl' : 'bg-white bento-border bento-shadow'} ${!questAvailable && !isFreeLimitReached ? 'opacity-70 cursor-wait' : ''} ${isFreeLimitReached ? 'opacity-80' : ''}`}
                  onClick={handleStartQuest}
                >
                  <div className="flex items-center space-x-5 relative z-10">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${userProfile.rpgMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-100 text-indigo-600 shadow-inner'}`}>
                        <motion.div animate={questAvailable ? { rotate: [0, 10, -10, 0] } : {}} transition={{ duration: 5, repeat: Infinity }}>
                          {questAvailable ? <Compass size={28} strokeWidth={1.5} /> : <Clock size={28} strokeWidth={1.5} />}
                        </motion.div>
                     </div>
                     <div>
                       <h3 className={`text-xl font-black uppercase tracking-tighter leading-none mb-1 ${userProfile.rpgMode ? 'text-white ' : 'text-indigo-800'}`}>Путь Судьбы</h3>
                       <p className={`text-[10px] font-bold uppercase tracking-[0.05em] opacity-40 ${userProfile.rpgMode ? 'text-indigo-400' : 'text-indigo-400'}`}>
                         {isFreeLimitReached ? 'Нужен Premium (3/3 пройден)' : (questAvailable ? 'Ежедневное испытание' : 'Ожидайте рассвета')}
                       </p>
                     </div>
                  </div>
                  <div className={`p-2 rounded-xl transition-all ${userProfile.rpgMode ? 'text-white' : 'text-indigo-400'}`}>
                     <ChevronRight size={20} strokeWidth={2.5} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    const isSubscribed = userProfile.isSubscribed;
    const isOwner = getTelegramUserId() === ADMIN_ID;
    const arc = userProfile.archetype;
    return (
      <div className={`px-5 pt-8 h-full overflow-y-auto pb-40 transition-colors duration-500 ${userProfile.rpgMode ? 'bg-parchment ' : 'bg-transparent'}`}>
        <header className="mb-8 flex items-center justify-between"><h1 className={`text-4xl font-black uppercase tracking-tighter ${userProfile.rpgMode ? 'text-white ' : 'text-white shadow-sm'}`}>Профиль</h1></header>
        <div className="flex items-center space-x-6 mb-10">
           <div className={`w-24 h-24 rounded-[32px] overflow-hidden border-4 shadow-sm ${userProfile.rpgMode ? 'border-slate-700' : 'bento-border'}`}>{userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : <UserIcon size={40} className="m-6 text-slate-200" />}</div>
           <div>
              <h3 className={`text-2xl font-black leading-tight ${userProfile.rpgMode ? 'text-white' : 'text-white shadow-sm'}`}>{userProfile.name || 'Странник'}</h3>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                 {isSubscribed && (
                   <div className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full border shadow-lg text-[9px] font-black uppercase tracking-[0.1em] ${
                     userProfile.rpgMode 
                       ? 'bg-amber-600 border-amber-500 text-white' 
                       : 'bg-amber-400 border-amber-500 text-slate-900'
                   }`}>
                     <Star size={11} fill="currentColor" />
                     <span>Premium</span>
                   </div>
                 )}
                 {arc && (
                   <div className={`inline-flex items-center px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                     userProfile.rpgMode 
                       ? 'bg-slate-900 border-slate-700 text-white shadow-md' 
                       : 'bg-slate-900 border-slate-950 text-white shadow-md'
                   }`}>
                     {arc.name}
                   </div>
                 )}
              </div>
           </div>
        </div>

        <div className={`py-3.5 px-5 rounded-[28px] mb-4 border flex items-center justify-between transition-all ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-white bento-border bento-shadow'}`}>
          <div className="flex items-center space-x-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${userProfile.rpgMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-amber-50 text-amber-500'}`}>
               <Zap size={24} fill="currentColor" />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${userProfile.rpgMode ? 'text-indigo-400' : 'text-slate-400'}`}>Заряды решений</p>
              <p className={`text-xl font-black ${userProfile.rpgMode ? 'text-white' : 'text-slate-800'}`}>
                {userProfile.isSubscribed ? '∞' : `${userProfile.energyDecisions}`}
              </p>
            </div>
          </div>
          {!userProfile.isSubscribed && (
            <button 
              onClick={handleBuyEnergy}
              disabled={isBuyingEnergy}
              className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center space-x-2 active:scale-95 transition-all ${userProfile.rpgMode ? 'bg-indigo-500 text-white' : 'bg-amber-500 text-white shadow-md shadow-amber-500/20'}`}
            >
              {isBuyingEnergy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} strokeWidth={3} />}
              <span>10</span>
            </button>
          )}
        </div>

        {arc && <ArchetypeCard archetype={arc} expanded={arcExpanded} onToggle={() => setArcExpanded(!arcExpanded)} showReset={true} isProfile={true} />}
        {!isSubscribed && (
          <div className={`py-5 px-5 rounded-[32px] mb-6 shadow-sm border-2 transition-all cursor-pointer ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-[#2dbdc0] text-white border-[#FFFFFF]'}`} onClick={() => setCurrentView('SUBSCRIPTION')}>
            <div className="flex items-center space-x-3 mb-2"><Star size={18} fill="currentColor" className="text-amber-400" /><p className={`text-[9px] font-black uppercase tracking-[0.2em] ${userProfile.rpgMode ? 'text-indigo-400' : 'text-blue-100'}`}>Статус: Странник</p></div>
            <h4 className={`text-2xl font-black mb-1 leading-tight uppercase tracking-tighter italic ${userProfile.rpgMode ? 'text-white ' : ''}`}>Открой все функции</h4>
            <p className={`text-[11px] opacity-80 mb-6 leading-relaxed ${userProfile.rpgMode ? 'text-white font-medium' : 'text-blue-50'}`}>Безлимитные сессии, ежедневные квесты и полное самопознание.</p>
            <button className={`w-full py-3.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center space-x-2 transition-all ${userProfile.rpgMode ? 'bg-white text-blue-600 shadow-md active:scale-95' : 'bg-white text-blue-600 shadow-md active:scale-95'}`}><Sparkles size={14} fill="currentColor" /><span>Подробнее о Premium</span></button>
          </div>
        )}
        <div className="space-y-4">
           <button onClick={() => setCurrentView('ONBOARDING')} className={`w-full py-4 px-5 rounded-[28px] border flex items-center justify-between bento-shadow transition-all ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-white bento-border'}`}><div className="flex items-center space-x-4"><div className={`w-11 h-11 rounded-xl flex items-center justify-center ${userProfile.rpgMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-500'}`}><Compass size={24} /></div><span className={`text-lg font-extrabold ${userProfile.rpgMode ? 'text-white' : 'text-slate-700'}`}>Путеводитель</span></div><ChevronRight size={20} className="opacity-30" /></button>
           <button onClick={() => setUserProfile(p => ({...p, rpgMode: !p.rpgMode}))} className={`w-full py-4 px-5 rounded-[28px] border flex items-center justify-between bento-shadow transition-all ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-white bento-border'}`}><div className="flex items-center space-x-4"><div className={`w-11 h-11 rounded-xl flex items-center justify-center ${userProfile.rpgMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-500'}`}><Moon size={24} /></div><span className={`text-lg font-extrabold ${userProfile.rpgMode ? 'text-white' : 'text-slate-700'}`}>Тёмная тема</span></div><div className={`w-12 h-6 rounded-full transition-all relative ${userProfile.rpgMode ? 'bg-indigo-600' : 'bg-slate-200'}`}><div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${userProfile.rpgMode ? 'left-7' : 'left-1'}`}></div></div></button>
           <button onClick={() => setCurrentView('ARCHETYPE_GLOSSARY')} className={`w-full py-4 px-5 rounded-[28px] border flex items-center justify-between bento-shadow transition-all ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-white bento-border'}`}><div className="flex items-center space-x-4"><div className={`w-11 h-11 rounded-xl flex items-center justify-center ${userProfile.rpgMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-500'}`}><BookOpen size={24} /></div><span className={`text-lg font-extrabold ${userProfile.rpgMode ? 'text-white' : 'text-slate-700'}`}>Глоссарий</span></div><ChevronRight size={20} className="opacity-30" /></button>
        </div>

        <div 
          onClick={() => {
            if (window.Telegram?.WebApp?.HapticFeedback) window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
            window.open('https://t.me/mindfulmirror', '_blank');
          }}
          className={`py-4 px-5 rounded-[28px] mt-6 border flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] ${
            userProfile.rpgMode ? 'rpg-card border-slate-700 bg-slate-800/40' : 'bg-white bento-border bento-shadow'
          }`}
        >
          <div className="flex items-center space-x-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${userProfile.rpgMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-blue-50 text-blue-500'}`}>
              <Send size={22} />
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${userProfile.rpgMode ? 'text-slate-400' : 'text-slate-400'}`}>Сообщество</p>
              <span className={`text-lg font-extrabold ${userProfile.rpgMode ? 'text-white' : 'text-slate-700'}`}>Наш Telegram канал</span>
            </div>
          </div>
          <ChevronRight size={20} className={userProfile.rpgMode ? 'text-white' : 'text-slate-300'} />
        </div>

        {isOwner && (
          <div className="mt-8 pt-8 border-t border-white/10">
             <button onClick={() => setCurrentView('ADMIN')} className={`w-full py-4 px-5 rounded-[28px] border flex items-center justify-between bento-shadow transition-all ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-amber-50 bento-border text-amber-900'}`}><div className="flex items-center space-x-4"><div className={`w-11 h-11 rounded-xl flex items-center justify-center ${userProfile.rpgMode ? 'bg-amber-600 text-white shadow-lg' : 'bg-amber-200 text-amber-700'}`}><ShieldAlert size={24} /></div><span className="text-lg font-extrabold">Админ-панель</span></div><ChevronRight size={20} className="opacity-30" /></button>
          </div>
        )}
      </div>
    );
  };

  const renderLimitReached = () => {
    const isRpg = userProfile.rpgMode;
    const isSubscribed = userProfile.isSubscribed;
    const t = isRpg ? SUBSCRIPTION_TEXTS.rpg : SUBSCRIPTION_TEXTS.normal;

    // Расчет ОСТАТКОВ попыток для отображения
    const remainingEmotions = Math.max(0, 3 - (userProfile.totalEmotionsDone || 0));
    const remainingQuests = Math.max(0, 3 - (userProfile.totalQuestsDone || 0));

    return (
      <div className={`h-full overflow-y-auto overflow-x-hidden flex flex-col items-center px-6 pt-2 pb-12 text-center animate-fade-in relative transition-all duration-700 ${isRpg ? 'bg-parchment' : 'bg-transparent'}`}>
        <div className={`absolute top-0 left-0 w-full h-1/2 opacity-20 blur-[100px] pointer-events-none ${isRpg ? 'bg-slate-800' : 'bg-indigo-500'}`} />
        <div className="w-full flex mb-2">
           <button onClick={() => setCurrentView('HOME')} className={`p-2 -ml-2 rounded-full ${userProfile.rpgMode ? 'text-white' : 'text-white'}`}><ArrowLeft size={24}/></button>
        </div>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-0 mb-2 relative w-full flex flex-col items-center">
          <motion.div animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-64 h-64 blur-[80px] rounded-full ${isRpg ? 'bg-indigo-500' : 'bg-indigo-400'}`} />
          <div className="relative z-10 flex flex-col items-center">
             <div className="relative group">
                <motion.div animate={{ scale: [1, 1.3], opacity: [0.4, 0] }} transition={{ duration: 3, repeat: Infinity }} className={`absolute inset-0 rounded-full border-2 ${isRpg ? 'border-white/10' : 'border-indigo-400/30'}`} />
                <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
                  <TreeIcon stage={9} size={150} rpgMode={isRpg} />
                </motion.div>
             </div>
             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className={`mt-2 px-6 py-4 rounded-3xl rounded-tl-none border shadow-2xl max-w-[280px] relative ${isRpg ? 'bg-slate-800 border-slate-700 text-white italic' : 'bg-white bento-border text-slate-600'}`}>
                <p className="text-[14px] font-bold leading-snug">{t.mentorSpeech}</p>
                <div className={`absolute -bottom-2 -right-2 p-1.5 rounded-lg text-white shadow-lg ${isRpg ? 'bg-indigo-600' : 'bg-indigo-600'}`}>
                   <Sparkles size={12} />
                </div>
             </motion.div>
          </div>
        </motion.div>
        {!isSubscribed && (
          <div className={`w-full p-8 rounded-[40px] mb-8 relative z-10 border-2 transition-all ${isRpg ? 'bg-slate-800/60 border-slate-700' : 'bg-white bento-border shadow-xl shadow-slate-200/40'}`}>
            <div className="flex justify-center mb-6">
              <p className={`text-[12px] font-black uppercase tracking-[0.3em] ${isRpg ? 'text-indigo-400' : 'text-indigo-600'}`}>{t.balanceTitle}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${isRpg ? 'bg-indigo-600 text-white shadow-lg' : 'bg-amber-50 text-amber-500'}`}>
                    <Zap size={20} fill="currentColor" />
                  </div>
                  <div className="flex items-center space-x-1.5 mb-1 h-5">
                    <span className={`text-xl font-black ${isRpg ? 'text-white' : ''}`}>{userProfile.energyDecisions}</span>
                    <button 
                      onClick={handleBuyEnergy}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-white active:scale-90 transition-transform ${isRpg ? 'bg-indigo-500' : 'bg-amber-500 shadow-sm'}`}
                    >
                      <Plus size={12} strokeWidth={4} />
                    </button>
                  </div>
                  <span className="text-[8px] uppercase font-black opacity-40 tracking-widest text-center">Заряды решений</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${isRpg ? 'bg-indigo-600 text-white shadow-lg' : 'bg-rose-50 text-rose-500'}`}>
                    <Heart size={20} fill="currentColor" />
                  </div>
                  <span className={`text-xl font-black mb-1 leading-none ${isRpg ? 'text-white' : ''}`}>{remainingEmotions}</span>
                  <span className="text-[8px] uppercase font-black opacity-40 tracking-widest text-center">Состояний</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 ${isRpg ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-500'}`}>
                    <Circle size={18} fill="currentColor" />
                  </div>
                  <span className={`text-xl font-black mb-1 leading-none ${isRpg ? 'text-white' : ''}`}>{remainingQuests}</span>
                  <span className="text-[8px] uppercase font-black opacity-40 tracking-widest text-center">Квестов</span>
                </div>
            </div>
          </div>
        )}
        <div className="mb-10 space-y-2 relative z-10">
           <h2 className={`text-6xl font-black uppercase tracking-tighter leading-none ${isRpg ? 'text-white ' : 'text-white shadow-sm'}`}>{t.title}</h2>
           <p className={`text-[11px] font-bold uppercase tracking-[0.2em] opacity-50 ${isRpg ? 'text-indigo-400' : 'text-white/60'}`}>{t.subTitle}</p>
           <p className={`text-[16px] leading-snug px-4 italic mt-4 opacity-70 ${isRpg ? 'text-slate-400' : 'text-white/80'}`}>{t.description}</p>
        </div>
        <div className="w-full space-y-4 mb-10 relative z-10">
           {[
             { id: '1', label: isRpg ? 'Око Истины' : 'Безлимитные Решения', desc: isRpg ? 'Взгляд сквоют туман сомнений без границ.' : 'Анализируйте любые дилеммы, анализируйте свой выбор.', icon: Zap, color: isRpg ? 'bg-indigo-600' : 'bg-amber-500', textColor: isRpg ? 'text-indigo-400' : 'text-amber-600' },
             { id: '2', label: isRpg ? 'Сердце Покоя' : 'Безлимитные Состояния', desc: isRpg ? 'Крепость духа, не знающая усталости.' : 'Проходите сессии, разбирайте свои чувства с помощником столько раз, сколько нужно.', icon: Heart, color: isRpg ? 'bg-indigo-600' : 'bg-rose-500', textColor: isRpg ? 'text-indigo-400' : 'text-rose-600' },
             { id: '3', label: isRpg ? 'Свитки Судьбы' : 'Ежедневные Квесты', desc: isRpg ? 'Новые испытания мудрости каждый рассвет.' : 'Проходите RPG-квесты ежедневно без ограничений.', icon: Sword, color: isRpg ? 'bg-indigo-600' : 'bg-indigo-500', textColor: isRpg ? 'text-indigo-400' : 'text-indigo-600' }
           ].map((benefit, idx) => (
             <motion.div key={benefit.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 * idx }} className={`flex items-center space-x-4 p-5 rounded-[32px] border transition-all ${isRpg ? 'bg-slate-800 border-slate-700 shadow-xl' : 'bg-white bento-border shadow-sm font-bold'}`}>
                <div className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center shadow-lg shrink-0 ${benefit.color}`}><benefit.icon size={22} fill="currentColor" /></div>
                <div className="flex-1"><p className={`text-[11px] font-black uppercase tracking-wider mb-0.5 ${benefit.textColor as any}`}>{benefit.label}</p><p className={`text-[12px] leading-snug opacity-70 font-bold ${isRpg ? 'text-slate-300' : 'text-slate-600'}`}>{benefit.desc}</p></div>
             </motion.div>
           ))}
        </div>
        <div className="w-full space-y-6 mb-24 relative z-10">
           <button onClick={handlePay} disabled={isPaying} className={`group w-full py-6 rounded-[40px] font-black text-lg flex items-center justify-center space-x-4 transition-all transform duration-300 active:scale-95 ${isPaying ? 'opacity-70 grayscale' : 'shadow-2xl'} ${isRpg ? 'rpg-button border-none' : 'bg-slate-900 text-white border-slate-950 shadow-xl'}`}>
              {isPaying ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} className="group-hover:rotate-12 transition-transform text-white" />}
              <span className="tracking-tight uppercase">{isPaying ? 'Соединение...' : 'Пробудить Силу'}</span>
           </button>
           <div className="flex flex-col items-center space-y-6">
              <div className={`flex items-center space-x-2 ${isRpg ? 'text-white/60' : 'text-slate-400'}`}><ShieldCheck size={16} /><span className="text-[10px] font-black uppercase tracking-widest">Безопасно через Telegram Stars</span></div>
           </div>
        </div>
      </div>
    );
  };

  const renderRanksInfo = () => (
    <div className={`p-8 h-full overflow-y-auto pb-40 transition-colors duration-500 ${userProfile.rpgMode ? 'bg-parchment ' : 'bg-transparent'}`}>
      <header className="mb-6 flex items-center space-x-4">
        <button onClick={() => setCurrentView('HOME')} className={`p-2 -ml-2 rounded-full ${userProfile.rpgMode ? 'text-white' : 'text-white'}`}><ArrowLeft size={24}/></button>
        <h1 className={`text-2xl font-bold uppercase ${userProfile.rpgMode ? 'text-white ' : 'text-white shadow-sm'}`}>Ранги Сознания</h1>
      </header>
      <div className={`mb-10 p-6 rounded-[32px] border ${userProfile.rpgMode ? 'bg-slate-800 border-slate-700 shadow-xl' : 'bg-white bento-border shadow-sm shadow-slate-200/40'}`}>
         <div className="flex justify-between items-center mb-4">
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${userProfile.rpgMode ? 'text-indigo-400' : 'text-slate-400'}`}>Ваш статус</p>
            <div className={`px-3 py-1 rounded-full text-[11px] font-black ${userProfile.rpgMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-600 text-white'}`}>{userProfile.xp} XP</div>
         </div>
         <p className={`text-xs leading-relaxed ${userProfile.rpgMode ? 'text-slate-300 font-medium italic' : 'text-slate-500'}`}>Каждая сессия рефлексии и принятое решение — это шаг к трансформации вашего внутреннего состояния.</p>
      </div>
      <div className="space-y-6">
        {RANKS.map((rank, i) => {
          const isReached = userProfile.xp >= rank.threshold;
          return (
            <div key={i} className={`p-6 rounded-[28px] border-2 flex items-center space-x-5 transition-all duration-500 ${userProfile.rpgMode ? (isReached ? 'bg-slate-800 border-slate-600' : 'bg-slate-900 border-slate-800 opacity-40 grayscale') : (isReached ? 'bg-white border-amber-400 shadow-sm' : 'bg-white opacity-60 border-slate-200 grayscale')}`}>
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"><TreeIcon stage={i} size={48} rpgMode={userProfile.rpgMode} /></div>
              <div className="flex-1 ml-2">
                <h3 className={`font-bold text-lg ${userProfile.rpgMode ? 'text-white' : 'text-slate-800'}`}>{rank.title}</h3>
                <p className={`text-xs font-bold uppercase tracking-widest ${isReached ? (userProfile.rpgMode ? 'text-indigo-400' : 'text-indigo-600') : 'text-slate-400'}`}>{rank.threshold} XP</p>
                <p className={`text-sm mt-1 leading-tight ${isReached ? (userProfile.rpgMode ? 'text-slate-400' : 'text-slate-600') : 'text-slate-400'}`}>{rank.desc}</p>
              </div>
              <div className="shrink-0">{isReached ? <Check size={20} className="text-emerald-500" strokeWidth={3} /> : <Lock size={18} className="text-slate-300" />}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderAdmin = () => {
    const config: SiteConfig = {
      appTitle: "Mindful Mirror",
      logoText: "MM",
      aboutParagraphs: ["Mindful Mirror - это ваш персональный помощник в мире осознанности"],
      quotes: [{ text: "Познай самого себя", author: "Сократ" }],
      adminPasscode: "0000"
    };
    // Fixed: onReset was incorrectly using handleGiftSub (which expects a targetId string).
    // Switched it to handleResetSub which correctly implements () => void (or Promise<void>).
    return <AdminInterface stats={appStats} config={config} onSave={(newCfg) => console.log('Saving config', newCfg)} onBack={() => setCurrentView('PROFILE')} onGift={handleGiftSub} onReset={handleResetSub} />;
  };

  const renderArchetypeResult = () => {
    const arc = userProfile.archetype;
    if (!arc) return null;
    return (
      <div className={`h-screen w-full overflow-y-auto animate-fade-in transition-colors duration-1000 ${userProfile.rpgMode ? 'bg-parchment' : 'bg-transparent'}`}>
        <div className="min-h-full flex flex-col items-center p-6 pb-20 justify-center">
            <ArchetypeCard archetype={arc} expanded={true} onToggle={() => {}} />
            <button onClick={() => setCurrentView('HOME')} className={`w-full max-w-md py-4 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-md active:scale-95 transition-all ${userProfile.rpgMode ? 'rpg-button border-none' : 'bg-slate-900 text-white shadow-xl'}`}>Принять путь</button>
        </div>
      </div>
    );
  };

  if (isInitializing) return <div className="h-screen w-full flex items-center justify-center bg-slate-50"><Loader2 className="text-indigo-500 animate-spin" size={48} /></div>;

  return (
    <div className={`h-screen w-full overflow-hidden flex flex-col font-sans relative transition-colors duration-500 ${userProfile.rpgMode ? 'bg-parchment' : 'bg-gradient-to-b from-[#9d8eed] via-[#A0E9F7] to-white'}`}>
      <BackgroundEffects rpgMode={userProfile.rpgMode} />
      <main className="flex-1 relative overflow-hidden z-10">
        {currentView === 'ONBOARDING' && <Onboarding rpgMode={userProfile.rpgMode} onComplete={handleOnboardingComplete} />}
        {currentView === 'HOME' && renderHome()}
        {currentView === 'CHAT' && selectedMode === 'REFLECTION' && <JournalInterface rpgMode={userProfile.rpgMode} entries={journalEntries} onSaveEntry={(e, i, d) => { setJournalEntries(prev => i ? [e, ...prev] : prev.map(item => item.id === e.id ? e : item)); const xpGain = Math.max(1, Math.ceil(d / 60)); setUserProfile(p => ({...p, xp: p.xp + xpGain, totalSessions: p.totalSessions + (i ? 1 : 0), totalMinutes: p.totalMinutes + xpGain})); reportEvent('session', { seconds: d, mode: 'REFLECTION' }); if (i) reportEvent('journal_entry', { entryType: e.type }); }} onDeleteEntry={(id) => setJournalEntries(prev => prev.filter(e => e.id !== id))} onUpdateOrder={(e) => setJournalEntries(e)} onBack={(totalSec) => { const xpGain = totalSec > 10 ? Math.max(1, Math.ceil(totalSec / 60)) : 0; if (totalSec > 10) { reportEvent('session', { seconds: totalSec, mode: 'REFLECTION' }); setUserProfile(p => ({...p, xp: p.xp + xpGain, totalMinutes: p.totalMinutes + xpGain})); } setCurrentView('HOME'); }} />}
        {currentView === 'CHAT' && selectedMode !== 'REFLECTION' && selectedMode && <ChatInterface rpgMode={userProfile.rpgMode} mode={selectedMode} archetype={userProfile.archetype} readOnly={!!viewingHistorySession} initialMessages={viewingHistorySession?.messages} onBack={() => { setViewingHistorySession(null); setCurrentView('HOME'); }} onSessionComplete={(msgs, dur, previewOverride) => { setHistory(prev => [{id: Date.now().toString(), mode: selectedMode!, date: Date.now(), duration: dur, preview: previewOverride || msgs.find(m => m.role === 'user')?.content || 'Сессия рефлексии', messages: msgs}, ...prev]); const xpGain = Math.max(1, Math.ceil(dur / 60)); const isDecision = selectedMode === 'DECISION'; const isEmotions = selectedMode === 'EMOTIONS'; if (isDecision) spendEnergyOnServer('decisions'); if (isEmotions) spendEnergyOnServer('emotions'); setUserProfile(p => { let newEnergyDecisions = p.energyDecisions; let newEmotionsDone = p.totalEmotionsDone || 0; if (!p.isSubscribed) { if (isDecision) newEnergyDecisions = Math.max(0, p.energyDecisions - 1); if (isEmotions) newEmotionsDone = Math.min(3, newEmotionsDone + 1); } return { ...p, xp: p.xp + xpGain, totalSessions: p.totalSessions + 1, totalMinutes: p.totalMinutes + xpGain, totalDecisions: isDecision ? (p.totalDecisions || 0) + 1 : (p.totalDecisions || 0), totalEmotionsDone: newEmotionsDone, energyDecisions: newEnergyDecisions }; }); reportEvent('session', { seconds: Math.round(dur), mode: selectedMode! }); }} />}
        {currentView === 'ARCHETYPE_TEST' && (
           <div className={`h-full flex flex-col animate-fade-in transition-colors duration-500 relative overflow-hidden ${userProfile.rpgMode ? 'bg-parchment ' : 'bg-transparent'}`}>
             <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.04] scale-[2.5] transform">
                    <svg width="400" height="400" viewBox="0 0 100 100" className={userProfile.rpgMode ? 'text-amber-900' : 'text-blue-900'}>
                      <path d="M50 50 m-20 0 a20 20 0 1 0 40 0 a20 20 0 1 0 -40 0" fill="none" stroke="currentColor" strokeWidth="0.3" />
                      <circle cx="50" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="0.3" />
                      <circle cx="50" cy="70" r="20" fill="none" stroke="currentColor" strokeWidth="0.3" />
                      <circle cx="32" cy="40" r="20" fill="none" stroke="currentColor" strokeWidth="0.3" />
                      <circle cx="68" cy="40" r="20" fill="none" stroke="currentColor" strokeWidth="0.3" />
                      <circle cx="32" cy="60" r="20" fill="none" stroke="currentColor" strokeWidth="0.3" />
                      <circle cx="68" cy="60" r="20" fill="none" stroke="currentColor" strokeWidth="0.3" />
                    </svg>
                </div>
                <div className={`absolute top-[-20%] left-[-20%] right-[-20%] bottom-[-20%] blur-[120px] opacity-[0.1] rounded-full ${userProfile.rpgMode ? 'bg-amber-500' : 'bg-blue-400'}`} />
             </div>
             <header className="relative z-30 pt-6 px-6 mb-1 flex items-center justify-between pointer-events-none">
                <button onClick={() => setCurrentView('HOME')} className={`p-2 -ml-2 rounded-full active:bg-black/5 transition-all pointer-events-auto ${userProfile.rpgMode ? 'text-white' : 'text-white shadow-sm'}`}>
                  <X size={24}/>
                </button>
                <div className="flex-1 px-8">
                  <div className={`h-1.5 rounded-full overflow-hidden ${userProfile.rpgMode ? 'bg-slate-900/40' : 'bg-white/20'}`}>
                    <div className={`h-full transition-all duration-700 ${userProfile.rpgMode ? 'bg-indigo-600' : 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]'}`} style={{ width: `${((testQuestionIdx + 1) / QUESTIONS.length) * 100}%` }} />
                  </div>
                </div>
                <span className="text-[11px] font-black tracking-widest text-white/50">{testQuestionIdx + 1}/{QUESTIONS.length}</span>
             </header>
             <div className="flex-1 flex flex-col min-h-0 overflow-visible no-scrollbar pb-6 z-20 overflow-visible w-full">
               <div className="flex flex-col items-center pt-2 overflow-visible">
                 <PrismAnimation rpgMode={userProfile.rpgMode} />
                 <div className="relative mt-1 mb-6 text-center px-10 w-full max-lg mx-auto">
                    <div className={`absolute inset-0 blur-3xl opacity-[0.15] -z-10 rounded-full scale-y-[0.4] ${userProfile.rpgMode ? 'bg-amber-400' : 'bg-indigo-300'}`} />
                    <h2 className={`text-[22px] font-black italic leading-snug ${userProfile.rpgMode ? 'text-white ' : 'text-white shadow-sm'}`}>
                      {QUESTIONS[testQuestionIdx].q}
                    </h2>
                 </div>
                 <div className="w-full px-6 space-y-3 max-w-md">
                   {QUESTIONS[testQuestionIdx].options.map((opt, idx) => (
                     <button 
                      key={idx} 
                      onClick={() => handleTestAnswer(idx)} 
                      className={`w-full text-left p-4 py-4.5 rounded-[24px] border-2 transition-all duration-300 transform active:scale-[0.98] ${
                        localSelectedIdx === idx 
                          ? (userProfile.rpgMode ? 'bg-indigo-600 text-white border-slate-700 shadow-xl' : 'bg-slate-900 text-white border-slate-950 shadow-2xl scale-[1.01]') 
                          : (userProfile.rpgMode ? 'bg-slate-900/60 border-slate-700 text-white hover:border-slate-500' : 'bg-white/90 backdrop-blur-md bento-border bento-shadow hover:border-indigo-200 font-bold')
                      }`}
                     >
                       <span className="text-[14px] font-bold leading-tight">{opt}</span>
                     </button>
                   ))}
                 </div>
               </div>
             </div>
           </div>
        )}
        {currentView === 'ARCHETYPE_RESULT' && renderArchetypeResult()}
        {currentView === 'ARCHETYPE_GLOSSARY' && (
           <div className={`p-8 h-full overflow-y-auto animate-fade-in pb-40 transition-colors duration-500 ${userProfile.rpgMode ? 'bg-parchment ' : 'bg-transparent'}`}>
             <header className="mb-10 flex items-center space-x-4"><button onClick={() => setCurrentView('PROFILE')} className={`p-2 -ml-2 rounded-full ${userProfile.rpgMode ? 'text-white' : 'text-white'}`}><ArrowLeft size={24}/></button><h1 className={`text-2xl font-bold uppercase ${userProfile.rpgMode ? 'text-white ' : 'text-white shadow-sm'}`}>Глоссарий</h1></header>
             <div className="space-y-6">{ARCHETYPES.map(arc => (<div key={arc.id} className={`p-6 rounded-[28px] border ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-white bento-border bento-shadow'}`}><h3 className={`text-xl font-bold mb-1 ${userProfile.rpgMode ? 'text-white' : ''}`}>{arc.name}</h3><p className="text-xs uppercase font-bold text-indigo-500 mb-4">{arc.role}</p><p className={`text-sm italic mb-4 opacity-70 ${userProfile.rpgMode ? 'text-slate-400' : ''}`}>"{arc.motto}"</p><p className={`text-xs leading-relaxed opacity-80 ${userProfile.rpgMode ? 'text-slate-300' : ''}`}>{arc.description}</p></div>))}</div>
           </div>
        )}
        {currentView === 'PROFILE' && renderProfile()}
        {currentView === 'ADMIN' && renderAdmin()}
        {currentRank && currentView === 'RANKS_INFO' && renderRanksInfo()}
        {currentView === 'HISTORY' && (
           <div className={`p-8 h-full overflow-y-auto pb-40 transition-colors duration-500 ${userProfile.rpgMode ? 'bg-parchment ' : 'bg-transparent'}`}>
             <div className="flex items-center justify-between mb-8">
               <h1 className={`text-4xl font-black uppercase tracking-tighter ${userProfile.rpgMode ? 'text-white ' : 'text-white shadow-sm'}`}>История</h1>
               {history.length > 0 && (
                 <button 
                   onClick={handleClearHistory}
                   className={`p-3 rounded-2xl transition-all active:scale-90 ${userProfile.rpgMode ? 'text-slate-400 hover:bg-slate-800' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                   title="Очистить историю"
                 >
                   <Trash2 size={24} />
                 </button>
               )}
             </div>
             {history.length === 0 ? (<div className="h-[50vh] flex flex-col items-center justify-center text-white/40"><HistoryIcon size={48} className="mb-4 opacity-20" /><p className="text-xs uppercase font-bold tracking-widest">История пуста</p></div>) : (
               <div className="space-y-4">{history.map(s => (<button key={s.id} onClick={() => { setViewingHistorySession(s); setSelectedMode(s.mode); setCurrentView('CHAT'); }} className={`w-full text-left p-6 rounded-[28px] border shadow-sm flex items-center space-x-4 active:scale-98 transition-all relative ${userProfile.rpgMode ? 'rpg-card border-slate-700' : 'bg-white bento-border bento-shadow'}`}><div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${s.mode === 'DECISION' ? (userProfile.rpgMode ? 'bg-indigo-600 text-white' : 'bg-amber-50 text-amber-500 shadow-none border-none') : (userProfile.rpgMode ? 'bg-indigo-600 text-white' : 'bg-cyan-50 shadow-none border-none')}`}>{s.mode === 'DECISION' ? <Zap size={20} fill="currentColor" className="text-amber-400"/> : <EmotionsIllustration rpgMode={userProfile.rpgMode} size={32} />}</div><div className="flex-1 overflow-hidden pr-10"><p className={`font-bold truncate ${userProfile.rpgMode ? 'text-white' : 'text-slate-700'}`}>{s.preview || 'Сессия рефлексии'}</p><p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">{new Date(s.date).toLocaleDateString('ru-RU')}</p></div><button onClick={(e) => handleDeleteHistorySession(s.id, e)} className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button></button>))}</div>
             )}
           </div>
        )}
        {currentView === 'SUBSCRIPTION' && renderLimitReached()}
      </main>
      {['HOME', 'PROFILE', 'HISTORY', 'RANKS_INFO', 'ADMIN'].includes(currentView) && <BottomNav rpgMode={userProfile.rpgMode} currentView={currentView} onChangeView={(v) => setCurrentView(v)} />}
    </div>
  );
};

export default App;