import { Injectable } from '@angular/core';
import { FlashcardSet, StudySession } from '../models/set.model';
import { Flashcard, CardStatus } from '../models/flashcard.model';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private key = 'flashcardSets';

  /* --------------------------------------------------------------------
     Sets
     -------------------------------------------------------------------- */

  getAllSets(): FlashcardSet[] {
    const data = localStorage.getItem(this.key);
    if (!data) return [];
    try {
      const sets: FlashcardSet[] = JSON.parse(data);
      // Backfill new fields for sets created with older schema
      return sets.map(s => ({
        ...s,
        studySessions: s.studySessions ?? [],
        lastStudied: s.lastStudied,
        cards: (s.cards || []).map(c => this.ensureCardShape(c))
      }));
    } catch {
      return [];
    }
  }

  saveSets(sets: FlashcardSet[]): void {
    localStorage.setItem(this.key, JSON.stringify(sets));
  }

  getSet(id: string): FlashcardSet | undefined {
    return this.getAllSets().find(s => s.id === id);
  }

  addSet(name: string, description?: string): FlashcardSet {
    const sets = this.getAllSets();
    const newSet: FlashcardSet = {
      id: this.uid(),
      name,
      description: description || '',
      createdAt: Date.now(),
      cards: [],
      studySessions: []
    };
    sets.push(newSet);
    this.saveSets(sets);
    return newSet;
  }

  updateSet(updated: FlashcardSet): void {
    const sets = this.getAllSets().map(s => s.id === updated.id ? updated : s);
    this.saveSets(sets);
  }

  deleteSet(id: string): void {
    this.saveSets(this.getAllSets().filter(s => s.id !== id));
  }

  /* --------------------------------------------------------------------
     Cards
     -------------------------------------------------------------------- */

  addCardToSet(setId: string, card: Partial<Flashcard>): void {
    const set = this.getSet(setId);
    if (!set) return;
    const fresh = this.ensureCardShape({
      id: this.uid(),
      front: card.front ?? '',
      back: card.back ?? ''
    });
    set.cards.push(fresh);
    this.updateSet(set);
  }

  addCardsToSet(setId: string, cards: Partial<Flashcard>[]): void {
    const set = this.getSet(setId);
    if (!set || !cards.length) return;
    for (const c of cards) {
      set.cards.push(this.ensureCardShape({
        id: this.uid(),
        front: c.front ?? '',
        back: c.back ?? ''
      }));
    }
    this.updateSet(set);
  }

  updateCardInSet(setId: string, updated: Flashcard): void {
    const set = this.getSet(setId);
    if (!set) return;
    set.cards = set.cards.map(c => c.id === updated.id ? this.ensureCardShape(updated) : c);
    this.updateSet(set);
  }

  deleteCardFromSet(setId: string, cardId: string): void {
    const set = this.getSet(setId);
    if (!set) return;
    set.cards = set.cards.filter(c => c.id !== cardId);
    this.updateSet(set);
  }

  deleteCardsFromSet(setId: string, cardIds: string[]): void {
    const set = this.getSet(setId);
    if (!set) return;
    set.cards = set.cards.filter(c => !cardIds.includes(c.id));
    this.updateSet(set);
  }

  getCards(setId: string): Flashcard[] {
    return this.getSet(setId)?.cards ?? [];
  }

  /* --------------------------------------------------------------------
     Learn-mode helpers
     -------------------------------------------------------------------- */

  isComplete(setId: string): boolean {
    const set = this.getSet(setId);
    if (!set || set.cards.length === 0) return false;
    return set.cards.every(c => c.status === 'mastered');
  }

  /** A weight that increases with mastery; used by Learn to pick cards. */
  getNextLearnCard(setId: string): Flashcard | null {
    const set = this.getSet(setId);
    if (!set) return null;
    const active = set.cards.filter(c => c.status !== 'mastered');
    if (!active.length) return null;
    // Prefer cards with fewer consecutiveCorrect
    active.sort((a, b) => {
      if (a.consecutiveCorrect !== b.consecutiveCorrect) {
        return a.consecutiveCorrect - b.consecutiveCorrect;
      }
      return (a.lastReviewed ?? 0) - (b.lastReviewed ?? 0);
    });
    return active[0];
  }

  /** Update a card after a Learn-mode answer. */
  processReview(setId: string, cardId: string, isCorrect: boolean): void {
    const set = this.getSet(setId);
    if (!set) return;
    const card = set.cards.find(c => c.id === cardId);
    if (!card) return;

    card.lastReviewed = Date.now();
    const history = card.history ?? [];
    history.unshift(isCorrect);
    card.history = history.slice(0, 5);

    if (isCorrect) {
      card.consecutiveCorrect += 1;
      card.timesCorrect += 1;
      card.easeFactor = Math.min(3.0, card.easeFactor + 0.1);
      if (card.consecutiveCorrect >= 4) {
        card.status = 'mastered';
      } else if (card.consecutiveCorrect >= 1) {
        card.status = 'learning';
      }
    } else {
      card.consecutiveCorrect = 0;
      card.timesIncorrect += 1;
      card.easeFactor = Math.max(1.3, card.easeFactor - 0.2);
      card.status = 'learning';
    }

    this.updateSet(set);
  }

  /** Record a completed study session and update lastStudied. */
  recordSession(setId: string, mode: StudySession['mode'], score: number, duration: number): void {
    const set = this.getSet(setId);
    if (!set) return;
    set.studySessions.push({ date: Date.now(), mode, score, duration });
    set.lastStudied = Date.now();
    this.updateSet(set);
  }

  /* --------------------------------------------------------------------
     Progress / stats
     -------------------------------------------------------------------- */

  getProgress(setId: string): {
    total: number;
    mastered: number;
    learning: number;
    new: number;
    percentComplete: number;
  } {
    const set = this.getSet(setId);
    if (!set) return { total: 0, mastered: 0, learning: 0, new: 0, percentComplete: 0 };

    let mastered = 0, learning = 0, fresh = 0;
    for (const c of set.cards) {
      if (c.status === 'mastered') mastered++;
      else if (c.status === 'learning') learning++;
      else fresh++;
    }
    const total = set.cards.length;
    return {
      total,
      mastered,
      learning,
      new: fresh,
      percentComplete: total ? Math.round((mastered / total) * 100) : 0
    };
  }

  /** Aggregate stats across every set. */
  getGlobalStats(): {
    totalCards: number;
    totalMastered: number;
    totalSessions: number;
    streakDays: number;
    last7: { date: string; count: number }[];
    last30: { date: string; count: number }[];
  } {
    const sets = this.getAllSets();
    const totalCards = sets.reduce((s, x) => s + x.cards.length, 0);
    const totalMastered = sets.reduce(
      (s, x) => s + x.cards.filter(c => c.status === 'mastered').length, 0
    );
    const allSessions = sets.flatMap(s => s.studySessions);
    const totalSessions = allSessions.length;

    // Sessions per day
    const dayKey = (t: number) => new Date(t).toISOString().slice(0, 10);
    const byDay = new Map<string, number>();
    for (const s of allSessions) {
      const k = dayKey(s.date);
      byDay.set(k, (byDay.get(k) ?? 0) + 1);
    }

    const today = new Date();
    const last7: { date: string; count: number }[] = [];
    const last30: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = dayKey(d.getTime());
      const entry = { date: k, count: byDay.get(k) ?? 0 };
      last30.push(entry);
      if (i < 7) last7.push(entry);
    }

    // Streak: consecutive days ending today (or yesterday)
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const k = dayKey(d.getTime());
      if ((byDay.get(k) ?? 0) > 0) streak++;
      else if (i > 0) break;
    }

    return { totalCards, totalMastered, totalSessions, streakDays: streak, last7, last30 };
  }

  resetProgress(setId: string): void {
    const set = this.getSet(setId);
    if (!set) return;
    for (const c of set.cards) {
      c.status = 'new';
      c.timesCorrect = 0;
      c.timesIncorrect = 0;
      c.consecutiveCorrect = 0;
      c.easeFactor = 2.5;
      c.lastReviewed = undefined;
      c.history = [];
    }
    this.updateSet(set);
  }

  /* --------------------------------------------------------------------
     Private helpers
     -------------------------------------------------------------------- */

  private uid(): string {
    return (crypto as any).randomUUID?.() ?? Date.now().toString() + Math.random().toString(36).slice(2, 8);
  }

  /** Ensure a card has all the required new fields (backward-compatible). */
  private ensureCardShape(c: Partial<Flashcard>): Flashcard {
    return {
      id: c.id ?? this.uid(),
      front: c.front ?? '',
      back: c.back ?? '',
      status: (c.status as CardStatus) ?? 'new',
      timesCorrect: c.timesCorrect ?? 0,
      timesIncorrect: c.timesIncorrect ?? 0,
      consecutiveCorrect: c.consecutiveCorrect ?? 0,
      easeFactor: c.easeFactor ?? 2.5,
      lastReviewed: c.lastReviewed,
      history: c.history ?? []
    };
  }
}