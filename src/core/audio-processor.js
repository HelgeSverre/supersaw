import FFT from "fft.js";

export class AudioProcessor {
  constructor(context) {
    this.context = context;
  }

  async decodeAudioData(arrayBuffer) {
    return new Promise((resolve, reject) => {
      this.context.decodeAudioData(arrayBuffer, resolve, reject);
    });
  }

  cloneAudioBuffer(audioBuffer) {
    const newBuffer = this.context.createBuffer(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate,
    );
    for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
      newBuffer.copyToChannel(audioBuffer.getChannelData(i), i);
    }
    return newBuffer;
  }

  async granularSynthesis(audioBuffer, grainSize, overlap, stretchFactor) {
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const outputLength = Math.floor(audioBuffer.length * stretchFactor);
    const outputBuffer = this.context.createBuffer(channels, outputLength, sampleRate);

    for (let channel = 0; channel < channels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      const hannWindow = this.hannWindow(grainSize);

      let grainIndex = 0;
      let outputIndex = 0;

      while (outputIndex + grainSize < outputLength && grainIndex * grainSize * (1 - overlap) < inputData.length) {
        const start = Math.floor(grainIndex * grainSize * (1 - overlap));
        const end = Math.min(start + grainSize, inputData.length);
        const grain = inputData.subarray(start, end);
        const grainLength = grain.length;

        for (let i = 0; i < grainLength; i++) {
          outputData[outputIndex + i] += grain[i] * hannWindow[i];
        }

        grainIndex++;
        outputIndex = Math.floor(grainIndex * grainSize * (1 - overlap) * stretchFactor);
      }
    }

    return outputBuffer;
  }

  hannWindow(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
    }
    return window;
  }

  nextPowerOfTwo(value) {
    return Math.pow(2, Math.ceil(Math.log2(value)));
  }

  async phaseVocoder(audioBuffer, stretchFactor) {
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const windowSize = 2048;
    const hopSize = windowSize / 4;
    const numFrames = Math.ceil(audioBuffer.length / hopSize);
    const outputLength = Math.floor(audioBuffer.length * stretchFactor);
    const outputBuffer = this.context.createBuffer(channels, outputLength, sampleRate);

    for (let channel = 0; channel < channels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);

      let phaseCumulative = new Float32Array(windowSize);
      let phasePrevious = new Float32Array(windowSize);

      for (let i = 0; i < numFrames; i++) {
        const start = i * hopSize;
        const end = Math.min(start + windowSize, inputData.length);

        const windowedInput = new Float32Array(this.nextPowerOfTwo(end - start));
        windowedInput.set(inputData.slice(start, end));

        const hann = this.hannWindow(windowedInput.length);
        for (let j = 0; j < windowedInput.length; j++) {
          windowedInput[j] *= hann[j];
        }
        const spectrum = this.fft(windowedInput);
        const magnitude = spectrum.map((c) => Math.sqrt(c[0] ** 2 + c[1] ** 2));
        const phase = spectrum.map((c) => Math.atan2(c[1], c[0]));

        const deltaPhase = phase.map((p, j) => {
          const delta = p - phasePrevious[j] - hopSize * ((2 * Math.PI * j) / windowSize);
          const wrappedDelta = delta - Math.floor(delta / (2 * Math.PI)) * 2 * Math.PI;
          return wrappedDelta;
        });
        phasePrevious = phase;

        phaseCumulative = phaseCumulative.map((pc, j) => pc + deltaPhase[j]);

        const stretchedIndex = Math.floor(i * hopSize * stretchFactor);
        const outputSpectrum = magnitude.map((m, j) => [
          m * Math.cos(phaseCumulative[j]),
          m * Math.sin(phaseCumulative[j]),
        ]);
        const outputWindow = this.ifft(outputSpectrum);

        for (let j = 0; j < outputWindow.length && stretchedIndex + j < outputData.length; j++) {
          outputData[stretchedIndex + j] += outputWindow[j];
        }
      }
    }

    return outputBuffer;
  }

  async spectralProcessing(audioBuffer, stretchFactor) {
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const windowSize = 2048;
    const hopSize = windowSize / 4;
    const numFrames = Math.ceil(audioBuffer.length / hopSize);
    const outputLength = Math.floor(audioBuffer.length * stretchFactor);
    const outputBuffer = this.context.createBuffer(channels, outputLength, sampleRate);

    for (let channel = 0; channel < channels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);

      for (let i = 0; i < numFrames; i++) {
        const start = i * hopSize;
        const end = Math.min(start + windowSize, inputData.length);

        const windowedInput = new Float32Array(this.nextPowerOfTwo(end - start));
        windowedInput.set(inputData.slice(start, end));

        const hann = this.hannWindow(windowedInput.length);
        for (let j = 0; j < windowedInput.length; j++) {
          windowedInput[j] *= hann[j];
        }
        const spectrum = this.fft(windowedInput);
        const magnitude = spectrum.map((c) => Math.sqrt(c[0] ** 2 + c[1] ** 2));
        const phase = spectrum.map((c) => Math.atan2(c[1], c[0]));

        const stretchedIndex = Math.floor(i * hopSize * stretchFactor);
        const outputSpectrum = magnitude.map((m, j) => [m * Math.cos(phase[j]), m * Math.sin(phase[j])]);
        const outputWindow = this.ifft(outputSpectrum);

        for (let j = 0; j < outputWindow.length && stretchedIndex + j < outputData.length; j++) {
          outputData[stretchedIndex + j] += outputWindow[j];
        }
      }
    }

    return outputBuffer;
  }

  fft(data) {
    const fftSize = this.nextPowerOfTwo(data.length);
    const fft = new FFT(fftSize);
    const complexArray = fft.createComplexArray();
    fft.realTransform(complexArray, data);
    fft.completeSpectrum(complexArray);
    const result = [];
    for (let i = 0; i < complexArray.length; i += 2) {
      result.push([complexArray[i], complexArray[i + 1]]);
    }
    return result;
  }

  ifft(data) {
    const fftSize = this.nextPowerOfTwo(data.length * 2);
    const fft = new FFT(fftSize);
    const complexArray = fft.createComplexArray();
    for (let i = 0; i < data.length; i++) {
      complexArray[i * 2] = data[i][0];
      complexArray[i * 2 + 1] = data[i][1];
    }
    const signal = new Float32Array(data.length);
    fft.inverseTransform(signal, complexArray);
    return signal;
  }

  async processAudio(buffer, method, params) {
    if (!buffer) {
      throw new Error("Invalid audio buffer");
    }

    switch (method) {
      case "granular":
        return this.granularSynthesis(buffer, params.grainSize, params.overlap, params.stretchFactor);
      case "phaseVocoder":
        return this.phaseVocoder(buffer, params.stretchFactor);
      case "spectral":
        return this.spectralProcessing(buffer, params.stretchFactor);
      default:
        throw new Error("Unknown processing method");
    }
  }
}
