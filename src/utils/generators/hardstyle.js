export class HardstyleGenerator {
  constructor(tonic = "A", scaleType = "harmonicMinor", bpm = 150) {
    this.tonicFrequency = this.noteToFrequency(tonic);
    this.scaleIntervals = this.getScaleIntervals(scaleType);
    this.bpm = bpm;
    this.beatDuration = (60 / this.bpm) * 1000; // Duration of one beat in milliseconds
    this.barLength = 4 * this.beatDuration; // Duration of one bar in milliseconds
  }

  noteToFrequency(note) {
    const notes = ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#"];
    const index = notes.indexOf(note);
    return 440 * Math.pow(2, (index - 9) / 12); // A4 = 440 Hz
  }

  getScaleIntervals(scaleType) {
    return scaleType === "harmonicMinor" ? [0, 2, 3, 5, 7, 8, 11] : [0, 2, 3, 5, 7, 8, 10];
  }

  generateMelody(bars = 4, restProbability = 0.3) {
    const melody = [];
    let currentTime = 0;
    for (let bar = 0; bar < bars; bar++) {
      let barTime = 0;
      while (barTime < this.barLength) {
        let durationChoices = [this.beatDuration, this.beatDuration / 2, this.beatDuration / 4];
        let duration = durationChoices[Math.floor(Math.random() * durationChoices.length)];

        if (barTime + duration > this.barLength) {
          // Ensure the note doesn't extend beyond the bar
          duration = this.barLength - barTime;
        }

        const intervalIndex = Math.floor(Math.random() * this.scaleIntervals.length);
        const frequency = this.tonicFrequency * Math.pow(2, this.scaleIntervals[intervalIndex] / 12);

        if (Math.random() > restProbability || barTime === 0) {
          melody.push({
            color: "yellow",
            frequency,
            startTime: currentTime,
            duration,
          });
        }

        currentTime += duration;
        barTime += duration;
      }
    }
    return melody;
  }

  shuffleScaleSteps() {
    let array = [...this.scaleIntervals];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  generateBassline(melody, bars = 4) {
    const bassline = [];
    for (let bar = 0; bar < bars; bar++) {
      let baseNoteFrequency =
        melody.find(
          (note) =>
            note.startTime >= bar * this.barLength &&
            note.startTime < (bar + 1) * this.barLength &&
            note.frequency !== 0,
        )?.frequency || 130.81;

      for (let beat = 0; beat < 4; beat++) {
        const startTime = bar * this.barLength + beat * this.beatDuration;
        const highDuration = this.beatDuration * 0.75;
        const lowDuration = this.beatDuration * 0.25;

        const scaleInterval = this.scaleIntervals[Math.floor(Math.random() * 2)];

        bassline.push({
          color: "red",
          frequency: baseNoteFrequency + scaleInterval,
          duration: highDuration,
          startTime: startTime,
        });

        bassline.push({
          color: "blue",
          frequency: (baseNoteFrequency + scaleInterval) / 2,
          duration: lowDuration,
          startTime: startTime + highDuration,
        });
      }
    }
    return bassline;
  }
}
