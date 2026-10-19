---
name: guitar-tab-engine
description: "Parse, align, and render guitar tabulatures (Guitar Pro GPX/GP5, MusicXML, AlphaTab), DTW beat synchronization, audio stem transient matching, and fretboard fingering optimization. Use when working on audio-to-tab pipelines, tab parsers, or score sync."
category: music
risk: safe
tags: [guitar, tabulature, gpx, alpha-tab, dtw, audio-to-tab, musicxml]
tools: [claude, codex, antigravity]
---

# Guitar Tab Engine Skill

Comprehensive guide for parsing, generating, aligning, and rendering guitar tablatures, Guitar Pro files, and synchronizing tabs to audio stems with sub-millisecond precision.

## Key Capabilities

1. **Format Parsers**: Guitar Pro (.gp, .gpx, .gp5, .gp4, .gp3) and MusicXML.
2. **Audio-to-Tab Alignment**: Dynamic Time Warping (DTW) and onset transient detection.
3. **Ergonomic Fingering Solver**: Translating MIDI pitch streams into comfortable physical string/fret configurations.
4. **Interactive Tab Rendering**: AlphaTab canvas/SVG integration with real-time playhead tracking.

---

## 1. Ergonomic Guitar Fingering Solver

A single musical pitch can be played in multiple positions on the guitar neck (e.g., Middle C / C4 / MIDI 60 can be played on String 2 Fret 1, String 3 Fret 5, String 4 Fret 10, or String 5 Fret 15).

### Position Optimization Cost Function
To select optimal string/fret combinations for a melody:
$$\text{Cost} = w_{\text{stretch}} \cdot \Delta_{\text{fret}} + w_{\text{string}} \cdot \Delta_{\text{string}} + w_{\text{shift}} \cdot |\text{HandPosition}_{t} - \text{HandPosition}_{t-1}|$$

* Fret distance: penalize spreads exceeding 4 frets without an index barre.
* String distance: prefer staying within adjacent strings during fast arpeggios.
* Hand position: anchor hand around 4-fret boxes (e.g., Position I: frets 1-4, Position V: frets 5-8).

---

## 2. Dynamic Time Warping (DTW) Audio-to-Tab Sync

When aligning an imported MP3/WAV backing track with an existing GPX or MusicXML tabulature:

```typescript
export interface TabNoteEvent {
  timeMs: number;
  string: number; // 0 to 5 (0 = Low E)
  fret: number;
  durationMs: number;
  velocity: number;
}

export function alignTabToAudioOnsets(
  tabEvents: TabNoteEvent[],
  audioTransientsMs: number[],
  maxDriftMs: number = 150
): TabNoteEvent[] {
  return tabEvents.map((event) => {
    // Find closest audio transient within window
    const closestTransient = audioTransientsMs.reduce((prev, curr) => {
      return Math.abs(curr - event.timeMs) < Math.abs(prev - event.timeMs) ? curr : prev;
    }, audioTransientsMs[0]);

    if (Math.abs(closestTransient - event.timeMs) <= maxDriftMs) {
      return { ...event, timeMs: closestTransient };
    }
    return event;
  });
}
```

---

## 3. AlphaTab React Integration Pattern

For embedding full interactive sheet music / tab notation:
* Initialize `@coderline/alphatab` inside a dedicated container element.
* Set `player.soundFont` for synthetic playback.
* Subscribe to `player.timeChanged` to drive 3D note highway synchronization.
