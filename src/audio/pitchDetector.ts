import { PitchDetectionResult } from '../types';

const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Standardowe struny gitary (MIDI number, E2 do E4)
export const STANDARD_GUITAR_STRINGS = [
  { stringIndex: 0, note: 'E', octave: 2, midi: 40, freq: 82.41, name: '6 (E)' },
  { stringIndex: 1, note: 'A', octave: 2, midi: 45, freq: 110.0, name: '5 (A)' },
  { stringIndex: 2, note: 'D', octave: 3, midi: 50, freq: 146.83, name: '4 (D)' },
  { stringIndex: 3, note: 'G', octave: 3, midi: 55, freq: 196.0, name: '3 (G)' },
  { stringIndex: 4, note: 'B', octave: 3, midi: 59, freq: 246.94, name: '2 (B)' },
  { stringIndex: 5, note: 'E', octave: 4, midi: 64, freq: 329.63, name: '1 (e)' },
];

export class PitchDetector {
  private analyser: AnalyserNode | null = null;
  private buffer: Float32Array<ArrayBuffer> | null = null;
  private sampleRate = 48000;

  constructor(analyserNode?: AnalyserNode) {
    if (analyserNode) {
      this.setAnalyser(analyserNode);
    }
  }

  public setAnalyser(analyserNode: AnalyserNode) {
    this.analyser = analyserNode;
    this.sampleRate = analyserNode.context.sampleRate;
    this.buffer = new Float32Array(analyserNode.fftSize);
  }

  /**
   * Wykrywa wysokość dźwięku za pomocą ulepszonego algorytmu autokorelacji YIN
   * zoptymalizowanego pod pasmo częstotliwości gitary (70 Hz - 1400 Hz)
   */
  public detect(): PitchDetectionResult {
    if (!this.analyser || !this.buffer) {
      return this.emptyResult();
    }

    this.analyser.getFloatTimeDomainData(this.buffer);

    // 1. Oblicz energię sygnału (RMS) w celu wyeliminowania ciszy
    let rms = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      rms += this.buffer[i] * this.buffer[i];
    }
    rms = Math.sqrt(rms / this.buffer.length);

    // Bramka szumów - ignoruj szum tła
    if (rms < 0.012) {
      return this.emptyResult();
    }

    // 2. Normalizacja zoptymalizowana autokorelacja (YIN Difference Function)
    const bufferSize = this.buffer.length;
    const minPeriod = Math.floor(this.sampleRate / 1400); // ~1400 Hz (próg górny)
    const maxPeriod = Math.floor(this.sampleRate / 70);   // ~70 Hz (próg dolny dla gitary)

    let bestPeriod = -1;
    let minDifference = 1.0;

    // Prosty i szybki YIN difference
    const d = new Float32Array(maxPeriod);
    d[0] = 0;
    let runningSum = 0;

    for (let tau = 1; tau < maxPeriod; tau++) {
      let sum = 0;
      for (let i = 0; i < bufferSize - tau; i += 2) { // Krok 2 dla wydajności
        const diff = this.buffer[i] - this.buffer[i + tau];
        sum += diff * diff;
      }
      d[tau] = sum;
      runningSum += sum;

      // Cumulative mean normalized difference
      const cmndf = (sum * tau) / (runningSum + 1e-9);

      if (tau >= minPeriod) {
        if (cmndf < 0.15) {
          // Znaleziono próg YIN
          bestPeriod = tau;
          minDifference = cmndf;
          break;
        }
        if (cmndf < minDifference) {
          minDifference = cmndf;
          bestPeriod = tau;
        }
      }
    }

    if (bestPeriod === -1 || minDifference > 0.45) {
      return this.emptyResult();
    }

    // Interpolacja paraboliczna dla sub-samplowej precyzji częstotliwości
    let period = bestPeriod;
    if (bestPeriod > 1 && bestPeriod < maxPeriod - 1) {
      const s0 = d[bestPeriod - 1];
      const s1 = d[bestPeriod];
      const s2 = d[bestPeriod + 1];
      const delta = (s0 - s2) / (2 * (s0 - 2 * s1 + s2) + 1e-9);
      if (Math.abs(delta) < 1) {
        period += delta;
      }
    }

    const frequency = this.sampleRate / period;

    // Przeliczenie na nutę MIDI i centy
    const midiFloat = 69 + 12 * Math.log2(frequency / 440);
    const midiNote = Math.round(midiFloat);
    const cents = Math.round((midiFloat - midiNote) * 100);

    const noteIndex = ((midiNote % 12) + 12) % 12;
    const octave = Math.floor(midiNote / 12) - 1;
    const noteName = NOTE_STRINGS[noteIndex];

    // Estymacja najbliższej otwartej struny gitary
    let closestString = 0;
    let minMidiDiff = 999;
    for (const str of STANDARD_GUITAR_STRINGS) {
      const diff = Math.abs(midiNote - str.midi);
      if (diff < minMidiDiff) {
        minMidiDiff = diff;
        closestString = str.stringIndex;
      }
    }

    return {
      detected: true,
      frequency: Math.round(frequency * 10) / 10,
      midiNote,
      noteName,
      octave,
      cents,
      clarity: Math.max(0, Math.min(1, 1 - minDifference)),
      stringEstimated: closestString,
    };
  }

  private emptyResult(): PitchDetectionResult {
    return {
      detected: false,
      frequency: 0,
      midiNote: 0,
      noteName: '-',
      octave: 0,
      cents: 0,
      clarity: 0,
    };
  }
}
