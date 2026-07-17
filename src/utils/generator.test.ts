// src/utils/generator.test.ts
import { describe, it, expect } from 'vitest';
import { generateQuestion } from './generator';

describe('Music Theory Generator Invariant Tests', () => {

  it('should generate advanced chord inversions for Grade 8 standard mode', () => {
    let hasFirstInversion = false;  // Tracks 'b' chords (e.g., Ib, Vb)
    let hasSecondInversion = false; // Tracks 'c' chords (e.g., Ic, Vc)

    for (let i = 0; i < 500; i++) {
      const question = generateQuestion(false, 8); // forceRootPosition = false

      question.chordSymbols.forEach((chord) => {
        if (chord.endsWith('b')) hasFirstInversion = true;
        if (chord.endsWith('c')) hasSecondInversion = true;
      });
    }

    // Ensures the generator successfully creates inversions across a 500-question sweep
    expect(hasFirstInversion).toBe(true);
    expect(hasSecondInversion).toBe(true);
  });

  it('should generate all types of cadences, and the cadences should be correct', () => {
    let hasPerfectCadence = false;
    let hasImperfectCadence = false;
    let hasPlagalCadence = false;
    let hasInterruptedCadence = false;
    
    for (let i = 0; i < 500; i++) {
      const question = generateQuestion(false, 8);
      const chords = question.chordSymbols; 
      const isMinor = question.key.type === 'minor';

      // HELPER GUARDS: Ensure 'V' does not accidentally trigger on a 'VI' chord
      const isVVariant = (str: string) => str.startsWith('V') && !str.startsWith('VI');
      const isIVVariant = (str: string) => str.startsWith('IV');
      const isIIVariant = (str: string) => str.startsWith('II') || str.startsWith('ii');
      const isIVariant = (str: string) => str.startsWith('I');
      const isVIVariant = (str: string) => str.startsWith('VI');

      // 1. Perfect Cadence: [Preceding] must be V, [Final] must be I
      if (question.cadenceType === 'Perfect') {
        hasPerfectCadence = true;
        expect(isVVariant(chords[1])).toBe(true);
        expect(isIVariant(chords[2])).toBe(true);
        
        // Minor Key Rule: Dominant chord must be major V / V7 (raised 7th leading tone)
        if (isMinor) {
          expect(chords[1].startsWith('v')).toBe(false); // No minor 'v' allowed
        }
      }

      // 2. Imperfect Cadence: [Final] must resolve to a V variant
      if (question.cadenceType === 'Imperfect') {
        hasImperfectCadence = true;
        expect(isVVariant(chords[2])).toBe(true);
        
        if (isMinor) {
          expect(chords[2].startsWith('v')).toBe(false);
        }
      }

      // 3. Plagal Cadence: [Preceding] must be IV or II, [Final] must be I
      if (question.cadenceType === 'Plagal') {
        hasPlagalCadence = true;
        const isValidPredecessor = isIVVariant(chords[1]) || isIIVariant(chords[1]);
        expect(isValidPredecessor).toBe(true);
        expect(isIVariant(chords[2])).toBe(true);
      }

      // 4. Interrupted Cadence: [Preceding] must be V, [Final] must be VI
      if (question.cadenceType === 'Interrupted') {
        hasInterruptedCadence = true;
        expect(isVVariant(chords[1])).toBe(true);
        expect(isVIVariant(chords[2])).toBe(true);
        
        if (isMinor) {
          expect(chords[1].startsWith('v')).toBe(false);
        }
      }
    }

    // Outer structural randomizer sweeps verification
    expect(hasPerfectCadence).toBe(true);
    expect(hasImperfectCadence).toBe(true);
    expect(hasPlagalCadence).toBe(true);
    expect(hasInterruptedCadence).toBe(true);
  });


  it('should enforce strict root positions when Easy Mode is active', () => {
    for (let i = 0; i < 200; i++) {
      const easyQuestion = generateQuestion(true, 8);

      easyQuestion.chordSymbols.forEach((chord) => {
        expect(chord.includes('b')).toBe(false);
        expect(chord.includes('c')).toBe(false);
      });
    } // Fixed: Correctly closes the for loop
  }); // Fixed: Correctly closes the 'it' block

  it('should generate the exact count of chords matching ABRSM grade criteria', () => {
    const g6Question = generateQuestion(false, 6);
    expect(g6Question.chordSymbols.length).toBe(2);
    expect(g6Question.progressionMidi.length).toBe(2);

    const g7Question = generateQuestion(false, 7);
    expect(g7Question.chordSymbols.length).toBe(2);
    expect(g7Question.progressionMidi.length).toBe(2);

    const g8Question = generateQuestion(false, 8);
    expect(g8Question.chordSymbols.length).toBe(3);
    expect(g8Question.progressionMidi.length).toBe(3);
  });

  it('should generate matching structural pairs between text arrays and audio numbers matrix arrays', () => {
    for (let i = 0; i < 100; i++) {
      const question = generateQuestion(false, 8);
      
      expect(question.chordSymbols.length).toEqual(question.progressionMidi.length);
      
      question.progressionMidi.forEach(chordNotes => {
        expect(chordNotes.length).toBeGreaterThan(0);
      });
    }
  });
});
