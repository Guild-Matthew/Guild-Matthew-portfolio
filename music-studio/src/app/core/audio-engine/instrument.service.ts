import { Injectable, signal } from '@angular/core';
import * as Tone from 'tone';
import type { InstrumentKind } from '../models/project.model';

/**
 * Owns the currently-active instrument(s). For Stage 1 we ship a
 * poly synth and a mono bass; sampler piano arrives in a later stage.
 */
@Injectable({ providedIn: 'root' })
export class InstrumentService {
  private readonly masterGain = new Tone.Gain(0.8).toDestination();
  private readonly polySynth: Tone.PolySynth<Tone.Synth>;
  private readonly bassSynth: Tone.MonoSynth;
  private readonly activeKind = signal<InstrumentKind>('polySynth');

  readonly activeInstrument = this.activeKind.asReadonly();

  constructor() {
    this.polySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.8 },
    }).connect(this.masterGain);
    this.polySynth.volume.value = -6;

    this.bassSynth = new Tone.MonoSynth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.4 },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.3,
        release: 0.4,
        baseFrequency: 100,
        octaves: 2,
      },
    }).connect(this.masterGain);
    this.bassSynth.volume.value = -6;
  }

  setInstrument(kind: InstrumentKind): void {
    this.activeKind.set(kind);
  }

  noteOn(midi: number, velocity = 0.8): void {
    const freq = Tone.Frequency(midi, 'midi').toFrequency();
    if (this.activeKind() === 'bassSynth') {
      this.bassSynth.triggerAttack(freq);
    } else {
      this.polySynth.triggerAttack(freq, Tone.now(), velocity);
    }
  }

  noteOff(midi: number): void {
    const freq = Tone.Frequency(midi, 'midi').toFrequency();
    if (this.activeKind() === 'bassSynth') {
      this.bassSynth.triggerRelease();
    } else {
      this.polySynth.triggerRelease(freq);
    }
  }

  preview(midi: number, duration: Tone.Unit.Time = '8n', velocity = 0.8): void {
    const freq = Tone.Frequency(midi, 'midi').toFrequency();
    if (this.activeKind() === 'bassSynth') {
      this.bassSynth.triggerAttackRelease(freq, duration, undefined, velocity);
    } else {
      this.polySynth.triggerAttackRelease(freq, duration, undefined, velocity);
    }
  }
}