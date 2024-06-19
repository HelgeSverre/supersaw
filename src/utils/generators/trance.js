export class TranceGenerator {
  constructor(bpm = 138, scale = "minor", root = "F#") {
    this.bpm = bpm;
    this.beatDuration = (60 / this.bpm) * 1000; // Duration of one beat in milliseconds
    this.sixteenthNoteDuration = this.beatDuration / 4; // Sixteenth note duration
    this.barLength = 4 * this.beatDuration; // Duration of one bar in milliseconds
    this.root = root;
    this.scaleType = scale;
    this.motifs = [
      [0, 2, -6, 4, 2, 0, -1, -12], // Modified to include descending element
      [1, 3, 5, -12, 3, 5, 7, 1, 3, 5], // Emphasis with upper notes moving up as lower notes descend
    ];

    this.notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  }

  getScaleNotes(root, octaveSpread = 2) {
    const scales = {
      harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      // Other scales omitted for brevity
    };

    const rootIndex = this.notes.indexOf(root);
    const intervals = scales[this.scaleType];
    let scaleNotes = [];

    for (let octave = 0; octave < octaveSpread; octave++) {
      scaleNotes = scaleNotes.concat(
        intervals.map((interval) => {
          const noteIndex = (rootIndex + interval + 12 * octave) % 24; // Extended to 24 for two octaves
          return this.notes[noteIndex % 12] + (Math.floor(noteIndex / 12) + 4); // Adding octave number
        }),
      );
    }
    return scaleNotes;
  }

  createStructuredMotifPreset(scaleNotes) {
    const motifPattern = this.motifs[Math.floor(Math.random() * this.motifs.length)];
    return motifPattern.map((index) => {
      const safeIndex = (index + scaleNotes.length) % scaleNotes.length;
      return scaleNotes[safeIndex];
    });
  }

  noteToFrequency(note) {
    // This function now also handles note octaves
    const baseFrequencies = {
      "C": 261.63,
      "C#": 277.18,
      "D": 293.66,
      "D#": 311.13,
      "E": 329.63,
      "F": 349.23,
      "F#": 369.99,
      "G": 392.0,
      "G#": 415.3,
      "A": 440.0,
      "A#": 466.16,
      "B": 493.88,
    };

    const noteRegex = /([A-G]#?)(\d+)/;
    const match = note.match(noteRegex);
    const noteName = match[1];
    const octave = parseInt(match[2]);

    return baseFrequencies[noteName] * Math.pow(2, octave - 4); // Calculate frequency based on octave
  }

  generate(bars = 4) {
    const melody = [];
    const scaleNotes = this.getScaleNotes(this.root);

    let startTime = 0;

    for (let bar = 0; bar < bars; bar++) {
      const motif = this.createStructuredMotifPreset(scaleNotes);

      for (let noteIndex = 0; noteIndex < motif.length; noteIndex++) {
        melody.push({
          color: "yellow",
          frequency: this.noteToFrequency(motif[noteIndex]),
          startTime: startTime,
          duration: this.sixteenthNoteDuration,
        });

        startTime += this.sixteenthNoteDuration;
      }
    }

    return melody;
  }
}
