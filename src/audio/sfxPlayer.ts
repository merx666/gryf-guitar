// Proceduralny odtwarzacz efektów dźwiękowych interfejsu (SFX)
// Wykorzystuje wyekstrahowany z REA sfxWorker.js oparty na fizycznej syntezie

export type SfxId =
  | 'select'
  | 'confirm'
  | 'back'
  | 'tap'
  | 'toggleOn'
  | 'toggleOff'
  | 'swipe'
  | 'streak'
  | 'miss'
  | 'levelUp'
  | 'inTune'
  | 'start'
  | 'click_subtle'
  | 'hit_perfect'
  | 'hit_good'
  | 'hit_miss'
  | 'song_complete';

class SfxPlayer {
  private worker: Worker | null = null;
  private ctx: AudioContext | null = null;
  private soundBuffers = new Map<string, AudioBuffer>();
  private pendingRequests = new Map<string, { resolve: (buf: AudioBuffer) => void }>();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    try {
      this.worker = new Worker('/workers/sfxWorker.js');
      this.worker.onmessage = (e) => {
        const { key, channels } = e.data;
        if (!this.ctx || !channels || !channels.length) return;

        const buffer = this.ctx.createBuffer(
          channels.length,
          channels[0].length,
          this.ctx.sampleRate
        );

        for (let ch = 0; ch < channels.length; ch++) {
          buffer.copyToChannel(channels[ch], ch);
        }

        this.soundBuffers.set(key, buffer);
        const pending = this.pendingRequests.get(key);
        if (pending) {
          pending.resolve(buffer);
          this.pendingRequests.delete(key);
        }
      };
    } catch (err) {
      console.warn('Nie udało się załadować sfxWorker.js:', err);
    }
  }

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx({ latencyHint: 'interactive' });
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public async play(rawId: SfxId, variant = 0) {
    // Mapowanie aliasów
    let id: string = rawId;
    if (rawId === 'click_subtle') id = 'tap';
    else if (rawId === 'hit_perfect') id = 'confirm';
    else if (rawId === 'hit_good') id = 'select';
    else if (rawId === 'hit_miss') id = 'miss';
    else if (rawId === 'song_complete') id = 'levelUp';

    const ctx = this.ensureContext();
    const key = `${id}:${variant}:${ctx.sampleRate}`;

    let buffer = this.soundBuffers.get(key);
    if (!buffer && this.worker) {
      buffer = await new Promise<AudioBuffer>((resolve) => {
        this.pendingRequests.set(key, { resolve });
        this.worker?.postMessage({
          jobs: [{ id, variant, key, fs: ctx.sampleRate }],
          urgent: true,
        });
      });
    }

    if (!buffer) return;

    try {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const gain = ctx.createGain();
      gain.gain.value = 0.5;
      source.connect(gain);
      gain.connect(ctx.destination);
      source.start(0);
    } catch {
      // Ignoruj błędy odtwarzania w tle
    }
  }
}

export const sfx = new SfxPlayer();
