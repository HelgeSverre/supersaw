class Distortion {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.waveshaper = audioContext.createWaveShaper();

    this.input.connect(this.dryGain);
    this.input.connect(this.waveshaper);
    this.waveshaper.connect(this.wetGain);
    this.dryGain.connect(this.output);
    this.wetGain.connect(this.output);

    this.amount = 0;
    this.mix = 1;
    this.updateCurve();
    this.updateMix();
  }

  updateCurve() {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;

    for (let i = 0; i < samples; ++i) {
      const x = (i * 2) / samples - 1;
      curve[i] = ((3 + this.amount) * x * 20 * deg) / (Math.PI + this.amount * Math.abs(x));
    }
    this.waveshaper.curve = curve;
  }

  setAmount(amount) {
    this.amount = amount;
    this.updateCurve();
  }

  setMix(mix) {
    this.mix = mix;
    this.updateMix();
  }

  updateMix() {
    this.dryGain.gain.setValueAtTime(1 - this.mix, this.audioContext.currentTime);
    this.wetGain.gain.setValueAtTime(this.mix, this.audioContext.currentTime);
  }

  connect(destination) {
    this.output.connect(destination);
  }

  disconnect() {
    this.output.disconnect();
  }
}

class Phaser {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.filters = [];
    this.depth = audioContext.createGain();
    this.feedback = audioContext.createGain();
    this.lfo = audioContext.createOscillator();
    this.dryGain = audioContext.createGain();
    this.wetGain = audioContext.createGain();

    for (let i = 0; i < 6; i++) {
      const filter = audioContext.createBiquadFilter();
      filter.type = "allpass";
      filter.frequency.value = 1000;
      this.filters.push(filter);
    }

    this.input.connect(this.dryGain);
    this.input.connect(this.filters[0]);
    for (let i = 1; i < this.filters.length; i++) {
      this.filters[i - 1].connect(this.filters[i]);
    }
    this.filters[this.filters.length - 1].connect(this.wetGain);

    this.lfo.connect(this.depth);
    this.depth.connect(this.filters[0].frequency);
    this.filters[this.filters.length - 1].connect(this.feedback);
    this.feedback.connect(this.filters[0]);

    this.dryGain.connect(this.output);
    this.wetGain.connect(this.output);

    this.lfo.start();
    this.setRate(0.5);
    this.setDepth(3000);
    this.setFeedback(0.7);
    this.mix = 1;
    this.updateMix();
  }

  setRate(rate) {
    this.lfo.frequency.setValueAtTime(rate, this.audioContext.currentTime);
  }

  setDepth(depth) {
    this.depth.gain.setValueAtTime(depth, this.audioContext.currentTime);
  }

  setFeedback(feedback) {
    this.feedback.gain.setValueAtTime(feedback, this.audioContext.currentTime);
  }

  setMix(mix) {
    this.mix = mix;
    this.updateMix();
  }

  updateMix() {
    this.dryGain.gain.setValueAtTime(1 - this.mix, this.audioContext.currentTime);
    this.wetGain.gain.setValueAtTime(this.mix, this.audioContext.currentTime);
  }

  connect(destination) {
    this.output.connect(destination);
  }

  disconnect() {
    this.output.disconnect();
  }
}

class ChorusFlanger {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.delay = audioContext.createDelay();
    this.depth = audioContext.createGain();
    this.feedback = audioContext.createGain();
    this.lfo = audioContext.createOscillator();
    this.dryGain = audioContext.createGain();
    this.wetGain = audioContext.createGain();

    this.input.connect(this.dryGain);
    this.input.connect(this.delay);
    this.delay.connect(this.wetGain);
    this.delay.connect(this.feedback);
    this.feedback.connect(this.input);

    this.lfo.connect(this.depth);
    this.depth.connect(this.delay.delayTime);

    this.dryGain.connect(this.output);
    this.wetGain.connect(this.output);

