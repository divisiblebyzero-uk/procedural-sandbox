import { 
  AVAILABLE_KEYS, 
  NOTE_OFFSETS, 
  ALLOWED_CHORDS, 
  CADENCE_TYPES
} from '../constants/musicTheory';

import type { 
  ScaleKey, 
  CadenceName 
} from '../constants/musicTheory';

export interface GeneratedQuestion {
  key: ScaleKey;
  cadenceType: string;
  chordSymbols: string[]; 
  keyChordMidi: number[]; 
  progressionMidi: number[][]; 
}

/**
 * Restricts any chord voice to stay strictly within Octaves 3 to 5 (MIDI 48 - 83)
 */
function restrictToOctaveRange(notesArray: number[]): number[] {
  return notesArray.map((note: number, idx: number) => {
    let processed = note;
    if (idx === 0) {
      // Left-Hand Bass Note: Keep anchored in Octave 3 (MIDI 48 - 59)
      while (processed > 59) processed -= 12;
      while (processed < 48) processed += 12;
    } else {
      // Right-Hand Upper Voices: Keep balanced in Octaves 4 and 5 (MIDI 60 - 83)
      while (processed > 83) processed -= 12;
      while (processed < 60) processed += 12;
    }
    return processed;
  }).sort((a, b) => a - b);
}

/**
 * Dynamically builds a single chord from semitone offsets and clamps it inside the target range
 */
function buildChordMidi(chordSymbol: string, keyCenterMidi: number, keyType: 'major' | 'minor', forceRootPosition: boolean): number[] {
  let targetSymbol = chordSymbol;
  
  // If forced to root position, strip inversion suffixes
  if (forceRootPosition) {
    if (targetSymbol.startsWith('V7')) targetSymbol = 'V7';
    else if (targetSymbol.startsWith('I')) targetSymbol = 'I';
    else if (targetSymbol.startsWith('II')) targetSymbol = 'II';
    else if (targetSymbol.startsWith('IV')) targetSymbol = 'IV';
    else if (targetSymbol.startsWith('V')) targetSymbol = 'V';
    else if (targetSymbol.startsWith('VI')) targetSymbol = 'VI';
  }

  const formula = ALLOWED_CHORDS[targetSymbol];
  if (!formula) throw new Error(`Chord symbol ${targetSymbol} not found.`);

  const offsetsArray = keyType === 'major' ? formula.structureMajor : formula.structureMinor;
  const rawNotes = offsetsArray.map((offset: number) => keyCenterMidi + offset);
  
  return restrictToOctaveRange(rawNotes);
}

/**
 * Generates an analytical question, adjusting chords based on grade limits and easy mode settings
 */
