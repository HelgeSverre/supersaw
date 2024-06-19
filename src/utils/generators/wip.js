export class GeneratorHardstyle {
  constructor(bpm = 150) {
    this.bpm = bpm;
    this.beatDuration = (60 / this.bpm) * 1000; // Duration of one beat in milliseconds
    this.barLength = 4 * this.beatDuration; // Duration of one bar in milliseconds
    this.notes = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
    this.motifs = [
      [0, 2, 1, 2], // Simple up and down movement
      [1, 1, 2, 0], // Syncopated jump
      [2, 1, 1, 0], // Descending with a leading tone
      [0, 2, 3, 2], // Common hardstyle rhythmic pattern
    ];
  }

  createStructuredMotifPreset(scaleNotes) {
    // Select a predefined motif
    const motifPattern = this.motifs[Math.floor(Math.random() * this.motifs.length)];
    return motifPattern.map((index) => {
      const safeIndex = index % scaleNotes.length; // Ensures we do not go out of bounds
      return scaleNotes[safeIndex]; // Safely access the scale note
    });
  }

  getScaleNotes(root) {
    const rootIndex = this.notes.indexOf(root);
    const intervals = [0, 2, 3, 5, 7, 8, 11];
    return intervals.map((interval) => this.notes[(rootIndex + interval) % 12]);
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

  // createStructuredMotif(scaleNotes) {
  //   const motif = [];
  //
  //   // Generate a random pattern for the motif
  //   const pattern = [];
  //   for (let i = 0; i < 16; i++) {
  //     pattern.push(Math.floor(Math.random() * scaleNotes.length));
  //   }
  //
  //   for (let i = 0; i < 16; i++) {
  //     const index = pattern[i];
  //     const note = scaleNotes[index];
  //     motif.push(note);
  //   }
  //
  //   return motif;
  // }

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
