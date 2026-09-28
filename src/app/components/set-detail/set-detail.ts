import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FlashcardSet } from '../../models/set.model';
import { Flashcard } from '../../models/flashcard.model';
import { StorageService } from '../../services/storage';
import { ParserService } from '../../services/parser';

@Component({
  selector: 'app-set-detail',
  templateUrl: './set-detail.html',
  styleUrls: ['./set-detail.css'],
  standalone: false
})
export class SetDetailComponent implements OnInit {
  set: FlashcardSet | null = null;
  newCard: Flashcard = this.blankCard();
  bulkFile: File | null = null;
  bulkDelimiter = 'auto';
  bulkCount = 0;
  isUploading = false;

  /* Selection mode */
  selectionMode = false;
  selectedCards = new Set<string>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storage: StorageService,
    private parser: ParserService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.set = this.storage.getSet(id) || null;
      if (!this.set) this.router.navigate(['/']);
    }
  }

  /* ------------------------------------------------------------------
     Add single card
     ------------------------------------------------------------------ */

  addCard(): void {
    if (!this.set) return;
    if (this.newCard.front && this.newCard.back) {
      this.storage.addCardToSet(this.set.id, {
        front: this.newCard.front,
        back: this.newCard.back
      });
      this.newCard = this.blankCard();
      this.set = this.storage.getSet(this.set.id) || null;
    }
  }

  /* ------------------------------------------------------------------
     Bulk upload
     ------------------------------------------------------------------ */

  onFileSelected(event: any): void {
    this.bulkFile = event.target.files[0];
  }

  async uploadBulk(): Promise<void> {
    if (!this.bulkFile || !this.set) {
      alert('Please select a file first.');
      return;
    }

    this.isUploading = true;
    try {
      const text = await this.parser.parseFile(this.bulkFile);
      const delimiter = this.bulkDelimiter === 'auto' ? undefined : this.bulkDelimiter;
      const pairs = this.parser.extractPairs(text, delimiter);
      const count = this.bulkCount > 0 ? Math.min(this.bulkCount, pairs.length) : pairs.length;

      if (count === 0) {
        alert('No valid front/back pairs found.\n\n' +
              'Make sure your file uses one of these formats:\n' +
              '• A - B    (dash with spaces)\n' +
              '• A\tB     (tab)\n' +
              '• A,B      (comma)\n' +
              '• A;B      (semicolon)\n' +
              '• A|B      (pipe)\n' +
              '• A: B     (colon+space)');
        return;
      }

      const cardsToAdd = pairs.slice(0, count).map(([front, back]) => ({
        front: front.trim(),
        back: back.trim()
      }));
      this.storage.addCardsToSet(this.set.id, cardsToAdd);

      this.set = this.storage.getSet(this.set.id) || null;
      this.bulkFile = null;
      this.bulkCount = 0;
      alert(`✅ Successfully added ${cardsToAdd.length} cards!`);
    } catch (err) {
      console.error(err);
      alert('Failed to parse file. Check the file format and try again.');
    } finally {
      this.isUploading = false;
    }
  }

  /* ------------------------------------------------------------------
     Edit / Delete cards
     ------------------------------------------------------------------ */

  editCard(card: Flashcard): void {
    this.router.navigate(['/edit', this.set?.id, card.id]);
  }

  deleteCard(cardId: string): void {
    if (!this.set) return;
    if (confirm('Delete this card?')) {
      this.storage.deleteCardFromSet(this.set.id, cardId);
      this.set = this.storage.getSet(this.set.id) || null;
    }
  }

  /* ------------------------------------------------------------------
     Selection mode
     ------------------------------------------------------------------ */

  toggleSelectionMode(): void {
    this.selectionMode = !this.selectionMode;
    if (!this.selectionMode) this.selectedCards.clear();
  }

  toggleCardSelection(cardId: string, event: any): void {
    if (event.target.checked) this.selectedCards.add(cardId);
    else this.selectedCards.delete(cardId);
  }

  toggleSelectAll(event: any): void {
    if (!this.set) return;
    if (event.target.checked) this.set.cards.forEach(c => this.selectedCards.add(c.id));
    else this.selectedCards.clear();
  }

  deleteSelected(): void {
    if (!this.set || this.selectedCards.size === 0) return;
    const count = this.selectedCards.size;
    if (confirm(`Delete ${count} selected card${count > 1 ? 's' : ''}?`)) {
      const cardIds = Array.from(this.selectedCards);
      this.storage.deleteCardsFromSet(this.set.id, cardIds);
      this.set = this.storage.getSet(this.set.id) || null;
      this.selectedCards.clear();
      this.selectionMode = false;
    }
  }

  /* ------------------------------------------------------------------
     Navigation
     ------------------------------------------------------------------ */

  goHome(): void {
    this.router.navigate(['/']);
  }

  goLearn(): void {
    if (this.set) this.router.navigate(['/learn', this.set.id]);
  }

  goMatch(): void {
    if (this.set) this.router.navigate(['/match', this.set.id]);
  }

  goTest(): void {
    if (this.set) this.router.navigate(['/test-setup', this.set.id]);
  }

  /* ------------------------------------------------------------------
     Template helpers
     ------------------------------------------------------------------ */

  /** Used by *ngFor trackBy to identify each card uniquely. */
  trackByCardId(_index: number, card: Flashcard): string {
    return card.id;
  }

  private blankCard(): Flashcard {
    return {
      id: '',
      front: '',
      back: '',
      status: 'new',
      timesCorrect: 0,
      timesIncorrect: 0,
      consecutiveCorrect: 0,
      easeFactor: 2.5,
      history: []
    };
  }
}