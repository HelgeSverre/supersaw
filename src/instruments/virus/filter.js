import ADSREnvelope from "./adsr.js";

class VirusFilter {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.filter = audioContext.createBiquadFilter();
    this.saturation = audioContext.createWaveShaper();

    this.input.connect(this.saturation);
    this.saturation.connect(this.filter);
    this.filter.connect(this.output);

    this.envelope = new ADSREnvelope(audioContext);
    this.keyTracking = 0;
    this.baseCutoff = 1000;
    this.resonance = 0;
    this.envelopeAmount = 0;
    this.saturationAmount = 0;

    this.updateSaturationCurve();
  }

  setType(type) {
    this.filter.type = type;
  }

  setCutoff(frequency) {
    this.baseCutoff = frequency;
    this.updateCutoff();
  }

  setResonance(amount) {
    this.resonance = amount;
    this.filter.Q.setValueAtTime(amount, this.audioContext.currentTime);
  }

  setEnvelopeAmount(amount) {
    this.envelopeAmount = amount;
  }

  setSaturation(amount) {
    this.saturationAmount = amount;
    this.updateSaturationCurve();
  }

  setKeyTracking(amount) {
    this.keyTracking = amount;
  }

  updateCutoff(note = 60) {
    const now = this.audioContext.currentTime;
    const keyTrackingOffset = (note - 60) * this.keyTracking;
    this.filter.frequency.setValueAtTime(this.baseCutoff + keyTrackingOffset, now);
  }

  updateSaturationCurve() {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const amount = this.saturationAmount * 50;
    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      curve[i] = (Math.tanh(amount * x) + x) / 2;
    }
    this.saturation.curve = curve;
  }

  triggerEnvelope() {
    this.envelope.trigger(this.filter.frequency, this.baseCutoff, this.envelopeAmount);
  }

  releaseEnvelope() {
    this.envelope.release(this.filter.frequency, this.baseCutoff);
  }

  connect(destination) {
    this.output.connect(destination);
  }

  disconnect() {
    this.output.disconnect();
  }

  setEnvelopeParams(attack, decay, sustain, release) {
    this.envelope.setParams(attack, decay, sustain, release);
  }
}

export default VirusFilter;
