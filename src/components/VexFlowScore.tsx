// src/components/VexFlowScore.tsx
import React, { useEffect, useRef } from 'react';
import { Vex } from 'vexflow';
import type { SandboxComposition } from '../types';

interface VexFlowScoreProps {
  data: SandboxComposition | null;
  activeBeatIndex: number;
}

export const VexFlowScore: React.FC<VexFlowScoreProps> = ({ data, activeBeatIndex }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    // 1. Instantly clear out all old paths to prevent ghosting or duplicates
    containerRef.current.innerHTML = '';

    // Extract necessary tools out of VexFlow 4 core namespace layout
    const { Renderer, Stave, StaveNote, Voice, Formatter, StaveConnector, ChordSymbol } = Vex.Flow;

    // 2. Setup the Canvas Bounds
    const renderer = new Renderer(containerRef.current, Renderer.Backends.SVG);
    renderer.resize(920, 280); 
    const context = renderer.getContext();

    const numBars = 4;
    const startX = 20;

    const trebleStaves: any[] = [];
    const bassStaves: any[] = [];

    // --- STEP 1: INITIALIZE STAVE ROW HORIZONTALS ---
    let currentX = startX;
    for (let i = 0; i < numBars; i++) {
      const barWidth = (i === 0) ? 240 : 170;
      
      const tStave = new Stave(currentX, 40, barWidth); 
      const bStave = new Stave(currentX, 150, barWidth);

      if (i === 0) {
        tStave.addClef('treble').addTimeSignature('4/4');
        bStave.addClef('bass').addTimeSignature('4/4');
      }

      tStave.setContext(context).draw();
      bStave.setContext(context).draw();

      trebleStaves.push(tStave);
      bassStaves.push(bStave);
      currentX += barWidth;
    }

    // --- STEP 2: DRAW PIANO SYSTEM JOINERS ---
    // Fix: Explicitly target the first index element [0] of the stave lists
    const brace = new StaveConnector(trebleStaves[0], bassStaves[0]);
    brace.setType(StaveConnector.type.BRACE).setContext(context).draw();

    const lineConnector = new StaveConnector(trebleStaves[0], bassStaves[0]);
    lineConnector.setType(StaveConnector.type.SINGLE).setContext(context).draw();

    // --- STEP 3: AUTOMATIC STEM GENERATOR RULE ---
    const getStemDirection = (pitch: string, clef: 'treble' | 'bass'): number => {
      const cleanPitch = pitch.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (clef === 'treble') {
        return ['C4', 'D4', 'E4', 'F4', 'G4', 'A4'].includes(cleanPitch) ? 1 : -1;
      } else {
        return ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3'].includes(cleanPitch) ? 1 : -1;
      }
    };

    // --- STEP 4: ARRANGE ALL NOTES ---
    let mIdx = 0;
    let bIdx = 0;

    // Fix: Declared array with 'any[]' to prevent Value-as-Type runtime warning errors
    const voicesToFormat: any[] = [];

    for (let bar = 0; bar < numBars; bar++) {
      const trebleNotesInBar: any[] = [];
      let tBeats = 0;
      
      while (tBeats < 4.0 && mIdx < data.melody.length) {
        const note = data.melody[mIdx];
        const isNotePlaying = mIdx === activeBeatIndex;

        // 🌟 Update Treble Notes configuration inside src/components/VexFlowScore.tsx:
        const staveNote = new StaveNote({
            keys: note.vexKeys, // 🌟 Changed from [note.vexKey] to note.vexKeys
            duration: note.duration,
            clef: 'treble',
            stem_direction: getStemDirection(note.pitches[note.pitches.length - 1], 'treble') // Check top note for stems
        });

        // ADD CHORD NAME ABOVE THE VERY FIRST NOTE OF EACH BAR
        if (tBeats === 0) {
          // Fix: Fallback string map rule used to prevent uncompiled missing interface tags
          const chordLabel = (note as any).chordSymbol || 'I'; 
          
          const chordSymbolText = new ChordSymbol()
            .setFont('sans-serif', 12, 'bold')
            .addText(chordLabel);
            
          staveNote.addModifier(chordSymbolText, 0);
        }

        if (isNotePlaying) {
          staveNote.setStyle({ fillStyle: '#2563eb', strokeStyle: '#2563eb' });
        }
        trebleNotesInBar.push(staveNote);
        tBeats += note.beats;
        mIdx++;
      }

      const bassNotesInBar: any[] = [];
      let bBeats = 0;
      
      while (bBeats < 4.0 && bIdx < data.bass.length) {
        const note = data.bass[bIdx];
        
        const isWholeNoteMode = data.bass.length === 4;
        const targetActiveIndex = isWholeNoteMode ? Math.floor(activeBeatIndex / 4) : activeBeatIndex;
        const isNotePlaying = bIdx === targetActiveIndex;

        const staveNote = new StaveNote({
          keys: note.vexKeys,
          duration: note.duration,
          clef: 'bass',
          // 🌟 FIX: Change note.pitches to note.pitches to pass a single string descriptor
          stem_direction: getStemDirection(note.pitches[0], 'bass') 
        });

        if (isNotePlaying && activeBeatIndex >= 0) {
          staveNote.setStyle({ fillStyle: '#2563eb', strokeStyle: '#2563eb' });
        }
        bassNotesInBar.push(staveNote);
        bBeats += note.beats;
        bIdx++;
      }

      const tVoice = new Voice({ num_beats: 4, beat_value: 4 }).addTickables(trebleNotesInBar);
      const bVoice = new Voice({ num_beats: 4, beat_value: 4 }).addTickables(bassNotesInBar);

      // --- STEP 5: LOCK HORIZONTAL ALIGNMENT ---
      const innerFormatWidth = 140;
      new Formatter().joinVoices([tVoice, bVoice]).format([tVoice, bVoice], innerFormatWidth);

      voicesToFormat.push(tVoice, bVoice);
      
      tVoice.draw(context, trebleStaves[bar]);
      bVoice.draw(context, bassStaves[bar]);
    }

    mIdx = 0;
    bIdx = 0;

  }, [data, activeBeatIndex]);

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400 italic">
        Configure parameters above and hit Generate.
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center bg-white p-4 rounded-xl shadow-inner overflow-x-auto border border-slate-200">
      <div ref={containerRef} className="w-full max-w-[920px]" />
    </div>
  );
};
