export class Pad {
  constructor(audioContext, mixer) {
    this.audioContext = audioContext;
    this.mixer = mixer;
    this.output = this.audioContext.createGain();
    this.output.connect(this.mixer);

    this.filter = this.audioContext.createBiquadFilter();
    this.filter.type = "lowpass";
    this.filter.frequency.setValueAtTime(4600, this.audioContext.currentTime);
    this.filter.Q.setValueAtTime(2, this.audioContext.currentTime);
    this.filter.connect(this.output);

    this.compressor = this.createCompressor();
    this.compressor.connect(this.filter);

    this.reverb = this.audioContext.createConvolver();
    this.reverb.buffer = this.createReverbImpulse();
    this.reverb.connect(this.compressor);

    this.adsr = {
      attack: 0.9,
      decay: 0.51,
      sustain: 0.6,
      release: 1.8,
    };

    this.notes = new Map();
  }

  createCompressor() {
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, this.audioContext.currentTime);
    compressor.knee.setValueAtTime(12, this.audioContext.currentTime);
    compressor.ratio.setValueAtTime(4, this.audioContext.currentTime);
    compressor.attack.setValueAtTime(0, this.audioContext.currentTime);
    compressor.release.setValueAtTime(0.5, this.audioContext.currentTime);

    return compressor;
  }

  createReverbImpulse() {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * 1.8;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      impulseL[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
      impulseR[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2);
    }

    return impulse;
  }

  createOscillators(frequency, time) {
    const detuneAmounts = [-13, -6, -3, 0, 2, 6, 12]; // Slight detuning for richness
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

  applyEnvelope(envelope, startTime, release) {
    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.linearRampToValueAtTime(1 / Math.sqrt(7), startTime + this.adsr.attack);
    envelope.gain.exponentialRampToValueAtTime(1 / Math.sqrt(7), startTime + this.adsr.attack + this.adsr.decay);

    if (release) {
      envelope.gain.linearRampToValueAtTime(0, startTime + this.adsr.attack + this.adsr.decay + this.adsr.release);
    }
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

    this.applyEnvelope(envelope, startTime, false);

    this.notes.set(frequency, { oscillators, envelope });
  }

  stopNote(frequency) {
    if (this.notes.has(frequency)) {
      const { oscillators, envelope } = this.notes.get(frequency);
      const now = this.audioContext.currentTime;

      envelope.gain.cancelAndHoldAtTime(now);
      envelope.gain.linearRampToValueAtTime(0, now + this.adsr.release);

      oscillators.forEach((oscillator) => {
        oscillator.stop(now + this.adsr.release);
        console.log("stopped");
        this.notes.delete(frequency);
      });
    }
  }

  playNote(frequency, time, duration) {
    const oscillators = this.createOscillators(frequency, time);
    const envelope = this.audioContext.createGain();
    envelope.connect(this.reverb);

    oscillators.forEach((oscillator) => {
      oscillator.connect(envelope);
      oscillator.start(time);
    });

    this.applyEnvelope(envelope, time, true);

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
        console.log("stopped");
      });
    });
    this.notes.clear();
  }

  setVolume(volume) {
    this.output.gain.value = volume;
  }
}
