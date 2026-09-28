import type { Project, Track } from '../models/project.model';

function uid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older environments. Good enough for local dev.
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function createDefaultTrack(name = 'Synth 1'): Track {
  return {
    id: uid(),
    name,
    type: 'instrument',
    instrumentConfig: { kind: 'polySynth', params: {} },
    clips: [],
    effects: [],
    volume: 0.8,
    pan: 0,
    muted: false,
    soloed: false,
    automation: [],
  };
}

export function createDefaultProject(name = 'Untitled'): Project {
  const now = Date.now();
  return {
    id: uid(),
    name,
    createdAt: now,
    updatedAt: now,
    bpm: 120,
    timeSignature: [4, 4],
    keySignature: 'C',
    lengthBars: 32,
    tracks: [createDefaultTrack()],
    masterEffects: [],
    loopRegion: null,
  };
}