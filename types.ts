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
  date: number; // timestamp
  duration: number; // seconds
  preview: string; // short text preview
  messages: Message[];
}

export interface UserProfile {
  name: string;
  email?: string;
  avatarUrl: string | null;
  isSetup: boolean;
  isRegistered: boolean;
  // 👇 НОВЫЕ ПОЛЯ (Добавлены для опроса и темы)
  theme?: 'LIGHT' | 'SPACE';
  onboardingCompleted?: boolean;
  focus?: string;    // На чем фокус (Спокойствие, Карьера...)
  struggle?: string; // Что мешает (Стресс, Лень...)
  aiTone?: string;   // Какой стиль общения
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
