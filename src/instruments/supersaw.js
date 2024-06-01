export class Supersaw {
  constructor(audioContext, mixer) {
    this.audioContext = audioContext;
    this.mixer = mixer;
    this.notes = new Map();
    this.adsr = { attack: 0.001, decay: 0.05, sustain: 1, release: 1 };
    this.numOscillators = 8;
    this.detuneAmount = 20;
    this.reverbAmount = 0.25;
    this.reverbTime = 2;
    this.distortionAmount = 0;

    // Create and connect nodes
    this.output = this.audioContext.createGain();
    this.distortion = this.createDistortion();
    this.reverb = this.createReverbImpulse();
    this.compressor = this.createCompressor();
    this.reverbHPF = this.createHighPassFilter(600);
    this.reverbLPF = this.createLowPassFilter(6000);

    // Chain the effects
    this.distortion.connect(this.compressor);
    this.compressor.connect(this.output);
    this.output.connect(this.mixer);

    // Parallel chain for reverb
    this.reverbGain = this.audioContext.createGain();
    this.reverbGain.gain.value = this.reverbAmount;
    this.reverbHPF.connect(this.reverbLPF);
    this.reverbLPF.connect(this.reverb);
    this.reverb.connect(this.reverbGain);
    this.reverbGain.connect(this.output);
  }

  oscGain(gain = 1) {
    return gain / Math.sqrt(this.numOscillators);
  }

  createHighPassFilter(frequency) {
    const filter = this.audioContext.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    return filter;
  }

  createLowPassFilter(frequency) {
    const filter = this.audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    return filter;
  }

  createCompressor() {
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-6, this.audioContext.currentTime);
    compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
    compressor.ratio.setValueAtTime(4, this.audioContext.currentTime);
    compressor.attack.setValueAtTime(0.005, this.audioContext.currentTime);
    compressor.release.setValueAtTime(0.05, this.audioContext.currentTime);
    return compressor;
  }

  createDistortion() {
    const distortion = this.audioContext.createWaveShaper();
    distortion.curve = this.makeDistortionCurve(this.distortionAmount);
    distortion.oversample = "4x";
    return distortion;
  }

  makeDistortionCurve(amount) {
    const k = typeof amount === "number" ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  createReverbImpulse() {
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

  createSupersawOscillators(frequency, time) {
    const oscillators = [];

    for (let i = 0; i < this.numOscillators; i++) {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, time);
      oscillator.detune.setValueAtTime((i - (this.numOscillators - 1) / 2) * this.detuneAmount, time);
      oscillators.push(oscillator);
    }

    return oscillators;
  }

  startNote(frequency) {
    const now = this.audioContext.currentTime;
    const oscillators = this.createSupersawOscillators(frequency, now);
    const envelope = this.audioContext.createGain();

    envelope.connect(this.distortion); // Connect to the first effect in the chain
    envelope.connect(this.reverbHPF);

    oscillators.forEach((oscillator, index) => {
      const phaseOffset = index / 1000 + Math.random() / 1000;
      oscillator.connect(envelope);
      oscillator.start(now + phaseOffset);
    });

    this.applyEnvelope(envelope, now);
    this.notes.set(frequency, { oscillators, envelope });
  }

  stopNote(frequency) {
    if (!this.notes.has(frequency)) return;

    const { release } = this.adsr;
    const { oscillators, envelope } = this.notes.get(frequency);
    const now = this.audioContext.currentTime;

    envelope.gain.cancelAndHoldAtTime(now);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + release);

    oscillators.forEach((oscillator) => {
      oscillator.stop(now + release + 0.001);
      oscillator.onended = () => oscillator.disconnect();
    });

    this.notes.delete(frequency);
  }

  playNote(frequency, time, duration) {
    const { attack, sustain, release, decay } = this.adsr;
    const oscillators = this.createSupersawOscillators(frequency, time);
    const envelope = this.audioContext.createGain();

    envelope.connect(this.distortion);
    envelope.connect(this.reverbHPF);

    oscillators.forEach((oscillator, index) => {
      const phaseOffset = index / 1000 + Math.random() / 1000;
      oscillator.connect(envelope);
      oscillator.start(time + phaseOffset);
    });

    this.applyEnvelope(envelope, time);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration + attack + decay + release);

    let key = `${frequency}:${time}:${duration}`;
    this.notes.set(key, { oscillators, envelope });
    oscillators.forEach((oscillator) => {
      oscillator.onended = () => this.notes.delete(key);
    });
  }

  applyEnvelope(envelope, time) {
    const { attack, decay, sustain, release } = this.adsr;
    envelope.gain.setValueAtTime(0.00001, time);
    envelope.gain.exponentialRampToValueAtTime(this.oscGain(1), time + attack);
    envelope.gain.exponentialRampToValueAtTime(this.oscGain(sustain), time + attack + decay);
    return { release };
  }

  clearScheduledNotes() {
    this.notes.forEach(({ oscillators }) => oscillators.forEach((oscillator) => oscillator.cancelScheduledValues(0)));
  }

  stop() {
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
