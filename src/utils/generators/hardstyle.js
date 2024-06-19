export class HardstyleGenerator {
  constructor(tonic = "A", scaleType = "harmonicMinor") {
    this.tonicFrequency = this.noteToFrequency(tonic);
    this.scaleIntervals = this.getScaleIntervals(scaleType);
    this.bpm = 150;
    this.beatDuration = (60 / this.bpm) * 1000;
    this.barLength = 4 * this.beatDuration;
  }

  noteToFrequency(note) {
    // Convert note name to frequency (example implementation)
    const notes = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
    const index = notes.indexOf(note);
    return 440 * Math.pow(2, (index - 9) / 12); // A4 = 440 Hz
  }

  getScaleIntervals(scaleType) {
    if (scaleType === "harmonicMinor") {
      // Intervals for a harmonic minor scale
      return [0, 2, 3, 5, 7, 8, 11];
    }

    // Natural minor as default
    return [0, 2, 3, 5, 7, 8, 10];
  }

  generateMelody(bars = 4, contour = "random") {
    const restProbability = 0.3;
    const melody = [];
    let currentTime = 0;
    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        if (Math.random() > restProbability) {
          // Check if this beat should be a rest
          const intervalIndex = this.getIntervalIndex(contour, bar, beat);
          const frequency = this.tonicFrequency * Math.pow(2, this.scaleIntervals[intervalIndex] / 12);
          melody.push({
            color: "blue",
            frequency,
            startTime: currentTime,
            duration: this.beatDuration,
          });
        }

        // No else needed, as we simply skip adding a note if it's a rest
        currentTime += this.beatDuration;
      }
    }
    return melody;
  }

  getIntervalIndex(contour, bar, beat) {
    switch (contour) {
      case "ascending":
        return (bar * 4 + beat) % this.scaleIntervals.length;
      case "descending":
        return this.scaleIntervals.length - 1 - ((bar * 4 + beat) % this.scaleIntervals.length);
      default:
        return Math.floor(Math.random() * this.scaleIntervals.length);
    }
  }

  generateBassline(melody, rhythmicPattern = "standard") {
    const bassline = [];
    melody.forEach((note, index) => {
      if (index % 4 === 0) {
        // Tonic reinforcement at the start of each bar
        bassline.push({
          color: "red",
          frequency: this.tonicFrequency,
          duration: this.beatDuration,
          startTime: note.startTime,
        });
      } else {
        bassline.push({
          color: "blue",
          frequency: note.frequency / 2,
          duration: this.beatDuration,
          startTime: note.startTime,
        });
      }
    });
    return bassline;
  }
}
