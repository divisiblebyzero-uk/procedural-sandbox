// src/utils/proceduralEngine.ts
import type { SandboxInput, SandboxComposition, NotePayload } from '../types';

const MAJOR_SCALE = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const MINOR_SCALE = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

const CHORD_ROOT_OFFSETS: { [key: string]: number } = {
  'I': 0, 'i': 0, 'II': 1, 'ii': 1, 'IV': 3, 'iv': 3, 'V': 4, 'v': 4, 'VI': 5, 'vi': 5
};

function toVexKey(pitch: string): string {
  const hasAccidental = pitch.includes('#');
  const letter = pitch.charAt(0).toLowerCase();
  const accidental = hasAccidental ? '#' : '';
  const octave = pitch.slice(-1);
  return `${letter}${accidental}/${octave}`;
}

function buildScale(root: string, isMinor: boolean, octaveOffset: number): string[] {
  const basePattern = isMinor ? MINOR_SCALE : MAJOR_SCALE;
  const startIndex = basePattern.indexOf(root);
  const result: string[] = [];
  
  for (let i = 0; i < 14; i++) { // Extended loop ceiling boundary to pull chords cleanly
    const rawIndex = (startIndex + i) % basePattern.length;
    const round = Math.floor((startIndex + i) / basePattern.length);
    const octave = octaveOffset + round;
    result.push(`${basePattern[rawIndex]}${octave}`);
  }
  return result;
}

