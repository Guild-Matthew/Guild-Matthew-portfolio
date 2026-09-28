import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProjectBarComponent } from './features/project-bar/project-bar.component';
import { TransportBarComponent } from './features/transport-bar/transport-bar.component';
import { PianoKeyboardComponent } from './shared/components/piano-keyboard/piano-keyboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProjectBarComponent, TransportBarComponent, PianoKeyboardComponent],
  template: `
    <div class="h-screen flex flex-col bg-neutral-950 text-neutral-100">
      <app-project-bar />
      <app-transport-bar />

      <main class="flex-1 overflow-auto flex items-center justify-center text-neutral-500">
        <div class="text-center">
          <div class="text-2xl mb-1 text-neutral-300">Stage 2</div>
          <div class="text-sm">
            Edit the project name, hit Save, then reload — your project persists.
          </div>
        </div>
      </main>

      <app-piano-keyboard />
    </div>
  `,
})
export class AppComponent {}