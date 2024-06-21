import { Seconds } from "./time";

const MINIMUM_VALUE = 0.0001;

export type ADSRParameters = {
  attack: Seconds;
  decay: Seconds;
  sustain: number; // Sustain level (0 to 1)
  release: Seconds;
};

class ADSR {
  private context: AudioContext;
  private parameters: ADSRParameters;

  constructor(context: AudioContext, parameters: ADSRParameters) {
    this.context = context;
    this.parameters = parameters;
  }

  applyEnvelope(param: AudioParam, startTime: Seconds, duration?: Seconds): void {
    const { attack, decay, sustain, release } = this.parameters;
    const now = this.context.currentTime;
    const endTime = duration ? startTime + duration : null;

    param.cancelScheduledValues(startTime);
    param.setValueAtTime(MINIMUM_VALUE, startTime);
    param.exponentialRampToValueAtTime(1, startTime + attack);
    param.exponentialRampToValueAtTime(sustain, startTime + attack + decay);

    if (endTime) {
      // If duration is known, schedule the release phase
      param.setValueAtTime(sustain, endTime);
      param.linearRampToValueAtTime(MINIMUM_VALUE, endTime + release);
    }
  }

  applyEnvelopeOnTrigger(param: AudioParam): void {
    const { attack, decay, sustain } = this.parameters;
    const now = this.context.currentTime;

    param.cancelScheduledValues(now);
    param.setValueAtTime(MINIMUM_VALUE, now);
    param.exponentialRampToValueAtTime(1, now + attack);
    param.exponentialRampToValueAtTime(sustain, now + attack + decay);
  }

  releaseEnvelope(param: AudioParam): void {
    const { sustain, release } = this.parameters;
    const now = this.context.currentTime;

    param.cancelScheduledValues(now);
    param.setValueAtTime(sustain, now);
    param.exponentialRampToValueAtTime(MINIMUM_VALUE, now + release);
  }
}

export default ADSR;
