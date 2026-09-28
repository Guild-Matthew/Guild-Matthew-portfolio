import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Flashcard } from '../../models/flashcard.model';
import { StorageService } from '../../services/storage';
import { StudyService, LearnQuestion } from '../../services/study';

@Component({
  selector: 'app-learn',
  templateUrl: './learn.html',
  styleUrls: ['./learn.css'],
  standalone: false
})
export class LearnComponent implements OnInit {
  setId = '';

  /* Session queue & current question */
  queue: Flashcard[] = [];
  currentQuestion: LearnQuestion | null = null;

  /* Answer state */
  selectedOption: string | null = null;
  writtenAnswer = '';
  isAnswered = false;
  wasCorrect = false;

  /* Round stats */
  roundMastered = 0;
  roundCorrect = 0;
  roundIncorrect = 0;
  isComplete = false;

  /* Setup */
  startTime = 0;

  /* Confetti (used on celebration screen) */
  confettiPieces = Array.from({ length: 40 }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 1500,
    color: ['#6D5DFB', '#10B981', '#F59E0B', '#EF4444', '#0EA5E9', '#EC4899'][
      Math.floor(Math.random() * 6)
    ]
  }));

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private storage: StorageService,
    private study: StudyService
  ) {}

  ngOnInit(): void {
    this.setId = this.route.snapshot.paramMap.get('setId') || '';
    if (!this.setId) {
      this.router.navigate(['/']);
      return;
    }

    const set = this.storage.getSet(this.setId);
    if (!set || set.cards.length === 0) {
      alert('This set has no cards to study.');
      this.router.navigate(['/set', this.setId]);
      return;
    }

    this.queue = this.study.buildLearnQueue(set);
    this.startTime = Date.now();
    this.loadNextQuestion();
  }

  /* ------------------------------------------------------------------
     Question loading
     ------------------------------------------------------------------ */

  private loadNextQuestion(): void {
    // Skip any already-mastered cards that somehow ended up in the queue
    while (this.queue.length && this.queue[0].status === 'mastered') {
      this.queue.shift();
    }

    if (this.queue.length === 0) {
      this.finishSession();
      return;
    }

    const set = this.storage.getSet(this.setId);
    if (!set) {
      this.finishSession();
      return;
    }

    const card = this.queue.shift()!;
    this.currentQuestion = this.study.buildLearnQuestion(card, set);
    this.selectedOption = null;
    this.writtenAnswer = '';
    this.isAnswered = false;
    this.wasCorrect = false;
  }

  /* ------------------------------------------------------------------
     Answering
     ------------------------------------------------------------------ */

  selectOption(opt: string): void {
    if (this.isAnswered) return;
    this.selectedOption = opt;
  }

  submitMC(): void {
    if (this.isAnswered || !this.selectedOption || !this.currentQuestion) return;
    const correct = this.selectedOption === this.currentQuestion.correctAnswer;
    this.applyAnswer(correct);
  }

  submitWritten(): void {
    if (this.isAnswered || !this.currentQuestion) return;
    const correct = this.study.fuzzyMatch(
      this.writtenAnswer,
      this.currentQuestion.correctAnswer
    );
    this.applyAnswer(correct);
  }

  private applyAnswer(correct: boolean): void {
    if (!this.currentQuestion) return;
    const card = this.currentQuestion.card;
    this.isAnswered = true;
    this.wasCorrect = correct;

    // Update storage — this bumps counters and possibly sets status to 'mastered'
    this.storage.processReview(this.setId, card.id, correct);

    const updatedSet = this.storage.getSet(this.setId);
    const updatedCard = updatedSet?.cards.find(c => c.id === card.id);

    if (correct) {
      this.roundCorrect++;
      if (updatedCard?.status === 'mastered') {
        this.roundMastered++;
      } else if (updatedCard) {
        // Requeue further back so the user sees other cards first
        this.study.requeueCard(this.queue, updatedCard, true);
      }
    } else {
      this.roundIncorrect++;
      if (updatedCard) {
        // Requeue within the next 1–2 questions
        this.study.requeueCard(this.queue, updatedCard, false);
      }
    }
  }

  /** Called by the "Continue" button after feedback */
  next(): void {
    this.loadNextQuestion();
  }

  /* ------------------------------------------------------------------
     Session lifecycle
     ------------------------------------------------------------------ */

  private finishSession(): void {
    this.isComplete = true;
    this.currentQuestion = null;

    const duration = Math.round((Date.now() - this.startTime) / 1000);
    const totalAnswers = this.roundCorrect + this.roundIncorrect;
    const score = this.study.accuracyPercent(this.roundCorrect, totalAnswers);

    this.storage.recordSession(this.setId, 'learn', score, duration);
  }

  restart(): void {
    this.storage.resetProgress(this.setId);
    const set = this.storage.getSet(this.setId);
    this.queue = set ? this.study.buildLearnQueue(set) : [];
    this.roundMastered = 0;
    this.roundCorrect = 0;
    this.roundIncorrect = 0;
    this.isComplete = false;
    this.startTime = Date.now();
    this.loadNextQuestion();
  }

  goBack(): void {
    this.router.navigate(['/set', this.setId]);
  }

  /* ------------------------------------------------------------------
     Computed getters used by the template
     ------------------------------------------------------------------ */

  get answeredCount(): number {
    return this.roundCorrect + this.roundIncorrect;
  }

  get accuracy(): number {
    const t = this.answeredCount;
    return t === 0 ? 0 : Math.round((this.roundCorrect / t) * 100);
  }
}