import type { Effect } from "./effectChain";

export class TapeDelay implements Effect {
  private audioContext: AudioContext;
  private input: GainNode;
  private output: GainNode;
  private delay: DelayNode;
  private feedback: GainNode;
  private filter: BiquadFilterNode;
  private distortion: WaveShaperNode;

  constructor(
    audioContext: AudioContext,
    delayTime: number = 0.2,
    feedback: number = 0.4,
    filterFrequency: number = 2000,
  ) {
    this.audioContext = audioContext;

    // Create nodes
    this.input = this.audioContext.createGain();
    this.output = this.audioContext.createGain();
    this.delay = this.audioContext.createDelay();
    this.feedback = this.audioContext.createGain();
    this.filter = this.audioContext.createBiquadFilter();
    this.distortion = this.audioContext.createWaveShaper();

    // Set node parameters
    this.delay.delayTime.setValueAtTime(delayTime, this.audioContext.currentTime);
    this.feedback.gain.setValueAtTime(feedback, this.audioContext.currentTime);
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(filterFrequency, this.audioContext.currentTime);
    this.distortion.curve = this.makeDistortionCurve(10);

    // Connect nodes
    this.input.connect(this.delay);
    this.delay.connect(this.filter);
    this.filter.connect(this.distortion);
    this.distortion.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.output);
    this.input.connect(this.output); // Direct signal

    this.addWowAndFlutter();
  }

  connect(node: AudioNode): void {
    this.output.connect(node);
  }

  disconnect(): void {
    this.output.disconnect();
  }

  getNode(): AudioNode {
    return this.input;
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

  private addWowAndFlutter(): void {
    const lfoDepth = 0.0002;
    const lfoSpeed = 0.1;

    setInterval(() => {
      const time = this.audioContext.currentTime;
      this.delay.delayTime.setValueAtTime(
        this.delay.delayTime.value + lfoDepth * Math.sin(2 * Math.PI * lfoSpeed * time),
        time,
      );
    }, 50);
  }
}
