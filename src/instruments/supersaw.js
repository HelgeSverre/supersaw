export class Supersaw {
  constructor(audioContext, mixer) {
    this.audioContext = audioContext;
    this.mixer = mixer;
    this.output = this.audioContext.createGain();
    this.output.connect(this.mixer);
    this.notes = new Map();

    // this.adsr = { attack: 0.0, decay: 0.0, sustain: 1, release: 0.2 };
    this.adsr = { attack: 0.01, decay: 0.1, sustain: 1, release: 0.5 };

    this.numOscillators = 8;
    this.reverbAmount = 0.5;
    this.reverbTime = 2;
    this.detuneAmount = 20;

    this.reverbGain = this.audioContext.createGain();
    this.reverbGain.connect(this.output);
    this.reverbGain.gain.value = this.reverbAmount;
    this.createReverbImpulse();
    this.createDistortion();
  }

  oscGain(gain = 1) {
    return gain / Math.sqrt(this.numOscillators);
  }

  createDistortion() {
    this.distortion = this.audioContext.createWaveShaper();
    this.distortion.curve = this.makeDistortionCurve(800);
    this.distortion.oversample = "4x"; // "none", "2x", "4x
    this.distortion.connect(this.reverbGain);
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
    // Reset reverb
    this.reverb = null;

    const length = this.audioContext.sampleRate * this.reverbTime;
    const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
    const impulseL = impulse.getChannelData(0);
    const impulseR = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      impulseL[i] = (Math.random() * 2 - 1) * (1 - i / length);
      impulseR[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }

    this.reverb = this.audioContext.createConvolver();
    this.reverb.buffer = impulse;
    this.reverb.connect(this.reverbGain);
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

  applyEnvelope(envelope, startTime) {
    const { attack, decay, sustain, release } = this.adsr;
    envelope.gain.setValueAtTime(0.00001, startTime);
    envelope.gain.exponentialRampToValueAtTime(this.oscGain(1), startTime + attack);
    envelope.gain.exponentialRampToValueAtTime(this.oscGain(sustain), startTime + attack + decay);
    return { release };
  }

  startNote(frequency) {
    const startTime = this.audioContext.currentTime;
    const oscillators = this.createSupersawOscillators(frequency, startTime);
    const envelope = this.audioContext.createGain();
    envelope.connect(this.output);

    if (this.reverb) {
      envelope.connect(this.reverb);
    }

    if (this.distortion) {
      envelope.connect(this.distortion);
    }

    oscillators.forEach((oscillator, index) => {
      oscillator.connect(envelope);

      const phaseOffset = index / 1000 + Math.random() / 1000;
      oscillator.start(startTime + phaseOffset);
    });

    const { release } = this.applyEnvelope(envelope, startTime);

    this.notes.set(frequency, { oscillators, envelope, release });
  }

  stopNote(frequency) {
    if (this.notes.has(frequency)) {
      const { oscillators, envelope, release } = this.notes.get(frequency);
      const now = this.audioContext.currentTime;

      envelope.gain.cancelScheduledValues(now);
      envelope.gain.setValueAtTime(envelope.gain.value, now);
      envelope.gain.linearRampToValueAtTime(0, now + release);

      oscillators.forEach((oscillator) => oscillator.stop(now + release));

      this.notes.delete(frequency);
    }
  }

  playNote(frequency, time, duration) {
    const oscillators = this.createSupersawOscillators(frequency, time);
    const envelope = this.audioContext.createGain();
    envelope.connect(this.output);

    if (this.reverb) {
      envelope.connect(this.reverb);
    }

    oscillators.forEach((oscillator, index) => {
      oscillator.connect(envelope);
      const phaseOffset = index / 1000 + Math.random() / 1000;
      oscillator.start(time + phaseOffset);
      oscillator.stop(time + duration + 0.1);
    });

    const { attack, decay, sustain, release } = this.adsr;
    envelope.gain.setValueAtTime(0.00001, time);
    envelope.gain.exponentialRampToValueAtTime(this.oscGain(1), time + attack);
    envelope.gain.exponentialRampToValueAtTime(this.oscGain(sustain), time + attack + decay);
    envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration + release);

    let key = `${frequency}:${time}:${duration}`;
    this.notes.set(key, { oscillators, envelope });

    oscillators.forEach((oscillator) => {
      oscillator.onended = () => this.notes.delete(key);
    });
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

  setReverbAmount(amount) {
    this.reverbAmount = amount;
    this.reverbGain.gain.value = this.reverbAmount;
  }

  setVolume(volume) {
    this.output.gain.value = volume;
  }

  setADSR(attack, decay, sustain, release) {
    this.adsr = { attack, decay, sustain, release };
  }
}
