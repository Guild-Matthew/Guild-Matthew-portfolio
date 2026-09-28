import { Injectable, computed, effect, inject, signal } from '@angular/core';
import * as Tone from 'tone';
import { ProjectStore } from '../state/project.store';
import type { Project } from '../models/project.model';

/**
 * Owns the Tone.js Transport. Framework-agnostic in spirit:
 * no Angular decorators beyond @Injectable, no template concerns.
 * Only signal updates re-enter the reactive graph.
 */
@Injectable({ providedIn: 'root' })
export class TransportService {
  private readonly projectStore = inject(ProjectStore);

  private readonly transport = Tone.getTransport();
  private metronomeSynth: Tone.MembraneSynth | null = null;
  private metronomeEventId: number | null = null;
  private lastAppliedProjectId: string | null = null;

  readonly bpm = signal(120);
  readonly isPlaying = signal(false);
  readonly positionBeats = signal(0);
  readonly timeSignature = signal<[number, number]>([4, 4]);
  readonly metronomeEnabled = signal(false);

  readonly currentBar = computed(() => {
    const [numerator] = this.timeSignature();
    return Math.floor(this.positionBeats() / numerator) + 1;
  });

  readonly currentBeat = computed(() => {
    const [numerator] = this.timeSignature();
    return (Math.floor(this.positionBeats()) % numerator) + 1;
  });

  readonly currentSixteenth = computed(
    () => Math.floor((this.positionBeats() % 1) * 4) + 1,
  );

  readonly positionLabel = computed(
    () => `${this.currentBar()}.${this.currentBeat()}.${this.currentSixteenth()}`,
  );

  constructor() {
    this.transport.bpm.value = this.bpm();
    this.transport.timeSignature = this.timeSignature()[0];

    // Update the position signal on every 16th note.
    this.transport.scheduleRepeat(() => {
      this.positionBeats.set(this.transport.ticks / this.transport.PPQ);
    }, '16n');

    // Whenever a *different* project becomes current, apply its tempo
    // and time signature to the Tone.js transport.
    effect(() => {
      const project = this.projectStore.currentProject();
      if (!project) return;
      if (project.id === this.lastAppliedProjectId) return;
      this.lastAppliedProjectId = project.id;
      this.applyProjectToTransport(project);
    });
  }

  private applyProjectToTransport(project: Project): void {
    this.bpm.set(project.bpm);
    this.transport.bpm.value = project.bpm;
    this.timeSignature.set(project.timeSignature);
    this.transport.timeSignature = project.timeSignature[0];
  }

  async play(): Promise<void> {
    await Tone.start();
    this.transport.start();
    this.isPlaying.set(true);
  }

  pause(): void {
    this.transport.pause();
    this.isPlaying.set(false);
  }

  stop(): void {
    this.transport.stop();
    this.transport.position = 0;
    this.positionBeats.set(0);
    this.isPlaying.set(false);
  }

  setBpm(bpm: number): void {
    const clamped = Math.max(20, Math.min(300, Math.round(bpm)));
    this.bpm.set(clamped);
    this.transport.bpm.value = clamped;
    this.projectStore.setBpm(clamped);
  }

  setTimeSignature(sig: [number, number]): void {
    this.timeSignature.set(sig);
    this.transport.timeSignature = sig[0];
    this.projectStore.setTimeSignature(sig);
  }

  toggleMetronome(): void {
    this.metronomeEnabled.update((v) => !v);
    this.rebuildMetronome();
  }

  private rebuildMetronome(): void {
    if (this.metronomeEventId !== null) {
      this.transport.clear(this.metronomeEventId);
      this.metronomeEventId = null;
    }
    if (!this.metronomeEnabled()) return;

    if (!this.metronomeSynth) {
      this.metronomeSynth = new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 },
      }).toDestination();
      this.metronomeSynth.volume.value = -8;
    }

    this.metronomeEventId = this.transport.scheduleRepeat((time) => {
      const beatIndex =
        Math.floor(this.transport.ticks / this.transport.PPQ) %
        this.timeSignature()[0];
      const pitch = beatIndex === 0 ? 'C5' : 'C4';
      this.metronomeSynth!.triggerAttackRelease(pitch, '32n', time);
    }, '4n');
  }
}