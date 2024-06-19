export class GeneratorHardstyle {
  constructor(bpm = 150) {
    this.bpm = bpm;
    this.beatDuration = (60 / this.bpm) * 1000; // Duration of one beat in milliseconds
    this.barLength = 4 * this.beatDuration; // Duration of one bar in milliseconds
    this.notes = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
    this.scaleType = "harmonicMinor";
  }

  getScaleIntervals(scaleType = "harmonicMinor") {
    const scales = {
      harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
    };
    return scales[scaleType];
  }

  getScaleNotes(root, scaleType = "harmonicMinor") {
    const rootIndex = this.notes.indexOf(root);
    const intervals = this.getScaleIntervals(scaleType);
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
  //   // Define a simple pattern for the motif
  //   const pattern = [1, 2, 4, 5, 7, 9, 10, 12, 14, 15, 17, 19, 20, 22, 23, 24];
  //
  //   for (let i = 0; i < 8; i++) {
  //     const index = pattern[i];
  //     const note = scaleNotes[index % scaleNotes.length];
  //     motif.push(note);
  //   }
  //
  //   return motif;
  // }

  createStructuredMotif(scaleNotes) {
    const motif = [];

    // Generate a random pattern for the motif
    const pattern = [];
    for (let i = 0; i < 16; i++) {
      pattern.push(Math.floor(Math.random() * scaleNotes.length));
    }

    for (let i = 0; i < 16; i++) {
      const index = pattern[i];
      const note = scaleNotes[index];
      motif.push(note);
    }

    return motif;
  }

  generateMelody(bars = 4, tonics) {
    const melody = [];

    for (let bar = 0; bar < bars; bar++) {
      const tonic = tonics[bar];
      const scaleNotes = this.getScaleNotes(tonic, this.scaleType);
      const motif = this.createStructuredMotif(scaleNotes);

      for (let beat = 0; beat < 4; beat++) {
        const startTime = bar * this.barLength + beat * this.beatDuration;
        const duration = this.beatDuration * 0.25;
        const noteIndex = beat * 4 + Math.floor(Math.random() * 4);
        const note = motif[noteIndex];

        if (note) {
          melody.push({
            color: "yellow",
            frequency: this.noteToFrequency(note),
            startTime: startTime,
            duration: duration,
          });
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
