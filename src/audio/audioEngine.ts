import { PitchDetector } from './pitchDetector';
import { AudioSettings, PitchDetectionResult } from '../types';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private pitchDetector: PitchDetector;
  private workletLoaded = false;
  private ampNode: AudioWorkletNode | null = null;
  private guitarNode: AudioWorkletNode | null = null;
  private fxNode: AudioWorkletNode | null = null;
  private limiterNode: AudioWorkletNode | null = null;

  public settings: AudioSettings = {
    detectionEnabled: true,
    inputDeviceId: '',
    noiseGateThreshold: 0.012,
    latencyOffsetMs: 0,
    humFilter50Hz: true,
    guitarTone: 'crunch',
    monitoringVolume: 0.8,
    backingVolume: 0.8,
  };

  private listeners: ((res: PitchDetectionResult) => void)[] = [];
  private animationFrameId: number | null = null;

  constructor() {
    this.pitchDetector = new PitchDetector();
  }

  public async initContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({ latencyHint: 'interactive' });
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    if (!this.workletLoaded) {
      try {
        await this.ctx.audioWorklet.addModule('/workers/guitarWorklet.js');
        this.workletLoaded = true;

        // Utworzenie węzłów DSP
        this.guitarNode = new AudioWorkletNode(this.ctx, 'melodic-guitar');
        this.ampNode = new AudioWorkletNode(this.ctx, 'melodic-amp');
        this.fxNode = new AudioWorkletNode(this.ctx, 'melodic-fx');
        this.limiterNode = new AudioWorkletNode(this.ctx, 'melodic-limiter');

        // Podłączenie łańcucha gitarowego: gitara -> wzmacniacz -> efekty -> limiter -> wyjście
        this.guitarNode.connect(this.ampNode);
        this.ampNode.connect(this.fxNode);
        this.fxNode.connect(this.limiterNode);
        this.limiterNode.connect(this.ctx.destination);
      } catch (err) {
        console.warn('Wczytywanie guitarWorklet.js nie powiodło się, używam trybu fallback:', err);
      }
    }
  }

  public async startMicrophone(deviceId?: string): Promise<boolean> {
    await this.initContext();
    if (!this.ctx) return false;

    if (this.stream) {
      this.stopMicrophone();
    }

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.sourceNode = this.ctx.createMediaStreamSource(this.stream);

      // Konfiguracja AnalyserNode
      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 8192;
      this.analyserNode.smoothingTimeConstant = 0.1;

      // Filtr pasmowy i 50Hz hum filter
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = this.settings.humFilter50Hz ? 60 : 40;

      this.sourceNode.connect(hp);
      hp.connect(this.analyserNode);

      this.pitchDetector.setAnalyser(this.analyserNode);
      this.startPitchLoop();
      return true;
    } catch (err) {
      console.error('Błąd dostępu do mikrofonu/wejścia audio:', err);
      return false;
    }
  }

  public stopMicrophone() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
  }

  private startPitchLoop() {
    const loop = () => {
      if (this.settings.detectionEnabled) {
        const result = this.pitchDetector.detect();
        for (const listener of this.listeners) {
          listener(result);
        }
      }
      this.animationFrameId = requestAnimationFrame(loop);
    };
    this.animationFrameId = requestAnimationFrame(loop);
  }

  public onPitch(listener: (res: PitchDetectionResult) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public getCurrentPitch(): PitchDetectionResult {
    return this.pitchDetector.detect();
  }

  public playSyntheticNote(stringIndex: number, fret: number, durationSec = 1.0) {
    if (!this.guitarNode) return;
    const midi = [40, 45, 50, 55, 59, 64][stringIndex] + fret;
    this.guitarNode.port.postMessage({
      type: 'notes',
      notes: [
        {
          string: stringIndex,
          fret,
          midi,
          at: 0,
          vel: 0.8,
          len: durationSec,
          attack: 0, // Pick
        },
      ],
    });
  }
}

export const audio = new AudioEngine();
