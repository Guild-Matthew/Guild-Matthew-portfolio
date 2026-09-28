import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Flashcard } from '../../models/flashcard.model';
import { StorageService } from '../../services/storage';

@Component({
  selector: 'app-edit-card',
  templateUrl: './edit-card.html',
  styleUrls: ['./edit-card.css'],
  standalone: false
})
export class EditCardComponent implements OnInit {
  card: Flashcard = this.blankCard();
  setId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storage: StorageService
  ) {}

  ngOnInit(): void {
    this.setId = this.route.snapshot.paramMap.get('setId') || '';
    const cardId = this.route.snapshot.paramMap.get('cardId');
    if (!this.setId || !cardId) {
      this.router.navigate(['/']);
      return;
    }
    const set = this.storage.getSet(this.setId);
    if (set) {
      const found = set.cards.find(c => c.id === cardId);
      if (found) this.card = { ...found };
      else this.router.navigate(['/set', this.setId]);
    } else {
      this.router.navigate(['/']);
    }
  }

  save(): void {
    if (this.card.front && this.card.back) {
      this.storage.updateCardInSet(this.setId, this.card);
      this.router.navigate(['/set', this.setId]);
    }
  }

  cancel(): void {
    this.router.navigate(['/set', this.setId]);
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