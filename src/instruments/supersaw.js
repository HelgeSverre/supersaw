export class Supersaw {
  constructor(audioContext, mixer) {
    this.audioContext = audioContext;
    this.mixer = mixer;
    this.output = this.audioContext.createGain();
    this.output.connect(this.mixer);
    this.notes = new Map();
    this.adsr = { attack: 0.001, decay: 0.1, sustain: 0.3, release: 0.5 };
    this.numOscillators = 4;
    this.detuneAmount = 22;
  }

  createSupersawOscillators(frequency, time) {
    const oscillators = [];

    for (let i = 0; i < this.numOscillators; i++) {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(frequency, time);
      oscillator.detune.setValueAtTime((i - (this.numOscillators - 1) / 2) * this.detuneAmount, time);
      oscillator.volume = 1 / this.numOscillators;
      oscillators.push(oscillator);
    }

    return oscillators;
  }

  applyEnvelope(envelope, startTime) {
    const { attack, decay, sustain, release } = this.adsr;
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(1, startTime + attack);
    envelope.gain.linearRampToValueAtTime(sustain, startTime + attack + decay);
    return { release };
  }

  startNote(frequency) {
    const startTime = this.audioContext.currentTime;
    const oscillators = this.createSupersawOscillators(frequency, startTime);
    const envelope = this.audioContext.createGain();
    envelope.connect(this.output);

    oscillators.forEach((oscillator) => {
      oscillator.connect(envelope);
      oscillator.start(startTime);
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

    oscillators.forEach((oscillator) => {
      oscillator.connect(envelope);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.1);
    });

    const { attack, decay, sustain, release } = this.adsr;
    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(1, time + attack);
    envelope.gain.exponentialRampToValueAtTime(sustain, time + attack + decay);
    envelope.gain.linearRampToValueAtTime(0.0001, time + duration + release);

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

  setVolume(volume) {
    this.output.gain.value = volume;
  }

  setADSR(attack, decay, sustain, release) {
    this.adsr = { attack, decay, sustain, release };
  }
}