    this.lfo.start();
    this.setRate(0.5);
    this.setDepth(0.005);
    this.setFeedback(0.5);
    this.setDelay(0.003);
    this.mix = 1;
    this.updateMix();
  }

  setRate(rate) {
    this.lfo.frequency.setValueAtTime(rate, this.audioContext.currentTime);
  }

  setDepth(depth) {
    this.depth.gain.setValueAtTime(depth, this.audioContext.currentTime);
  }

  setFeedback(feedback) {
    this.feedback.gain.setValueAtTime(feedback, this.audioContext.currentTime);
  }

  setDelay(delayTime) {
    this.delay.delayTime.setValueAtTime(delayTime, this.audioContext.currentTime);
  }

  setMix(mix) {
    this.mix = mix;
    this.updateMix();
  }

  updateMix() {
    this.dryGain.gain.setValueAtTime(1 - this.mix, this.audioContext.currentTime);
    this.wetGain.gain.setValueAtTime(this.mix, this.audioContext.currentTime);
  }

  connect(destination) {
    this.output.connect(destination);
  }

  disconnect() {
    this.output.disconnect();
  }
}

class Ringmod {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.ringOsc = audioContext.createOscillator();
    this.ringGain = audioContext.createGain();

    this.input.connect(this.dryGain);
    this.input.connect(this.ringGain);
    this.ringOsc.connect(this.ringGain.gain);
    this.ringGain.connect(this.wetGain);
    this.dryGain.connect(this.output);
    this.wetGain.connect(this.output);

    this.ringOsc.start();

    this.frequency = 440;
    this.mix = 1;
    this.updateFrequency();
    this.updateMix();
  }

  setFrequency(freq) {
    this.frequency = freq;
    this.updateFrequency();
  }

  updateFrequency() {
    this.ringOsc.frequency.setValueAtTime(this.frequency, this.audioContext.currentTime);
  }

  setMix(mix) {
    this.mix = mix;
    this.updateMix();
  }

  updateMix() {
    this.dryGain.gain.setValueAtTime(1 - this.mix, this.audioContext.currentTime);
    this.wetGain.gain.setValueAtTime(this.mix, this.audioContext.currentTime);
  }

  connect(destination) {
    this.output.connect(destination);
  }

  disconnect() {
    this.output.disconnect();
  }
}

class Reverb {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.convolver = audioContext.createConvolver();

    this.input.connect(this.dryGain);
    this.input.connect(this.convolver);
    this.convolver.connect(this.wetGain);
    this.dryGain.connect(this.output);
    this.wetGain.connect(this.output);

    this.mix = 0.5;
    this.updateMix();

    // Generate a simple impulse response for reverb
    this.generateImpulseResponse(2, 2);
  }

  generateImpulseResponse(duration, decay) {
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      left[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
      right[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
    }

    this.convolver.buffer = impulse;
  }

  setMix(mix) {
    this.mix = mix;
    this.updateMix();
  }

  updateMix() {
    this.dryGain.gain.setValueAtTime(1 - this.mix, this.audioContext.currentTime);
    this.wetGain.gain.setValueAtTime(this.mix, this.audioContext.currentTime);
  }

  connect(destination) {
    this.output.connect(destination);
  }

  disconnect() {
    this.output.disconnect();
  }
}

class Delay {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.input = audioContext.createGain();
    this.output = audioContext.createGain();
    this.dryGain = audioContext.createGain();
    this.wetGain = audioContext.createGain();
    this.feedbackGain = audioContext.createGain();
    this.delayNode = audioContext.createDelay(2.0); // Maximum delay of 2 seconds

    this.input.connect(this.dryGain);
    this.input.connect(this.delayNode);
    this.delayNode.connect(this.wetGain);
    this.delayNode.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);
    this.dryGain.connect(this.output);
    this.wetGain.connect(this.output);

    this.mix = 0.5;
    this.time = 0.5;
    this.feedback = 0.3;
    this.updateMix();
    this.updateDelay();
    this.updateFeedback();
  }

  setMix(mix) {
    this.mix = mix;
    this.updateMix();
  }

  setTime(time) {
    this.time = time;
    this.updateDelay();
  }

  setFeedback(feedback) {
    this.feedback = feedback;
    this.updateFeedback();
  }

  updateMix() {
    this.dryGain.gain.setValueAtTime(1 - this.mix, this.audioContext.currentTime);
    this.wetGain.gain.setValueAtTime(this.mix, this.audioContext.currentTime);
  }

  updateDelay() {
    this.delayNode.delayTime.setValueAtTime(this.time, this.audioContext.currentTime);
  }

  updateFeedback() {
    this.feedbackGain.gain.setValueAtTime(this.feedback, this.audioContext.currentTime);
  }

  connect(destination) {
    this.output.connect(destination);
  }

  disconnect() {
    this.output.disconnect();
  }
}

export { Distortion, Phaser, ChorusFlanger, Ringmod, Reverb, Delay };
