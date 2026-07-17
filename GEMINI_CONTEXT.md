# 🎹 Procedural Composition Sandbox (`procedural-sandbox`) Context

> **Instructions for the AI:** Initialize context for the 'Procedural Composition Sandbox' experiment. This project is a separate React/TypeScript/Vite web application exploring procedural music generation logic before bundling it into the main offline native app `ws-at` (Divisible By Zero Audio Trainer).

## 🚀 Project Overview
* **Name:** Procedural Composition Sandbox
* **Stack:** React, TypeScript, Vite, VexFlow 4.2.3, Web Audio API (Vanilla).
* **Core Philosophy:** Pure frontend experiment, 100% offline, zero-data, high-performance audio/visual synchronization.
* **Goal:** Create music procedurally based on user inputs (Key, Chord progression, Bass style, Complexity bounds, Modulation path) for ABRSM Grade 8 training simulation.

## 🛠 Active Technical Architecture & Invariants

### 1. Data Structure Model (`src/types.ts`)
```typescript
export interface NotePayload {
  pitches: string[];    // Supports multi-note chords e.g., ["C4", "E4", "G4"]
  vexKeys: string[];    // VexFlow 4 compliant names e.g., ["c/4", "e/4", "g/4"]
  duration: string;     // Rhythm tokens: "q" (crotchet/quarter), "8" (quaver/eighth), "w" (whole)
  beats: number;        // Numerical length value: 1.0 = crotchet, 0.5 = quaver, 4.0 = whole
  chordSymbol?: string; // Optional Roman numeral label metadata (e.g., "I", "IV", "V")
}

export interface SandboxComposition {
  melody: NotePayload[];
  bass: NotePayload[];
}

export interface SandboxInput {
  key: string;              // e.g., "C Major", "A minor"
  chordSequence: string[];  // e.g., ["I", "IV", "V", "I"]
  bassStyle: 'Alberti' | 'Figured' | 'Block';
  complexity: number;       // Step constraint interval size (2 to 4)
  modulationType: 'None' | 'Dominant' | 'Subdominant' | 'Relative';
}
```

### 2. Composition Generation Engine (`src/utils/proceduralEngine.ts`)
* **Melody Rules:** Operates on time-balancing logic. Every bar fills exactly 4.0 beats. Quavers (`'8'`) have a 50% generation probability on open space, grouping into pairs of 0.5 beats. Notes must move step-wise up/down by random intervals of 2 to `complexity`. Bars must end on core chord tones.
* **Chord Injections:** On beat 0 of every measure (and trailing beats leading into modulations in bar 3), the engine builds actual 4-note polyphonic chords `[Root, Third, Fifth, Octave Root]` directly derived from scale steps.
* **Grade 8 Modulation & Accidentals:** Bar 3 calculates an active tonal pivot based on the `modulationType`. Minor-mode invariants are explicitly checked: dominant `V` harmonies dynamically force a raised leading tone (e.g., changing `G4` to `G#4` in A minor scale tracking arrays).

### 3. Visual Music Score Engraver (`src/components/VexFlowScore.tsx`)
* **Version Lock:** Enforces **VexFlow 4.2.3** specifically. Version 5 requires cloud font files; version 4 houses vectors inline, keeping the tool 100% offline-compatible.
* **Layout Constraints:** Renders a classical Grand Stave system using an explicit sidebar layout. Clefs and time signatures render *only* on bar 1. Horizontal dimensions are strictly balanced per system (`240px` for measure 1 to handle clefs, `170px` for structural measures 2-4).
* **Engraving Standard (Stem Directions):** Automatic layout direction thresholds check pitches. Treble notes under B4 and bass notes under D3 flip stems up (`1`), while notes on or above those thresholds flip down (`-1`).
* **Dynamic Repaint Tracking:** To prevent layout distortion or notes changing sizes on selection shifts, the component resets and completely repaints the entire 4-bar SVG vector block synchronously using a single formatting layout whenever `activeBeatIndex` updates from the controller thread.

### 4. Synthesizer & Timing Scheduler (`src/utils/audioEngine.ts`)
* Uses browser-native `AudioContext` and vanilla Sine oscillators. High piano decay curves are emulated via custom linear/exponential gain nodes (attack at `+0.01`s, sustain held until 90% note duration, decay ringing over into next beat boundary for legato articulation).
* **Polyphonic Chord Processing:** The player evaluates note items by running a `.forEach` map directly on the `note.pitches` string arrays, firing off stacked frequency oscillators at the exact same point on the background timing thread.
* **Range Safety Rails:** The internal frequency map spans low bass roots up to top treble lines (`A1` to `D6`). A safety rail checks boundaries: any pitch out of map bounds is caught and shifted down an octave automatically before execution to prevent silent dropouts.
* **UI Synchronization:** Tracks real-time cursor highlighting by running explicit JS `setTimeout` callbacks inside the timing array, firing an `onBeatCallback` handler to notify parent React states of the exact active melody array index.

## 📋 Current Working Status
* **Clean Tree Architecture:** Unused boilerplate code (`App.css`, React/Vite logos) has been stripped out. 
* **Tailwind & CSS Variables:** Configured dark-theme styling parameters matching the styling guidelines of the master `ws-at` repository inside `src/index.css`.
* **Git Safety:** Main tracking trees committed and backed up cleanly on GitHub on branch `main` with local unneeded directories sandboxed via `.gitignore`.
