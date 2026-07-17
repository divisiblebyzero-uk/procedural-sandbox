// Define custom types for strict compiler checks
export type KeyType = 'major' | 'minor';

export interface ScaleKey {
  name: string;
  type: KeyType;
}

export type CadenceName = 'PERFECT' | 'IMPERFECT' | 'PLAGAL' | 'INTERRUPTED';

export interface CadenceFormula {
  name: string;
  finalChords: string[];
  allowedPreceding: string[];
}

// MIDI Note number offsets relative to C (C = 0)
export const NOTE_OFFSETS: Record<string, number> = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 
  'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 
  'A#': 10, 'Bb': 10, 'B': 11
};

// Scale interval steps (semitones from the tonic root)
export const SCALE_INTERVALS: Record<KeyType, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],                 // Natural Major
  minor: [0, 2, 3, 5, 7, 8, 11]                 // Harmonic Minor (raised 7th for functional chord logic)
};

// Available keys for the test generation
export const AVAILABLE_KEYS: ScaleKey[] = [
  { name: 'C', type: 'major' },
  { name: 'G', type: 'major' },
  { name: 'D', type: 'major' },
  { name: 'A', type: 'major' },
  { name: 'F', type: 'major' },
  { name: 'Bb', type: 'major' },
  { name: 'Eb', type: 'major' },
  { name: 'A', type: 'minor' },
  { name: 'E', type: 'minor' },
  { name: 'D', type: 'minor' },
  { name: 'G', type: 'minor' }
];

export interface ChordFormula {
  label: string;
  degree: number;
  bass: number;
  structureMajor: number[]; // Intervals above bass note in Major keys
  structureMinor: number[]; // Intervals above bass note in minor keys
}

// Programmatic initialization to completely bypass text rendering glitches
export const ALLOWED_CHORDS: Record<string, ChordFormula> = {};

// --- TONIC CHORDS ---
ALLOWED_CHORDS['I'] = {
  label: 'Tonic (Root)', degree: 0, bass: 0,
  structureMajor: Array.of(0, 4, 7, 12), // [Root, 3rd, 5th, Octave Root]
  structureMinor: Array.of(0, 3, 7, 12)  // Minor 3rd
};
ALLOWED_CHORDS['Ib'] = {
  label: 'Tonic (1st Inv)', degree: 0, bass: 2,
  structureMajor: Array.of(4, 7, 12, 16), // 3rd in bass, others stacked up
  structureMinor: Array.of(3, 7, 12, 15)
};
ALLOWED_CHORDS['Ic'] = {
  label: 'Tonic (2nd Inv)', degree: 0, bass: 4,
  structureMajor: Array.of(7, 12, 16, 19), // 5th in bass
  structureMinor: Array.of(7, 12, 15, 19)
};

// --- SUPERTONIC CHORDS ---
ALLOWED_CHORDS['II'] = {
  label: 'Supertonic (Root)', degree: 1, bass: 1,
  structureMajor: Array.of(2, 5, 9, 14),
  structureMinor: Array.of(2, 5, 8, 14)
};
ALLOWED_CHORDS['IIb'] = {
  label: 'Supertonic (1st Inv)', degree: 1, bass: 3,
  structureMajor: Array.of(5, 9, 14, 17),
  structureMinor: Array.of(5, 8, 14, 17)
};

// --- SUBDOMINANT CHORDS ---
ALLOWED_CHORDS['IV'] = {
  label: 'Subdominant (Root)', degree: 3, bass: 3,
  structureMajor: Array.of(5, 9, 12, 17),
  structureMinor: Array.of(5, 8, 12, 17)
};

// --- DOMINANT CHORDS ---
ALLOWED_CHORDS['V'] = {
  label: 'Dominant (Root)', degree: 4, bass: 4,
  structureMajor: Array.of(7, 11, 14, 19),
  structureMinor: Array.of(7, 11, 14, 19) // Raised 3rd for harmonic minor
};
ALLOWED_CHORDS['Vb'] = {
  label: 'Dominant (1st Inv)', degree: 4, bass: 6,
  structureMajor: Array.of(11, 14, 19, 23),
  structureMinor: Array.of(11, 14, 19, 23)
};
ALLOWED_CHORDS['Vc'] = {
  label: 'Dominant (2nd Inv)', degree: 4, bass: 1,
  structureMajor: Array.of(14, 19, 23, 26),
  structureMinor: Array.of(14, 19, 23, 26)
};
ALLOWED_CHORDS['V7'] = {
  label: 'Dominant 7th (Root)', degree: 4, bass: 4,
  structureMajor: Array.of(7, 11, 14, 17), // Includes minor 7th
  structureMinor: Array.of(7, 11, 14, 17)
};

// --- SUBMEDIANT CHORDS ---
ALLOWED_CHORDS['VI'] = {
  label: 'Submediant (Root)', degree: 5, bass: 5,
  structureMajor: Array.of(9, 12, 16, 21),
  structureMinor: Array.of(9, 13, 16, 21)
};





// Cadence formulas permitted by the syllabus
export const CADENCE_TYPES: Record<CadenceName, CadenceFormula> = {
  PERFECT: {
    name: 'Perfect',
    finalChords: ['I', 'Ib', 'Ic'],
    allowedPreceding: ['V', 'Vb', 'Vc']
  },
  IMPERFECT: {
    name: 'Imperfect',
    finalChords: ['V', 'Vb', 'Vc'],
    allowedPreceding: ['I', 'Ib', 'II', 'IIb', 'IV', 'VI']
  },
  PLAGAL: {
    name: 'Plagal',
    finalChords: ['I'],
    allowedPreceding: ['IV']
  },
  INTERRUPTED: {
    name: 'Interrupted',
    finalChords: ['VI'],
    allowedPreceding: ['V']
  }
};

// 2025/2026 simplified Roman numerals list (removes specific inversion characters)
export const SYLLABUS_2025_CHORDS = ['I', 'II', 'IV', 'V', 'VI'];

// 2027/2028 complete Roman numerals list (with specific inversion layout suffixes)
export const SYLLABUS_2027_CHORDS = ['I', 'Ib', 'Ic', 'II', 'IIb', 'IV', 'V', 'Vb', 'Vc', 'VI'];

export interface ModulationDestination {
  name: string;      // e.g., "Dominant", "Relative Minor"
  type: KeyType;     // 'major' or 'minor'
  semitoneOffset: number; // Semitones away from the starting root
}

// Syllabus Rules: Major starting key destinations
export const MAJOR_MODULATIONS: ModulationDestination[] = [
  { name: 'Dominant', type: 'major', semitoneOffset: 7 },     // C Major -> G Major
  { name: 'Subdominant', type: 'major', semitoneOffset: 5 },  // C Major -> F Major
  { name: 'Relative Minor', type: 'minor', semitoneOffset: 9 } // C Major -> A Minor
];

// Syllabus Rules: Minor starting key destinations
export const MINOR_MODULATIONS: ModulationDestination[] = [
  { name: 'Dominant', type: 'minor', semitoneOffset: 7 },     // A Minor -> E Minor
  { name: 'Subdominant', type: 'minor', semitoneOffset: 5 },  // A Minor -> D Minor
  { name: 'Relative Major', type: 'major', semitoneOffset: 3 } // A Minor -> C Major
];
