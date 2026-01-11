export type ViewState = 'ONBOARDING' | 'HOME' | 'CHAT' | 'HISTORY' | 'PROFILE' | 'SETTINGS' | 'ABOUT' | 'READ_HISTORY' | 'RANKS_INFO' | 'ADMIN' | 'DAILY_GUIDE';

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

export interface UserProfile {
  name: string;
  avatarUrl: string | null;
  isSetup: boolean;
  isRegistered: boolean;
  theme?: 'LIGHT' | 'SPACE';
  
  // 👇 ГЛУБИННЫЙ ПРОФИЛЬ (АРХЕТИП)
  onboardingCompleted?: boolean;
  archetype?: string;    // Например: "Творец"
  shadow?: string;       // Главный страх (Тень)
  superpower?: string;   // Источник силы
  aiTone?: string;       // Тон общения
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

// 👇 НОВАЯ СТРУКТУРА "АЛХИМИЧЕСКОЙ КАРТЫ"
export interface DailyInsightData {
  date: string;
  archetype: string; // Роль дня (метафора)
  trap: string;      // Ловушка/Щит
  lens: string;      // Оптика/Призма
  key: string;       // Артефакт/Практика
}
