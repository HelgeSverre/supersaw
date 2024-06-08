import type { Effect } from "./chain";

export class Distortion implements Effect {
  private audioContext: AudioContext;
  private distortion: WaveShaperNode;

  constructor(audioContext: AudioContext, amount: number) {
    this.audioContext = audioContext;
    this.distortion = this.audioContext.createWaveShaper();
    this.distortion.curve = this.makeDistortionCurve(amount);
    this.distortion.oversample = "4x";
  }

  private makeDistortionCurve(amount: number): Float32Array {
    const k = amount;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  connect(node: AudioNode) {
    this.distortion.connect(node);
  }

  disconnect() {
    this.distortion.disconnect();
  }

  setAmount(amount: number) {
    this.distortion.curve = this.makeDistortionCurve(amount);
  }

  getNode(): WaveShaperNode {
    return this.distortion;
  }
}
