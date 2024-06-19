export class GeneratorHardstyle {
  constructor(bpm = 150, scale = "harmonicMinor", root = "F#") {
    this.bpm = bpm;
    this.beatDuration = (60 / this.bpm) * 1000; // Duration of one beat in milliseconds
    this.barLength = 4 * this.beatDuration; // Duration of one bar in milliseconds
    this.root = root;
    this.scaleType = scale;
    this.motifs = [
      [0, 2, 1, 2], // Simple up and down movement
      [1, 1, 2, 0], // Syncopated jump
      [2, 1, 1, 0], // Descending with a leading tone
      [0, 2, 3, 2], // Common hardstyle rhythmic pattern
    ];
  }

  createStructuredMotifPreset(scaleNotes) {
    const motifPattern = this.motifs[Math.floor(Math.random() * this.motifs.length)];
    return motifPattern.map((index) => {
      const safeIndex = index % scaleNotes.length; // Ensures we do not go out of bounds
      return scaleNotes[safeIndex]; // Safely access the scale note
    });
  }

  getScaleNotes(root) {
    const scales = {
      harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
      major: [0, 2, 4, 5, 7, 9, 11],
      minor: [0, 2, 3, 5, 7, 8, 10],
      dorian: [0, 2, 3, 5, 7, 9, 10],
      phrygian: [0, 1, 3, 5, 7, 8, 10],
      lydian: [0, 2, 4, 6, 7, 9, 11],
      mixolydian: [0, 2, 4, 5, 7, 9, 10],
      locrian: [0, 1, 3, 5, 6, 8, 10],
      pentatonicMinor: [0, 3, 5, 7, 10],
      pentatonicMajor: [0, 2, 4, 7, 9],
      blues: [0, 3, 5, 6, 7, 10],
    };

    const notes = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];

    // Find the index of the root note in the notes array
    const rootIndex = notes.indexOf(root);

    // Get the interval pattern for the specified scale type
    const intervals = scales[this.scaleType];

    // Generate the scale notes by applying the intervals to the root note
    return intervals.map((interval) => {
      const noteIndex = (rootIndex + interval) % 12;
      return notes[noteIndex];
    });
  }

  noteToFrequency(note) {
    const noteFrequencies = {
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
    return noteFrequencies[note];
  }

  generate(bars = 4) {
    const basslineInfo = this.generateBassline(bars);
    const { bassline, tonics } = basslineInfo;

    const melody = this.generateMelody(bars, tonics);
    return { melody, bassline, tonics };
  }

  generateMelody(bars = 4, tonics) {
    const melody = [];

    for (let bar = 0; bar < bars; bar++) {
      const tonic = tonics[bar];
      const scaleNotes = this.getScaleNotes(tonic);
      const motif = this.createStructuredMotifPreset(scaleNotes);

      for (let beat = 0; beat < 4; beat++) {
        const startTime = bar * this.barLength + beat * this.beatDuration;
        const duration = this.beatDuration * 0.25; // Maintain note length
        const noteIndex = beat % motif.length; // Ensure we use only valid indices
        const note = motif[noteIndex]; // Access the note from the motif

        if (note) {
          melody.push({
            color: "yellow",
            frequency: this.noteToFrequency(note),
            startTime: startTime,
            duration: duration,
          });
        } else {
          debugger;
        }
      }
    }
    return melody;
  }

  generateBassline(bars = 4) {
    const bassline = [];
    const scaleType = this.scaleType; // Assuming the scaleType is set for the whole class
    const scaleNotes = this.getScaleNotes(this.root, scaleType); // Get scale notes from the root

    // Generate tonics from scale notes, choosing notes that typically make strong bass tones.
    const tonics = [];
    for (let bar = 0; bar < bars; bar++) {
      // Randomly pick a tonic from the scale notes, biased towards more 'bassy' notes by selecting lower intervals more often
      const tonicIndex = Math.floor(Math.random() * (scaleNotes.length / 2)); // This limits the range to the lower half of the scale
      const tonic = scaleNotes[tonicIndex];
      tonics.push(tonic);
    }

    // Generate the bassline using the selected tonics
    for (let bar = 0; bar < bars; bar++) {
      const tonic = tonics[bar];
      const baseNoteFrequency = this.noteToFrequency(tonic);

      for (let beat = 0; beat < 4; beat++) {
        const startTime = bar * this.barLength + beat * this.beatDuration;
        const highDuration = this.beatDuration * 0.7;
        const lowDuration = this.beatDuration * 0.2;

        bassline.push({
          color: "red",
          frequency: baseNoteFrequency, // High part of the bass
          duration: highDuration,
          startTime: startTime,
        });

        bassline.push({
          color: "blue",
          frequency: baseNoteFrequency / 2, // One octave down
          duration: lowDuration,
          startTime: startTime + highDuration,
        });
      }
    }

    return { bassline, tonics };
  }

  generateBasslineOld(bars = 4) {
    const bassline = [];
    const tonics = ["G", "G", "C", "C", "E", "E", "D", "E"];

    for (let bar = 0; bar < bars; bar++) {
      const tonic = tonics[bar];
      const baseNoteFrequency = this.noteToFrequency(tonic);

      for (let beat = 0; beat < 4; beat++) {
        const startTime = bar * this.barLength + beat * this.beatDuration;
        const highDuration = this.beatDuration * 0.7;
        const lowDuration = this.beatDuration * 0.2;

        bassline.push({
          color: "red",
          frequency: baseNoteFrequency, // High part of the bass
          duration: highDuration,
          startTime: startTime,
        });

        bassline.push({
          color: "blue",
          frequency: baseNoteFrequency / 2, // One octave down
          duration: lowDuration,
          startTime: startTime + highDuration,
        });
      }
    }

    return { bassline, tonics };
  }
}
