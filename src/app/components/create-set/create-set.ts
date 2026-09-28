import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from '../../services/storage';

@Component({
  selector: 'app-create-set',
  templateUrl: './create-set.html',
  styleUrls: ['./create-set.css'],
  standalone: false
})
export class CreateSetComponent {
  title: string = '';
  description: string = '';
  isSubmitting: boolean = false;

  constructor(
    private storage: StorageService,
    private router: Router
  ) {}

  createSet(): void {
    if (!this.title.trim()) {
      alert('Please enter a title for your set.');
      return;
    }

    this.isSubmitting = true;
    const newSet = this.storage.addSet(this.title.trim(), this.description.trim());
    this.isSubmitting = false;
    
    // Navigate to the newly created set
    this.router.navigate(['/set', newSet.id]);
  }

  cancel(): void {
    this.router.navigate(['/']);
  }
}