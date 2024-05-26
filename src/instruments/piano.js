// Instrument.js

import { midiNoteToFrequency } from "../core/midi.js";

export class Piano {
  constructor(audioContext, mixer) {
    this.audioContext = audioContext;
    this.mixer = mixer;
    this.output = this.audioContext.createGain();
    this.output.connect(this.mixer);
    this.notes = new Map();
  }

  playNote(note, time, duration) {
    const fundamentalFreq = midiNoteToFrequency(note);
    const oscillators = [];

    // Create multiple oscillators to simulate piano overtones
    const frequencies = [fundamentalFreq, fundamentalFreq * 2, fundamentalFreq * 3];

    frequencies.forEach((freq) => {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, time);
      oscillator.connect(this.output);
      oscillators.push(oscillator);
    });

    // ADSR envelope
    const attack = 0.01;
    const decay = 0.1;
    const sustain = 0.3;
    const release = 0.2;

    this.output.gain.setValueAtTime(0.0001, time);
    this.output.gain.linearRampToValueAtTime(1, time + attack);
    this.output.gain.exponentialRampToValueAtTime(sustain, time + attack + decay);
    this.output.gain.linearRampToValueAtTime(0.0001, time + duration + release);

    oscillators.forEach((oscillator) => {
      oscillator.start(time);
      oscillator.stop(time + duration + release);
      oscillator.onended = () => this.notes.delete(`${note}:${time}:${duration}`);
    });

    let key = `${note}:${time}:${duration}`;
    this.notes.set(key, oscillators);
  }

  clearScheduledNotes() {
    this.notes.forEach((oscillators) => oscillators.forEach((oscillator) => oscillator.cancelScheduledValues(0)));
  }

  stop() {
    this.notes.forEach((oscillators) => {
      oscillators.forEach((oscillator) => {
        oscillator.disconnect();
        oscillator.stop();
      });
    });
    this.notes.clear();
  }

  setVolume(volume) {
    this.output.gain.value = volume;
  }
}
