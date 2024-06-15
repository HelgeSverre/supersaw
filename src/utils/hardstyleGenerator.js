export class MusicGenerator {
  constructor(baseFrequency = 130.81, bpm = 150) {
    this.baseFrequency = baseFrequency;
    this.bpm = bpm;
    this.beatDuration = (60 / this.bpm) * 1000;
    this.barLength = 4 * this.beatDuration;
  }

  randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  generateHardstyleMelodyWithPhrasing(bars = 4) {
    const melody = [];
    const phraseLengths = [0.25, 0.5, 0.75, 1]; // Sum of lengths within a bar should equal 4
    let currentTime = 0;

    for (let bar = 0; bar < bars; bar++) {
      let barTime = 0; // Track time within the bar
      while (barTime < this.barLength) {
        const length = this.randomChoice(phraseLengths);
        const realDuration = this.beatDuration * length;
        if (barTime + realDuration > this.barLength) break; // Avoid exceeding the bar length

        const interval = this.randomChoice([0, 1, 2, 4, 5, 7]);
        const frequency = this.baseFrequency * Math.pow(2, interval / 12);
        melody.push({
          color: "yellow",
          frequency,
          startTime: currentTime,
          duration: realDuration,
        });

        currentTime += realDuration;
        barTime += realDuration;
      }
      currentTime = (bar + 1) * this.barLength; // Move to the start of the next bar
    }
    return melody;
  }

  generateHardstyleMelody(bars = 4) {
    const melody = [];
    const noteLengths = [1, 0.5, 0.25]; // Full beat, half beat, and quarter beat
    const noteIntervals = [0, 1, 2, 4, 5, 7]; // Scale intervals
    const restProbability = 0.2; // Adjusted probability of a rest

    let currentTime = 0;
    for (let bar = 0; bar < bars; bar++) {
      let barTime = 0;
      while (barTime < this.barLength) {
        let length = this.randomChoice(noteLengths);
        let interval = this.randomChoice(noteIntervals);
        let realDuration = this.beatDuration * length;

        if (barTime + realDuration > this.barLength) {
          realDuration = this.barLength - barTime; // Adjust last note duration to fit the bar
          length = realDuration / this.beatDuration; // Recalculate note length
        }

        if (Math.random() < restProbability) {
        } else {
          const frequency = this.baseFrequency * Math.pow(2, interval / 12);
          melody.push({
            color: "green",
            frequency,
            startTime: currentTime,
            duration: realDuration,
          });
        }

        currentTime += realDuration;
        barTime += realDuration;
      }
    }
    return melody;
  }

  generateHardstyleMelodyPentatonicSyncopation(bars = 4) {
    const melody = [];
    const noteLengths = [0.25, 0.5, 1]; // Emphasizes rhythmic syncopation
    const noteIntervals = [0, 3, 5, 7, 10]; // Pentatonic minor scale intervals
    const restProbability = 0.1; // Lower probability of rests for more continuous sound

    let currentTime = 0;
    for (let bar = 0; bar < bars; bar++) {
      let barTime = 0;
      while (barTime < this.barLength) {
        let length = this.randomChoice(noteLengths);
        let interval = this.randomChoice(noteIntervals);
        let realDuration = this.beatDuration * length;

        if (barTime + realDuration > this.barLength) {
          realDuration = this.barLength - barTime;
          length = realDuration / this.beatDuration;
        }

        if (Math.random() < restProbability) {
          // melody.push({
          //   color: "transparent",
          //   frequency: 0,
          //   startTime: currentTime,
          //   duration: realDuration,
          // });
        } else {
          const frequency = this.baseFrequency * Math.pow(2, interval / 12);
          melody.push({
            color: "green",
            frequency,
            startTime: currentTime,
            duration: realDuration,
          });
        }

        currentTime += realDuration;
        barTime += realDuration;
      }
    }
    return melody;
  }

  generateHardstyleMelodyHarmonicMinor(bars = 4) {
    const melody = [];
    const noteLengths = [0.5, 1]; // Longer notes for sustained energy
    const noteIntervals = [0, 2, 3, 5, 7, 8, 11]; // Harmonic minor scale intervals
    const restProbability = 0.2; // Slightly higher rest probability for dramatic effect

    let currentTime = 0;
    for (let bar = 0; bar < bars; bar++) {
      let barTime = 0;
      while (barTime < this.barLength) {
        let length = this.randomChoice(noteLengths);
        let interval = this.randomChoice(noteIntervals);
        let realDuration = this.beatDuration * length;

        if (barTime + realDuration > this.barLength) {
          realDuration = this.barLength - barTime;
          length = realDuration / this.beatDuration;
        }

        if (Math.random() < restProbability) {
          melody.push({ color: "transparent", frequency: 0, startTime: currentTime, duration: realDuration });
        } else {
          const frequency = this.baseFrequency * Math.pow(2, interval / 12);
          melody.push({ color: "blue", frequency, startTime: currentTime, duration: realDuration });
        }

        currentTime += realDuration;
        barTime += realDuration;
      }
    }
    return melody;
  }

  generateHardstyleMelodyPhrygian(bars = 4) {
    const melody = [];
    const noteLengths = [0.25, 0.125]; // Including very short notes for high energy
    const noteIntervals = [0, 1, 4, 5, 7, 8, 10]; // Phrygian dominant scale intervals
    const restProbability = 0.15;

    let currentTime = 0;
    for (let bar = 0; bar < bars; bar++) {
      let barTime = 0;
      while (barTime < this.barLength) {
        let length = this.randomChoice(noteLengths);
        let interval = this.randomChoice(noteIntervals);
        let realDuration = this.beatDuration * length;

        if (barTime + realDuration > this.barLength) {
          realDuration = this.barLength - barTime;
          length = realDuration / this.beatDuration;
        }

        if (Math.random() < restProbability) {
          melody.push({ color: "transparent", frequency: 0, startTime: currentTime, duration: realDuration });
        } else {
          const frequency = this.baseFrequency * Math.pow(2, interval / 12);
          melody.push({ color: "red", frequency, startTime: currentTime, duration: realDuration });
        }

        currentTime += realDuration;
        barTime += realDuration;
      }
    }
    return melody;
  }

  generateHardstyleBassline(melody, bars = 4) {
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

        bassline.push({
          color: "red",
          frequency: baseNoteFrequency,
          duration: highDuration,
          startTime: startTime,
        });

        bassline.push({
          color: "blue",
          frequency: baseNoteFrequency / 2,
          duration: lowDuration,
          startTime: startTime + highDuration,
        });
      }
    }
    return bassline;
  }

  generateHardstyleBasslineSimple(melody, bars = 4) {
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

        bassline.push({
          color: "purple",
          frequency: baseNoteFrequency,
          duration: highDuration,
          startTime: startTime,
        });
      }
    }
    return bassline;
  }

  generateHardstyleKick(bars = 4) {
    const kick = [];
    for (let bar = 0; bar < bars; bar++) {
      for (let beat = 0; beat < 4; beat++) {
        const startTime = bar * this.barLength + beat * this.beatDuration;
        kick.push({
          color: "white",
          frequency: 130.81,
          startTime: startTime,
          duration: this.beatDuration,
        });
      }
    }
    return kick;
  }

  generateHardstyleSong() {
    const melody = this.generateHardstyleMelodyWithPhrasing();
    const bassline = this.generateHardstyleBassline(melody);
    const kick = this.generateHardstyleKick();
    return [...melody, ...bassline, ...kick];
  }
}
