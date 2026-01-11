// src/types.ts

// Добавил 'ONBOARDING' в список экранов
export type ViewState = 'ONBOARDING' | 'HOME' | 'CHAT' | 'HISTORY' | 'PROFILE' | 'SETTINGS' | 'ABOUT' | 'READ_HISTORY' | 'RANKS_INFO' | 'ADMIN';

export type JournalMode = 'DECISION' | 'EMOTIONS' | 'REFLECTION';

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
  date: number;
  duration: number;
  preview: string;
  messages: Message[];
}

// Добавил новые поля (focus, struggle, aiTone, theme, onboardingCompleted)
export interface UserProfile {
  name: string;
  email?: string;
  avatarUrl: string | null;
  isSetup: boolean;
  isRegistered: boolean;
  theme?: 'LIGHT' | 'SPACE';
  onboardingCompleted?: boolean;
  focus?: string;
  struggle?: string;
  aiTone?: string;
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