export function generateComposition(input: SandboxInput): SandboxComposition {
  const melody: NotePayload[] = [];
  const bass: NotePayload[] = [];
  
  const isBaseMinor = input.key.includes('minor');
  const baseScaleRoot = input.key.split(' ')[0];

  let currentMelodyScale = buildScale(baseScaleRoot, isBaseMinor, 4);
  let currentBassScale = buildScale(baseScaleRoot, isBaseMinor, 2);

  const numBars = 4;
  let currentScaleIndex = 4; 

  for (let bar = 0; bar < numBars; bar++) {
    let activeKeyRoot = baseScaleRoot;
    let isCurrentMinor = isBaseMinor;

    if (bar >= 2 && input.modulationType !== 'None') {
      if (input.modulationType === 'Dominant') {
        activeKeyRoot = isBaseMinor ? 'E' : 'G';
      } else if (input.modulationType === 'Subdominant') {
        activeKeyRoot = isBaseMinor ? 'D' : 'F';
      } else if (input.modulationType === 'Relative') {
        activeKeyRoot = isBaseMinor ? 'C' : 'A';
        isCurrentMinor = !isBaseMinor;
      }
      currentMelodyScale = buildScale(activeKeyRoot, isCurrentMinor, 4);
      currentBassScale = buildScale(activeKeyRoot, isCurrentMinor, 2);
    }

    const chordSymbol = input.chordSequence[bar] || 'I';
    const chordRootIndex = CHORD_ROOT_OFFSETS[chordSymbol] || 0;

    // ABRSM minor-key rule: Always raise the 7th scale degree on a dominant (V) harmony
    if (isCurrentMinor && chordSymbol.toUpperCase() === 'V') {
      const leadingToneIndex = (chordRootIndex + 6) % currentMelodyScale.length;
      const originalPitch = currentMelodyScale[leadingToneIndex];
      if (!originalPitch.includes('#')) {
        currentMelodyScale[leadingToneIndex] = originalPitch.replace(/(\d)/, '#$1');
      }
    }

    let remainingBeatsInBar = 4.0;
    let isFirstNoteOfBar = true;

    // --- MELODY ROW ENGINE (Supports Chords + Quavers) ---
    while (remainingBeatsInBar > 0) {
      const isLastBeat = remainingBeatsInBar <= 1.0;
      
      // Determine if we should generate a thick 4-note chord or a simple single melody line
      // Trigger a 3/4 note block chord on beat 0, OR leading up to the modulation pivot in bar 2 (index 2)
      const shouldBuildTrebleChord = isFirstNoteOfBar || (bar === 2 && remainingBeatsInBar <= 2.0);
      
      const triggerQuaverPair = Math.random() > 0.5 && !isLastBeat && remainingBeatsInBar >= 1.0 && !shouldBuildTrebleChord;
      const loopCount = triggerQuaverPair ? 2 : 1;
      const currentDuration = triggerQuaverPair ? '8' : 'q';
      const beatValue = triggerQuaverPair ? 0.5 : 1.0;

      for (let step = 0; step < loopCount; step++) {
        let notePitches: string[] = [];

        if (shouldBuildTrebleChord && step === 0) {
          // 🌟 Build a beautiful, rich 4-note chord structure [Root, Third, Fifth, Octave Root]
          const rootNote = currentMelodyScale[chordRootIndex];
          const thirdNote = currentMelodyScale[chordRootIndex + 2];
          const fifthNote = currentMelodyScale[chordRootIndex + 4];
          const octaveNote = currentMelodyScale[chordRootIndex + 7];
          
          notePitches = [rootNote, thirdNote, fifthNote, octaveNote];
          currentScaleIndex = chordRootIndex + 7; // Reset melody tracker path to rest gracefully on top note
        } else {
          // Standard single melody line logic
          if (isLastBeat && step === loopCount - 1) {
            const targetIndex = [chordRootIndex, chordRootIndex + 2, chordRootIndex + 4].filter(idx => idx < currentMelodyScale.length);
            currentScaleIndex = targetIndex.reduce((prev, curr) => 
              Math.abs(curr - currentScaleIndex) < Math.abs(prev - currentScaleIndex) ? curr : prev
            );
          } else {
            const direction = Math.random() > 0.5 ? 1 : -1;
            const stepSize = Math.floor(Math.random() * (input.complexity - 1)) + 2;
            let nextIndex = currentScaleIndex + (direction * stepSize);

            if (nextIndex < 0 || nextIndex >= currentMelodyScale.length) {
              nextIndex = currentScaleIndex - (direction * stepSize);
            }
            currentScaleIndex = Math.max(0, Math.min(currentMelodyScale.length - 1, nextIndex));
          }
          notePitches = [currentMelodyScale[currentScaleIndex]];
        }

        melody.push({
          pitches: notePitches,
          vexKeys: notePitches.map(toVexKey),
          duration: currentDuration,
          beats: beatValue,
          chordSymbol: chordSymbol
        });
        
        remainingBeatsInBar -= beatValue;
        isFirstNoteOfBar = false;
      }
    }

    // --- BASS ACCOMPANIMENT ARRANGER ---
    const rootPitch = currentBassScale[chordRootIndex];
    const thirdPitch = currentBassScale[(chordRootIndex + 2) % currentBassScale.length];
    const fifthPitch = currentBassScale[(chordRootIndex + 4) % currentBassScale.length];

    if (input.bassStyle === 'Alberti') {
      const p = [rootPitch, fifthPitch, thirdPitch, fifthPitch];
      p.forEach(note => {
        bass.push({ 
          pitches: [note], 
          vexKeys: [toVexKey(note)], // 🌟 FIX: Cleaned up nested array brackets
          duration: 'q', 
          beats: 1.0 
        });
      });
    } else if (input.bassStyle === 'Block') {
      const lowOctaveRoot = rootPitch;
      const highOctaveRoot = currentBassScale[chordRootIndex + 7] || rootPitch;
      bass.push({ 
        pitches: [lowOctaveRoot, highOctaveRoot], 
        vexKeys: [toVexKey(lowOctaveRoot), toVexKey(highOctaveRoot)], 
        duration: 'w', 
        beats: 4.0 
      });
    } else {
      for (let beat = 0; beat < 4; beat++) {
        const p = beat === 0 ? rootPitch : (beat === 2 ? fifthPitch : thirdPitch);
        bass.push({ 
          pitches: [p], 
          vexKeys: [toVexKey(p)], // 🌟 FIX: Cleaned up nested array brackets
          duration: 'q', 
          beats: 1.0 
        });
      }
    }
  }

  return { melody, bass };
}