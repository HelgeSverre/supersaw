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

export default SuperSawSynth;

class SuperSawSynthWithADSR {
  constructor(audioContext, numOscillators = 7) {
    this.audioContext = audioContext;
    this.numOscillators = numOscillators;
    this.oscillators = [];
    this.gains = [];
    this.highPassFilter = this.audioContext.createBiquadFilter();
    this.highPassFilter.type = "highpass";
    this.highPassFilter.frequency.value = 30; // Adjust based on your needs
    this.initOscillators();
  }

  initOscillators() {
    const centerIndex = Math.floor(this.numOscillators / 2);
    for (let i = 0; i < this.numOscillators; i++) {
      const oscillator = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      gain.gain.value = 0.0001; // Start with gain at a minimal non-zero value to avoid clicks and allow exponential ramp
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

  start(frequency, detuneCurve, adsr, time = this.audioContext.currentTime) {
    const { attack, decay, sustain, release } = adsr;
    const centerIndex = Math.floor(this.numOscillators / 2);
    this.oscillators.forEach((oscillator, index) => {
      oscillator.frequency.value = frequency;
      if (index !== centerIndex) {
        const detuneAmount = detuneCurve[index - (index < centerIndex ? 0 : 1)];
        oscillator.detune.value = detuneAmount;
      }
      oscillator.start(time);
      const gainNode = this.gains[index];
      gainNode.gain.cancelScheduledValues(time);
      gainNode.gain.setValueAtTime(0.0001, time);
      gainNode.gain.exponentialRampToValueAtTime(1, time + attack);
      gainNode.gain.exponentialRampToValueAtTime(sustain, time + attack + decay);
    });
  }

  stop(time = this.audioContext.currentTime, adsr) {
    const { release } = adsr;
    this.gains.forEach((gain) => {
      gain.gain.setValueAtTime(gain.gain.value, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + release);
    });
    this.oscillators.forEach((oscillator) => {
      oscillator.stop(time + release + 0.1); // Add a small buffer to ensure release completes
    });
  }
}

// // Example usage:
// const audioContext = new AudioContext();
// const supersaw = new SuperSawSynth(audioContext);
// const detuneCurve = [/* Fill this array based on the polynomial approximation */];
// const adsr = { attack: 0.5, decay: 0.2, sustain: 0.7, release: 0.5 };
//
// supersaw.start(440, detuneCurve, adsr);
// setTimeout(() => {
//   supersaw.stop(audioContext.currentTime, adsr);
// }, 2000);  // Stop after 2 seconds

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
