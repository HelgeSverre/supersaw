import type { ADSR, Instrument } from "../core/types";
import { Reverb } from "../core/effects/reverb";
import { Filter } from "../core/effects/filter";
import { Distortion } from "../core/effects/distortion";
import { Compressor } from "../core/effects/compressor";
import { ParallelChain } from "../core/effects/parallelChain";
import { type Effect, EffectChain } from "../core/effects/effectChain";

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
  private lowPassFrequency: number;

  private dryCompressor: Effect;
  private dryDistortion: Effect;
  private cutoffFilter: Effect;
  private reverb: Effect;

  private output: GainNode;

  private effectChain: ParallelChain;

  constructor(audioContext: AudioContext, mixer: AudioNode) {
    this.audioContext = audioContext;
    this.mixer = mixer;
    this.notes = new Map();
    this.adsr = { attack: 0.01, decay: 0.08, sustain: 0.2, release: 1.0 };
    this.numOscillators = 8;
    this.detuneAmount = 20;
    this.reverbAmount = 0.25;
    this.reverbTime = 2;
    this.distortionAmount = 4;
    this.lowPassFrequency = 22050;

    this.dryCompressor = new Compressor(this.audioContext);
    this.dryDistortion = new Distortion(this.audioContext, this.distortionAmount);
    this.cutoffFilter = new Filter(this.audioContext, "lowpass", this.lowPassFrequency);
    this.reverb = new Reverb(this.audioContext, this.reverbTime);

    this.effectChain = new ParallelChain(audioContext, [
      new EffectChain(this.audioContext, [this.dryCompressor, this.dryDistortion, this.cutoffFilter]),
      new EffectChain(this.audioContext, [
        this.reverb,
        new Filter(this.audioContext, "highpass", 500),
        new Filter(this.audioContext, "lowpass", 6000),
        this.cutoffFilter,
      ]),
    ]);

    this.output = this.audioContext.createGain();
    this.effectChain.connect(this.output);
    this.output.connect(this.mixer);
  }

  private oscGain(gain = 1): number {
    return gain / Math.sqrt(this.numOscillators);
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
