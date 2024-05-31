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

    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = index % 2 === 0 ? "square" : "triangle"; // Alternating between square and triangle waves
      oscillator.frequency.setValueAtTime(freq, time);
      oscillator.detune.setValueAtTime(index * 12, time); // Slight detuning for a richer sound
      oscillators.push(oscillator);
    });

    return oscillators;
  }

  applyEnvelope(envelope, attackTime, decayTime, sustainLevel, releaseTime, startTime) {
    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(1, startTime + attackTime);
    envelope.gain.exponentialRampToValueAtTime(sustainLevel, startTime + attackTime + decayTime);
    envelope.gain.exponentialRampToValueAtTime(0.01, startTime + attackTime + decayTime + releaseTime);

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

    // Shorter attack and decay for a pluckier sound
    const { attackTime, decayTime, sustainLevel, releaseTime } = this.applyEnvelope(
      envelope,
      0.01, // Very fast attack
      0.1, // Short decay
      0.1, // Lower sustain
      0.2, // Quick release
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
      // Ensure the note stops after the specified duration plus a bit extra to allow for release decay
      oscillator.stop(time + duration + 0.2); // Adjusted for quicker stop to match plucky behavior
    });

    // Very short attack and decay to simulate a pluck
    const attack = 0.01; // Very fast attack to simulate the initial force of a pluck
    const decay = 0.05; // Quick decay to simulate the rapid loss of energy
    const sustain = 0.1; // Lower sustain as the string vibration dies out quickly
    const release = 0.2; // Short release to simulate the quick silence after the note is played

    envelope.gain.setValueAtTime(0.0001, time);
    envelope.gain.linearRampToValueAtTime(1, time + attack);
    envelope.gain.exponentialRampToValueAtTime(sustain, time + attack + decay);
    envelope.gain.linearRampToValueAtTime(0.0001, time + duration + release); // Adjust release part of the envelope

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
