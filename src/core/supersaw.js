class SuperSawSynth {
  constructor(audioContext, numOscillators = 7, highPassFilterFrequency = 30) {
    this.audioContext = audioContext;
    this.numOscillators = numOscillators;
    this.oscillators = [];
    this.gains = [];
    this.highPassFilter = this.audioContext.createBiquadFilter();
    this.highPassFilter.type = "highpass";
    this.highPassFilter.frequency.value = highPassFilterFrequency;
    this.initOscillators();
  }

  setHighPassFilterFrequency(frequency) {
    this.highPassFilter.frequency.value = frequency;
  }

  initOscillators() {
    const centerIndex = Math.floor(this.numOscillators / 2);
    for (let i = 0; i < this.numOscillators; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      oscillator.type = "sawtooth";
      if (i !== centerIndex) {
        // Random phase for each oscillator
        oscillator.start(0, Math.random() * 2 * Math.PI);
      }
      oscillator.connect(gain);
      gain.connect(this.highPassFilter);
      this.oscillators.push(oscillator);
      this.gains.push(gain);
    }
    this.highPassFilter.connect(this.audioContext.destination);
  }

  start(frequency, detuneCurve, time = this.audioContext.currentTime) {
    const centerIndex = Math.floor(this.numOscillators / 2);
    this.oscillators.forEach((oscillator, index) => {
      oscillator.frequency.value = frequency;
      if (index !== centerIndex) {
        // Apply the detune curve
        const detuneAmount = detuneCurve[index - (index < centerIndex ? 0 : 1)];
        oscillator.detune.value = detuneAmount;
      }
      oscillator.start(time);
    });
  }

  setVolume(volume, time = this.audioContext.currentTime) {
    this.gains.forEach((gain) => {
      gain.gain.setValueAtTime(volume, time);
    });
  }

  stop(time = this.audioContext.currentTime) {
    this.oscillators.forEach((oscillator) => {
      oscillator.stop(time);
    });
  }
}

// Example usage:
// const audioContext = new AudioContext();
// const supersaw = new SuperSawSynth(audioContext);
// const detuneCurve = [
//   /* Fill this array based on the polynomial approximation */
// ];
// supersaw.setVolume(0.5);
// supersaw.start(440, detuneCurve);
// setTimeout(() => {
//   supersaw.stop();
// }, 2000); // Stop after 2 seconds
