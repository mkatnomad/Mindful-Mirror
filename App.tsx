import React, { useState, useEffect, useRef } from 'react';
import { sendMessageToGemini } from './services/geminiService';

// --- 1. ГРАФИЧЕСКИЙ ДВИЖОК (ВСТРОЕННЫЕ ИКОНКИ) ---
// Мы рисуем их вручную, чтобы исключить ошибки импорта и белые экраны
const Icons: any = {
  Zap: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,
  Heart: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>,
  Book: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>,
  User: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>,
  Compass: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>,
  Battery: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="6" width="18" height="12" rx="2" ry="2"></rect><line x1="23" y1="13" x2="23" y2="11"></line></svg>,
  ArrowLeft: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>,
  Send: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>,
  Star: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>,
  Feather: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>,
  Briefcase: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
  Shield: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>,
  Map: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>,
  Loader: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"></path></svg>,
  Lightbulb: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 9.5 6 4.65 4.65 0 0 0 8 11.5c0 1.43.9 2.58 1.57 3.5"></path></svg>,
  Cloud: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>,
  Info: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>,
  Settings: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Anchor: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="3"></circle><line x1="12" y1="22" x2="12" y2="8"></line><path d="M5 12H2a10 10 0 0 0 20 0h-3"></path></svg>,
  Target: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>,
  MessageSquare: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  Activity: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>,
  Lock: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  Search: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Coffee: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>,
  Sun: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>,
  Moon: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>,
  Medal: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>,
  Award: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>,
  Camera: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>,
  Sparkles: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path></svg>,
  Sprout: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 20h10"/><path d="M10 20c5.5-2.5.8-6.4 3-10"/><path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.2.4-4.8-.4-1.2-.6-2.1-1.9-2-3.3a2.94 2.94 0 0 1 .83-1.98C6.59 6.66 7.94 6 9.5 6 9.5 9.4z"/><path d="M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z"/></svg>,
  CheckCircle: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  Flame: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.148-.22-4.01 1-5 0 0-2 3.5-3 5.5A5 5 0 0 0 11 14.5a5 5 0 0 0 5 5c2.76 0 5-4.5 5-4.5s-2 3.5-4 4.5c-1 1-3.5 1-4.5 0-1.5-1.5-1.5-3.5-1.5-3.5z"/></svg>,
  Clock: (p:any) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
};

// --- ТИПЫ ---
type ViewState = 'HOME' | 'ONBOARDING' | 'CHAT' | 'HISTORY' | 'PROFILE' | 'SETTINGS' | 'DAILY_GUIDE' | 'ARCHETYPE_RESULT' | 'TUTORIAL' | 'ARCHETYPE_RESULT_VIEW';
type JournalMode = 'DECISION' | 'EMOTIONS' | 'REFLECTION';

interface Message { id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: number; }
interface ChatSession { id: string; mode: JournalMode; date: number; duration: number; preview: string; messages: Message[]; }
interface UserProfile { name: string; avatarUrl: string | null; onboardingCompleted?: boolean; archetype?: string; focus?: string; struggle?: string; chronotype?: string; currentMood?: 'high' | 'flow' | 'ok' | 'low'; }
interface DailyInsightData { date: string; generatedForMood?: string; mindset: string; action: string; health: string; insight: string; }

// --- КЛЮЧИ ---
const STORAGE_KEYS = {
  PROFILE: 'mm_profile_beautiful_prod_final', 
  HISTORY: 'mm_history_beautiful_prod_final',
  SESSIONS: 'mm_sessions_beautiful_prod_final',
  TIME: 'mm_time_beautiful_prod_final',
  JOURNAL: 'mm_journal_beautiful_prod_final',
  DAILY_INSIGHT: 'mm_insight_beautiful_prod_final',
  CONFIG: 'mm_config_beautiful_prod_final'
};

const Logo = ({ className = "w-20 h-20" }: { className?: string }) => (
  <img src="/logo.png" alt="Mindful Mirror" className={`${className} object-contain`} onError={(e) => e.currentTarget.style.display = 'none'} />
);

