import type { Effect } from "./effectChain";

export class Gain implements Effect {
  private audioContext: AudioContext;
  private gain: GainNode;

  constructor(audioContext: AudioContext, gain: number) {
    this.audioContext = audioContext;
    this.gain = this.audioContext.createGain();
    this.gain.gain.setValueAtTime(gain, this.audioContext.currentTime);
  }

  connect(node: AudioNode) {
    this.gain.connect(node);
  }

  disconnect() {
    this.gain.disconnect();
  }

  getNode(): GainNode {
    return this.gain;
  }
}
