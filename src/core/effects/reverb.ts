import type { Effect } from "./chain";

export class Reverb implements Effect {
  private audioContext: AudioContext;
  private reverb: ConvolverNode;

  constructor(audioContext: AudioContext, time: number) {
    this.audioContext = audioContext;
    this.reverb = this.audioContext.createConvolver();
    this.reverb.buffer = this.createReverbImpulse(time);
  }

  private createReverbImpulse(time: number): AudioBuffer {
    const length = this.audioContext.sampleRate * time;
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      impulseL[i] = (Math.random() * 2 - 1) * (1 - i / length);
      impulseR[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    return impulse;
  }

  setTime(time: number) {
    this.reverb.buffer = this.createReverbImpulse(time);
  }

  connect(node: AudioNode) {
    this.reverb.connect(node);
  }

  disconnect() {
    this.reverb.disconnect();
  }

  getNode(): ConvolverNode {
    return this.reverb;
  }
}
