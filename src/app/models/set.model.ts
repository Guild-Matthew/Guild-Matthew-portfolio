import { Flashcard } from './flashcard.model';

export interface StudySession {
  date: number;
  mode: 'learn' | 'test' | 'match';
  score: number;      // 0–100
  duration: number;   // seconds
}

export interface FlashcardSet {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  cards: Flashcard[];
  lastStudied?: number;
  studySessions: StudySession[];
}