import type { Effect } from "./effectChain";

export class CombFilter implements Effect {
  private audioContext: AudioContext;
  private filter: IIRFilterNode;

  constructor(audioContext: AudioContext, delayTime: number, decay: number) {
    this.audioContext = audioContext;

    // Get the sample rate of the audio context
    const sampleRate = audioContext.sampleRate;

    // Calculate the number of delay samples based on the delay time and sample rate
    const delaySamples = Math.round(delayTime * sampleRate);

    // Create feedforward and feedback arrays for the comb filter
    const feedforward = new Float32Array(delaySamples + 1);
    const feedback = new Float32Array(delaySamples + 1);

    // Set the initial and delayed sample values for the comb filter
    feedforward[0] = 1;
    feedforward[delaySamples] = -decay;

    feedback[0] = 1;
    feedback[delaySamples] = -decay;

    // Create the IIRFilterNode with the feedforward and feedback coefficients
    this.filter = this.audioContext.createIIRFilter(feedforward, feedback);
  }

  connect(node: AudioNode) {
    this.filter.connect(node);
  }

  disconnect() {
    this.filter.disconnect();
  }

  getNode(): IIRFilterNode {
    return this.filter;
  }
}
