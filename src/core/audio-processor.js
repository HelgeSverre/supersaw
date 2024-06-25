import FFT from "fft.js";

export class WindowFunctions {
  static run(type, size) {
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

  // TODO: This doesnt work very well.
  timeDomainHarmonicScaling(audioBuffer, stretchFactor) {
    console.log("[AudioProcessor] timeDomainHarmonicScaling starting");

    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const outputLength = Math.floor(audioBuffer.length * stretchFactor);
    const outputBuffer = this.context.createBuffer(channels, outputLength, sampleRate);

    for (let channel = 0; channel < channels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);

      // Initialize parameters for TDHS
      const windowSize = 2048; // Example window size
      const hopSize = windowSize / 4;
      const numFrames = Math.ceil(inputData.length / hopSize);

      for (let i = 0; i < numFrames; i++) {
        const start = i * hopSize;
        const end = start + windowSize;

        const windowedInput = new Float32Array(windowSize);
        windowedInput.set(inputData.subarray(start, Math.min(end, inputData.length)));

        // Apply window function
        const hann = this.getWindowFunction("hann", windowedInput.length);
        for (let j = 0; j < windowedInput.length; j++) {
          windowedInput[j] *= hann[j];
        }

        const spectrum = this.fft(windowedInput);
        const magnitude = spectrum.map((c) => Math.sqrt(c[0] ** 2 + c[1] ** 2));
        const phase = spectrum.map((c) => Math.atan2(c[1], c[0]));

        const scaledMagnitude = magnitude.map((m) => m * stretchFactor);
        const scaledPhase = phase.map((p) => p * stretchFactor);

        const outputSpectrum = scaledMagnitude.map((m, j) => [
          m * Math.cos(scaledPhase[j]),
          m * Math.sin(scaledPhase[j]),
        ]);

        const outputWindow = this.ifft(outputSpectrum);

        const stretchedIndex = Math.floor(i * hopSize * stretchFactor);
        for (let j = 0; j < outputWindow.length && stretchedIndex + j < outputData.length; j++) {
          outputData[stretchedIndex + j] += outputWindow[j];
        }
      }
    }

    console.log("[AudioProcessor] timeDomainHarmonicScaling finished");

    return outputBuffer;
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
    const inputLength = audioBuffer.length;
    const outputLength = Math.floor(inputLength * stretchFactor);
    const outputBuffer = this.context.createBuffer(channels, outputLength, sampleRate);

    const fftSize = this.nextPowerOfTwo(windowSize);
    const window = this.getWindowFunction(windowType, fftSize);

    const epsilon = 1e-10; // Small value to avoid division by zero

    for (let channel = 0; channel < channels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);

      let prevPhase = new Float32Array(fftSize / 2 + 1);
      let prevMagnitude = new Float32Array(fftSize / 2 + 1);

      const numInputFrames = Math.floor((inputLength - fftSize) / hopSize) + 1;
      const numOutputFrames = Math.floor((outputLength - fftSize) / (hopSize * stretchFactor)) + 1;

      for (let i = 0; i < numOutputFrames; i++) {
        const inputIndex = Math.floor(i / stretchFactor) * hopSize;
        const outputIndex = Math.floor(i * hopSize * stretchFactor);

        if (inputIndex + fftSize > inputLength) break;

        const windowedInput = new Float32Array(fftSize);
        for (let j = 0; j < fftSize; j++) {
          windowedInput[j] = inputData[inputIndex + j] * window[j];
        }

        const spectrum = this.fft(windowedInput);
        const magnitude = new Float32Array(fftSize / 2 + 1);
        const phase = new Float32Array(fftSize / 2 + 1);

        for (let j = 0; j <= fftSize / 2; j++) {
          const real = spectrum[j][0];
          const imag = spectrum[j][1];
          magnitude[j] = Math.sqrt(real * real + imag * imag + epsilon);
          phase[j] = Math.atan2(imag, real);
        }

        const deltaPhase = new Float32Array(fftSize / 2 + 1);
        const newPhase = new Float32Array(fftSize / 2 + 1);

        for (let j = 0; j <= fftSize / 2; j++) {
          const expectedPhase = prevPhase[j] + (2 * Math.PI * hopSize * j) / fftSize;
          deltaPhase[j] = this.principalArgument(phase[j] - expectedPhase);
          newPhase[j] = prevPhase[j] + deltaPhase[j] * stretchFactor;
        }

        const outputSpectrum = new Array(fftSize);
        for (let j = 0; j <= fftSize / 2; j++) {
          const mag = magnitude[j] * (1 - stretchFactor) + prevMagnitude[j] * stretchFactor;
          outputSpectrum[j] = [mag * Math.cos(newPhase[j]), mag * Math.sin(newPhase[j])];
        }

        // Mirror the spectrum for the IFFT
        for (let j = fftSize / 2 + 1; j < fftSize; j++) {
          outputSpectrum[j] = [outputSpectrum[fftSize - j][0], -outputSpectrum[fftSize - j][1]];
        }

        // Check for NaN values before IFFT
        if (outputSpectrum.some((c) => isNaN(c[0]) || isNaN(c[1]))) {
          console.warn("NaN detected in outputSpectrum at frame", i, ". Using zero-filled array.");
          outputSpectrum.fill([0, 0]);
        }

        const outputWindow = this.ifft(outputSpectrum);

        // Overlap-add
        for (let j = 0; j < fftSize && outputIndex + j < outputLength; j++) {
          outputData[outputIndex + j] += outputWindow[j] * window[j];
        }

        prevPhase = newPhase;
        prevMagnitude = magnitude;
      }

      // Normalize output
      const maxAmplitude = Math.max(...outputData.map(Math.abs));
      if (maxAmplitude > epsilon) {
        for (let i = 0; i < outputLength; i++) {
          outputData[i] /= maxAmplitude;
        }
      }
    }

    console.log("[AudioProcessor] spectralProcessing finished");
    return outputBuffer;
  }

  principalArgument(phase) {
    return phase - 2 * Math.PI * Math.floor((phase + Math.PI) / (2 * Math.PI));
  }
}
