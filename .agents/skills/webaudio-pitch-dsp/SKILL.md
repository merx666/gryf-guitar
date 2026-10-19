---
name: webaudio-pitch-dsp
description: "Ultra-low latency Web Audio API pitch detection, AudioWorklet, YIN/ACF algorithms, guitar overtone filtering, and tuner DSP. Use when building real-time audio analyzers, tuner interfaces, or guitar pitch pipelines."
category: audio
risk: safe
tags: [webaudio, dsp, pitch-detection, guitar, yin, audioworklet]
tools: [claude, codex, antigravity]
---

# WebAudio Pitch DSP Skill

Expert guide for implementing ultra-low latency, real-time guitar pitch detection and audio DSP in modern web browsers using the Web Audio API and AudioWorklet.

## Core Architectural Invariants

### 1. Browser DSP Bypass
Default browser constraints destroy guitar harmonic richness. When acquiring microphone input for guitar analysis, ALWAYS disable speech processing filters:

```typescript
const stream = await navigator.mediaDevices.getUserMedia({
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    latency: 0,
    channelCount: 1,
    sampleRate: { ideal: 48000 }
  }
});
```

### 2. AudioWorklet Zero-Allocation Rule
Inside the `AudioWorkletProcessor.process()` callback:
- **NEVER** allocate objects, closures, or typed arrays.
- **NEVER** use `console.log` or synchronous locks.
- Pre-allocate a power-of-two circular ring buffer (`Float32Array(4096)`) in the constructor.
- Communicate with the main UI thread via `MessagePort` with Transferable buffers or `SharedArrayBuffer` with Atomics.

---

## Pitch Detection Algorithms for Guitar

### A. YIN Algorithm (Gold Standard for Guitar)
The YIN algorithm solves the fundamental octave-jumping problem in plucked strings:

1. **Difference Function**:
   $$d_t(\tau) = \sum_{j=1}^W (x_{t+j} - x_{t+j+\tau})^2$$

2. **Cumulative Mean Normalized Difference**:
   $$d_t'(\tau) = \begin{cases} 1 & \text{if } \tau = 0 \\ \frac{d_t(\tau)}{\frac{1}{\tau} \sum_{j=1}^\tau d_t(j)} & \text{otherwise} \end{cases}$$

3. **Absolute Thresholding**: Select lowest $\tau$ where $d_t'(\tau) < \text{threshold}$ (typically `0.10` to `0.15`).
4. **Parabolic Interpolation**: Refine peak position with neighboring points:
   $$\delta = \frac{d(\tau+1) - d(\tau-1)}{2(2 d(\tau) - d(\tau-1) - d(\tau+1))}$$
   $$\tau_{\text{refined}} = \tau + \delta$$
   $$f_0 = \frac{\text{sampleRate}}{\tau_{\text{refined}}}$$

---

## Standard Guitar String Reference Table

| String | Name | Note | MIDI | Fundamental ($f_0$) | Valid Range (Hz) |
|---|---|---|---|---|---|
| 6 | Low E | E2 | 40 | 82.41 Hz | 75.0 – 95.0 Hz |
| 5 | A | A2 | 45 | 110.00 Hz | 95.0 – 128.0 Hz |
| 4 | D | D3 | 50 | 146.83 Hz | 128.0 – 170.0 Hz |
| 3 | G | G3 | 55 | 196.00 Hz | 170.0 – 220.0 Hz |
| 2 | B | B2 | 59 | 246.94 Hz | 220.0 – 285.0 Hz |
| 1 | High e| E4 | 64 | 329.63 Hz | 285.0 – 380.0 Hz |

### Calculating Cents Deviation
```typescript
export function getCentsDeviation(detectedFreq: number, targetFreq: number): number {
  return Math.round(1200 * Math.log2(detectedFreq / targetFreq));
}
```

---

## Noise Gate & Octave Jump Rejection

1. **RMS Energy Gate**:
   Calculate Root Mean Square energy. If $\text{RMS} < 0.015$, treat signal as silence or noise floor to prevent false triggers.
2. **Subharmonic Verification**:
   Guitar strings (especially low E and A) have strong 2nd harmonics ($2f_0$). When detecting $164.8\text{ Hz}$, verify if an $82.4\text{ Hz}$ periodic minimum exists in the YIN buffer before committing to E3 instead of E2.
