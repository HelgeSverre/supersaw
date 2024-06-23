type NoteName = "C" | "C#" | "D" | "D#" | "E" | "F" | "F#" | "G" | "G#" | "A" | "A#" | "B";
type ScaleType =
  | "major"
  | "minor"
  | "melodicMinor"
  | "harmonicMinor"
  | "dorian"
  | "phrygian"
  | "lydian"
  | "mixolydian"
  | "locrian";

const scaleIntervals: { [key in ScaleType]: number[] } = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  locrian: [0, 1, 3, 5, 6, 8, 10],
};

class Note {
  name: NoteName;
  octave: number;
  pitch: number;

  constructor(name: NoteName, octave: number, pitch: number) {
    this.name = name;
    this.octave = octave;
    this.pitch = pitch;
  }

  static fromMidi(midiNumber: number): Note {
    const A4_MIDI = 69;
    const A4_PITCH = 440;
    const noteNames: NoteName[] = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const noteIndex = midiNumber % 12;
    const octave = Math.floor(midiNumber / 12) - 1;
    const pitch = A4_PITCH * Math.pow(2, (midiNumber - A4_MIDI) / 12);
    return new Note(noteNames[noteIndex], octave, pitch);
  }

  pitchToMidi(): number {
    const A4 = 440;
    const A4_MIDI = 69;
    return Math.round(12 * (Math.log(this.pitch / A4) / Math.log(2)) + A4_MIDI);
  }

  toString(): string {
    return `${this.name}${this.octave}`;
  }
}

class Scale {
  root: Note;
  type: ScaleType;
  intervals: number[];

  constructor(root: Note, type: ScaleType) {
    this.root = root;
    this.type = type;
    this.intervals = scaleIntervals[type];
  }

  getNoteAtDegree(degree: number): Note {
    const interval = this.intervals[degree % this.intervals.length];
    const pitch = this.root.pitch * Math.pow(2, interval / 12);
    const note = Note.fromMidi(this.root.pitchToMidi() + interval);
    return new Note(note.name, note.octave, pitch);
  }
}

class Chord {
  notes: Note[];

  constructor(root: Note, scale: Scale) {
    this.notes = [root, scale.getNoteAtDegree(2), scale.getNoteAtDegree(4)];
  }

  addSeventh(scale: Scale): void {
    this.notes.push(scale.getNoteAtDegree(6));
  }

  invert(): Chord {
    const invertedNotes = [...this.notes.slice(1), this.notes[0]];
    return new Chord(invertedNotes[0], new Scale(invertedNotes[0], "major"));
  }
}

class Arpeggiator {
  chordProgression: string;
  rootNote: Note;
  scale: Scale;
  chords: Chord[];

  constructor(chordProgression: string, rootNote: Note, scaleType: ScaleType) {
    this.chordProgression = chordProgression;
    this.rootNote = rootNote;
    this.scale = new Scale(rootNote, scaleType);
    this.chords = this.createChords();
  }

  private createChords(): Chord[] {
    const chordSymbols = this.chordProgression.split(" ");
    return chordSymbols.map((symbol) => new Chord(this.getChordRoot(symbol), this.scale));
  }

  private getChordRoot(symbol: string): Note {
    const root = symbol[0];
    return this.rootNote;
  }

  generateArpeggiatedSequence(noteLength: number, gate: number): { note: Note; startTime: number; duration: number }[] {
    const bpm = 120;
    const beatDuration = 60 / bpm; // Duration of one beat in seconds
    const notes: { note: Note; startTime: number; duration: number }[] = [];
    let currentTime = 0;

    this.chords.forEach((chord) => {
      chord.notes.forEach((note) => {
        const duration = noteLength * beatDuration;
        notes.push({
          note: note,
          startTime: currentTime,
          duration: duration * gate,
        });
        currentTime += duration; // Move to the next note's start time
      });
    });

    return notes;
  }
}

// Example usage:
const rootNote = new Note("C", 4, 261.63); // Middle C
const arpeggiator = new Arpeggiator("C G Am F", rootNote, "major");
console.log(arpeggiator.chords);

arpeggiator.chords[0].addSeventh(arpeggiator.scale);
console.log(arpeggiator.chords[0]);

const invertedChord = arpeggiator.chords[0].invert();
console.log(invertedChord);

const sequence = arpeggiator.generateArpeggiatedSequence(0.5, 0.9); // Note length in beats, gate as a fraction of note length
console.log(sequence);
