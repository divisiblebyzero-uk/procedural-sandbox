// src/types.ts
export interface NotePayload {
  pitches: string[];    // 🌟 Array of strings: e.g., ["C4", "E4", "G4"]
  vexKeys: string[];    // 🌟 Array of strings: e.g., ["c/4", "e/4", "g/4"]
  duration: string;     // "q", "8", "w"
  beats: number;        // 1.0, 0.5, 4.0
  chordSymbol?: string; 
}

export interface SandboxComposition {
  melody: NotePayload[];
  bass: NotePayload[];
}

export interface SandboxInput {
  key: string;              // "C Major", "A minor"
  chordSequence: string[];  // ["I", "IV", "V", "I"]
  bassStyle: 'Alberti' | 'Figured' | 'Block';
  complexity: number;       // Step constraint interval size
  modulationType: 'None' | 'Dominant' | 'Subdominant' | 'Relative'; // 🌟 Added
}
