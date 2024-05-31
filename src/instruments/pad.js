export class Pad {
  constructor(audioContext, mixer) {
    this.audioContext = audioContext;
    this.mixer = mixer;
    this.output = this.audioContext.createGain();
    this.output.connect(this.mixer);

    // Osc -> Reverb -> Compressor -> Output
    // Osc -> Output

    this.compressor = this.createCompressor();
    this.compressor.connect(this.output);

    this.reverb = this.audioContext.createConvolver();
    this.reverb.connect(this.compressor);
    this.createReverbImpulse();

    this.notes = new Map();
  }

  createCompressor() {
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-10, this.audioContext.currentTime);
    compressor.knee.setValueAtTime(40, this.audioContext.currentTime);
    compressor.ratio.setValueAtTime(10, this.audioContext.currentTime);
    compressor.attack.setValueAtTime(0, this.audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

    return compressor;
  }

  createReverbImpulse() {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * 3.5;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }

    this.reverb.buffer = impulse;
  }

  createOscillators(frequency, time) {
    const detuneAmounts = [-12, -6, 0, 6, 12]; // Slight detuning for richness
    const oscillators = [];

    detuneAmounts.forEach((detune) => {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = "sawtooth"; // Sawtooth for a richer sound
      oscillator.frequency.setValueAtTime(frequency, time);
      oscillator.detune.setValueAtTime(detune, time);

      oscillators.push(oscillator);
    });

    return oscillators;
  }

  applyEnvelope(envelope, attackTime, decayTime, sustainLevel, releaseTime, startTime) {
    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.linearRampToValueAtTime(1 / 5, startTime + attackTime);
    envelope.gain.exponentialRampToValueAtTime(sustainLevel / 5, startTime + attackTime + decayTime);
    if (releaseTime) {
      envelope.gain.linearRampToValueAtTime(0, startTime + attackTime + decayTime + releaseTime);
    }

    return { attackTime, decayTime, sustainLevel, releaseTime };
  }

  startNote(frequency) {
    const startTime = this.audioContext.currentTime;
    const oscillators = this.createOscillators(frequency, startTime);
    const envelope = this.audioContext.createGain();
    envelope.connect(this.reverb);

    oscillators.forEach((oscillator) => {
      oscillator.connect(envelope);
      oscillator.start(startTime);
    });

    this.applyEnvelope(envelope, 2.0, 0.2, 1, null, startTime);

    this.notes.set(frequency, { oscillators, envelope, releaseTime: 2.0 });
  }

  stopNote(frequency) {
    if (this.notes.has(frequency)) {
      const { oscillators, envelope, releaseTime } = this.notes.get(frequency);
      const now = this.audioContext.currentTime;

      envelope.gain.cancelAndHoldAtTime(now);
      envelope.gain.linearRampToValueAtTime(0, now + releaseTime);

      oscillators.forEach((oscillator) => {
        oscillator.stop(now + releaseTime);
        this.notes.delete(frequency);
      });
    }
  }

  playNote(frequency, time, duration) {
    const oscillators = this.createOscillators(frequency, time);
    const envelope = this.audioContext.createGain();
    envelope.connect(this.output);

    oscillators.forEach((oscillator) => {
      oscillator.connect(envelope); // Connect oscillator to envelope
      oscillator.start(time);
      oscillator.stop(time + duration);
      oscillator.onended = () => this.notes.delete(`${frequency}:${time}:${duration}`);
    });

    const attack = 2.0;
    const decay = 1.0;
    const sustain = 0.8;
    const release = 2.0;

    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(1, time + attack);
    envelope.gain.exponentialRampToValueAtTime(sustain, time + attack + decay);
    envelope.gain.linearRampToValueAtTime(0.0001, time + duration + release);

    let key = `${frequency}:${time}:${duration}`;
    this.notes.set(key, { oscillators, envelope });
  }

  clearScheduledNotes() {
    this.notes.forEach(({ oscillators }) => oscillators.forEach((oscillator) => oscillator.cancelScheduledValues(0)));
  }

  stop() {
    this.notes.forEach(({ oscillators }) => {
      oscillators.forEach((oscillator) => {
        oscillator.disconnect();
        oscillator.stop();
      });
    });
    this.notes.clear();
  }

  setVolume(volume) {
    this.output.gain.value = volume;
  }
}
