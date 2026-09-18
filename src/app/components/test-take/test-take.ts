import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Flashcard } from '../../models/flashcard.model';
import { StorageService } from '../../services/storage';

type QuestionType = 'tf' | 'mc' | 'written' | 'match';

interface Question {
  type: QuestionType;
  card: Flashcard;
  userAnswer?: string | boolean | string[];
  isCorrect?: boolean;
  options?: string[];
  matchPairs?: { term: string; definition: string; userMatch?: string }[];
  statement?: string;
  correctAnswer?: string;
}

@Component({
  selector: 'app-test-take',
  templateUrl: './test-take.html',
  styleUrls: ['./test-take.css'],
  standalone: false
})
export class TestTakeComponent implements OnInit {
  questions: Question[] = [];
  isGraded = false;
  score = 0;
  total = 0;
  timerSeconds = 0;
  timerInterval: any = null;
  timerEnabled = true;
  timeLimit = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storage: StorageService
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    const setId = params.get('setId');
    const query = this.route.snapshot.queryParams;
    const count = +query['count'] || 10;
    const timer = +query['timer'] || 0;
    const typesParam = (query['types'] as string) || '';
    const types = typesParam.split(',').filter(Boolean) as string[];

    const validTypes = types.filter(t =>
      ['tf', 'mc', 'written', 'match'].includes(t)
    ) as QuestionType[];

    if (!setId) {
      this.router.navigate(['/']);
      return;
    }

    const allCards = this.storage.getCards(setId);
    if (allCards.length === 0) {
      this.router.navigate(['/set', setId]);
      return;
    }

    this.timeLimit = timer;
    this.timerEnabled = timer > 0;

    const shuffled = this.shuffleArray([...allCards]);
    const selected = shuffled.slice(0, Math.min(count, shuffled.length));

    const availableTypes: QuestionType[] = validTypes.length > 0
      ? validTypes
      : ['mc', 'written', 'tf', 'match'];

    this.questions = selected.map((card, index) => {
      const type = availableTypes[index % availableTypes.length];
      return this.createQuestion(card, type, allCards);
    });

    this.total = this.questions.length;

    if (this.timerEnabled) {
      this.timerInterval = setInterval(() => {
        this.timerSeconds++;
        if (this.timeLimit > 0 && this.timerSeconds >= this.timeLimit * 60) {
          this.submitTest();
        }
      }, 1000);
    }
  }

  getLetter(index: number): string {
    return String.fromCharCode(97 + index);
  }

  private shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private createQuestion(card: Flashcard, type: QuestionType, allCards: Flashcard[]): Question {
    const q: Question = { type, card };

    if (type === 'tf') {
      const otherCards = allCards.filter(c => c.id !== card.id);
      const shuffledOthers = this.shuffleArray(otherCards);
      const distractor = shuffledOthers.length > 0 ? shuffledOthers[0].back : 'wrong';
      const useTrue = Math.random() > 0.5;
      const backToShow = useTrue ? card.back : distractor;
      q.statement = `The definition of "${card.front}" is "${backToShow}".`;
      q.userAnswer = '';
      q.correctAnswer = useTrue ? 'true' : 'false';
      q.card = { ...card, back: backToShow };
    } else if (type === 'mc') {
      const distractors = allCards
        .filter(c => c.id !== card.id && c.back !== card.back)
        .map(c => c.back);
      const shuffledDistractors = this.shuffleArray(distractors);
      const options = [card.back, ...shuffledDistractors.slice(0, 3)];
      q.options = this.shuffleArray(options);
      q.userAnswer = '';
    } else if (type === 'written') {
      q.userAnswer = '';
    } else if (type === 'match') {
      const otherCards = allCards.filter(c => c.id !== card.id);
      const shuffledOthers = this.shuffleArray(otherCards);
      const selectedOthers = shuffledOthers.slice(0, 3);
      const pairs = [
        { term: card.front, definition: card.back },
        ...selectedOthers.map(c => ({ term: c.front, definition: c.back }))
      ];
      const shuffledPairs = this.shuffleArray(pairs);
      q.matchPairs = shuffledPairs.map(p => ({
        term: p.term,
        definition: p.definition,
        userMatch: ''
      }));
    }
    return q;
  }

  getTimeString(): string {
    const mins = Math.floor(this.timerSeconds / 60);
    const secs = this.timerSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  onMCChange(q: Question, option: string): void {
    q.userAnswer = option;
  }

  onWrittenChange(q: Question, value: string): void {
    q.userAnswer = value;
  }

  onTFChange(q: Question, value: boolean): void {
    q.userAnswer = value ? 'true' : 'false';
  }

  submitTest(): void {
    if (this.isGraded) return;
    if (this.timerInterval) clearInterval(this.timerInterval);

    let correct = 0;
    for (const q of this.questions) {
      let isCorrect = false;
      if (q.type === 'tf') {
        isCorrect = (q.userAnswer === q.correctAnswer);
      } else if (q.type === 'mc') {
        isCorrect = (q.userAnswer === q.card.back);
      } else if (q.type === 'written') {
        isCorrect = (q.userAnswer?.toString().trim().toLowerCase() === q.card.back.trim().toLowerCase());
      } else if (q.type === 'match') {
        if (q.matchPairs) {
          let allMatched = true;
          for (const pair of q.matchPairs) {
            if (pair.userMatch !== pair.definition) {
              allMatched = false;
              break;
            }
          }
          isCorrect = allMatched;
        }
      }
      q.isCorrect = isCorrect;
      if (isCorrect) correct++;
    }
    this.score = correct;
    this.isGraded = true;
  }

  restart(): void {
    this.router.navigate(['/test-setup', this.route.snapshot.paramMap.get('setId')]);
  }

  goBack(): void {
    this.router.navigate(['/set', this.route.snapshot.paramMap.get('setId')]);
  }
}