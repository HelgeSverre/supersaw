import { midiNoteToFrequency } from "../core/midi.js";

export class Synth {
  constructor(audioContext, mixer) {
    this.audioContext = audioContext;
    this.mixer = mixer;
    this.output = this.audioContext.createGain();
    this.output.connect(this.mixer);
    this.notes = new Map();
  }

  playNote(note, time, duration) {
    const oscillator = this.audioContext.createOscillator();
    const frequency = midiNoteToFrequency(note);

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.connect(this.output);

    // ADSR envelope
    this.output.gain.setValueAtTime(0.0001, time);
    this.output.gain.linearRampToValueAtTime(1, time + 0.01);
    this.output.gain.exponentialRampToValueAtTime(0.3, time + 0.1);
    this.output.gain.linearRampToValueAtTime(0.0001, time + duration);

    oscillator.start(time);

    let key = `${note}:${time}:${duration}`;
    this.notes.set(key, oscillator);

    oscillator.onended = () => this.notes.delete(key);
    oscillator.stop(time + duration + 0.1);
  }

  clearScheduledNotes() {
    this.notes.forEach((oscillator) => oscillator.cancelScheduledValues(0));
  }

  stop() {
    this.notes.forEach((oscillator) => {
      oscillator.disconnect();
      oscillator.stop();
    });
    this.notes.clear();
  }

  // connect(destination) {
  //   this.output.connect(destination);
  // }
  //
  // disconnect() {
  //   this.output.disconnect();
  // }

  setVolume(volume) {
    this.output.gain.value = volume;
  }
}
