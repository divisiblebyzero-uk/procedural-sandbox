// src/App.tsx
import { useState } from 'react';
import { generateComposition } from './utils/proceduralEngine';
import { VexFlowScore } from './components/VexFlowScore';
import { playComposition } from './utils/audioEngine';
import type { SandboxComposition, SandboxInput } from './types';

export default function App() {
  // 1. Component State Blocks
  const [key, setKey] = useState<string>('C Major');
  const [chordSequenceString, setChordSequenceString] = useState<string>('I - IV - V - I');
  const [bassStyle, setBassStyle] = useState<'Alberti' | 'Figured' | 'Block'>('Alberti');
  const [complexity, setComplexity] = useState<number>(4); // Max interval step jump size
  
  const [composition, setComposition] = useState<SandboxComposition | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [activeBeatIndex, setActiveBeatIndex] = useState<number>(-1); // 🌟 Added highlight index tracker state
  const [modulationType, setModulationType] = useState<'None' | 'Dominant' | 'Subdominant' | 'Relative'>('None');

  // Update your handleGenerateAndPlay method:
  const handleGenerateAndPlay = async () => {
    setIsPlaying(true);
    setActiveBeatIndex(-1);

    // 1. Split the selector string into an array of chord tokens
    const chordsArray = chordSequenceString.split(' - ');

    // 2. Build the configuration payload object matching SandboxInput
    const inputConfig: SandboxInput = {
      key: key,
      chordSequence: chordsArray,
      bassStyle: bassStyle,
      complexity: complexity,
      modulationType: modulationType
    };

    // 3. Generate the composition payload data using your configuration
    const result = generateComposition(inputConfig);
    setComposition(result);

    // 4. Pass the result data down to your real-time audio playback engine thread
    await playComposition(result, (index) => {
      setActiveBeatIndex(index);
    });

    setIsPlaying(false);
  };


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-6 antialiased font-sans">
      <div className="w-full max-w-4xl">
        
        {/* Main Title Heading Header Block */}
        <header className="mb-8 mt-4 flex items-center gap-3">
          <span className="text-3xl">🎵</span>
          <h1 className="text-2xl font-bold tracking-tight text-white">Procedural Composition Sandbox</h1>
        </header>

        {/* Input Parameters Config Panel Card Box wrapper */}
        <main className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            
            {/* Key Signature Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Key Signature</label>
              <select 
                value={key} 
                onChange={(e) => setKey(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="C Major">C Major</option>
                <option value="A minor">A minor</option>
              </select>
            </div>

            {/* Chord Progression Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Chord Sequence</label>
              <select 
                value={chordSequenceString} 
                onChange={(e) => setChordSequenceString(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="I - IV - V - I">I - IV - V - I (Authentic)</option>
                <option value="I - VI - IV - V">I - VI - IV - V (Pop Standard)</option>
                <option value="i - iv - V - i">i - iv - V - i (Minor Cadence)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Modulation Target (Grade 8)</label>
              <select 
                value={modulationType} 
                onChange={(e) => setModulationType(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="None">None (Stay in Tonic)</option>
                <option value="Dominant">Dominant (V / v)</option>
                <option value="Subdominant">Subdominant (IV / iv)</option>
                <option value="Relative">Relative Major/Minor</option>
              </select>
            </div>

            {/* Bass Style Arranger Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Bass Style</label>
              <select 
                value={bassStyle} 
                onChange={(e) => setBassStyle(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="Alberti">Alberti Bass</option>
                <option value="Block">Block Chords</option>
                <option value="Figured">Figured Walking</option>
              </select>
            </div>

            {/* Melody Line Complexity Bounds Constraint Slider/Selector */}
            <div className="flex flex-col gap-2 md:col-span-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Melody Complexity</label>
              <select 
                value={complexity} 
                onChange={(e) => setComplexity(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value={2}>Low (Steps +/- 2)</option>
                <option value={3}>Medium (Steps +/- 3)</option>
                <option value={4}>High (Steps +/- 4)</option>
              </select>
            </div>
          </div>

          {/* Master Operational Generate and Play Execution Button */}
          <button
            onClick={handleGenerateAndPlay}
            disabled={isPlaying}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition duration-150 ease-in-out shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>⚡</span>
            {isPlaying ? 'Generating Music Payload...' : 'Generate & Play Composition'}
          </button>
        </main>

        {/* Visual Notation Target Container Output Box Screen */}
          <section className="w-full min-h-[280px] bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-center shadow-xl">
            <VexFlowScore data={composition} activeBeatIndex={activeBeatIndex} />
          </section>

      </div>
    </div>
  );
}
