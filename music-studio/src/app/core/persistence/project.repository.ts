import { Injectable, InjectionToken } from '@angular/core';
import { db, type ProjectSummary } from './db';
import type { Project } from '../models/project.model';

/**
 * Storage abstraction. The app talks only to this interface, so a future
 * Supabase/Firebase/REST backend can be dropped in by providing a
 * different implementation of PROJECT_REPOSITORY — no store or component
 * changes required.
 */
export interface ProjectRepository {
  list(): Promise<ProjectSummary[]>;
  get(id: string): Promise<Project | undefined>;
  save(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
}

export const PROJECT_REPOSITORY = new InjectionToken<ProjectRepository>(
  'PROJECT_REPOSITORY',
);

@Injectable()
export class DexieProjectRepository implements ProjectRepository {
  async list(): Promise<ProjectSummary[]> {
    const all = await db.projects.orderBy('updatedAt').reverse().toArray();
    return all.map((p) => ({
      id: p.id,
      name: p.name,
      updatedAt: p.updatedAt,
      trackCount: p.tracks.length,
    }));
  }

  async get(id: string): Promise<Project | undefined> {
    return db.projects.get(id);
  }

  async save(project: Project): Promise<void> {
    await db.projects.put(project);
  }

  async delete(id: string): Promise<void> {
    await db.projects.delete(id);
  }
}