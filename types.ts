
export type ViewState = 'ONBOARDING' | 'HOME' | 'CHAT' | 'HISTORY' | 'PROFILE' | 'SETTINGS' | 'ABOUT' | 'READ_HISTORY' | 'RANKS_INFO' | 'ADMIN' | 'ARCHETYPE_TEST' | 'ARCHETYPE_RESULT' | 'ARCHETYPE_GLOSSARY' | 'SUBSCRIPTION';

export type JournalMode = 'DECISION' | 'EMOTIONS' | 'REFLECTION';

export interface Archetype {
  id: string;
  name: string;
  role: string;
  description: string;
  motto: string;
  strength: string;
  weakness: string;
  quote: string;
  meaning: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type?: 'text' | 'decision-card';
  decisionData?: DecisionData;
  timestamp: number;
}

export interface DecisionAnalysis {
  verdict: string;
  balanceA: number; // 0-100%
  balanceB: number; // 0-100%
  hiddenFactor: string;
  riskLevel: number; // 1-10
  riskDescription: string;
  actionStep: string;
}

export interface DecisionArgument {
  text: string;
  type: 'pro' | 'con';
}

export interface DecisionData {
  topic: string;
  decisionType: 'SINGLE' | 'COMPARE';
  optionA: string;
  optionB: string;
  argsA: DecisionArgument[];
  argsB: DecisionArgument[];
  analysis?: DecisionAnalysis;
  // Поля для обратной совместимости с историей
  pros?: string[]; 
  cons?: string[];
}

export interface ChatSession {
  id: string;
  mode: JournalMode;
  date: number; // timestamp
  duration: number; // seconds
  preview: string; // short text preview
  messages: Message[];
}

export interface UserProfile {
  name: string;
  avatarUrl: string | null;
  isSetup: boolean;
  isRegistered: boolean;
  onboardingDone?: boolean;
  archetype?: Archetype | null;
  secondaryArchetypes?: { name: string; percent: number }[];
  xp: number;
  lastQuestDate: number | null;
  artifacts: string[];
  totalSessions: number;
  totalMinutes: number;
  totalDecisions?: number; // Добавлено для статистики
  rpgMode: boolean;
  source?: string | null; // Источник перехода (start_param)
  // Subscription fields
  firstRunDate: number | null;
  isSubscribed: boolean;
  subscriptionExpiry: number | null;
  // Energy (Welcome Bonuses / Consumables)
  energyDecisions: number;
  energyEmotions: number;
  energyQuests: number;
  // Limit tracking
  lastUsageDate: null | string; // YYYY-MM-DD
  dailyDecisionCount: number;
  dailyEmotionsCount: number;
  totalQuestsDone: number;
  totalEmotionsDone?: number; // Добавлено для лимита сессий состояний
}

export interface SiteConfig {
  appTitle: string;
  logoText: string;
  customLogoUrl?: string | null;
  customWatermarkUrl?: string | null;
  aboutParagraphs: string[];
  quotes: { text: string; author: string }[];
  adminPasscode: string;
}

export type JournalEntryType = 'INTENTION' | 'INSIGHT' | 'GRATITUDE';

export interface JournalEntry {
  id: string;
  date: number;
  type: JournalEntryType;
  content: string;
}