// --- ВЕКТОРНЫЕ ДЕРЕВЬЯ (SVG) ---
const TreeIllustration: React.FC<{ stage: number, className?: string }> = ({ stage, className }) => {
  const c = className || "w-full h-full";
  const gid = `grad-tree-fixed-${stage}`;

  if (stage <= 1) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#FEF3C7" /><path d="M50 75C50 75 40 75 40 75" stroke="#D97706" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="70" r="6" fill="#B45309" /></svg>;
  if (stage === 2) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#ECFDF5" /><path d="M50 80V60" stroke="#059669" strokeWidth="3" strokeLinecap="round"/><path d="M50 60C50 60 35 55 35 45C35 55 50 60 50 60Z" fill="#10B981" /><path d="M50 60C50 60 65 55 65 45C65 55 50 60 50 60Z" fill="#34D399" /></svg>;
  if (stage === 3) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#D1FAE5" /><path d="M50 85V50" stroke="#059669" strokeWidth="3" strokeLinecap="round"/><path d="M50 65L65 55" stroke="#059669" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="45" r="10" fill="#10B981" /><circle cx="65" cy="55" r="6" fill="#34D399" /></svg>;
  if (stage === 4) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#A7F3D0" /><path d="M50 85V45" stroke="#92400E" strokeWidth="4" strokeLinecap="round"/><path d="M50 65L30 55" stroke="#92400E" strokeWidth="2" strokeLinecap="round"/><circle cx="50" cy="40" r="15" fill="#10B981" /><circle cx="30" cy="55" r="8" fill="#34D399" /><circle cx="65" cy="50" r="8" fill="#34D399" /></svg>;
  if (stage === 5) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#6EE7B7" /><path d="M50 90V40" stroke="#92400E" strokeWidth="5" strokeLinecap="round"/><path d="M50 60L25 50" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/><path d="M50 50L75 40" stroke="#92400E" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="35" r="20" fill="#059669" /><circle cx="25" cy="50" r="12" fill="#10B981" /><circle cx="75" cy="40" r="12" fill="#10B981" /></svg>;
  if (stage === 6) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#34D399" /><path d="M50 90L50 35" stroke="#78350F" strokeWidth="6" strokeLinecap="round"/><path d="M50 70L20 60" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/><path d="M50 60L80 50" stroke="#78350F" strokeWidth="3" strokeLinecap="round"/><circle cx="50" cy="30" r="25" fill="#047857" /><circle cx="20" cy="60" r="15" fill="#059669" /><circle cx="80" cy="50" r="15" fill="#059669" /></svg>;
  if (stage === 7) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#10B981" /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="7" strokeLinecap="round"/><path d="M50 70L20 55" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/><path d="M50 60L85 45" stroke="#451A03" strokeWidth="4" strokeLinecap="round"/><circle cx="50" cy="35" r="30" fill="#064E3B" /><circle cx="20" cy="55" r="18" fill="#065F46" /><circle cx="85" cy="45" r="18" fill="#065F46" /><circle cx="35" cy="80" r="5" fill="#064E3B" opacity="0.5"/></svg>;
  if (stage === 8) return <svg viewBox="0 0 100 100" className={c} fill="none"><circle cx="50" cy="50" r="45" fill="#FCE7F3" /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="8" strokeLinecap="round"/><circle cx="50" cy="40" r="35" fill="#065F46" /><circle cx="25" cy="55" r="20" fill="#047857" /><circle cx="75" cy="55" r="20" fill="#047857" /><circle cx="40" cy="30" r="5" fill="#F472B6" /><circle cx="60" cy="30" r="5" fill="#F472B6" /><circle cx="25" cy="55" r="5" fill="#F472B6" /><circle cx="75" cy="55" r="5" fill="#F472B6" /><circle cx="50" cy="15" r="5" fill="#F472B6" /></svg>;
  
  // 9: Древо Мудрости
  return (<svg viewBox="0 0 100 100" className={c} fill="none"><defs><radialGradient id={gid} cx="50%" cy="50%" r="50%" fx="50%" fy="50%"><stop offset="0%" style={{stopColor:'rgb(255,255,255)', stopOpacity:0.8}} /><stop offset="100%" style={{stopColor:'rgb(16, 185, 129)', stopOpacity:0}} /></radialGradient></defs><circle cx="50" cy="50" r="48" fill={`url(#${gid})`} /><path d="M50 95L50 40" stroke="#451A03" strokeWidth="10" strokeLinecap="round"/><circle cx="50" cy="40" r="40" fill="#064E3B" /><circle cx="20" cy="65" r="25" fill="#065F46" /><circle cx="80" cy="65" r="25" fill="#065F46" /><circle cx="50" cy="25" r="15" fill="#10B981" /><path d="M20 20L25 25" stroke="#FCD34D" strokeWidth="2" /><path d="M80 20L75 25" stroke="#FCD34D" strokeWidth="2" /></svg>);
};

const TREE_STAGES = [
  { threshold: 5000, title: "Древо Мудрости", stageIndex: 9 },
  { threshold: 2500, title: "Плодоносящее Древо", stageIndex: 9 },
  { threshold: 1200, title: "Цветущее Древо", stageIndex: 8 },
  { threshold: 600, title: "Ветвистое Древо", stageIndex: 7 },
  { threshold: 300, title: "Крепкое Древо", stageIndex: 6 },
  { threshold: 150, title: "Молодое Дерево", stageIndex: 5 },
  { threshold: 75, title: "Саженец", stageIndex: 4 },
  { threshold: 30, title: "Побег", stageIndex: 3 },
  { threshold: 10, title: "Росток", stageIndex: 2 },
  { threshold: 0, title: "Семя", stageIndex: 1 },
];

