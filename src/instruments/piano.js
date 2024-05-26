export class Piano {
  constructor(audioContext, mixer) {
    this.audioContext = audioContext;
    this.mixer = mixer;
    this.output = this.audioContext.createGain();
    this.output.connect(this.mixer);
    this.notes = new Map();
  }

  createOscillators(frequency, time) {
    const frequencies = [frequency, frequency * 2, frequency * 3];
    const oscillators = [];

    frequencies.forEach((freq) => {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, time);
      oscillators.push(oscillator);
    });

    return oscillators;
  }

  applyEnvelope(envelope, attackTime, decayTime, sustainLevel, releaseTime, startTime) {
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(1, startTime + attackTime);
    envelope.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime + decayTime);

    return { attackTime, decayTime, sustainLevel, releaseTime };
  }

  startNote(frequency) {
    const startTime = this.audioContext.currentTime;
    const oscillators = this.createOscillators(frequency, startTime);
    const envelope = this.audioContext.createGain();
    envelope.connect(this.output);

    oscillators.forEach((oscillator) => {
      oscillator.connect(envelope);
      oscillator.start(startTime);
    });

    const { attackTime, decayTime, sustainLevel, releaseTime } = this.applyEnvelope(
      envelope,
      0.1,
      0.3,
      0.7,
      0.5,
      startTime,
    );

    this.notes.set(frequency, { oscillators, envelope, releaseTime });
  }

  stopNote(frequency) {
    if (this.notes.has(frequency)) {
      const { oscillators, envelope, releaseTime } = this.notes.get(frequency);
      const now = this.audioContext.currentTime;

      envelope.gain.cancelScheduledValues(now);
      envelope.gain.setValueAtTime(envelope.gain.value, now);
      envelope.gain.linearRampToValueAtTime(0, now + releaseTime);

      oscillators.forEach((oscillator) => oscillator.stop(now + releaseTime));

      this.notes.delete(frequency);
    }
  }

  playNote(frequency, time, duration) {
    const oscillators = this.createOscillators(frequency, time);
    const envelope = this.audioContext.createGain();
    envelope.connect(this.output);
    const key = `${frequency}:${time}:${duration}`;

    oscillators.forEach((oscillator) => {
      oscillator.connect(envelope);
      oscillator.start(time);
      oscillator.stop(time + duration + 0.5);
      oscillator.onended = () => this.notes.delete(key);
    });

    const attack = 0.01;
    const decay = 0.05;
    const sustain = 0.3;
    const release = 0.5;

    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(1, time + attack);
    envelope.gain.exponentialRampToValueAtTime(sustain, time + attack + decay);
    envelope.gain.linearRampToValueAtTime(0.0001, time + duration + release);

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