export type ScreenName =
  | 'menu'
  | 'tour'
  | 'lessons'
  | 'training'
  | 'songs'
  | 'play'
  | 'gear'
  | 'profile'
  | 'tuner'
  | 'fretboard'
  | 'calibration'
  | 'recorder';

export interface NoteHit {
  string: number; // 0-5 (0 = niska E, 5 = wysoka e)
  fret: number;
  time: number; // sekundy
  duration: number;
  technique?: 'pick' | 'hammer' | 'pull' | 'slide' | 'bend' | 'palmMute' | 'harmonic' | 'tap';
  bend?: number;
}

export interface ChordShape {
  name: string;
  frets: (number | -1)[]; // -1 oznacza strunę wytłumioną
  time: number;
  duration: number;
}

export interface TourSong {
  id: string;
  chapter: number;
  order: number;
  title: string;
  artist: string;
  genre: string;
  year: number;
  about: string;
  tempo: number;
  tuning: string;
  teaches: string[];
  uses: string[];
  notesCount: number;
  durationMs: number;
  file: string;
}

export interface TourChapter {
  n: number;
  id: string;
  venue: string;
  place: string;
  stage: string;
  passMark: number;
  story: string;
  doneStory: string;
}

export interface PlayerRank {
  level: number;
  title: string;
  xpCurrent: number;
  xpNext: number;
  starsTotal: number;
  starsEarned: number;
  badgesEarned: number;
  badgesTotal: number;
}

export interface Badge {
  id: string;
  name: string;
  desc: string;
  category: 'tour' | 'skill' | 'technique' | 'training' | 'drills' | 'dedication' | 'explore';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  unlocked: boolean;
  progress: number; // 0 do 1
}

export interface AudioSettings {
  detectionEnabled: boolean;
  inputDeviceId: string;
  noiseGateThreshold: number; // 0.001 do 0.1
  latencyOffsetMs: number; // kompensacja bufora w ms (-200 do 200)
  humFilter50Hz: boolean;
  guitarTone: 'clean' | 'crunch' | 'distortion' | 'acoustic' | 'jazz' | 'bass';
  monitoringVolume: number;
  backingVolume: number;
}

export interface PitchDetectionResult {
  detected: boolean;
  frequency: number; // Hz
  midiNote: number;
  noteName: string;
  octave: number;
  cents: number; // odchyłka od -50 do +50
  clarity: number; // 0 do 1
  stringEstimated?: number;
}
