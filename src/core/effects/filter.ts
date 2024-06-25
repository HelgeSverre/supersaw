import type { Effect } from "./effectChain";

export class Filter implements Effect {
  private audioContext: AudioContext;
  private filter: BiquadFilterNode;

  constructor(audioContext: AudioContext, type: BiquadFilterType, frequency: number) {
    this.audioContext = audioContext;
    this.filter = this.audioContext.createBiquadFilter();
    this.filter.type = type;
    this.filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    this.filter.Q.setValueAtTime(2, this.audioContext.currentTime);
  }

  connect(node: AudioNode) {
    this.filter.connect(node);
  }

  disconnect() {
    this.filter.disconnect();
  }

  getNode(): BiquadFilterNode {
    return this.filter;
  }
}
