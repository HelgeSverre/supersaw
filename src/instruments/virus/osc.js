class VirusOscillator {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.oscillator = audioContext.createOscillator();
    this.pulseShaper = audioContext.createWaveShaper();
    this.syncOscillator = audioContext.createOscillator();
    this.syncGain = audioContext.createGain();
    this.waveshaper = audioContext.createWaveShaper();
    this.output = audioContext.createGain();

    this.oscillator.connect(this.pulseShaper);
    this.pulseShaper.connect(this.waveshaper);
    this.waveshaper.connect(this.output);

    this.syncOscillator.connect(this.syncGain);
    this.syncGain.connect(this.oscillator.frequency);

    this.waveform = "saw";
    this.pulseWidth = 0.5;
    this.syncEnabled = false;
    this.syncRatio = 1;
    this.detune = 0;

    this.spectralWaveforms = [
      this.createSpectralWaveform1(),
      this.createSpectralWaveform2(),
      this.createSpectralWaveform3(),
      this.createSpectralWaveform4(),
      this.createSpectralWaveform5(),
      this.createSpectralWaveform6(),
    ];

    this.wavetablePosition = 0;
    this.updateWaveform();
  }

  createSpectralWaveform1() {
    // Inspired by "Tortured Soul" spectral waveform
    const partials = 32;
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      let sum = 0;
      for (let j = 1; j <= partials; j++) {
        sum += Math.sin((2 * Math.PI * j * i) / 256) / (j * (1 + j * 0.05));
      }
      curve[i] = sum / partials;
    }
    return curve;
  }

  createSpectralWaveform2() {
    // Inspired by "Gibbon" spectral waveform
    const partials = 16;
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      let sum = 0;
      for (let j = 1; j <= partials; j++) {
        sum += Math.sin((2 * Math.PI * j * i) / 256) * Math.exp(-0.3 * j);
      }
      curve[i] = sum / partials;
    }
    return curve;
  }

  createSpectralWaveform3() {
    // Inspired by "Formant" spectral waveform
    const partials = 20;
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      let sum = 0;
      for (let j = 1; j <= partials; j++) {
        let amplitude = 1 / j;
        if (j % 2 === 0) amplitude *= 0.5;
        if (j % 3 === 0) amplitude *= 1.5;
        sum += Math.sin((2 * Math.PI * j * i) / 256) * amplitude;
      }
      curve[i] = sum / partials;
    }
    return curve;
  }

  createSpectralWaveform4() {
    // Inspired by "Noisy 2" spectral waveform
    const partials = 16;
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      let sum = 0;
      for (let j = 1; j <= partials; j++) {
        if (j % 2 !== 0) {
          sum += Math.sin((2 * Math.PI * j * i) / 256) / j;
        }
      }
      curve[i] = sum;
    }
    return curve;
  }

  createSpectralWaveform5() {
    // Inspired by "Filthy" spectral waveform
    const partials = 20;
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      let sum = 0;
      for (let j = 1; j <= partials; j++) {
        if (j % 2 === 0) {
          sum += (Math.sin((2 * Math.PI * j * i) / 256) * 0.5) / j;
        } else {
          sum += Math.sin((2 * Math.PI * j * i) / 256) / j;
        }
      }
      curve[i] = sum;
    }
    return curve;
  }

  createSpectralWaveform6() {
    // Inspired by "Decay" spectral waveform
    const partials = 20;
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      let sum = 0;
      for (let j = 1; j <= partials; j++) {
        sum += Math.sin((2 * Math.PI * j * i) / 256) * Math.exp(-0.1 * j);
      }
      curve[i] = sum / partials;
    }
    return curve;
  }

  setWaveform(waveform) {
    this.waveform = waveform;
    this.updateWaveform();
  }

  setPulseWidth(width) {
    this.pulseWidth = width;
    if (this.waveform === "pulse") {
      this.updateWaveform();
    }
  }

  setWavetablePosition(position) {
    this.wavetablePosition = Math.max(0, Math.min(1, position));
    if (this.waveform === "wavetable") {
      this.updateWavetable();
    }
  }

  updateWaveform() {
    switch (this.waveform) {
      case "sine":
        this.oscillator.type = "sine";
        this.waveshaper.curve = null;
        this.pulseShaper.curve = null;
        break;
      case "triangle":
        this.oscillator.type = "triangle";
        this.waveshaper.curve = null;
        this.pulseShaper.curve = null;
        break;
      case "saw":
        this.oscillator.type = "sawtooth";
        this.waveshaper.curve = null;
        this.pulseShaper.curve = null;
        break;
      case "pulse":
        this.oscillator.type = "sawtooth";
        this.updatePulseWidth();
        break;
      case "wavetable":
        this.oscillator.type = "sawtooth";
        this.waveshaper.curve = this.spectralWaveforms[this.waveform];
        this.pulseShaper.curve = null;
        break;
    }
  }

  updatePulseWidth() {
    const pulseWidth = this.pulseWidth;
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      curve[i] = i / 256 < pulseWidth ? -1 : 1;
    }
    this.pulseShaper.curve = curve;
  }

  updateWavetable() {
    const position = this.wavetablePosition * (this.spectralWaveforms.length - 1);
    const index = Math.floor(position);
    const nextIndex = Math.min(index + 1, this.spectralWaveforms.length - 1);
    const fraction = position - index;

    const currentWaveform = this.spectralWaveforms[index];
    const nextWaveform = this.spectralWaveforms[nextIndex];

    const interpolatedWaveform = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      interpolatedWaveform[i] = (1 - fraction) * currentWaveform[i] + fraction * nextWaveform[i];
    }

    this.waveshaper.curve = interpolatedWaveform;
  }

  enableSync(enabled) {
    this.syncEnabled = enabled;
    if (enabled) {
      this.syncGain.gain.setValueAtTime(1000, this.audioContext.currentTime);
    } else {
      this.syncGain.gain.setValueAtTime(0, this.audioContext.currentTime);
    }
  }

  setDetune(cents) {
    this.detune = cents;
    this.updateFrequency();
  }

  setSyncRatio(ratio) {
    this.syncRatio = ratio;
    this.updateFrequency();
  }

  setFrequency(frequency) {
    this.baseFrequency = frequency;
    this.updateFrequency();
  }

  updateFrequency() {
    const now = this.audioContext.currentTime;
    this.oscillator.frequency.setValueAtTime(this.baseFrequency, now);
    this.oscillator.detune.setValueAtTime(this.detune, now);
    this.syncOscillator.frequency.setValueAtTime(this.baseFrequency * this.syncRatio, now);
    this.syncOscillator.detune.setValueAtTime(this.detune, now);
  }

  start(time) {
    this.oscillator.start(time);
    this.syncOscillator.start(time);
  }

  stop(time) {
    this.oscillator.stop(time);
    this.syncOscillator.stop(time);
  }

  connect(destination) {
    this.output.connect(destination);
  }

  disconnect() {
    this.output.disconnect();
  }
}

export default VirusOscillator;
