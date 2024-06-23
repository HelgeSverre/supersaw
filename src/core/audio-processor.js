import FFT from "fft.js";

const EPSILON = 1e-10;

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

  granularSynthesis(audioBuffer, { grainSize = 256, overlap = 0.5, stretchFactor = 1.0 }) {
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

    // const signal = new Float32Array(fftSize); <--- removed this
    const signal = fft.toComplexArray(fftSize); // <--- added this

    // Add this check before the inverse transform
    if (complexArray.some(isNaN)) {
      console.error("NaN detected in complexArray before IFFT");
      // Handle the error, e.g., by returning a zero-filled array
      return new Float32Array(data.length);
    }

    fft.inverseTransform(signal, complexArray);

    // Add this check after the inverse transform
    if (signal.some(isNaN)) {
      console.error("NaN detected in signal after IFFT");
      // Handle the error, e.g., by returning a zero-filled array
      return new Float32Array(data.length);
    }

    return signal.slice(0, data.length);
  }

  phaseVocoder(audioBuffer, { windowSize = 2048, hopSize = 512, stretchFactor = 1.0, windowType = "hann" }) {
    console.log("Starting phase vocoder with params:", { windowSize, hopSize, stretchFactor, windowType });
    console.log("Input buffer length:", audioBuffer.length);

    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const numFrames = Math.ceil(audioBuffer.length / hopSize);
    const outputLength = Math.floor(audioBuffer.length * stretchFactor);
    const outputBuffer = this.context.createBuffer(channels, outputLength, sampleRate);

    function zeroPadBuffer(buffer, minLength) {
      if (buffer.length >= minLength) return buffer;
      const paddedBuffer = new Float32Array(minLength);
      paddedBuffer.set(buffer);
      return paddedBuffer;
    }

    function unwrapPhase(phase) {
      let unwrapped = phase.slice();
      for (let i = 1; i < unwrapped.length; i++) {
        let d = unwrapped[i] - unwrapped[i - 1];
        d = d > Math.PI ? d - 2 * Math.PI : d < -Math.PI ? d + 2 * Math.PI : d;
        unwrapped[i] = unwrapped[i - 1] + d;
      }
      return unwrapped;
    }

    for (let channel = 0; channel < channels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      console.log("Channel data stats:", {
        min: Math.min(...inputData),
        max: Math.max(...inputData),
        hasNaN: inputData.some(isNaN),
      });

      const paddedInput = zeroPadBuffer(inputData, windowSize * 4);
      const outputData = outputBuffer.getChannelData(channel);

      let phaseCumulative = new Float32Array(windowSize);
      let phasePrevious = new Float32Array(windowSize);

      for (let i = 0; i < numFrames; i++) {
        const start = i * hopSize;
        const end = Math.min(start + windowSize, paddedInput.length);
        const windowedInput = new Float32Array(windowSize);
        for (let j = 0; j < windowSize; j++) {
          windowedInput[j] = (start + j < end ? paddedInput[start + j] : 0) * this.hannWindow(windowSize)[j];
        }

        const spectrum = this.fft(windowedInput);
        console.log(`Frame ${i} spectrum stats:`, {
          min: Math.min(...spectrum.flat()),
          max: Math.max(...spectrum.flat()),
          hasNaN: spectrum.flat().some(isNaN),
        });

        const magnitude = spectrum.map((c) => {
          const mag = Math.sqrt(c[0] ** 2 + c[1] ** 2);
          if (mag < 1e-10) {
            return 1e-10; // Set a minimum threshold
          }
          if (mag > 1e10) {
            console.warn(`Very large magnitude detected: ${mag}`);
            return 1e10; // Set a maximum threshold
          }
          return mag;
        });
        const phase = spectrum.map((c) => Math.atan2(c[1], c[0]));

        const unwrappedPhase = unwrapPhase(phase.map((p) => (isFinite(p) ? p : 0)));

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
          if (isNaN(real) || isNaN(imag)) {
            console.error(`NaN detected in outputSpectrum at index ${j}`);
            console.log(`magnitude: ${m}, phaseCumulative: ${phaseCumulative[j]}`);
            // Return a default value or handle the error
            return [0, 0];
          }
          return [real, imag];
        });

        console.log(`Frame ${i} output spectrum stats:`, {
          min: Math.min(...outputSpectrum.flat()),
          max: Math.max(...outputSpectrum.flat()),
          hasNaN: outputSpectrum.flat().some(isNaN),
        });

        const outputWindow = this.ifft(outputSpectrum);

        console.log(`Frame ${i} output window stats:`, {
          min: Math.min(...outputWindow),
          max: Math.max(...outputWindow),
          hasNaN: outputWindow.some(isNaN),
        });

        for (let j = 0; j < outputWindow.length && stretchedIndex + j < outputData.length; j++) {
          outputData[stretchedIndex + j] += outputWindow[j];
        }
      }

      console.log("Output data stats:", {
        min: Math.min(...outputData),
        max: Math.max(...outputData),
        hasNaN: outputData.some(isNaN),
      });
    }

    console.log("Finished phase vocoder");
    return outputBuffer;
  }

  async spectralProcessing(audioBuffer, { windowSize = 2048, hopSize = 512, stretchFactor = 1.0 }) {
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

        const window = this.hannWindow(windowedInput.length);
        for (let j = 0; j < windowedInput.length; j++) {
          windowedInput[j] *= window[j];
        }

        const spectrum = this.fft(windowedInput);
        const magnitude = spectrum.map((c) => Math.sqrt(c[0] ** 2 + c[1] ** 2));
        const phase = spectrum.map((c) => Math.atan2(c[1], c[0]));
        // console.table(windowedInput);
        // console.log(magnitude, phase);
        // debugger;

        const stretchedIndex = Math.floor(i * hopSize * stretchFactor);
        const outputSpectrum = magnitude.map((m, j) => [m * Math.cos(phase[j]), m * Math.sin(phase[j])]);
        // console.table(outputSpectrum);
        // debugger;

        outputSpectrum.forEach((complexNumber, index) => {
          const [real, imag] = complexNumber;
          if (!isFinite(real) || !isFinite(imag)) {
            console.log(`Non-finite value at index ${index}: [${real}, ${imag}]`);
            debugger;
          }
        });

        const outputWindow = this.ifft(outputSpectrum); // This returns NaNs

        for (let j = 0; j < outputWindow.length && stretchedIndex + j < outputData.length; j++) {
          outputData[stretchedIndex + j] += outputWindow[j];
        }
      }
    }

    return outputBuffer;
  }
}
