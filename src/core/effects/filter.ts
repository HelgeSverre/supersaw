// src/effects/Filter.ts
export class Filter {
  private audioContext: AudioContext;
  private filter: BiquadFilterNode;

  constructor(audioContext: AudioContext, type: BiquadFilterType, frequency: number) {
    this.audioContext = audioContext;
    this.filter = this.audioContext.createBiquadFilter();
    this.filter.type = type;
    this.filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
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
