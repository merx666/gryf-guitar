# Design System: Gryf — Rocksmith+ Web Guitar
**Project ID:** 15861067580094713309

## 1. Visual Theme & Atmosphere
Gryf embodies the high-voltage atmosphere of a darkened arena stage blended with the precision of a modern digital audio workstation (DAW). The aesthetic philosophy draws inspiration from vintage tube amplifiers, monolithic concert stage backdrops, and the neon phosphor feedback of 3D music simulation highways like Rocksmith+.

The mood is raw yet surgical: deep obsidian negative space allows searing neon string colors and warm amber tube filaments to pop with razor-sharp clarity. Monolithic vertical slices dominate the navigation, creating an imposing architectural rhythm reminiscent of Marshall amplifier stacks and concert lighting trusses. Motion is snappy and physical, featuring skewed ribbon headers, instantaneous string vibration responses under 5ms, and cascading gemstone note projections designed to eliminate visual latency and keep guitarists locked in rhythm.

## 2. Color Palette & Roles

### Base Atmosphere & Surfaces
* **Deep Void Obsidian (`#0b0907`)**: Canvas background and infinite void. Grounds all interfaces and gives the 3D note highway infinite depth.
* **Charcoal Amp Chassis (`#110e0b`)**: Surface level for accordion slices, elevated cards, and mixer panels.
* **Warm Metal Rim (`#1a1612`)**: Secondary panel fill for active states, recessed sliders, and waveform tracks.
* **Tolex Textured Surface (`#241e18`)**: Hover states, dropdown menus, and modal dialog overlays.

### Accents & Brand Energy
* **Stage Spotlight Crimson (`#e0392b`)**: Primary call-to-action button color, urgent warning alerts, low-E string highway laser, and live stage glow.
* **Vintage Vacuum Tube Amber (`#e2b04a`)**: Gryf PRO tier badge, streak multiplier counters, mastery stars, and high-impact micro-interactions.
* **Stage Phosphor Green (`#58c46c`)**: Perfect pitch lock indicator, active tuner checkmarks, stem solo state, and completed track status.
* **Electric Overdrive Cyan (`#38bdf8`)**: Real-time microphone audio input scope, latency diagnostics, and tempo sync metronome tick.

### Typography & Dividers
* **Cream Parchment (`#f2ead8`)**: Primary typography, headers, fret numbers, and active navigation titles. High-contrast readability against dark charcoal.
* **Dimmed Silver Cream (`rgba(242, 234, 216, 0.7)`)**: Secondary body copy, song artist credits, subtitle labels, and inactive track indicators.
* **Muted Carbon Ash (`rgba(242, 234, 216, 0.4)`)**: Tertiary helper text, shortcut keys, and inactive string indicators.
* **Hairline Rule Filament (`rgba(242, 234, 216, 0.13)`)**: 1px structural container borders, fret markers, tab dividers, and waveform grid coordinates.

### Rocksmith+ Standard 6-String Color Protocol
* **String 6 (Low E) - Crimson Flame (`#e0392b`)**: Thickest wound gauge, foundation bass notes.
* **String 5 (A) - Goldenrod Amber (`#eab308`)**: Rhythm power chords and lower mid-range.
* **String 4 (D) - Electric Azure (`#3b82f6`)**: Center core string, clear harmonic visibility.
* **String 3 (G) - Molten Sunset Orange (`#f97316`)**: Blues bends and lead melody transition string.
* **String 2 (B) - Neon Emerald (`#22c55e`)**: High harmonic register and lead runs.
* **String 1 (High e) - Violet Laser (`#a855f7`)**: Thinnest unwound gauge, piercing solo notes.

## 3. Typography Rules
* **Display & Hero Headings (`Big Shoulders Display`, `Oswald`, sans-serif)**:
  * Weight: Black 900.
  * Transformation: Uppercase.
  * Letter-spacing: Tightened (`-0.02em` to `0em`) to create tall, authoritative typographic walls that mirror rock festival lineup posters.
  * Usage: Main section titles, song names, streak counters, and slice accordion title ribbons.
* **Subheadings, Badges & Category Labels (`Barlow Condensed`, sans-serif)**:
  * Weight: Bold 700.
  * Transformation: Uppercase.
  * Letter-spacing: Expanded (`+0.12em` to `+0.2em`) for maximum legibility at small sizes.
  * Usage: Stage slices category badges, Gryf PRO indicators, difficulty ratings, audio sample rate readouts, and tuner note names.