const ARCHETYPE_INFO: any = {
  "Творец": { 
    desc: "Для вас жизнь — это чистый холст, требующий выражения. Вы не переносите серость, рутину и застой. Ваша миссия — материализовать свои идеи, будь то бизнес, искусство или уникальный стиль жизни. Вы видите потенциал там, где другие видят пустоту.",
    strength: "Способность создавать нечто уникальное из хаоса. Визионерство.", 
    shadow: "Перфекционизм, который парализует. Страх, что результат будет недостаточно идеальным.", 
    advice: "Не ждите вдохновения — оно приходит во время работы. «Сделанное» лучше «идеального».", 
    icon: Icons.Feather, color: "text-purple-600", bg: "bg-purple-50" 
  },
  "Правитель": { 
    desc: "Вы — архитектор реальности. Хаос вызывает у вас желание навести порядок. Вы естественным образом берете ответственность на себя, создаете структуры, системы и ведете людей за собой. Успех для вас — это работающий механизм.",
    strength: "Лидерство, стратегическое видение и умение нести ответственность.", 
    shadow: "Желание контролировать всё и всех. Страх потерять авторитет.", 
    advice: "Научитесь доверять течению жизни. Иногда лучший способ управления — это позволить вещам случаться.", 
    icon: Icons.Briefcase, color: "text-indigo-600", bg: "bg-indigo-50" 
  },
  "Мудрец": { 
    desc: "Ваш главный инструмент — разум. Вы верите, что истина сделает вас свободным. Вы стремитесь понять, как устроен этот мир, анализируете факты и избегаете поспешных решений. Вы — вечный ученик и философ.",
    strength: "Глубокий интеллект, аналитика и объективность.", 
    shadow: "«Горе от ума». Бездействие из-за бесконечного анализа. Отстраненность.", 
    advice: "Знание без действий бесполезно. Сделайте шаг, даже если у вас нет 100% данных.", 
    icon: Icons.Book, color: "text-blue-600", bg: "bg-blue-50" 
  },
  "Хранитель": { 
    desc: "Ваша суперсила — это сердце. Вы чувствуете людей, стремитесь помочь и защитить. Вы создаете уют и безопасность для окружающих. Вы — тот самый человек, к которому идут за поддержкой в трудную минуту.",
    strength: "Эмпатия, великодушие и умение заботиться.", 
    shadow: "Самопожертвование. Вы часто забываете о себе, спасая других.", 
    advice: "Сначала наденьте кислородную маску на себя. Вы не сможете помочь другим, если выгорите.", 
    icon: Icons.Shield, color: "text-emerald-600", bg: "bg-emerald-50" 
  },
  "Искатель": { 
    desc: "Вы не можете сидеть на месте. Рутина вас душит. Вы стремитесь к новым горизонтам, будь то путешествия, новые знания или духовный поиск. Свобода для вас — главная ценность.",
    strength: "Любознательность, независимость и смелость быть собой.", 
    shadow: "Неумение пустить корни. Вечный бег от обязательств.", 
    advice: "Счастье — это путь, но иногда важно остановиться и насладиться моментом «здесь и сейчас».", 
    icon: Icons.Compass, color: "text-amber-600", bg: "bg-amber-50" 
  }
};

// --- ВНУТРЕННИЕ КОМПОНЕНТЫ ---

const InternalChat: React.FC<{ mode: JournalMode, onBack: () => void, onComplete: (msg: any, dur: number) => void }> = ({ mode, onBack, onComplete }) => {
  const [messages, setMessages] = useState<Message[]>([{ id: '1', role: 'assistant', content: 'Привет! О чем хочешь поговорить?', timestamp: Date.now() }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const startTime = useRef(Date.now());

  const send = async () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [userMsg, ...prev]); 
    setInput('');
    setLoading(true);
    try {
      const response = await sendMessageToGemini(input);
      setMessages(prev => [{ id: (Date.now()+1).toString(), role: 'assistant', content: response, timestamp: Date.now() }, ...prev]);
    } catch {
      setMessages(prev => [{ id: (Date.now()+1).toString(), role: 'assistant', content: "Ошибка связи.", timestamp: Date.now() }, ...prev]);
    } finally { setLoading(false); }
  };

  const finish = () => { onComplete(messages, Math.round((Date.now() - startTime.current) / 1000)); onBack(); };

  return (
    <div className="flex flex-col h-full bg-white z-50 fixed inset-0">
      <div className="p-4 border-b flex justify-between items-center bg-white">
        <button onClick={onBack}><Icons.ArrowLeft className="w-6 h-6 text-slate-500" /></button>
        <span className="font-bold text-slate-800">{mode === 'DECISION' ? 'Решение' : mode === 'EMOTIONS' ? 'Эмоции' : 'Дневник'}</span>
        <button onClick={finish} className="text-xs font-bold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">Завершить</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col-reverse space-y-reverse space-y-4 bg-slate-50">
        {loading && <div className="self-start bg-white p-3 rounded-2xl shadow-sm"><Icons.Loader className="animate-spin text-indigo-500 w-4 h-4"/></div>}
        {messages.map(m => (<div key={m.id} className={`max-w-[80%] p-4 rounded-2xl text-sm ${m.role === 'user' ? 'self-end bg-indigo-600 text-white' : 'self-start bg-white text-slate-800 shadow-sm'}`}>{m.content}</div>))}
      </div>
      <div className="p-4 border-t bg-white flex space-x-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="Напишите..." className="flex-1 bg-slate-100 rounded-full px-4 py-3 outline-none text-sm" />
        <button onClick={send} className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white"><Icons.Send className="w-5 h-5" /></button>
      </div>
    </div>
  );
};

