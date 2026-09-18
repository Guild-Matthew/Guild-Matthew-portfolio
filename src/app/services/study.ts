import { Injectable } from '@angular/core';
import { Flashcard } from '../models/flashcard.model';
import { FlashcardSet } from '../models/set.model';

export interface MCQ {
  card: Flashcard;
  options: string[];
  correctAnswer: string;
}

export interface LearnQuestion {
  card: Flashcard;
  type: 'mc' | 'written';
  options?: string[];
  correctAnswer: string;
}

export interface TFQuestion {
  card: Flashcard;
  statement: string;
  correct: boolean;
  shownBack: string;
}

@Injectable({ providedIn: 'root' })
export class StudyService {

  /* --------------------------------------------------------------------
     Utilities
     -------------------------------------------------------------------- */

  /** Fisher–Yates shuffle (returns a new array). */
  shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Normalize text: lowercase, trim, collapse spaces, strip punctuation. */
  normalize(s: string): string {
    return s
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[.,;:!?'"()\-–—]/g, '');
  }

  /** Levenshtein edit distance — iterative DP with two rows. */
  levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const prev = new Array(b.length + 1);
    const curr = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;

    for (let i = 1; i <= a.length; i++) {
      curr[0] = i;
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        curr[j] = Math.min(
          curr[j - 1] + 1,
          prev[j] + 1,
          prev[j - 1] + cost
        );
      }
      for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
    }
    return prev[b.length];
  }

  /**
   * Fuzzy answer matching.
   *   - case-insensitive
   *   - whitespace-insensitive
   *   - punctuation-insensitive
   *   - tolerant of small typos only for reasonably long answers:
   *       ≤ 6 chars  → must match exactly (after normalization)
   *       7–8 chars  → allow 1 typo
   *       9+ chars   → allow up to 3 typos (or 15% of length)
   */
  fuzzyMatch(userAnswer: string, correctAnswer: string): boolean {
    const u = this.normalize(userAnswer);
    const c = this.normalize(correctAnswer);
    if (!u || !c) return false;
    if (u === c) return true;

    const len = c.length;

    // Short answers must be exact
    if (len <= 6) return false;

    const maxDist = len <= 8 ? 1 : Math.min(3, Math.floor(len * 0.15));
    return this.levenshtein(u, c) <= maxDist;
  }

  /* --------------------------------------------------------------------
     Distractors
     -------------------------------------------------------------------- */

  /** Pick up to N distractor definitions from other cards in the set.
   *  Avoids near-duplicates of the correct answer and each other. */
  generateDistractors(correct: Flashcard, set: FlashcardSet, count = 3): string[] {
    const pool = set.cards
      .filter(c => c.id !== correct.id)
      .map(c => c.back)
      .filter(text => this.normalize(text) !== this.normalize(correct.back));

    const deduped: string[] = [];
    for (const d of pool) {
      if (!deduped.some(existing => this.normalize(existing) === this.normalize(d))) {
        deduped.push(d);
      }
    }

    return this.shuffle(deduped).slice(0, count);
  }

  /* --------------------------------------------------------------------
     Learn mode
     -------------------------------------------------------------------- */

  /** Decide question type based on the card's progress. */
  learnQuestionType(card: Flashcard): 'mc' | 'written' {
    return card.consecutiveCorrect >= 2 ? 'written' : 'mc';
  }

  buildLearnQuestion(card: Flashcard, set: FlashcardSet): LearnQuestion {
    const type = this.learnQuestionType(card);
    if (type === 'mc') {
      const distractors = this.generateDistractors(card, set, 3);
      while (distractors.length < 3) {
        distractors.push(`— ${Math.random().toString(36).slice(2, 6)} —`);
      }
      const options = this.shuffle([card.back, ...distractors]);
      return { card, type: 'mc', options, correctAnswer: card.back };
    }
    return { card, type: 'written', correctAnswer: card.back };
  }

  /** Build the initial Learn queue: unmastered cards, weakest first. */
  buildLearnQueue(set: FlashcardSet, includeMastered = false): Flashcard[] {
    const cards = includeMastered
      ? [...set.cards]
      : set.cards.filter(c => c.status !== 'mastered');

    return cards.sort((a, b) => a.consecutiveCorrect - b.consecutiveCorrect);
  }

  /** Insert a card back into the queue.
   *  - Correct (not yet mastered): requeue ~3 positions later
   *  - Incorrect: requeue within the next 1–2 questions */
  requeueCard(queue: Flashcard[], card: Flashcard, wasCorrect: boolean): void {
    const insertAt = wasCorrect
      ? Math.min(3, queue.length)
      : Math.min(1, queue.length);
    queue.splice(insertAt, 0, card);
  }

  /* --------------------------------------------------------------------
     Test mode
     -------------------------------------------------------------------- */

  /** Multiple choice: 1 correct + up to 3 distractors, shuffled. */
  buildMCQ(card: Flashcard, set: FlashcardSet): MCQ {
    const distractors = this.generateDistractors(card, set, 3);
    while (distractors.length < 3) {
      distractors.push(`— ${Math.random().toString(36).slice(2, 6)} —`);
    }
    return {
      card,
      options: this.shuffle([card.back, ...distractors]),
      correctAnswer: card.back
    };
  }

  /** True/false: 50% real pair, 50% mismatched pair. */
  buildTFQuestion(card: Flashcard, set: FlashcardSet): TFQuestion {
    const others = set.cards.filter(c => c.id !== card.id && c.back !== card.back);
    const showCorrect = Math.random() < 0.5 || others.length === 0;
    const shownBack = showCorrect
      ? card.back
      : others[Math.floor(Math.random() * others.length)].back;
    return {
      card,
      statement: `The definition of "${card.front}" is "${shownBack}".`,
      correct: showCorrect,
      shownBack
    };
  }

  /* --------------------------------------------------------------------
     Accuracy
     -------------------------------------------------------------------- */

  accuracyPercent(correct: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }
}