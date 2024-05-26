export class Supersaw {
  constructor(audioContext, mixer) {
    this.audioContext = audioContext;
    this.mixer = mixer;
    this.output = this.audioContext.createGain();
    this.output.connect(this.mixer);
    this.notes = new Map();
    this.adsr = { attack: 0.01, decay: 0.5, sustain: 0.2, release: 0.3 };
    // this.adsr = { attack: 0.001, decay: 0.1, sustain: 0.05, release: 0.5 };

    this.numOscillators = 4;
    this.reverbAmount = 0.5;
    this.detuneAmount = 12;

    this.reverbGain = this.audioContext.createGain();
    this.reverbGain.connect(this.output);
    this.reverbGain.gain.value = this.reverbAmount;
    this.createReverbImpulse();
  }

  createReverbImpulse() {
    // Reset reverb
    this.reverb = null;

    const length = this.audioContext.sampleRate * 2; // 3 seconds reverb
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
    const phaseOffset = 10; // 10ms phase offset between each oscillator

    for (let i = 0; i < this.numOscillators; i++) {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, time);
      oscillator.detune.setValueAtTime((i - (this.numOscillators - 1) / 2) * this.detuneAmount, time);
      oscillator.volume = 1 / Math.sqrt(this.numOscillators);
      oscillators.push(oscillator);
    }

    return oscillators;
  }

  applyEnvelope(envelope, startTime) {
    const { attack, decay, sustain, release } = this.adsr;
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.exponentialRampToValueAtTime(1, startTime + attack);
    envelope.gain.exponentialRampToValueAtTime(sustain, startTime + attack + decay);
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

    oscillators.forEach((oscillator, index) => {
      oscillator.connect(envelope);
      const phaseOffset = index / 100;
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

    oscillators.forEach((oscillator) => {
      oscillator.connect(envelope);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.1);
    });

    const { attack, decay, sustain, release } = this.adsr;
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.exponentialRampToValueAtTime(1, time + attack);
    envelope.gain.exponentialRampToValueAtTime(sustain, time + attack + decay);
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
