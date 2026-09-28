/**
 * Core domain model. Serializable to JSON as-is, so it round-trips
 * cleanly through IndexedDB today and a REST/Supabase backend later.
 */

export type TrackType = 'instrument' | 'audio' | 'drum';
export type InstrumentKind = 'polySynth' | 'samplerPiano' | 'bassSynth';
export type EffectKind = 'reverb' | 'delay' | 'eq3' | 'compressor' | 'distortion';

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  bpm: number;
  timeSignature: [number, number];
  keySignature: string;
  lengthBars: number;
  tracks: Track[];
  masterEffects: EffectConfig[];
  loopRegion: { startBar: number; endBar: number } | null;
}

export interface Track {
  id: string;
  name: string;
  type: TrackType;
  instrumentConfig: InstrumentConfig | null;
  clips: Clip[];
  effects: EffectConfig[];
  volume: number;
  pan: number;
  muted: boolean;
  soloed: boolean;
  automation: AutomationLane[];
}

export interface Clip {
  id: string;
  startBar: number;
  lengthBars: number;
  color: string;
  content: NoteContent | AudioContent | DrumContent;
}

export interface NoteContent {
  type: 'notes';
  notes: NoteEvent[];
}

export interface NoteEvent {
  id: string;
  pitch: number;       // MIDI note number 0–127
  startBeat: number;   // beats, relative to clip start
  durationBeats: number;
  velocity: number;    // 0–127
}

export interface AudioContent {
  type: 'audio';
  sampleId: string;
  offsetSeconds: number;
  durationSeconds: number;
  gainDb: number;
}

export interface DrumContent {
  type: 'drum';
  steps: DrumStep[];
  swing: number;
}

export interface DrumStep {
  voiceId: string;     // e.g. 'kick', 'snare', 'hihat'
  step: number;        // grid step index
  velocity: number;    // 0–127
}

export interface InstrumentConfig {
  kind: InstrumentKind;
  params: Record<string, number | string>;
}

export interface EffectConfig {
  id: string;
  type: EffectKind;
  enabled: boolean;
  params: Record<string, number>;
}

export interface AutomationLane {
  parameter: 'volume' | 'pan';
  points: { beat: number; value: number }[];
}