const InternalBottomNav: React.FC<{ currentView: string, onChangeView: (v: string) => void }> = ({ currentView, onChangeView }) => (
  <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 px-6 py-4 flex justify-between items-center z-40 safe-area-pb">
    {[{ id: 'HOME', icon: Icons.Zap, label: 'Путь' }, { id: 'HISTORY', icon: Icons.Book, label: 'История' }, { id: 'PROFILE', icon: Icons.User, label: 'Профиль' }].map(item => (
      <button key={item.id} onClick={() => onChangeView(item.id)} className={`flex flex-col items-center space-y-1 ${currentView === item.id ? 'text-indigo-600' : 'text-slate-400'}`}>
        <item.icon className="w-6 h-6" strokeWidth={currentView === item.id ? 2.5 : 2} />{currentView === item.id && <span className="text-[10px] font-bold">{item.label}</span>}
      </button>
    ))}
  </div>
);

// --- ЭКРАНЫ ---

const ArchetypeResultScreen: React.FC<{ archetype: string, onContinue: () => void, isReadOnly?: boolean, onBack?: () => void }> = ({ archetype, onContinue, isReadOnly, onBack }) => {
  const info = ARCHETYPE_INFO[archetype] || ARCHETYPE_INFO["Искатель"];
  return (
    <div className="h-full flex flex-col bg-white overflow-y-auto animate-fade-in relative z-50">
      <div className="p-6 pb-0">{isReadOnly && <button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 mb-4"><Icons.ArrowLeft className="w-6 h-6" /></button></div>
      <div className="flex-1 px-6 pb-12 flex flex-col items-center text-center">
        <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-xl ${info.bg} ${info.color}`}><info.icon className="w-16 h-16" strokeWidth={1.5} /></div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">Ваш Архетип</h2>
        <h1 className="text-4xl font-black text-slate-800 mb-6">{archetype}</h1>
        <p className="text-lg text-slate-600 leading-relaxed mb-10">{info.desc}</p>
        <div className="w-full space-y-4 mb-10 text-left">
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-100"><div className="flex items-center space-x-3 mb-2 text-emerald-700 font-bold"><Icons.Star className="w-5 h-5"/><span>Суперсила</span></div><p className="text-emerald-900/80 font-medium leading-snug">{info.strength}</p></div>
          <div className="p-5 rounded-2xl bg-rose-50 border border-rose-100"><div className="flex items-center space-x-3 mb-2 text-rose-700 font-bold"><Icons.Cloud className="w-5 h-5"/><span>Тень</span></div><p className="text-rose-900/80 font-medium leading-snug">{info.shadow}</p></div>
          <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-100"><div className="flex items-center space-x-3 mb-2 text-indigo-700 font-bold"><Icons.Lightbulb className="w-5 h-5"/><span>Совет</span></div><p className="text-indigo-900/80 font-medium leading-snug">{info.advice}</p></div>
        </div>
        {!isReadOnly && <button onClick={onContinue} className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-xl active:scale-95 transition-all">Далее</button>}
      </div>
    </div>
  );
};

const TutorialScreen: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [slide, setSlide] = useState(0);
  const slides = [
    { title: "Карта Дня", desc: "Каждое утро ИИ создает для вас персональный план на основе вашего архетипа.", icon: Icons.Map, color: "text-indigo-500", bg: "bg-indigo-50" },
    { title: "Настроение", desc: "Нажмите на кнопку 'Как ты?' на главной, чтобы адаптировать план под ваш уровень энергии.", icon: Icons.Battery, color: "text-emerald-500", bg: "bg-emerald-50" },
    { title: "Древо Сознания", desc: "Ваш прогресс визуализируется в виде дерева. Чем больше практик, тем выше оно растет.", icon: Icons.User, color: "text-amber-500", bg: "bg-amber-50" }
  ];
  return (
    <div className="h-full flex flex-col bg-white px-6 py-10 animate-fade-in relative z-50">
      <div className="flex-1 flex flex-col justify-center items-center text-center">
        <div className={`w-32 h-32 rounded-[32px] flex items-center justify-center mb-8 shadow-sm ${slides[slide].bg} ${slides[slide].color}`}><slides[slide].icon className="w-16 h-16" /></div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">{slides[slide].title}</h2>
        <p className="text-slate-500 text-lg leading-relaxed max-w-xs">{slides[slide].desc}</p>
      </div>
      <div className="flex flex-col items-center space-y-8">
        <div className="flex space-x-2">{slides.map((_, i) => <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-indigo-600' : 'w-2 bg-slate-200'}`} />)}</div>
        <button onClick={() => { if (slide < slides.length - 1) setSlide(s => s + 1); else onFinish(); }} className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold text-lg shadow-lg active:scale-95 transition-all">{slide < slides.length - 1 ? "Далее" : "Начать"}</button>
      </div>
    </div>
  );
};

