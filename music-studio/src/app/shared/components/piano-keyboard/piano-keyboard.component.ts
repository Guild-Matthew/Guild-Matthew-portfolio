import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { InstrumentService } from '../../../core/audio-engine/instrument.service';

interface KeyDef {
  midi: number;
  label?: string;
}

const BLACK_KEY_WIDTH_PCT = (100 / 14) * 0.6;

@Component({
  selector: 'app-piano-keyboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="select-none p-3 bg-neutral-950 border-t border-neutral-800">
      <div class="flex items-center gap-3 mb-2 text-xs text-neutral-400">
        <span>Computer keys: A W S E D F T G Y H U J K</span>
        <span class="ml-auto font-mono">Octave {{ baseOctave() }}</span>
        <button class="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700"
                (click)="shiftOctave(-1)">Z ▼</button>
        <button class="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700"
                (click)="shiftOctave(1)">X ▲</button>
      </div>

      <div class="relative h-36 w-full flex">
        @for (key of whiteKeys; track key.midi) {
          <div
            class="flex-1 border border-neutral-800 rounded-b cursor-pointer
                   transition-colors flex items-end justify-center pb-1 text-[10px]"
            [class.bg-white]="!isActive(key.midi)"
            [class.text-neutral-500]="!isActive(key.midi)"
            [class.bg-emerald-400]="isActive(key.midi)"
            [class.text-emerald-900]="isActive(key.midi)"
            (mousedown)="noteOn(key.midi)"
            (mouseup)="noteOff(key.midi)"
            (mouseleave)="noteOff(key.midi)"
          >
            {{ key.label }}
          </div>
        }

        @for (key of blackKeys; track key.midi) {
          <div
            class="absolute top-0 h-[60%] rounded-b cursor-pointer
                   transition-colors border border-black z-10"
            [style.left.%]="blackLeftPct(key.midi)"
            [style.width.%]="blackWidthPct"
            [class.bg-neutral-900]="!isActive(key.midi)"
            [class.bg-emerald-500]="isActive(key.midi)"
            (mousedown)="noteOn(key.midi)"
            (mouseup)="noteOff(key.midi)"
            (mouseleave)="noteOff(key.midi)"
          ></div>
        }
      </div>
    </div>
  `,
})
export class PianoKeyboardComponent {
  private readonly instrument = inject(InstrumentService);

  readonly baseOctave = signal(4);
  readonly heldNotes = signal<Set<number>>(new Set());

  readonly blackWidthPct = BLACK_KEY_WIDTH_PCT;

  // C3 (48) through B4 (71) — 14 white keys, 10 black keys.
  readonly whiteKeys: KeyDef[] = [
    { midi: 48, label: 'C' }, { midi: 50, label: 'D' }, { midi: 52, label: 'E' },
    { midi: 53, label: 'F' }, { midi: 55, label: 'G' }, { midi: 57, label: 'A' },
    { midi: 59, label: 'B' },
    { midi: 60, label: 'C' }, { midi: 62, label: 'D' }, { midi: 64, label: 'E' },
    { midi: 65, label: 'F' }, { midi: 67, label: 'G' }, { midi: 69, label: 'A' },
    { midi: 71, label: 'B' },
  ];

  readonly blackKeys: KeyDef[] = [
    { midi: 49 }, { midi: 51 }, { midi: 54 }, { midi: 56 }, { midi: 58 },
    { midi: 61 }, { midi: 63 }, { midi: 66 }, { midi: 68 }, { midi: 70 },
  ];

  // Map each black key to the white key index it sits *after* (0-based).
  private readonly blackKeyAnchor: Record<number, number> = {
    49: 0, 51: 1, 54: 3, 56: 4, 58: 5,
    61: 7, 63: 8, 66: 10, 68: 11, 70: 12,
  };

  private readonly keyMap: Record<string, number> = {
    a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7,
    y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16,
  };

  isActive(midi: number): boolean {
    return this.heldNotes().has(midi);
  }

  blackLeftPct(midi: number): number {
    const anchor = this.blackKeyAnchor[midi];
    const centerPct = ((anchor + 1) / 14) * 100;
    return centerPct - BLACK_KEY_WIDTH_PCT / 2;
  }

  shiftOctave(delta: number): void {
    this.baseOctave.update((o) => Math.max(1, Math.min(7, o + delta)));
  }

  noteOn(midi: number): void {
    if (this.heldNotes().has(midi)) return;
    this.heldNotes.update((s) => new Set(s).add(midi));
    this.instrument.noteOn(midi);
  }

  noteOff(midi: number): void {
    if (!this.heldNotes().has(midi)) return;
    this.heldNotes.update((s) => {
      const next = new Set(s);
      next.delete(midi);
      return next;
    });
    this.instrument.noteOff(midi);
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.repeat) return;
    if (this.isTextInput(event.target)) return;

    const key = event.key.toLowerCase();
    if (key === 'z') { this.shiftOctave(-1); return; }
    if (key === 'x') { this.shiftOctave(1); return; }

    const offset = this.keyMap[key];
    if (offset === undefined) return;
    event.preventDefault();

    const midi = (this.baseOctave() + 1) * 12 + offset;
    this.noteOn(midi);
  }

  @HostListener('window:keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (this.isTextInput(event.target)) return;
    const offset = this.keyMap[event.key.toLowerCase()];
    if (offset === undefined) return;

    const midi = (this.baseOctave() + 1) * 12 + offset;
    this.noteOff(midi);
  }

  private isTextInput(target: EventTarget | null): boolean {
    const el = target as HTMLElement | null;
    if (!el) return false;
    const tag = el.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
  }
}