export function generateQuestion(forceRootPosition: boolean = false, grade: number = 8): GeneratedQuestion {
  const randomKey = AVAILABLE_KEYS[Math.floor(Math.random() * AVAILABLE_KEYS.length)];
  const keyCenterMidi = 60 + NOTE_OFFSETS[randomKey.name];

  let selectedCadenceType = '';
  let selectedProgression: string[] = [];

  // --- FIX: Explicit isolation paths for Grade 6 to completely prevent randomizer loop hijacking ---
  if (grade === 6) {
    // Grade 6: 50% chance for Perfect (V -> I) or Imperfect (I -> V or IV -> V)
    const isPerfect = Math.random() > 0.5;
    
    if (isPerfect) {
      selectedCadenceType = 'Perfect';
      selectedProgression = Array.of('V', 'I');
    } else {
      selectedCadenceType = 'Imperfect';
      // Alternate between the two most common root forms of imperfect cadences
      selectedProgression = Math.random() > 0.5 ? Array.of('I', 'V') : Array.of('IV', 'V');
    }
  } 
  else if (grade === 7) {
    // Grade 7: Perfect (V->I), Imperfect (I/IV->V), or Interrupted (V->VI)
    const rand = Math.random();
    if (rand < 0.34) {
      selectedCadenceType = 'Perfect';
      selectedProgression = Array.of('V', 'I');
    } else if (rand < 0.67) {
      selectedCadenceType = 'Imperfect';
      selectedProgression = Math.random() > 0.5 ? Array.of('I', 'V') : Array.of('IV', 'V');
    } else {
      selectedCadenceType = 'Interrupted';
      selectedProgression = Array.of('V', 'VI');
    }
  } 
  else {
    // Grade 8: Advanced open fallback framework tracking all inversions
    let cadenceKeys = Object.keys(CADENCE_TYPES) as CadenceName[];
    const randomCadenceKey = cadenceKeys[Math.floor(Math.random() * cadenceKeys.length)];
    const cadenceFormula = CADENCE_TYPES[randomCadenceKey];
    
    selectedCadenceType = cadenceFormula.name;

    // --- FIX: Filter out inverted chords if forceRootPosition (Easy Mode) is true ---
    let finalChordsPool = cadenceFormula.finalChords;
    let precedingChordsPool = cadenceFormula.allowedPreceding;
    let openingChordsPool = ['I', 'Ib', 'IV'];

    if (forceRootPosition) {
      // Strip any chords containing lowercase inversion modifiers ('b', 'c')
      finalChordsPool = finalChordsPool.filter((c: string) => !c.includes('b') && !c.includes('c'));
      precedingChordsPool = precedingChordsPool.filter((c: string) => !c.includes('b') && !c.includes('c'));
      openingChordsPool = openingChordsPool.filter((c: string) => !c.includes('b') && !c.includes('c'));
    }

    // Safety Fallbacks: If filtering leaves a pool completely empty, revert to standard root chords
    if (finalChordsPool.length === 0) finalChordsPool = ['I'];
    if (precedingChordsPool.length === 0) precedingChordsPool = ['V'];

    const finalChord = finalChordsPool[Math.floor(Math.random() * finalChordsPool.length)];
    const precedingChord = precedingChordsPool[Math.floor(Math.random() * precedingChordsPool.length)];
    
    // Ensure the opening chord is unique and doesn't clone the middle chord
    const validOpeners = openingChordsPool.filter((c: string) => c !== precedingChord); 
    // Final defensive check if filtering cleared out options completely
    const chosenOpeners = validOpeners.length > 0 ? validOpeners : openingChordsPool;
    const openingChord = chosenOpeners[Math.floor(Math.random() * chosenOpeners.length)];
    
    selectedProgression = Array.of(openingChord, precedingChord, finalChord);
  }


  // Enforce root positioning clean-ups 
  const effectiveRootPositionFlag = forceRootPosition || grade === 6 || grade === 7;

  if (effectiveRootPositionFlag) {
    selectedProgression = selectedProgression.map(sym => {
      if (sym.startsWith('V7')) return 'V7';
      if (sym.startsWith('VI')) return 'VI'; 
      if (sym.startsWith('V')) return 'V';
      if (sym.startsWith('IV')) return 'IV';
      if (sym.startsWith('II')) return 'II';
      if (sym.startsWith('I')) return 'I';
      return 'I';
    });
  }

  const keyChordMidi = buildChordMidi('I', keyCenterMidi, randomKey.type, false);
  
  // FIX: Map over selectedProgression using buildChordMidi with the correct arguments
  const progressionMidi = selectedProgression.map((chordSymbol: string) => {
    return buildChordMidi(chordSymbol, keyCenterMidi, randomKey.type, false); 
  });

  // 2. Clear out the unused/broken function calls and return the compiled structure cleanly
  return {
    key: randomKey,
    cadenceType: selectedCadenceType,
    chordSymbols: selectedProgression, // Controls the text display array ("I — IV — V")
    progressionMidi,                  // Controls the audio output matrix array
    keyChordMidi: keyChordMidi         // Uses your local line 155 variable to clear the warning!
  };
}