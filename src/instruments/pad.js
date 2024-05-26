export class Pad {
  constructor(audioContext, mixer) {
    this.audioContext = audioContext;
    this.mixer = mixer;
    this.output = this.audioContext.createGain();
    this.output.connect(this.mixer);
    this.notes = new Map();
    this.reverb = this.audioContext.createConvolver();
    this.reverb.connect(this.output);
    this.createReverbImpulse();
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
    const frequencies = [frequency, frequency * 0.5, frequency * 0.25];
    const oscillators = [];

    frequencies.forEach((freq) => {
      const oscillator = this.audioContext.createOscillator();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(freq, time);
      oscillator.connect(this.reverb);
      oscillators.push(oscillator);
    });

    return oscillators;
  }

  applyEnvelope(envelope, attackTime, decayTime, sustainLevel, releaseTime, startTime) {
    envelope.gain.setValueAtTime(0.0001, startTime);
    envelope.gain.linearRampToValueAtTime(1, startTime + attackTime);
    envelope.gain.exponentialRampToValueAtTime(sustainLevel, startTime + attackTime + decayTime);
    envelope.gain.linearRampToValueAtTime(0.0001, startTime + releaseTime);

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

    const { releaseTime } = this.applyEnvelope(envelope, 2.0, 1.0, 0.8, 3.0, startTime);

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

    const attack = 2.0;
    const decay = 1.0;
    const sustain = 0.8;
    const release = 2.0;

    this.output.gain.setValueAtTime(0.0001, time);
    this.output.gain.linearRampToValueAtTime(1, time + attack);
    this.output.gain.exponentialRampToValueAtTime(sustain, time + attack + decay);
    this.output.gain.linearRampToValueAtTime(0.0001, time + duration + release);

    oscillators.forEach((oscillator) => {
      oscillator.start(time);
      oscillator.stop(time + duration + release);
      oscillator.onended = () => this.notes.delete(`${frequency}:${time}:${duration}`);
    });

    let key = `${frequency}:${time}:${duration}`;
    this.notes.set(key, oscillators);
  }

  clearScheduledNotes() {
    this.notes.forEach((oscillators) => oscillators.forEach((oscillator) => oscillator.cancelScheduledValues(0)));
  }

  stop() {
    this.notes.forEach((oscillators) => {
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
