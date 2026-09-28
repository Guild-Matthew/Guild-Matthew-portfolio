import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ProjectStore } from '../../core/state/project.store';

@Component({
  selector: 'app-project-bar',
  standalone: true,
  imports: [DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex items-center gap-3 px-4 py-2 bg-neutral-950 border-b border-neutral-800 text-sm"
    >
      <div class="flex items-center gap-2">
        <span class="text-neutral-500">Project</span>
        @if (editingName()) {
          <input
            #nameInput
            type="text"
            [value]="store.currentProjectName()"
            (blur)="commitName($event)"
            (keydown.enter)="commitName($event)"
            (keydown.escape)="cancelEdit()"
            class="bg-neutral-800 border border-emerald-600 rounded px-2 py-0.5 text-neutral-100 w-56 focus:outline-none"
          />
        } @else {
          <button
            type="button"
            (dblclick)="startEdit()"
            class="px-2 py-0.5 rounded hover:bg-neutral-800 text-neutral-100"
            title="Double-click to rename"
          >
            {{ store.currentProjectName() }}
            @if (store.isDirty()) {
              <span class="text-amber-400 ml-1" title="Unsaved changes">●</span>
            }
          </button>
        }
      </div>

      <button
        type="button"
        (click)="onNew()"
        class="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
      >
        New
      </button>

      <button
        type="button"
        (click)="store.saveCurrent()"
        [disabled]="store.isSaving() || !store.isDirty()"
        class="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white"
      >
        {{ store.isSaving() ? 'Saving…' : 'Save' }}
      </button>

      <div class="relative">
        <button
          type="button"
          (click)="toggleMenu()"
          class="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-100"
        >
          Projects ▾
        </button>

        @if (menuOpen()) {
          <div
            class="absolute top-full left-0 mt-1 w-80 bg-neutral-900 border border-neutral-700 rounded shadow-xl z-50"
          >
            @if (store.allProjects().length === 0) {
              <div class="px-3 py-4 text-neutral-500 text-center">
                No saved projects yet.
              </div>
            } @else {
              <ul class="max-h-80 overflow-auto py-1">
                @for (p of store.allProjects(); track p.id) {
                  <li
                    class="flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-800"
                    [class.bg-neutral-800]="p.id === store.currentProjectId()"
                  >
                    <button
                      type="button"
                      (click)="openProject(p.id)"
                      class="flex-1 text-left"
                    >
                      <div class="text-neutral-100 truncate">{{ p.name }}</div>
                      <div class="text-xs text-neutral-500">
                        {{ p.updatedAt | date: 'short' }} ·
                        {{ p.trackCount }} track{{ p.trackCount === 1 ? '' : 's' }}
                      </div>
                    </button>
                    <button
                      type="button"
                      (click)="deleteProject(p.id, $event)"
                      class="text-neutral-500 hover:text-red-400 px-2"
                      title="Delete project"
                    >
                      ✕
                    </button>
                  </li>
                }
              </ul>
            }
          </div>
        }
      </div>

      <div class="flex-1"></div>

      @if (store.lastError(); as err) {
        <span class="text-red-400">{{ err }}</span>
      }
    </div>
  `,
})
export class ProjectBarComponent {
  readonly store = inject(ProjectStore);

  readonly menuOpen = signal(false);
  readonly editingName = signal(false);

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  startEdit(): void {
    this.editingName.set(true);
    // Focus after Angular renders the input.
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>(
        'app-project-bar input[type=text]',
      );
      input?.focus();
      input?.select();
    });
  }

  cancelEdit(): void {
    this.editingName.set(false);
  }

  commitName(event: Event): void {
    const value = (event.target as HTMLInputElement).value.trim();
    if (value) this.store.renameProject(value);
    this.editingName.set(false);
  }

  async onNew(): Promise<void> {
    await this.store.newProject('Untitled');
    this.startEdit();
  }

  async openProject(id: string): Promise<void> {
    await this.store.loadProject(id);
    this.menuOpen.set(false);
  }

  async deleteProject(id: string, event: Event): Promise<void> {
    event.stopPropagation();
    if (!confirm('Delete this project? This cannot be undone.')) return;
    await this.store.deleteProject(id);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('app-project-bar')) {
      this.menuOpen.set(false);
    }
  }
}