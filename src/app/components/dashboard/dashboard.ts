import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FlashcardSet } from '../../models/set.model';
import { StorageService } from '../../services/storage';

interface GlobalStats {
  totalCards: number;
  totalMastered: number;
  totalSessions: number;
  streakDays: number;
  last7: { date: string; count: number }[];
  last30: { date: string; count: number }[];
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  standalone: false
})
export class DashboardComponent implements OnInit {
  sets: FlashcardSet[] = [];
  newSetName = '';
  selectionMode = false;
  selectedSets = new Set<string>();
  loading = true;

  globalStats: GlobalStats = {
    totalCards: 0,
    totalMastered: 0,
    totalSessions: 0,
    streakDays: 0,
    last7: [],
    last30: []
  };

  constructor(private storage: StorageService, private router: Router) {}

  ngOnInit(): void {
    this.loadSets();
    this.loading = false;
  }

  loadSets(): void {
    try {
      this.sets = this.storage.getAllSets() || [];
    } catch (e) {
      console.error('Failed to load sets:', e);
      this.sets = [];
    }
    this.globalStats = this.storage.getGlobalStats();
    this.selectedSets.clear();
  }

  /* ------------------------------------------------------------------
     Card-level helpers
     ------------------------------------------------------------------ */

  /** Percentage of cards in a set that are 'mastered' (0–100). */
  getProgressPercent(set: FlashcardSet): number {
    if (!set.cards || set.cards.length === 0) return 0;
    const mastered = set.cards.filter(c => c.status === 'mastered').length;
    return Math.round((mastered / set.cards.length) * 100);
  }

  /** Breakdown of card statuses for a set. */
  getSetStatusSummary(set: FlashcardSet): {
    newCount: number;
    learning: number;
    mastered: number;
  } {
    let n = 0, l = 0, m = 0;
    for (const c of set.cards) {
      if (c.status === 'mastered') m++;
      else if (c.status === 'learning') l++;
      else n++;
    }
    return { newCount: n, learning: l, mastered: m };
  }

  /** Deterministic gradient index (0–5) for a set's visual identity. */
  getSetGradientIndex(set: FlashcardSet): number {
    let h = 0;
    for (let i = 0; i < set.id.length; i++) {
      h = (h * 31 + set.id.charCodeAt(i)) >>> 0;
    }
    return h % 6;
  }

  /** First letter / initials for the set avatar. */
  getSetInitials(set: FlashcardSet): string {
    const words = set.name.trim().split(/\s+/).slice(0, 2);
    return words.map(w => w[0]?.toUpperCase() ?? '').join('') || '?';
  }

  /* ------------------------------------------------------------------
     Navigation
     ------------------------------------------------------------------ */

  createSet(): void {
    if (this.newSetName.trim()) {
      this.router.navigate(['/create-set'], {
        queryParams: { title: this.newSetName.trim() }
      });
    } else {
      this.router.navigate(['/create-set']);
    }
  }

  openSet(id: string): void {
    this.router.navigate(['/set', id]);
  }

  /* ------------------------------------------------------------------
     Selection mode
     ------------------------------------------------------------------ */

  toggleSelectionMode(): void {
    this.selectionMode = !this.selectionMode;
    if (!this.selectionMode) this.selectedSets.clear();
  }

  toggleSetSelection(id: string, event: any): void {
    if (event.target.checked) this.selectedSets.add(id);
    else this.selectedSets.delete(id);
  }

  deleteSelected(): void {
    if (this.selectedSets.size === 0) return;
    const count = this.selectedSets.size;
    if (confirm(`Delete ${count} set${count > 1 ? 's' : ''} and all their cards?`)) {
      for (const id of this.selectedSets) this.storage.deleteSet(id);
      this.loadSets();
      this.selectionMode = false;
      this.selectedSets.clear();
    }
  }

  /* ------------------------------------------------------------------
     Global stats chart helpers
     ------------------------------------------------------------------ */

  /** Max session count in the last 7 days (used for bar-chart scaling). */
  get maxLast7Count(): number {
    return Math.max(1, ...this.globalStats.last7.map(d => d.count));
  }

  /** Bar height as a percentage (0–100) for the last-7-days chart. */
  barHeightPercent(count: number): number {
    return Math.round((count / this.maxLast7Count) * 100);
  }

  /** Short weekday label (Mon, Tue, …) for a date string. */
  weekdayLabel(dateStr: string): string {
    const d = new Date(dateStr);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  }
}