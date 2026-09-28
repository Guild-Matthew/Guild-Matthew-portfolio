import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TransportBarComponent } from './features/transport-bar/transport-bar.component';
import { PianoKeyboardComponent } from './shared/components/piano-keyboard/piano-keyboard.component';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TransportBarComponent, PianoKeyboardComponent],
  template: `
    <div class="h-screen flex flex-col bg-neutral-950 text-neutral-100">
      <app-transport-bar />

      <main class="flex-1 overflow-auto flex items-center justify-center text-neutral-500">
        <div class="text-center">
          <div class="text-2xl mb-1 text-neutral-300">Stage 1</div>
          <div class="text-sm">
            Press ▶ to start the transport. Play notes with your mouse or the
            computer keyboard (A–K).
          </div>
        </div>
      </main>

      <app-piano-keyboard />
    </div>
  `,
})
export class AppComponent {}