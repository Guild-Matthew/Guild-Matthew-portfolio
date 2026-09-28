import { Injectable, computed, inject, signal } from '@angular/core';
import { PROJECT_REPOSITORY } from '../persistence/project.repository';
import { createDefaultProject } from '../persistence/project.factory';
import type { Project } from '../models/project.model';
import type { ProjectSummary } from '../persistence/db';

@Injectable({ providedIn: 'root' })
export class ProjectStore {
  private readonly repo = inject(PROJECT_REPOSITORY);

  private readonly _currentProject = signal<Project | null>(null);
  private readonly _isDirty = signal(false);
  private readonly _isSaving = signal(false);
  private readonly _allProjects = signal<ProjectSummary[]>([]);
  private readonly _lastError = signal<string | null>(null);

  readonly currentProject = this._currentProject.asReadonly();
  readonly currentProjectId = computed(() => this._currentProject()?.id ?? null);
  readonly currentProjectName = computed(
    () => this._currentProject()?.name ?? 'Untitled',
  );
  readonly isDirty = this._isDirty.asReadonly();
  readonly isSaving = this._isSaving.asReadonly();
  readonly allProjects = this._allProjects.asReadonly();
  readonly lastError = this._lastError.asReadonly();

  readonly currentBpm = computed(() => this._currentProject()?.bpm ?? 120);
  readonly currentTimeSignature = computed<[number, number]>(
    () => this._currentProject()?.timeSignature ?? [4, 4],
  );
  readonly trackCount = computed(() => this._currentProject()?.tracks.length ?? 0);

  /**
   * Called once at app startup. Loads the most recently edited project,
   * or creates a fresh one if none exist.
   */
  async initialize(): Promise<void> {
    try {
      const list = await this.repo.list();
      this._allProjects.set(list);
      if (list.length > 0) {
        await this.loadProject(list[0].id);
      } else {
        this._currentProject.set(createDefaultProject('My First Song'));
        this._isDirty.set(true);
      }
    } catch (err) {
      console.error('[ProjectStore] initialize failed', err);
      this._lastError.set('Failed to load projects.');
      this._currentProject.set(createDefaultProject('Untitled'));
      this._isDirty.set(true);
    }
  }

  async newProject(name = 'Untitled'): Promise<void> {
    this._currentProject.set(createDefaultProject(name));
    this._isDirty.set(true);
  }

  async loadProject(id: string): Promise<void> {
    const p = await this.repo.get(id);
    if (!p) return;
    this._currentProject.set(p);
    this._isDirty.set(false);
  }

  async saveCurrent(): Promise<void> {
    const p = this._currentProject();
    if (!p) return;
    this._isSaving.set(true);
    this._lastError.set(null);
    try {
      const updated: Project = { ...p, updatedAt: Date.now() };
      await this.repo.save(updated);
      this._currentProject.set(updated);
      this._isDirty.set(false);
      await this.refreshProjectList();
    } catch (err) {
      console.error('[ProjectStore] save failed', err);
      this._lastError.set('Failed to save project.');
    } finally {
      this._isSaving.set(false);
    }
  }

  async deleteProject(id: string): Promise<void> {
    await this.repo.delete(id);
    if (this._currentProject()?.id === id) {
      const list = await this.repo.list();
      if (list.length > 0) {
        await this.loadProject(list[0].id);
      } else {
        this._currentProject.set(createDefaultProject('Untitled'));
        this._isDirty.set(true);
      }
    }
    await this.refreshProjectList();
  }

  renameProject(name: string): void {
    this.patchProject({ name });
  }

  patchProject(patch: Partial<Project>): void {
    const current = this._currentProject();
    if (!current) return;
    this._currentProject.set({
      ...current,
      ...patch,
      updatedAt: Date.now(),
    });
    this._isDirty.set(true);
  }

  setBpm(bpm: number): void {
    this.patchProject({ bpm });
  }

  setTimeSignature(sig: [number, number]): void {
    this.patchProject({ timeSignature: sig });
  }

  async refreshProjectList(): Promise<void> {
    const list = await this.repo.list();
    this._allProjects.set(list);
  }
}