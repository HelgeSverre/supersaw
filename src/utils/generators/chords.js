const noteFrequencies = {
  "C3": 130.81,
  "C#3": 138.59,
  "D3": 146.83,
  "D#3": 155.56,
  "E3": 164.81,
  "F3": 174.61,
  "F#3": 185.0,
  "G3": 196.0,
  "G#3": 207.65,
  "A3": 220.0,
  "A#3": 233.08,
  "B3": 246.94,
  "C4": 261.63,
  "C#4": 277.18,
  "D4": 293.66,
  "D#4": 311.13,
  "E4": 329.63,
  "F4": 349.23,
  "F#4": 369.99,
  "G4": 392.0,
  "G#4": 415.3,
  "A4": 440.0,
  "A#4": 466.16,
  "B4": 493.88,
  "C5": 523.25,
  "C#5": 554.37,
  "D5": 587.33,
  "D#5": 622.25,
  "E5": 659.25,
  "F5": 698.46,
  "F#5": 739.99,
  "G5": 783.99,
  "G#5": 830.61,
  "A5": 880.0,
  "A#5": 932.33,
  "B5": 987.77,
};

const scales = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
};

const romanNumerals = {
  I: 0,
  ii: 1,
  iii: 2,
  IV: 3,
  V: 4,
  vi: 5,
  vii: 6,
  i: 0,
  II: 1,
  III: 2,
  iv: 3,
  v: 4,
  VI: 5,
  VII: 6,
};

export function getScaleNotes(root, scaleType) {
  const rootIndex = Object.keys(noteFrequencies).indexOf(`${root}3`);
  const intervals = scales[scaleType];
  return intervals.map((interval) => {
    const noteName = Object.keys(noteFrequencies)[(rootIndex + interval) % 12];
    return {
      note: noteName.slice(0, -1), // Remove octave number
      frequency: noteFrequencies[noteName],
    };
  });
}

export function getChord(scaleNotes, numeral) {
  const degree = romanNumerals[numeral];
  const chordRoot = scaleNotes[degree];
  const third = scaleNotes[(degree + 2) % scaleNotes.length];
  const fifth = scaleNotes[(degree + 4) % scaleNotes.length];

  return [
    { note: `${chordRoot.note}3`, frequency: noteFrequencies[`${chordRoot.note}3`] },
    { note: `${third.note}4`, frequency: noteFrequencies[`${third.note}4`] },
    { note: `${fifth.note}4`, frequency: noteFrequencies[`${fifth.note}4`] },
  ];
}

export function generateChordProgression(key, scale, progression) {
  const scaleNotes = getScaleNotes(key, scale);
  const chords = progression.split(" - ").map((numeral) => getChord(scaleNotes, numeral));
  return chords;
}

export function generateChordProgressionWithIntervals(key, scaleIntervals, progression) {
  const rootIndex = Object.keys(noteFrequencies).indexOf(`${key}3`);
  const scaleNotes = scaleIntervals.map((interval) => {
    const noteName = Object.keys(noteFrequencies)[(rootIndex + interval) % 12];
    return {
      note: noteName.slice(0, -1), // Remove octave number
      frequency: noteFrequencies[noteName],
    };
  });
  return progression.split(" - ").map((numeral) => getChord(scaleNotes, numeral));
}
