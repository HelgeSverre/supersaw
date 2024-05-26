export class Synth {
  constructor(audioContext, mixer) {
    this.audioContext = audioContext;
    this.mixer = mixer;
    this.output = this.audioContext.createGain();
    this.output.connect(this.mixer);
    this.notes = new Map();
  }

  createOscillator(frequency, time) {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(frequency, time);
    return oscillator;
  }

  applyEnvelope(envelope, attackTime, decayTime, sustainLevel, releaseTime, startTime) {
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(1, startTime + attackTime);
    envelope.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime + decayTime);

    return { attackTime, decayTime, sustainLevel, releaseTime };
  }

  startNote(frequency) {
    const startTime = this.audioContext.currentTime;
    const oscillator = this.createOscillator(frequency, startTime);
    const envelope = this.audioContext.createGain();
    envelope.connect(this.output);

    oscillator.connect(envelope);
    oscillator.start(startTime);

    const { releaseTime } = this.applyEnvelope(envelope, 0.001, 0.3, 0.7, 0.5, startTime);

    this.notes.set(frequency, { oscillator, envelope, releaseTime });
  }

  stopNote(frequency) {
    if (this.notes.has(frequency)) {
      const { oscillator, envelope, releaseTime } = this.notes.get(frequency);
      const now = this.audioContext.currentTime;

      envelope.gain.cancelScheduledValues(now);
      envelope.gain.setValueAtTime(envelope.gain.value, now);
      envelope.gain.linearRampToValueAtTime(0, now + releaseTime);

      oscillator.stop(now + releaseTime);

      this.notes.delete(frequency);
    }
  }

  playNote(frequency, time, duration) {
    const oscillator = this.createOscillator(frequency, time);
    const envelope = this.audioContext.createGain();
    envelope.connect(this.output);

    oscillator.connect(envelope);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.1);

    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(1, time + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.3, time + 0.1);
    envelope.gain.linearRampToValueAtTime(0.0001, time + duration + 0.1);

    let key = `${frequency}:${time}:${duration}`;
    this.notes.set(key, { oscillator });

    oscillator.onended = () => this.notes.delete(key);
  }

  clearScheduledNotes() {
    this.notes.forEach(({ oscillator }) => oscillator.cancelScheduledValues(0));
  }

  stop() {
    this.notes.forEach(({ oscillator }) => {
      oscillator.disconnect();
      oscillator.stop();
    });
    this.notes.clear();
  }

  setVolume(volume) {
    this.output.gain.value = volume;
  }
}
