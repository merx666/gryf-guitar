---
name: rocksmith-highway-engine
description: "Build high-FPS 3D guitar note highways, WebGL/Three.js/Canvas fretboard projection, audioContext clock synchronization, particle hit effects, and note gem instancing. Use when developing 3D rhythm game highways, guitar simulations, or real-time note gem rendering."
category: game-development
risk: safe
tags: [threejs, webgl, canvas, rocksmith, note-highway, rhythm-game, guitar]
tools: [claude, codex, antigravity]
---

# Rocksmith Highway Engine Skill

Architectural and mathematical guide for engineering high-FPS, zero-jitter 3D guitar note highways inspired by Rocksmith+ and Guitar Hero.

## 1. Mathematical Fretboard Perspective Projection

### Logarithmic Acoustic Fret Spacing
Real guitar fret distances from the nut follow the twelfth root of two ($2^{1/12} \approx 1.05946$):
$$x_n = L \cdot \left(1 - 2^{-n/12}\right)$$
Where $L$ is the vibrating scale length (typically $648\text{ mm}$ for Fender, $628\text{ mm}$ for Gibson).

### 3D Highway Perspective Transform
Transforming 2D timeline note coordinates $(t, \text{string})$ into 3D highway coordinates $(x, y, z)$:
* **$z$ axis (Depth into screen)**:
  $$z = \frac{t_{\text{note}} - t_{\text{current}}}{T_{\text{lookahead}}}$$
  Where $T_{\text{lookahead}}$ is typically $2.0$ to $3.5$ seconds.
* **$y$ axis (Fretboard width with vanishing perspective)**:
  $$\text{scale}(z) = \frac{1}{1 + k_{\text{persp}} \cdot z}$$
  $$x_{\text{screen}} = x_{\text{center}} + (x_{\text{string}} - x_{\text{center}}) \cdot \text{scale}(z)$$

---

## 2. AudioContext Time Synchronization Invariant

**CRITICAL RULE**: Never drive the highway position using `performance.now()` or `Date.now()`. Audio output buffers suffer from slight OS clock drifts that cause visual note stutter.

ALWAYS sample time from the running Web Audio hardware context:
```typescript
function getCurrentPlayheadSeconds(audioCtx: AudioContext, audioStartTime: number): number {
  if (audioCtx.state !== 'running') return 0;
  return audioCtx.currentTime - audioStartTime;
}
```

---

## 3. Physical String Vibration Model

When a note is struck correctly, simulate physical string oscillation via an exponentially damped harmonic oscillator:
$$y_{\text{string}}(t) = A_0 \cdot e^{-\lambda t} \cdot \cos(2\pi f_0 t)$$
* $A_0$: initial pluck amplitude (in pixels, typically $4\text{px}$ to $8\text{px}$).
* $\lambda$: damping coefficient ($\approx 4.0$).
* $f_0$: visual oscillation frequency clamped for 60-120fps display ($\approx 25\text{Hz}$).

---

## 4. Standard Rocksmith Color Encoding

```typescript
export const ROCKSMITH_STRING_COLORS = {
  0: '#e0392b', // String 6 (Low E) - Red
  1: '#eab308', // String 5 (A)     - Yellow
  2: '#3b82f6', // String 4 (D)     - Blue
  3: '#f97316', // String 3 (G)     - Orange
  4: '#22c55e', // String 2 (B)     - Green
  5: '#a855f7', // String 1 (High e) - Purple
} as const;
```

---

## 5. Hit Accuracy Windows

* **PERFECT (Streak x4)**: $\pm 35\text{ ms}$ (triggers particle sparks + flame crown).
* **GOOD (Streak x2)**: $\pm 75\text{ ms}$ (triggers standard string glow).
* **MISS (Resets streak)**: $> 75\text{ ms}$ late or note gem crosses hit line unplayed.
