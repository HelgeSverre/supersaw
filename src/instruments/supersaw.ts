import type { ADSR, Instrument } from "../core/types";
import { Reverb } from "../core/effects/reverb";
import { Filter } from "../core/effects/filter";
import { Distortion } from "../core/effects/distortion";
import { Compressor } from "../core/effects/compressor";
import { ParallelChain } from "../core/effects/parallelChain";
import { EffectChain } from "../core/effects/effectChain";

interface Note {
  oscillators: OscillatorNode[];
  envelope: GainNode;
}

export class Supersaw implements Instrument {
  private audioContext: AudioContext;
  private mixer: AudioNode;
  private notes: Map<string | number, Note>;
  private adsr: ADSR;
  private numOscillators: number;
  private detuneAmount: number;
  private reverbAmount: number;
  private reverbTime: number;
  private distortionAmount: number;

  private output: GainNode;

  private effectChain: ParallelChain;

  constructor(audioContext: AudioContext, mixer: AudioNode) {
    this.audioContext = audioContext;
    this.mixer = mixer;
    this.notes = new Map();
    this.adsr = { attack: 0.01, decay: 0.08, sustain: 0.3, release: 1.1 };
    this.numOscillators = 8;
    this.detuneAmount = 20;
    this.reverbAmount = 0.25;
    this.reverbTime = 2;
    this.distortionAmount = 4;

    this.effectChain = new ParallelChain(audioContext, [
      new EffectChain(this.audioContext, [
        new Compressor(this.audioContext),
        new Distortion(this.audioContext, this.distortionAmount),
      ]),
      new EffectChain(this.audioContext, [
        new Reverb(this.audioContext, this.reverbTime),
        new Filter(this.audioContext, "highpass", 500),
        new Filter(this.audioContext, "lowpass", 6000),
      ]),
    ]);

    this.output = this.audioContext.createGain();
    this.effectChain.connect(this.output);
    this.output.connect(this.mixer);
  }

  private oscGain(gain = 1): number {
    return gain / Math.sqrt(this.numOscillators);
  }

  private createHighPassFilter(frequency: number): BiquadFilterNode {
    const filter = this.audioContext.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    return filter;
  }

  private createLowPassFilter(frequency: number): BiquadFilterNode {
    const filter = this.audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    return filter;
  }

  private createCompressor(): DynamicsCompressorNode {
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-6, this.audioContext.currentTime);
    compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
    compressor.ratio.setValueAtTime(4, this.audioContext.currentTime);
    compressor.attack.setValueAtTime(0.005, this.audioContext.currentTime);
    compressor.release.setValueAtTime(0.05, this.audioContext.currentTime);
    return compressor;
  }

  private createDistortion(): WaveShaperNode {
    const distortion = this.audioContext.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(this.distortionAmount);
    distortion.oversample = "4x";
    return distortion;
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

  private createReverbImpulse(): ConvolverNode {
    const reverb = this.audioContext.createConvolver();
    const length = this.audioContext.sampleRate * this.reverbTime;
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      impulseL[i] = (Math.random() * 2 - 1) * (1 - i / length);
      impulseR[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    reverb.buffer = impulse;
    return reverb;
  }

  private createSupersawOscillators(frequency: number, time: number): OscillatorNode[] {
    const oscillators: OscillatorNode[] = [];

    for (let i = 0; i < this.numOscillators; i++) {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, time);
      oscillator.detune.setValueAtTime((i - (this.numOscillators - 1) / 2) * this.detuneAmount, time);
      oscillators.push(oscillator);
    }

    return oscillators;
  }

  startNote(frequency: number): void {
    const now = this.audioContext.currentTime;
    const oscillators = this.createSupersawOscillators(frequency, now);
    const envelope = this.audioContext.createGain();

    envelope.connect(this.effectChain.getInputNode());

    oscillators.forEach((oscillator, index) => {
      const phaseOffset = index / 1000 + Math.random() / 1000;
      oscillator.connect(envelope);
      oscillator.start(now + phaseOffset);
    });

    this.applyEnvelope(envelope, now);
    this.notes.set(frequency, { oscillators, envelope });
  }

  stopNote(frequency: number): void {
    if (!this.notes.has(frequency)) return;

    const { release } = this.adsr;
    const { oscillators, envelope } = this.notes.get(frequency)!;
    const now = this.audioContext.currentTime;

    envelope.gain.cancelAndHoldAtTime(now);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + release);

    oscillators.forEach((oscillator) => {
      oscillator.stop(now + release + 0.001);
      oscillator.onended = () => oscillator.disconnect();
    });

    this.notes.delete(frequency);
  }

  playNote(frequency: number, time: number, duration: number): void {
    const { attack, sustain, release, decay } = this.adsr;
    const oscillators = this.createSupersawOscillators(frequency, time);
    const envelope = this.audioContext.createGain();

    envelope.connect(this.effectChain.getInputNode());

    oscillators.forEach((oscillator, index) => {
      const phaseOffset = index / 1000 + Math.random() / 1000;
      oscillator.connect(envelope);
      oscillator.start(time + phaseOffset);
    });

    this.applyEnvelope(envelope, time);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration + attack + decay + release);

    const key = `${frequency}:${time}:${duration}`;
    this.notes.set(key, { oscillators, envelope });
    oscillators.forEach((oscillator) => {
      oscillator.onended = () => this.notes.delete(key);
    });
  }

  private applyEnvelope(envelope: GainNode, time: number): { release: number } {
    const { attack, decay, sustain, release } = this.adsr;
    envelope.gain.setValueAtTime(0.00001, time);
    envelope.gain.exponentialRampToValueAtTime(this.oscGain(1), time + attack);
    envelope.gain.exponentialRampToValueAtTime(this.oscGain(sustain), time + attack + decay);
    return { release };
  }

  stop(): void {
    this.notes.forEach(({ oscillators, envelope }) => {
      oscillators.forEach((oscillator) => {
        oscillator.stop(this.audioContext.currentTime);
        oscillator.onended = () => oscillator.disconnect();
        oscillator.disconnect();
      });

      envelope.gain.cancelScheduledValues(this.audioContext.currentTime);
      envelope.disconnect();
    });

    this.notes.clear();
  }
}
