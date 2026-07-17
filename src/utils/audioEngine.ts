// src/utils/audioEngine.ts
import type { SandboxComposition } from '../types';

const FREQUENCY_MAP: { [key: string]: number } = {
    // Low Bass Register Mappings (C2-B3)
    'A1': 55.00, 'B1': 61.74, 'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
    'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
    // Treble Mappings (Middle Register)
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61,
    // 🌟 FIX: Added Missing Higher Octave Mappings (A5-D6)
    'A5': 880.00, 'A#5': 932.33, 'B5': 987.77, 'C6': 1046.50, 'C#6': 1109.73, 'D6': 1174.66
};

let activeAudioContext: AudioContext | null = null;

export async function playComposition(
    data: SandboxComposition,
    onBeatCallback: (currentBeatIndex: number) => void
): Promise<void> {
    if (!activeAudioContext) {
        activeAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = activeAudioContext;
    if (ctx.state === 'suspended') await ctx.resume();

    const startTime = ctx.currentTime + 0.05;
    const tempoBPM = 85; // Elegant spacing for quavers
    const beatUnitDuration = 60 / tempoBPM; // Length of 1 full crotchet beat in seconds

    const playTone = (pitchName: string, timeOffset: number, duration: number, volume: number) => {
        let cleanPitch = pitchName.replace('/', '').toUpperCase();

        // 🌟 Safety Rail: If note is out of map bounds, drop it by one octave
        if (!FREQUENCY_MAP[cleanPitch]) {
            const octave = parseInt(cleanPitch.slice(-1));
            if (octave > 4) {
                cleanPitch = cleanPitch.slice(0, -1) + (octave - 1); // e.g. E6 -> E5
            }
        }

        const frequency = FREQUENCY_MAP[cleanPitch];
        if (!frequency) return;

        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = 'sine';
        const noteStart = startTime + timeOffset;

        osc.frequency.setValueAtTime(frequency, noteStart);
        gainNode.gain.setValueAtTime(0, noteStart);
        gainNode.gain.linearRampToValueAtTime(volume, noteStart + 0.01);
        gainNode.gain.setValueAtTime(volume, noteStart + (duration * 0.85));
        gainNode.gain.exponentialRampToValueAtTime(0.001, noteStart + duration + 0.05);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + duration + 0.05);
    };

    // --- SCHEDULE DYNAMIC TREBLE TIMELINE ---
    let accumulatedMelodyTime = 0;
    data.melody.forEach((note, index) => {
        const currentOffset = accumulatedMelodyTime;
        const noteDurationInSeconds = note.beats * beatUnitDuration;

        // Loop through all simultaneous pitches in the chord block
        note.pitches.forEach(pitch => {
            playTone(pitch, currentOffset, noteDurationInSeconds, 0.08); // Lower volume slightly to mix smoothly
        });

        setTimeout(() => {
            onBeatCallback(index);
        }, currentOffset * 1000);

        accumulatedMelodyTime += noteDurationInSeconds;
    });

    // --- SCHEDULE DYNAMIC BASS TIMELINE ---
    let accumulatedBassTime = 0;
    data.bass.forEach((note) => {
        const noteDurationInSeconds = note.beats * beatUnitDuration;

        note.pitches.forEach(pitch => {
            playTone(pitch, accumulatedBassTime, noteDurationInSeconds, 0.16);
        });

        accumulatedBassTime += noteDurationInSeconds;
    });

    return new Promise((resolve) => {
        setTimeout(() => {
            onBeatCallback(-1);
            resolve();
        }, accumulatedMelodyTime * 1000);
    });
}
