import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Flashcard } from '../../models/flashcard.model';
import { StorageService } from '../../services/storage';

interface Tile {
  id: string;
  pairId: string;
  text: string;
  isFront: boolean;
  matched: boolean;
}

@Component({
  selector: 'app-match',
  templateUrl: './match.html',          // <-- no .component
  styleUrls: ['./match.css'],           // <-- no .component
  standalone: false
})
export class MatchComponent implements OnInit, OnDestroy {
  tiles: Tile[] = [];
  selectedTile: Tile | null = null;
  pairsMatched = 0;
  totalPairs = 0;
  timerSeconds = 0;
  timerInterval: any = null;
  isGameOver = false;
  isError = false;
  errorTimeout: any = null;
  private setId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storage: StorageService
  ) {}

  ngOnInit(): void {
    this.setId = this.route.snapshot.paramMap.get('setId') || '';
    if (!this.setId) {
      this.router.navigate(['/']);
      return;
    }

    const cards = this.storage.getCards(this.setId);
    if (cards.length === 0) {
      alert('This set has no cards. Add some first!');
      this.router.navigate(['/set', this.setId]);
      return;
    }

    const shuffledCards = this.shuffleArray([...cards]);
    const selectedCards = shuffledCards.slice(0, 6);

    const tiles: Tile[] = [];
    for (const card of selectedCards) {
      tiles.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
        pairId: card.id,
        text: card.front,
        isFront: true,
        matched: false
      });
      tiles.push({
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
        pairId: card.id,
        text: card.back,
        isFront: false,
        matched: false
      });
    }
    this.tiles = this.shuffleArray(tiles);
    this.totalPairs = selectedCards.length;

    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.timerInterval) clearInterval(this.timerInterval);
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
  }

  private shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  onTileClick(tile: Tile): void {
    if (this.isGameOver) return;
    if (tile.matched) return;
    if (this.isError) return;
    if (this.selectedTile && this.selectedTile.id === tile.id) return;

    if (!this.selectedTile) {
      this.selectedTile = tile;
      return;
    }

    const first = this.selectedTile;
    const second = tile;

    if (first.isFront === second.isFront) {
      this.selectedTile = null;
      return;
    }

    if (first.pairId === second.pairId) {
      first.matched = true;
      second.matched = true;
      this.pairsMatched++;
      this.selectedTile = null;

      if (this.pairsMatched === this.totalPairs) {
        this.isGameOver = true;
        clearInterval(this.timerInterval);
      }
    } else {
      this.isError = true;
      this.timerSeconds += 2;
      this.errorTimeout = setTimeout(() => {
        this.isError = false;
        this.selectedTile = null;
      }, 800);
    }
  }

  getTimeString(): string {
    const mins = Math.floor(this.timerSeconds / 60);
    const secs = this.timerSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  resetGame(): void {
    clearInterval(this.timerInterval);
    this.timerSeconds = 0;
    this.timerInterval = setInterval(() => this.timerSeconds++, 1000);

    this.tiles.forEach(t => t.matched = false);
    this.tiles = this.shuffleArray(this.tiles);
    this.pairsMatched = 0;
    this.isGameOver = false;
    this.selectedTile = null;
    this.isError = false;
    if (this.errorTimeout) clearTimeout(this.errorTimeout);
  }

  exitMatch(): void {
    this.router.navigate(['/set', this.setId]);
  }
}