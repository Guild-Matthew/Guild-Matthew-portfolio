import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from '../../services/storage';

@Component({
  selector: 'app-test-setup',
  templateUrl: './test-setup.html',        // <-- no .component
  styleUrls: ['./test-setup.css'],         // <-- no .component
  standalone: false
})
export class TestSetupComponent implements OnInit {
  setId: string = '';
  questionCount = 10;
  timerMinutes = 20;
  includeTF = true;
  includeMC = true;
  includeWritten = true;
  includeMatch = true;
  maxCards = 0;

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
    this.maxCards = cards.length;
    this.questionCount = Math.min(20, this.maxCards || 10);
  }

  startTest(): void {
    if (this.maxCards === 0) {
      alert('This set has no cards. Add some first!');
      return;
    }
    const selectedTypes: string[] = [];
    if (this.includeTF) selectedTypes.push('tf');
    if (this.includeMC) selectedTypes.push('mc');
    if (this.includeWritten) selectedTypes.push('written');
    if (this.includeMatch) selectedTypes.push('match');

    if (selectedTypes.length === 0) {
      alert('Please select at least one question type.');
      return;
    }

    const count = Math.min(this.questionCount, this.maxCards);
    this.router.navigate(['/test', this.setId], {
      queryParams: {
        count,
        timer: this.timerMinutes,
        types: selectedTypes.join(',')
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/set', this.setId]);
  }
}