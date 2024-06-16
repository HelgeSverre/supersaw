import { frequencyToMidiNote, noteLabel } from "../core/midi.js";

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

  noteToFrequency(note) {
    // Map of note names to their semitone positions from C
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

    // Extract the note and octave from the input
    const keyName = note.slice(0, -1);
    const octave = parseInt(note.slice(-1));

    // Find the position of the note in the octave
    const keyNumber = notes.indexOf(keyName);

    // Calculate the position of the note in the chromatic scale starting from C0
    const noteNumber = octave * 12 + keyNumber;

    // A4 is 440 Hz, and is the 49th key (from C0, which is MIDI note number 12)
    return 440 * Math.pow(2, (noteNumber - 57) / 12);
  }

  createBasicMotif(baseFrequency, barLength) {
    // Define the motif structure in terms of a fraction of the bar length
    return [
      { note: baseFrequency, duration: 2 / 3 }, // Two-thirds of a beat
      { note: baseFrequency * Math.pow(2, 3 / 12), duration: 1 / 6 }, // One-sixth of a beat
      { note: baseFrequency * Math.pow(2, 7 / 12), duration: 1 / 6 }, // One-sixth of a beat
    ];
  }

  varyMotif(motif, variationType) {
    switch (variationType) {
      case "rhythm":
        // Shift the timing of notes
        motif[1].duration *= 0.5;
        motif[2].duration *= 2;
        break;
      case "interval":
        // Change the intervals of the notes
        motif[1].note *= Math.pow(2, 1 / 12); // Minor second up
        motif[2].note /= Math.pow(2, 1 / 12); // Minor second down
        break;
      case "inversion":
        // Invert the motif intervals
        motif = motif.map((note, index) => {
          if (index === 0) return note;
          return { note: motif[0].note / (note.note / motif[0].note), duration: note.duration };
        });
        break;
    }
    return motif;
  }

  generateMelodyWithMotif(bars, rootNotes = ["A4", "G4", "F4", "G4"]) {
    // generateMelodyWithMotif(bars, rootNotes, barLength, motifTemplate) {
    let melody = [];
    let currentTime = 0;

    for (let bar = 0; bar < bars; bar++) {
      let baseFrequency = this.noteToFrequency(rootNotes[bar % rootNotes.length]);
      let motif = this.createBasicMotif(baseFrequency, this.barLength); // Generate motif with correct timing

      // Apply motif to the current bar
      motif.forEach((note) => {
        melody.push({
          color: "green",
          frequency: note.note,
          startTime: currentTime,
          duration: note.duration * this.barLength, // Adjust duration to fit within the bar
        });
        currentTime += note.duration * this.barLength;
      });

      // Fill the remaining part of the bar with rest or repeat the motif
      currentTime = (bar + 1) * this.barLength; // Ensure each bar starts fresh, aligning the melody correctly
    }
    return melody;
  }

  generateHardstyleTripletMelodyAndBassline(bars = 4, rootNotes = ["D#6", "A#5", "F#5", "F5"]) {
    const melody = [];
    const bassline = [];
    const beatDuration = this.barLength / 4; // Each beat's duration within a 4/4 bar
    const noteDuration = (2 / 3) * beatDuration; // Two-thirds of the beat for the melody note
    const bassNoteDuration = beatDuration / 3; // Last third of the beat for the bass note

    const key = this.noteToFrequency(rootNotes[0]);

    let currentTime = 0;
    for (let bar = 0; bar < bars; bar++) {
      const baseFrequency = this.noteToFrequency(rootNotes[bar % rootNotes.length]);

      // Define intervals and weights for the Aeolian mode
      const intervals = [
        { interval: -7, weight: 9 }, // Perfect fifth
        { interval: -5, weight: 9 }, // Perfect fourth
        { interval: -3, weight: 8 }, // Minor third
        { interval: -2, weight: 8 }, // Major second
        { interval: 0, weight: 20 }, // Root
        { interval: 2, weight: 3 }, // Major second
        { interval: 3, weight: 3 }, // Minor third
        { interval: 5, weight: 2 }, // Perfect fourth
        { interval: 7, weight: 2 }, // Perfect fifth
        { interval: 8, weight: 1 }, // Minor sixth
        // { interval: 10, weight: 0.5 }, // Minor seventh
        // { interval: 12, weight: 2 }, // Octave
      ];

      for (let beat = 0; beat < 4; beat++) {
        // Root note always starts the bar
        let frequency = beat === 0 ? baseFrequency : this.weightedIntervalChoice(baseFrequency, intervals);

        // Generate melody note
        melody.push({
          color: beat === 0 ? "yellow" : "skyblue", // Different colors for visual differentiation
          frequency: frequency,
          startTime: currentTime,
          duration: noteDuration,
        });

        // Generate bass note
        bassline.push({
          color: "hotpink",
          frequency: baseFrequency / 2, // One octave lower
          startTime: currentTime + noteDuration,
          duration: bassNoteDuration,
        });

        currentTime += beatDuration; // Move to the next beat
      }
    }
    return { melody, bassline };
  }

  // Helper function to select an interval based on weights
  weightedIntervalChoice(baseFrequency, intervals) {
    const totalWeight = intervals.reduce((acc, item) => acc + item.weight, 0);
    let random = Math.random() * totalWeight;
    for (const item of intervals) {
      random -= item.weight;
      if (random <= 0) {
        return baseFrequency * Math.pow(2, item.interval / 12);
      }
    }
  }

  generateHardstyleTripletMelodyAndBasslineOld(bars = 4, rootNotes = ["D#6", "A#5", "F#5", "F5"]) {
    const melody = [];
    const bassline = [];
    const beatDuration = this.barLength / 4; // Each beat's duration within a 4/4 bar
    const noteDuration = (2 / 3) * beatDuration; // Two-thirds of the beat for the melody note
    const bassNoteDuration = beatDuration / 3; // Last third of the beat for the bass note

    let currentTime = 0;
    for (let bar = 0; bar < bars; bar++) {
      const baseFrequency = this.noteToFrequency(rootNotes[bar % rootNotes.length]);
      for (let beat = 0; beat < 4; beat++) {
        // Generate melody note
        melody.push({
          color: "skyblue", // Color coding for visual differentiation
          frequency: baseFrequency, // Using the root note for each beat's melody
          startTime: currentTime,
          duration: noteDuration * 0.9,
        });

        // Generate bass note
        bassline.push({
          color: "red", // Color coding for the bass note
          frequency: baseFrequency / 2, // Typically one octave lower
          startTime: currentTime + noteDuration,
          duration: bassNoteDuration,
        });

        currentTime += beatDuration; // Move to the next beat
      }
    }
    return { melody, bassline };
  }

  generateThreeFourMelody(bars = 4, rootNotes = ["D#6", "A#5", "F#5", "F5"]) {
    const melody = [];
    const noteIntervals = [0, 2, 4, 5, 7]; // Using a simple major scale pattern for variations
    const beatDuration = this.barLength / 3; // As we are dividing the bar into three major beats

    let currentTime = 0;
    for (let bar = 0; bar < bars; bar++) {
      const baseFrequency = this.noteToFrequency(rootNotes[bar % rootNotes.length]);
      // Generating three notes per bar, starting with the root note
      for (let beat = 0; beat < 3; beat++) {
        const interval = beat === 0 ? 0 : this.randomChoice(noteIntervals); // Root note starts the bar
        const frequency = beat === 0 ? baseFrequency : baseFrequency * Math.pow(2, interval / 12);
        melody.push({
          color: beat === 0 ? "red" : "blue", // Highlight the root note differently
          frequency,
          startTime: currentTime,
          duration: beatDuration - 10, // Slightly shorter than the beat for separation
        });
        currentTime += beatDuration;
      }
    }
    return melody;
  }

  generateTripletBassline(bars = 4, rootNotes = ["D#6", "A#5", "F#5", "F5"]) {
    const bassline = [];
    const beatDuration = this.barLength / 3;
    const tripletDuration = beatDuration / 3; // Dividing the beat into three for triplets

    let currentTime = 0;
    for (let bar = 0; bar < bars; bar++) {
      const baseFrequency = this.noteToFrequency(rootNotes[bar % rootNotes.length]) / 2; // One octave lower
      // Generate three triplet bass notes for each main beat
      for (let beat = 0; beat < 3; beat++) {
        for (let triplet = 1; triplet <= 3; triplet++) {
          // Start from offset to create the offbeat feel
          bassline.push({
            color: "green",
            frequency: baseFrequency,
            startTime: currentTime + triplet * tripletDuration,
            duration: tripletDuration - 10, // Slightly shorter to prevent overlapping
          });
        }
        currentTime += beatDuration;
      }
    }
    return bassline;
  }

  generateHardstyleMelodyWithRootNotes(bars = 4, rootNotes = ["D#6", "A#5", "F#5", "F5"]) {
    const melody = [];
    const noteLengths = [0.25, 0.5, 1]; // Various note lengths for variety
    const noteIntervals = [0, 1, 3, 5, 7]; // Minor scale intervals for variation
    const restProbability = 0.1; // Probability of a rest note

    let currentTime = 0;
    for (let bar = 0; bar < bars; bar++) {
      const baseFrequency = this.noteToFrequency(rootNotes[bar % rootNotes.length]); // Get frequency for current bar

      console.log(
        baseFrequency,
        frequencyToMidiNote(baseFrequency),
        noteLabel(frequencyToMidiNote(baseFrequency)),
        rootNotes[bar % rootNotes.length],
      );

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
        } else {
          const frequency = baseFrequency * Math.pow(2, interval / 12);
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

        // const interval = this.randomChoice([0, 1, 2, 4, 5, 7]);
        const interval = this.randomChoice([0, 2, 3, 5, 7, 8, 11]);
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
            color: "skyblue",
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
          melody.push({
            color: "transparent",
            frequency: 0,
            startTime: currentTime,
            duration: realDuration,
          });
        } else {
          const frequency = this.baseFrequency * Math.pow(2, interval / 12);
          melody.push({
            color: "blue",
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

  generateHardstyleMelodyPhrygian(bars = 4) {
    const melody = [];
    const noteLengths = [0.5, 0.25, 0.125]; // Including very short notes for high energy
    const noteIntervals = [0, 1, 4, 5, 7, 8, 10]; // Phrygian dominant scale intervals
    const restProbability = 0.2;

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

  generateHardstyleBassline(melody, bars = 4, high = true, low = true) {
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

        if (high) {
          bassline.push({
            color: "red",
            frequency: baseNoteFrequency,
            duration: highDuration,
            startTime: startTime,
          });
        }

        if (low) {
          bassline.push({
            color: "blue",
            frequency: baseNoteFrequency / 2,
            duration: lowDuration,
            startTime: startTime + highDuration,
          });
        }
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