const OnboardingScreen: React.FC<{ onComplete: (data: Partial<UserProfile>) => void, onBack: () => void }> = ({ onComplete, onBack }) => {
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState({ CREATOR: 0, RULER: 0, SAGE: 0, CAREGIVER: 0, EXPLORER: 0 });
  const [finalData, setFinalData] = useState<{ focus?: string, struggle?: string, chronotype?: string }>({});
  
  const steps = [
    { title: "Что дает вам энергию?", type: 'archetype', options: [{ label: "Создание нового", type: 'CREATOR', icon: Icons.Feather }, { label: "Управление и успех", type: 'RULER', icon: Icons.Target }, { label: "Поиск истины", type: 'SAGE', icon: Icons.Book }, { label: "Помощь людям", type: 'CAREGIVER', icon: Icons.Heart }] },
    { title: "Чего вы избегаете?", type: 'archetype', options: [{ label: "Скуки и рутины", type: 'CREATOR', icon: Icons.Zap }, { label: "Хаоса", type: 'RULER', icon: Icons.Briefcase }, { label: "Незнания", type: 'SAGE', icon: Icons.Search }, { label: "Застоя", type: 'EXPLORER', icon: Icons.Map }] },
    { title: "Идеальный выходной?", type: 'archetype', options: [{ label: "Путешествие", type: 'EXPLORER', icon: Icons.Compass }, { label: "Уют с семьей", type: 'CAREGIVER', icon: Icons.Coffee }, { label: "Изучение нового", type: 'SAGE', icon: Icons.Zap }, { label: "Планирование недели", type: 'RULER', icon: Icons.Briefcase }] },
    { title: "В кризис вы...", type: 'archetype', options: [{ label: "Ищу нестандартный выход", type: 'CREATOR', icon: Icons.Star }, { label: "Беру ответственность", type: 'RULER', icon: Icons.Shield }, { label: "Анализирую ситуацию", type: 'SAGE', icon: Icons.Brain }, { label: "Забочусь об эмоциях", type: 'CAREGIVER', icon: Icons.Heart }] },
    { title: "Драйвер жизни?", type: 'archetype', options: [{ label: "Самовыражение", type: 'CREATOR', icon: Icons.Feather }, { label: "Статус", type: 'RULER', icon: Icons.Star }, { label: "Истина", type: 'SAGE', icon: Icons.Search }, { label: "Свобода", type: 'EXPLORER', icon: Icons.Map }] },
    { title: "Ценность в людях?", type: 'archetype', options: [{ label: "Уникальность", type: 'CREATOR', icon: Icons.Star }, { label: "Верность", type: 'CAREGIVER', icon: Icons.Anchor }, { label: "Ум", type: 'SAGE', icon: Icons.Book }, { label: "Легкость", type: 'EXPLORER', icon: Icons.Compass }] },
    { title: "Решения?", type: 'archetype', options: [{ label: "Интуиция", type: 'CREATOR', icon: Icons.Zap }, { label: "Логика", type: 'SAGE', icon: Icons.Brain }, { label: "Выгода", type: 'RULER', icon: Icons.Target }, { label: "Сердце", type: 'CAREGIVER', icon: Icons.Heart }] },
    { title: "Лидерство?", type: 'archetype', options: [{ label: "Вдохновитель", type: 'CREATOR', icon: Icons.Sun }, { label: "Стратег", type: 'RULER', icon: Icons.Target }, { label: "Наставник", type: 'SAGE', icon: Icons.Book }, { label: "Защитник", type: 'CAREGIVER', icon: Icons.Shield }] },
    { title: "Перемены?", type: 'archetype', options: [{ label: "Приключение!", type: 'EXPLORER', icon: Icons.Send }, { label: "Изучаю", type: 'SAGE', icon: Icons.Search }, { label: "Внедряю", type: 'RULER', icon: Icons.Briefcase }, { label: "Осторожно", type: 'CAREGIVER', icon: Icons.Lock }] },
    { title: "Подарок?", type: 'archetype', options: [{ label: "С душой", type: 'CAREGIVER', icon: Icons.Heart }, { label: "Билет", type: 'EXPLORER', icon: Icons.Map }, { label: "Книга", type: 'SAGE', icon: Icons.Book }, { label: "Статус", type: 'RULER', icon: Icons.Star }] },
    { title: "Утро?", type: 'archetype', options: [{ label: "План", type: 'RULER', icon: Icons.Activity }, { label: "Кофе", type: 'CREATOR', icon: Icons.Coffee }, { label: "В путь", type: 'EXPLORER', icon: Icons.Cloud }, { label: "Семья", type: 'CAREGIVER', icon: Icons.Smile }] },
    { title: "Наследие?", type: 'archetype', options: [{ label: "Искусство", type: 'CREATOR', icon: Icons.Feather }, { label: "Империя", type: 'RULER', icon: Icons.Briefcase }, { label: "Открытие", type: 'SAGE', icon: Icons.Book }, { label: "Память", type: 'CAREGIVER', icon: Icons.Heart }] },
    // Настройки
    { title: "Главный фокус?", key: 'focus', options: [{ label: "Доходы", value: "Рост доходов", icon: Icons.Zap }, { label: "Спокойствие", value: "Снижение стресса", icon: Icons.Cloud }, { label: "Дисциплина", value: "Дисциплина", icon: Icons.Brain }, { label: "Семья", value: "Семья", icon: Icons.Heart }] },
    { title: "Что мешает?", key: 'struggle', options: [{ label: "Лень", value: "Прокрастинация", icon: Icons.Clock }, { label: "Страх", value: "Неуверенность", icon: Icons.Lock }, { label: "Усталость", value: "Выгорание", icon: Icons.Battery }, { label: "Хаос", value: "Расфокус", icon: Icons.Activity }] },
    { title: "Биоритмы?", key: 'chronotype', options: [{ label: "Жаворонок", value: "Утро", icon: Icons.Sun }, { label: "Сова", value: "Вечер", icon: Icons.Moon }, { label: "Плавающий", value: "Плавающий", icon: Icons.Activity }] }
  ];

  const currentStepData = steps[step];
  if (!currentStepData) return null;

  const handleSelect = (option: any) => {
    if (currentStepData.type === 'archetype') setScores(prev => ({ ...prev, [option.type]: (prev[option.type as keyof typeof scores] || 0) + 1 }));
    if (currentStepData.key) setFinalData(prev => ({ ...prev, [currentStepData.key!]: option.value }));

    if (step < steps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      let winner = 'SAGE';
      let max = -1;
      Object.entries(scores).forEach(([k, v]) => { if (v > max) { max = v; winner = k; } });
      const archMap: any = { CREATOR: "Творец", RULER: "Правитель", SAGE: "Мудрец", CAREGIVER: "Хранитель", EXPLORER: "Искатель" };
      onComplete({ archetype: archMap[winner] || "Искатель", ...finalData });
    }
  };

  return (
    <div className="h-full flex flex-col bg-white px-6 py-10 animate-fade-in relative z-50">
      <div className="flex justify-start mb-6"><button onClick={onBack} className="p-2 -ml-2 text-slate-400 hover:text-slate-600"><Icons.ArrowLeft className="w-6 h-6"/></button></div>
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="mb-10">
          <div className="flex space-x-1 mb-8 justify-center flex-wrap gap-y-2">{steps.map((_, i) => (<div key={i} className={`h-1.5 rounded-full transition-all duration-500 mx-0.5 ${i <= step ? 'w-4 bg-indigo-500' : 'w-2 bg-slate-100'}`} />))}</div>
          <h2 className="text-2xl font-black text-slate-800 text-center leading-tight mb-2">{currentStepData.title}</h2>
        </div>
        <div className="space-y-3" key={step}>
          {currentStepData.options.map((option: any, idx: number) => (
            <button key={idx} onClick={() => handleSelect(option)} className="w-full p-5 rounded-[24px] border border-slate-100 bg-slate-50 hover:bg-white hover:border-indigo-200 hover:shadow-lg transition-all active:scale-[0.98] flex items-center text-left group focus:outline-none">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-500 shadow-sm mr-4 group-hover:scale-110 transition-transform"><option.icon className="w-5 h-5" /></div>
              <span className="font-bold text-slate-700 text-base group-hover:text-indigo-700 leading-tight">{option.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- APP ---
const App: React.FC = () => {
  // АВТО-СБРОС
  useEffect(() => {
    if (!localStorage.getItem('mm_final_v21_reset')) {
      localStorage.clear();
      localStorage.setItem('mm_final_v21_reset', 'true');
      window.location.reload();
    }
  }, []);

  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.CONFIG) || 'null') || DEFAULT_CONFIG; } catch { return DEFAULT_CONFIG; }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? { onboardingCompleted: false, currentMood: 'ok', ...JSON.parse(saved) } : { name: '', avatarUrl: null, isSetup: true, isRegistered: false, onboardingCompleted: false, currentMood: 'ok' };
    } catch { return { name: '', avatarUrl: null, isSetup: true, isRegistered: false, onboardingCompleted: false, currentMood: 'ok' }; }
  });

  const [currentView, setCurrentView] = useState<string>('HOME'); 
  const [selectedMode, setSelectedMode] = useState<JournalMode | null>(null);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [dailyInsight, setDailyInsight] = useState<DailyInsightData | null>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.DAILY_INSIGHT) || 'null'); } catch { return null; }
  });
  
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [isBatteryModalOpen, setIsBatteryModalOpen] = useState(false);
  const [history, setHistory] = useState<ChatSession[]>(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]'); } catch { return []; }});
  const [totalSessions, setTotalSessions] = useState<number>(() => {
    const val = parseInt(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '0', 10);
    return isNaN(val) ? 0 : val;
  });
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(() => {
    const val = parseInt(localStorage.getItem(STORAGE_KEYS.TIME) || '0', 10);
    return isNaN(val) ? 0 : val;
  });

  // Effects
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(userProfile)); }, [userProfile]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SESSIONS, totalSessions.toString()); }, [totalSessions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.TIME, totalTimeSeconds.toString()); }, [totalTimeSeconds]);

  const totalMinutes = Math.round(totalTimeSeconds / 60);
  const totalSteps = totalSessions + totalMinutes; 
  const getTreeStage = (steps: number) => { const safeSteps = isNaN(steps) ? 0 : steps; return TREE_STAGES.find(r => safeSteps >= r.threshold) || TREE_STAGES[TREE_STAGES.length - 1]; };
  const currentTree = getTreeStage(totalSteps);

  const startMode = (mode: JournalMode) => { setSelectedMode(mode); setCurrentView('CHAT'); };
  
  const handleSessionComplete = (messages: Message[], duration: number) => {
    const previewText = messages.find(m => m.role === 'user')?.content || 'Сессия';
    const newSession: ChatSession = { id: Date.now().toString(), mode: selectedMode!, date: Date.now(), duration, preview: previewText.substring(0, 50) + '...', messages };
    setHistory(prev => [newSession, ...prev]); setTotalSessions(prev => prev + 1); setTotalTimeSeconds(prev => prev + duration);
  };

  // --- GENERATION ---
  useEffect(() => {
    const generateDailyAdvice = async () => {
      if (!userProfile.onboardingCompleted || !userProfile.name) return;
      const todayStr = new Date().toDateString();
      if (dailyInsight && dailyInsight.date === todayStr && dailyInsight.generatedForMood === currentMood) return;

      setIsInsightLoading(true);
      try {
        const userName = userProfile.name || "Друг";
        const prompt = `Ты — ментор. Клиент: ${userName}. Архетип: "${userProfile.archetype}". Цель: "${userProfile.focus}". 4 совета.`;
        const responseText = await sendMessageToGemini(prompt);
        const parts = responseText.split('|||');
        const newInsight = { date: todayStr, generatedForMood: userProfile.currentMood, mindset: parts[0]||"Фокус", action: parts[1]||"Действие", health: parts[2]||"Дыши", insight: parts[3]||"Вперед" };
        setDailyInsight(newInsight);
        localStorage.setItem(STORAGE_KEYS.DAILY_INSIGHT, JSON.stringify(newInsight));
      } catch (e) { } finally { setIsInsightLoading(false); }
    };
    generateDailyAdvice();
  }, [userProfile.name, userProfile.currentMood, userProfile.onboardingCompleted]);

  // --- RENDERERS ---
  const renderBatteryModal = () => {
    if (!isBatteryModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsBatteryModalOpen(false)}></div>
        <div className="bg-white rounded-[32px] p-6 w-full max-w-xs relative z-10 animate-fade-in shadow-2xl">
          <div className="grid grid-cols-2 gap-3">
            {[{l:"🔥",v:"high"},{l:"🌊",v:"flow"},{l:"🙂",v:"ok"},{l:"🪫",v:"low"}].map(i=>(<button key={i.v} onClick={()=>{setIsBatteryModalOpen(false); setUserProfile(p=>({...p, currentMood: i.v as any}))}} className="p-4 bg-slate-50 rounded-2xl text-2xl">{i.l}</button>))}
          </div>
        </div>
      </div>
    );
  };

  const renderHome = () => (
    <div className="h-full overflow-y-auto animate-fade-in relative z-10 pb-32">
      <header className="mb-4 w-full flex items-center justify-between px-6 pt-4">
         <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm">{userProfile.avatarUrl ? <img src={userProfile.avatarUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-400"><Icons.User className="w-6 h-6"/></div>}</div>
            <div><h3 className="text-sm font-bold text-slate-900 leading-tight">{userProfile.name || 'Странник'}</h3><p className="text-[10px] text-slate-400 font-medium">{userProfile.archetype || 'Начало пути'}</p></div>
         </div>
         <div className="w-10 h-10 flex items-center justify-center"><Logo /></div>
      </header>

      <div className="px-6 mb-8">
        {!userProfile.onboardingCompleted ? (
          <button onClick={() => setCurrentView('ONBOARDING')} className="w-full relative overflow-hidden rounded-[32px] bg-slate-900 p-8 text-left shadow-xl shadow-slate-200 group active:scale-95 transition-all">
             <div className="relative z-10">
               <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white mb-6"><Icons.Compass className="w-6 h-6"/></div>
               <h2 className="text-2xl font-bold text-white mb-2 leading-tight">Найти свой путь</h2>
               <div className="inline-flex items-center space-x-2 bg-white text-slate-900 px-5 py-2.5 rounded-full text-xs font-bold"><span>Начать тест</span></div>
             </div>
          </button>
        ) : (
          <div className="w-full relative overflow-hidden rounded-[32px] bg-white border border-slate-100 p-6 text-left shadow-lg shadow-indigo-100/50">
             <div className="relative z-10">
               <div className="flex justify-between items-start mb-4">
                 <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider">Фокус дня</span>
                 <button onClick={(e) => { e.stopPropagation(); setIsBatteryModalOpen(true); }} className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors active:scale-90"><Icons.Battery className="w-4 h-4"/><span className="text-[10px] font-bold text-slate-600">{userProfile.currentMood || 'Ok'}</span></button>
               </div>
               <h2 className="text-xl font-bold text-slate-800 leading-snug line-clamp-3 mb-6">{dailyInsight?.mindset || "Загрузка..."}</h2>
               <button onClick={() => setCurrentView('DAILY_GUIDE')} className="w-full py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm shadow-md shadow-indigo-200 active:scale-95 transition-all flex items-center justify-center space-x-2 group"><span>Открыть карту</span></button>
             </div>
          </div>
        )}
      </div>

      <div className="px-6 mb-8">
        <div className="grid grid-cols-3 gap-4">
          <button onClick={() => startMode('DECISION')} className="flex flex-col items-center p-4 rounded-[24px] bg-white border border-slate-50 shadow-sm active:scale-95 transition-all group"><div className={`w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3`}><Icons.Zap className="w-6 h-6"/></div><span className="text-[11px] font-bold text-slate-500">РЕШЕНИЕ</span></button>
          <button onClick={() => startMode('EMOTIONS')} className="flex flex-col items-center p-4 rounded-[24px] bg-white border border-slate-50 shadow-sm active:scale-95 transition-all group"><div className={`w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 mb-3`}><Icons.Heart className="w-6 h-6"/></div><span className="text-[11px] font-bold text-slate-500">ЭМОЦИИ</span></button>
          <button onClick={() => startMode('REFLECTION')} className="flex flex-col items-center p-4 rounded-[24px] bg-white border border-slate-50 shadow-sm active:scale-95 transition-all group"><div className={`w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 mb-3`}><Icons.Book className="w-6 h-6"/></div><span className="text-[11px] font-bold text-slate-500">ДНЕВНИК</span></button>
        </div>
      </div>

      <div className="px-6 mb-6">
         <button onClick={() => setCurrentView('RANKS_INFO')} className="w-full bg-gradient-to-br from-white to-slate-50 border border-slate-100 p-5 rounded-[24px] shadow-sm active:scale-95 transition-all relative overflow-hidden">
            <div className="flex justify-between items-center mb-4 relative z-10">
                <div className="flex items-center space-x-4">
                   <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center overflow-hidden"><TreeIllustration stage={currentTree.stageIndex} className="w-10 h-10" /></div>
                   <div className="text-left"><p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Древо</p><h4 className="text-base font-bold text-slate-800">{currentTree.title}</h4></div>
                </div>
            </div>
         </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full overflow-hidden flex flex-col font-sans relative bg-[#F8FAFC]">
      <main className="flex-1 relative overflow-hidden z-10">
        {renderBatteryModal()}
        {currentView === 'ONBOARDING' && <OnboardingScreen onComplete={(data) => { setUserProfile(prev => ({ ...prev, ...data, onboardingCompleted: true })); localStorage.removeItem(STORAGE_KEYS.DAILY_INSIGHT); setDailyInsight(null); setCurrentView('ARCHETYPE_RESULT'); }} onBack={() => setCurrentView('HOME')} />}
        {currentView === 'ARCHETYPE_RESULT' && <ArchetypeResultScreen archetype={userProfile.archetype || 'Искатель'} onContinue={() => setCurrentView('TUTORIAL')} />}
        {currentView === 'ARCHETYPE_RESULT_VIEW' && <ArchetypeResultScreen archetype={userProfile.archetype || 'Искатель'} isReadOnly={true} onBack={() => setCurrentView('PROFILE')} onContinue={() => {}} />}
        {currentView === 'TUTORIAL' && <TutorialScreen onFinish={() => setCurrentView('HOME')} />}
        {currentView === 'DAILY_GUIDE' && <div className="p-6 pt-12"><h1>Карта дня</h1><p>{dailyInsight?.mindset}</p><button onClick={() => setCurrentView('HOME')}>Назад</button></div>}
        {currentView === 'HOME' && renderHome()}
        {currentView === 'CHAT' && <InternalChat mode={selectedMode!} onBack={() => setCurrentView('HOME')} onComplete={(msgs, dur) => { handleSessionComplete(msgs, dur); }} />}
        {currentView === 'PROFILE' && <div className="p-6 pt-12"><h1>Профиль</h1><p>{userProfile.name}</p><button onClick={() => setCurrentView('ARCHETYPE_RESULT_VIEW')}>Архетип</button></div>}
        {currentView === 'HISTORY' && <div className="p-6 pt-12"><h1>История</h1>{history.map(h=><div key={h.id}>{h.preview}</div>)}</div>}
      </main>
      {(['HOME', 'HISTORY', 'PROFILE'].includes(currentView)) && <InternalBottomNav currentView={currentView} onChangeView={setCurrentView} />}
    </div>
  );
};

export default App;
