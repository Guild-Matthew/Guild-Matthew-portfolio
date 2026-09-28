import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  DexieProjectRepository,
  PROJECT_REPOSITORY,
} from './core/persistence/project.repository';
import { ProjectStore } from './core/state/project.store';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    { provide: PROJECT_REPOSITORY, useClass: DexieProjectRepository },
    provideAppInitializer(() => inject(ProjectStore).initialize()),
  ],
};