* **Body Text & Tabulature Notation (`Barlow`, system-ui, sans-serif)**:
  * Weight: Regular 400 and Medium 500.
  * Transformation: Sentence case.
  * Letter-spacing: Natural (`0em`).
  * Usage: Song descriptions, feature explanations, modal instructions, settings menus, and chord chart fingerings.

## 4. Component Stylings

* **Stage Slices Accordion**:
  * Geometry: Sharp, vertical monolithic columns (`rounded-none`).
  * Interaction: Expands on hover or focus to reveal full stage artwork with 30-degree slice skew (`skew-x-[-4deg]`), high-contrast dark vignette, and animated vertical text ribbons.
  * Lighting: Ambient radial gradient emanating from the bottom-center mimicking floor footlights.

* **Action Buttons & CTA Ribbons**:
  * Shape: Sharp rectangular with subtle chamfers (`rounded-sm` or `rounded-none`).
  * Surface: High-voltage Stage Spotlight Crimson (`#e0392b`) or Vintage Vacuum Tube Amber (`#e2b04a`) with inner top-edge 1px highlight (`inset 0 1px 0 rgba(255, 255, 255, 0.2)`).
  * Hover & Active: Instantaneous 2px forward scale, illuminated neon drop shadow (`0 0 25px rgba(224, 57, 43, 0.6)`), and high-frequency sound feedback.

* **Cards & DAW Containers**:
  * Geometry: Clean precision squared edges (`rounded-sm`).
  * Background: Layered Charcoal Amp Chassis (`#110e0b`) with a faint 1px border filament (`rgba(242, 234, 216, 0.12)`).
  * Shadow Depth: Deep concert shadows (`0 20px 40px rgba(0, 0, 0, 0.8)`), isolating interactive components from the background canvas.

* **Inputs & Audio Upload Troughs**:
  * Shape: Subtly rounded corners (`rounded-md`).
  * Background: Deep recessed black well (`#080605`) with 1px hairline border (`rgba(242, 234, 216, 0.15)`).
  * Focus State: Border transitions to Vacuum Tube Amber (`#e2b04a`) accompanied by a subtle 4px outer bloom (`0 0 0 3px rgba(226, 176, 74, 0.2)`).

* **Rocksmith+ 3D Note Highway**:
  * Fretboard: Ebony woodgrain perspective plane with realistic vanishing point perspective (`perspective: 1000px; rotateX(62deg)`).
  * Fret Bars: Metallic nickel-silver lines placed with true logarithmic acoustic spacing.
  * Inlays: Mother-of-pearl diamond markers on frets 3, 5, 7, 9, 15, 17, 19, 21, and dual markers on octave fret 12.
  * Note Gems: 3D beveled gemstones color-coded to the 6 strings, displaying embossed fret numbers, connected by vibrant sustain tails.
  * Hit Line & Feedback: Pulsing laser hit zone at the bottom of the screen with particle spark bursts, flame streak crowns, and physical string bounce animations upon detection.

* **AI Audio-to-Tab Studio & Multi-Track Mixer**:
  * Track Lanes: Dual stacked high-fidelity waveform visualizers (Master Mix track and Demucs-separated Isolated Guitar Stem).
  * Solo / Mute Toggles: Circular mechanical toggle buttons with Stage Phosphor Green (`#58c46c`) active glow ring.
  * Timeline Playhead: 5ms dynamic time-warping scrub head with glowing amber cursor and millimeter-accurate beat marker snaps.

## 5. Layout Principles
* **Full-Bleed Panoramic Viewports**: The app occupies 100% of viewport width and height (`100vw`, `100vh`), eliminating standard window scrollbars in favor of immersive DAW-style workspaces.
* **Monolithic Vertical Slices**: High-level navigation is split across panoramic horizontal slices that breathe dynamically, ensuring instantaneous 1-click access to Play, Songs, AI Studio, Gear, and Profile.
* **Persistent Performance HUD**: Top navigation bar remains docked at all times with real-time audio oscilloscopes, pitch detection status, active latency meters, and profile level badges.
* **Strict Pro-Touch Target Standard**: All interactive triggers maintain an absolute minimum hit target of 44px by 44px, ensuring swift and error-free operation whether using mouse clicks or touchscreen interfaces.
