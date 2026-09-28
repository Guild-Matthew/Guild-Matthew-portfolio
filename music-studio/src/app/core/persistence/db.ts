import Dexie, { type EntityTable } from 'dexie';
import type { Project } from '../models/project.model';

/** Lightweight projection used for the project-list UI. */
export interface ProjectSummary {
  id: string;
  name: string;
  updatedAt: number;
  trackCount: number;
}

/**
 * The IndexedDB schema. Only `projects` exists for now; later stages add
 * tables for samples, recordings, and preset banks. Bumping the Dexie
 * version number is how future schema changes are applied.
 */
class MusicStudioDB extends Dexie {
  projects!: EntityTable<Project, 'id'>;

  constructor() {
    super('music-studio');
    this.version(1).stores({
      // Listed fields are indexed; Dexie stores the full object regardless.
      projects: 'id, name, updatedAt',
    });
  }
}

export const db = new MusicStudioDB();