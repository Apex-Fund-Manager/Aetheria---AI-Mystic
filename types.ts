export type AppView = 'home' | 'tarot' | 'dream' | 'astral' | 'profile' | 'store';

export type LegalMode = 'terms' | 'privacy' | 'support' | null;

export interface UserState {
  credits: number;
  streak: number;
  lastDailyBonus: string | null; // ISO date string
  history: ReadingHistory[];
  soundEnabled: boolean;
  hapticEnabled: boolean;
  hasSeenTutorial: boolean;
}

export interface TarotCard {
  name: string;
  position: 'Past' | 'Present' | 'Future';
  meaning: string;
  visualCue: string; // Description for a placeholder image
}

export interface TarotResult {
  cards: TarotCard[];
  summary: string;
}

export interface DreamResult {
  interpretation: string;
  themes: string[];
  psychologicalNote: string;
  luckyNumbers: number[];
}

export interface AstralResult {
  guidance: string;
  technique: string;
  safetyTip: string;
  plane: string; // e.g., "Etheric Plane", "Astral Plane", "Mental Plane"
}

export interface ReadingHistory {
  id: string;
  date: string;
  type: 'tarot' | 'dream' | 'astral';
  summary: string;
}

export interface ServiceResponse<T> {
  data?: T;
  error?: string;
}