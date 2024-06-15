// Ticker.ts

import { audioManager } from "../audio";
import { midiNoteToFrequency } from "../midi";

export class Ticker {
  private audioContext: AudioContext;
  private readonly mixer: GainNode;

  constructor(audioContext: AudioContext, mixer: GainNode) {
    this.audioContext = audioContext;
    this.mixer = mixer;
  }

  public play(): void {
    let oscillator = this.audioContext.createOscillator();
    let gainNode = this.audioContext.createGain();
    let filter = this.audioContext.createBiquadFilter();

    // Set up the filter
    filter.type = "lowpass";
    filter.frequency.value = 2000;
    filter.Q.value = 2;

    // Connect the nodes
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioManager.mixer);

    let now = audioManager.audioContext.currentTime;

    // ADSR
    let attack = 0.001;
    let decay = 0.03;
    let duration = now + attack + decay + 0.0001;

    // Envelope
    gainNode.gain.setValueAtTime(0.0001, now);
    gainNode.gain.exponentialRampToValueAtTime(1, now + attack); // Quick fade in
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + decay); // Fade out

    // Oscillator
    oscillator.type = "sine"; // Type of sound wave
    oscillator.frequency.setValueAtTime(midiNoteToFrequency(90), now); // Higher frequency for a "tick" sound
    oscillator.frequency.exponentialRampToValueAtTime(midiNoteToFrequency(90), now + 0.0001); // Higher frequency for a "tick" sound
    oscillator.start();

    // Stop the sound after the duration
    oscillator.stop(duration);

    // Clean up after the sound has played
    setTimeout(() => {
      oscillator.disconnect();
      gainNode.disconnect();
    }, duration * 100);
  }
}
