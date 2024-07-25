class LFO {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.oscillator = audioContext.createOscillator();
    this.gainNode = audioContext.createGain();
    this.oscillator.connect(this.gainNode);

    this.sampleTime = 0;
    this.currentSample = 0;
    this.nextSample = 0;

    this.setWaveform("sine");
    this.oscillator.frequency.setValueAtTime(1, audioContext.currentTime);
    this.gainNode.gain.setValueAtTime(1, audioContext.currentTime);

    this.oscillator.start();
  }

  setWaveform(waveform) {
    this.waveform = waveform;
    if (["sine", "square", "sawtooth", "triangle"].includes(waveform)) {
      this.oscillator.type = waveform;
    } else {
      this.oscillator.type = "sawtooth"; // Use sawtooth as the base for custom waveforms
    }
  }

  setFrequency(frequency) {
    this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
  }

  setAmount(amount) {
    this.gainNode.gain.setValueAtTime(amount, this.audioContext.currentTime);
  }

  connect(param) {
    this.gainNode.connect(param);
  }

  disconnect() {
    this.gainNode.disconnect();
  }

  getValue() {
    const now = this.audioContext.currentTime;
    let value;

    switch (this.waveform) {
      case "S&H":
        if (now >= this.sampleTime) {
          this.currentSample = Math.random() * 2 - 1;
          this.sampleTime = now + 1 / this.oscillator.frequency.value;
        }
        value = this.currentSample;
        break;
      case "S&G":
        if (now >= this.sampleTime) {
          this.currentSample = this.nextSample;
          this.nextSample = Math.random() * 2 - 1;
          this.sampleTime = now + 1 / this.oscillator.frequency.value;
        }
        const phase = (now - this.sampleTime) * this.oscillator.frequency.value;
        value = this.currentSample + (this.nextSample - this.currentSample) * phase;
        break;
      default:
        value =
          this.oscillator.type === "sawtooth"
            ? ((now * this.oscillator.frequency.value) % 1) * 2 - 1
            : Math.sin(now * this.oscillator.frequency.value * Math.PI * 2);
    }

    return value * this.gainNode.gain.value;
  }
}

export default LFO;
