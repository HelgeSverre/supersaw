import type { Effect } from "./chain";

export class Compressor implements Effect {
  private audioContext: AudioContext;
  private compressor: DynamicsCompressorNode;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-6, this.audioContext.currentTime);
    this.compressor.knee.setValueAtTime(6, this.audioContext.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.audioContext.currentTime);
    this.compressor.attack.setValueAtTime(0.1, this.audioContext.currentTime);
    this.compressor.release.setValueAtTime(0.8, this.audioContext.currentTime);
  }

  connect(node: AudioNode) {
    this.compressor.connect(node);
  }

  disconnect() {
    this.compressor.disconnect();
  }

  getNode(): DynamicsCompressorNode {
    return this.compressor;
  }
}
