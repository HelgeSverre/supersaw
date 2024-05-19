import { midiNoteToFrequency } from "../core/midi.js";

export class Instrument {
  constructor(audioContext, mixer) {
    this.audioContext = audioContext;
    this.mixer = mixer;
  }

  playNote(note, time, duration) {
    const gainNode = this.audioContext.createGain();
    const oscillator = this.audioContext.createOscillator();
    const frequency = midiNoteToFrequency(note);

    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(frequency, time);
    oscillator.connect(gainNode);
    gainNode.connect(this.mixer);

    // ADSR envelope
    gainNode.gain.setValueAtTime(0.0001, time);
    gainNode.gain.linearRampToValueAtTime(1, time + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.3, time + 0.1);
    gainNode.gain.linearRampToValueAtTime(0.0001, time + duration);

    oscillator.start(time);
    oscillator.stop(time + duration + 0.1);
  }
}
