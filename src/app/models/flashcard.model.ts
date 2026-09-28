export type CardStatus = 'new' | 'learning' | 'mastered';

export interface Flashcard {
  id: string;
  front: string;
  back: string;

  /* Study tracking */
  status: CardStatus;
  timesCorrect: number;
  timesIncorrect: number;
  consecutiveCorrect: number;
  easeFactor: number;
  lastReviewed?: number;

  /* History (last 5 attempts, most recent first) */
  history?: boolean[];
}