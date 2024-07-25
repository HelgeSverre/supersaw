class ADSREnvelope {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.attack = 0.01;
    this.decay = 0.1;
    this.sustain = 0.5;
    this.release = 0.1;
  }

  trigger(param, baseValue, envelopeAmount) {
    const now = this.audioContext.currentTime;
    const attackValue = baseValue + envelopeAmount;

    param.cancelScheduledValues(now);
    param.setValueAtTime(baseValue, now);
    param.linearRampToValueAtTime(attackValue, now + this.attack);
    param.linearRampToValueAtTime(baseValue + this.sustain * envelopeAmount, now + this.attack + this.decay);
  }

  release(param, baseValue) {
    const now = this.audioContext.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(baseValue, now + this.release);
  }

  setParams(attack, decay, sustain, release) {
    this.attack = attack;
    this.decay = decay;
    this.sustain = sustain;
    this.release = release;
  }
}

export default ADSREnvelope;
