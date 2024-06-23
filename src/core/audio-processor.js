import FFT from "fft.js";

class WindowFunctions {
  static hann(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
    }
    return window;
  }

  static hamming(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (size - 1));
    }
    return window;
  }

  static blackman(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] =
        0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1)) + 0.08 * Math.cos((4 * Math.PI * i) / (size - 1));
    }
    return window;
  }
}

export class AudioProcessor {
  constructor(context) {
    this.context = context;
  }

  decodeAudioData(arrayBuffer) {
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

  getWindowFunction(type, size) {
    switch (type) {
      case "hann":
        return WindowFunctions.hann(size);
      case "hamming":
        return WindowFunctions.hamming(size);
      case "blackman":
        return WindowFunctions.blackman(size);
      default:
        return WindowFunctions.hann(size); // Default window if no type matched
    }
  }

  granularSynthesis(audioBuffer, { grainSize = 256, overlap = 0.5, stretchFactor = 1.0, windowType = "hann" }) {
    console.log("[AudioProcessor] granularSynthesis starting");

    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const outputLength = Math.floor(audioBuffer.length * stretchFactor);
    const outputBuffer = this.context.createBuffer(channels, outputLength, sampleRate);

    for (let channel = 0; channel < channels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      const window = this.getWindowFunction(windowType, grainSize);

      let grainIndex = 0;
      let outputIndex = 0;

      while (outputIndex + grainSize < outputLength && grainIndex * grainSize * (1 - overlap) < inputData.length) {
        const start = Math.floor(grainIndex * grainSize * (1 - overlap));
        const end = Math.min(start + grainSize, inputData.length);
        const grain = inputData.subarray(start, end);
        const grainLength = grain.length;

        for (let i = 0; i < grainLength; i++) {
          outputData[outputIndex + i] += grain[i] * window[i];
        }

        grainIndex++;
        outputIndex = Math.floor(grainIndex * grainSize * (1 - overlap) * stretchFactor);
      }
    }

    console.log("[AudioProcessor] granularSynthesis finished");

    return outputBuffer;
  }

  nextPowerOfTwo(value) {
    return Math.pow(2, Math.ceil(Math.log2(value)));
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

    // noinspection JSCheckFunctionSignatures
    const signal = fft.toComplexArray(fftSize);

    if (complexArray.some(isNaN)) {
      throw new Error("NaN detected in complexArray before IFFT");
    }

    fft.inverseTransform(signal, complexArray);

    // Add this check after the inverse transform
    if (signal.some(isNaN)) {
      throw new Error("NaN detected in signal after IFFT");
    }

    return signal.slice(0, data.length);
  }

  phaseVocoder(audioBuffer, { windowSize = 2048, hopSize = 512, stretchFactor = 1.0, windowType = "hann" }) {
    console.log("[AudioProcessor] phaseVocoder starting");

    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
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
        const windowedInput = new Float32Array(windowSize);
        const window = this.getWindowFunction(windowType, windowSize);

        for (let j = 0; j < windowSize; j++) {
          windowedInput[j] = (start + j < end ? inputData[start + j] : 0) * window[j];
        }

        const spectrum = this.fft(windowedInput);

        const magnitude = spectrum.map((c) => Math.sqrt(c[0] ** 2 + c[1] ** 2));
        const phase = spectrum.map((c) => Math.atan2(c[1], c[0]));
        const unwrappedPhase = this.unwrapPhase(phase);

        const deltaPhase = unwrappedPhase.map((p, j) => {
          let expectedPhase = phasePrevious[j] + hopSize * ((2 * Math.PI * j) / windowSize);
          return p - expectedPhase;
        });

        phasePrevious = unwrappedPhase;
        phaseCumulative = phaseCumulative.map((pc, j) => {
          const newPhase = pc + deltaPhase[j] * stretchFactor;
          return newPhase - Math.floor(newPhase / (2 * Math.PI)) * 2 * Math.PI;
        });

        const stretchedIndex = Math.floor(i * hopSize * stretchFactor);

        const outputSpectrum = magnitude.map((m, j) => {
          const real = m * Math.cos(phaseCumulative[j]);
          const imag = m * Math.sin(phaseCumulative[j]);
          return [real, imag];
        });

        const outputWindow = this.ifft(outputSpectrum);

        for (let j = 0; j < outputWindow.length && stretchedIndex + j < outputData.length; j++) {
          outputData[stretchedIndex + j] += outputWindow[j];
        }
      }
    }

    console.log("[AudioProcessor] phaseVocoder finished");
    return outputBuffer;
  }

  unwrapPhase(phase) {
    let unwrapped = phase.slice();
    for (let i = 1; i < unwrapped.length; i++) {
      let d = unwrapped[i] - unwrapped[i - 1];
      d = d > Math.PI ? d - 2 * Math.PI : d < -Math.PI ? d + 2 * Math.PI : d;
      unwrapped[i] = unwrapped[i - 1] + d;
    }
    return unwrapped;
  }

  spectralProcessing(audioBuffer, { windowSize = 2048, hopSize = 512, stretchFactor = 1.0, windowType = "hann" }) {
    console.log("[AudioProcessor] spectralProcessing starting");

    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
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

        const window = this.getWindowFunction(windowType, windowedInput.length);
        for (let j = 0; j < windowedInput.length; j++) {
          windowedInput[j] *= window[j];
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

    console.log("[AudioProcessor] spectralProcessing finished");

    return outputBuffer;
  }
}
