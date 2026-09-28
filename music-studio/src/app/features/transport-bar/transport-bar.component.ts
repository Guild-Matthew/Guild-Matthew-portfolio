import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TransportService } from '../../core/audio-engine/transport.service';
import { InstrumentService } from '../../core/audio-engine/instrument.service';
import type { InstrumentKind } from '../../core/models/project.model';

@Component({
  selector: 'app-transport-bar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex items-center gap-3 px-4 py-3 bg-neutral-900 border-b border-neutral-800 text-sm"
    >
      <!-- Play / Stop -->
      <button
        type="button"
        (click)="toggle()"
        class="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
        [attr.aria-label]="transport.isPlaying() ? 'Stop' : 'Play'"
      >
        {{ transport.isPlaying() ? '■' : '▶' }}
      </button>

      <button
        type="button"
        (click)="transport.stop()"
        class="w-10 h-10 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition"
        aria-label="Return to start"
      >
        ⏮
      </button>

      <!-- Position -->
      <div class="font-mono text-lg tabular-nums text-emerald-400 min-w-[5.5rem] text-center">
        {{ transport.positionLabel() }}
      </div>

      <!-- BPM -->
      <label class="flex items-center gap-2">
        <span class="text-neutral-400">BPM</span>
        <input
          type="number"
          min="20"
          max="300"
          [value]="transport.bpm()"
          (input)="onBpmInput($event)"
          class="w-20 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-100 focus:outline-none focus:border-emerald-500"
        />
      </label>

      <!-- Time signature -->
      <label class="flex items-center gap-2">
        <span class="text-neutral-400">Time</span>
        <select
          [value]="transport.timeSignature().join('/')"
          (change)="onTimeSignatureChange($event)"
          class="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-100"
        >
          <option value="4/4">4/4</option>
          <option value="3/4">3/4</option>
          <option value="6/8">6/8</option>
          <option value="5/4">5/4</option>
        </select>
      </label>

      <!-- Metronome -->
      <button
        type="button"
        (click)="transport.toggleMetronome()"
        class="px-3 py-1.5 rounded border transition"
        [class.bg-emerald-600]="transport.metronomeEnabled()"
        [class.border-emerald-500]="transport.metronomeEnabled()"
        [class.bg-neutral-800]="!transport.metronomeEnabled()"
        [class.border-neutral-700]="!transport.metronomeEnabled()"
      >
        Metronome
      </button>

      <div class="flex-1"></div>

      <!-- Instrument picker -->
      <label class="flex items-center gap-2">
        <span class="text-neutral-400">Instrument</span>
        <select
          [value]="instrument.activeInstrument()"
          (change)="onInstrumentChange($event)"
          class="bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-neutral-100"
        >
          <option value="polySynth">Poly Synth</option>
          <option value="bassSynth">Bass Synth</option>
        </select>
      </label>
    </div>
  `,
})
export class TransportBarComponent {
  readonly transport = inject(TransportService);
  readonly instrument = inject(InstrumentService);

  async toggle(): Promise<void> {
    if (this.transport.isPlaying()) {
      this.transport.pause();
    } else {
      await this.transport.play();
    }
  }

  onBpmInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    if (!Number.isFinite(value)) return;
    this.transport.setBpm(value);
  }

  onTimeSignatureChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const [num, den] = value.split('/').map(Number);
    this.transport.setTimeSignature([num, den]);
  }

  onInstrumentChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as InstrumentKind;
    this.instrument.setInstrument(value);
  }
}