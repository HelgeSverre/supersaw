// src/effects/Compressor.ts
export class Compressor {
  private audioContext: AudioContext;
  private compressor: DynamicsCompressorNode;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.compressor.threshold.setValueAtTime(-6, this.audioContext.currentTime);
    this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
    this.compressor.ratio.setValueAtTime(4, this.audioContext.currentTime);
    this.compressor.attack.setValueAtTime(0.005, this.audioContext.currentTime);
    this.compressor.release.setValueAtTime(0.05, this.audioContext.currentTime);
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
