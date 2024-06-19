export class GeneratorHardstyle {
  constructor(bpm = 150) {
    this.bpm = bpm;
    this.beatDuration = (60 / this.bpm) * 1000; // Duration of one beat in milliseconds
    this.barLength = 4 * this.beatDuration; // Duration of one bar in milliseconds
    this.notes = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
    this.root = "A"; // The root note from which the scale is generated
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

    const melody = this.generateMelody(bars, bassline, tonics);
    return { melody, bassline, tonics };
  }

  generateMelody(bars = 4, bassline, tonics) {
    const melody = [];

    for (let bar = 0; bar < bars; bar++) {
      const tonic = tonics[bar];
      const scaleNotes = this.getScaleNotes(tonic, this.scaleType);

      let currentTime = bar * this.barLength;

      for (let beat = 0; beat < 4; beat++) {
        const startTime = bar * this.barLength + beat * this.beatDuration;
        const duration = this.beatDuration * 0.7;
        const note = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
        const noteDuration = this.beatDuration * 0.5; // Half beat note duration

        melody.push({
          color: "yellow",
          frequency: this.noteToFrequency(note),
          startTime: startTime,
          duration: duration,
        });

        currentTime += noteDuration;
      }
    }
    return melody;
  }

  generateBassline(bars = 4) {
    const scaleNotes = this.getScaleNotes(this.root, this.scaleType);

    const bassline = [];
    const tonics = [];

    for (let bar = 0; bar < bars; bar++) {
      const tonic = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
      tonics.push(tonic);
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

  // generateHardstyleBassline(melody, bars = 4) {
  //   const bassline = [];
  //   for (let bar = 0; bar < bars; bar++) {
  //     const baseNoteFrequency = melody.length > 0 ? melody[0].frequency : 130.81; // Default or first note
  //
  //     for (let beat = 0; beat < 4; beat++) {
  //       const startTime = bar * this.barLength + beat * this.beatDuration;
  //       const highDuration = this.beatDuration * 0.75;
  //       const lowDuration = this.beatDuration * 0.25;
  //
  //       bassline.push({
  //         color: "red",
  //         frequency: baseNoteFrequency, // High part of the bass
  //         duration: highDuration,
  //         startTime: startTime,
  //       });
  //
  //       bassline.push({
  //         color: "blue",
  //         frequency: baseNoteFrequency / 2, // Low part of the bass, one octave down
  //         duration: lowDuration,
  //         startTime: startTime + highDuration,
  //       });
  //     }
  //   }
  //   return bassline;
  // }
}
