
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

export interface DecisionData {
  topic: string;
  pros: string[];
  cons: string[];
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
  archetype?: Archetype | null;
  secondaryArchetypes?: { name: string; percent: number }[];
  xp: number;
  lastQuestDate: number | null;
  artifacts: string[];
  totalSessions: number;
  totalMinutes: number;
  rpgMode: boolean;
  // Subscription fields
  firstRunDate: number | null;
  isSubscribed: boolean;
  subscriptionExpiry: number | null;
  // Limit tracking
  lastUsageDate: string | null; // YYYY-MM-DD
  dailyDecisionCount: number;
  dailyEmotionsCount: number;
  totalQuestsDone: number;
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
