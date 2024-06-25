import FFT from "fft.js";
import { WindowFunctions } from "../audio-processor";

export class TimeDomainHarmonicScaling {
  private context: AudioContext;
  private stretchFactor: number;
  private windowSize: number;
  private hopSize: number;
  private windowType: "hann" | "hamming" | "blackman";
  private fft: FFT;

  constructor(
    context: AudioContext,
    config: {
      stretchFactor?: number;
      windowSize?: number;
      hopSize?: number;
      windowType?: "hann" | "hamming" | "blackman";
    } = {},
  ) {
    this.context = context;
    this.stretchFactor = config.stretchFactor || 1.0;
    this.windowSize = config.windowSize || 2048;
    this.hopSize = config.hopSize || 512;
    this.windowType = config.windowType || "hann";
    this.fft = new FFT(this.nextPowerOfTwo(this.windowSize));
  }

  public process(audioBuffer: AudioBuffer): AudioBuffer {
    console.log("[TimeDomainHarmonicScaling] Processing started");

    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const outputLength = Math.floor(audioBuffer.length * this.stretchFactor);
    const outputBuffer = this.context.createBuffer(channels, outputLength, sampleRate);

    for (let channel = 0; channel < channels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);

      const numFrames = Math.ceil(inputData.length / this.hopSize);

      for (let i = 0; i < numFrames; i++) {
        const start = i * this.hopSize;
        const end = start + this.windowSize;

        const windowedInput = new Float32Array(this.windowSize);
        windowedInput.set(inputData.subarray(start, Math.min(end, inputData.length)));

        // Apply window function
        const window = WindowFunctions.run(this.windowType, windowedInput.length);
        for (let j = 0; j < windowedInput.length; j++) {
          windowedInput[j] *= window[j];
        }

        const spectrum = this.computeFFT(windowedInput);
        const magnitude = spectrum.map((c) => Math.sqrt(c[0] ** 2 + c[1] ** 2));
        const phase = spectrum.map((c) => Math.atan2(c[1], c[0]));

        const scaledMagnitude = magnitude.map((m) => m * this.stretchFactor);
        const scaledPhase = phase.map((p) => p * this.stretchFactor);

        const outputSpectrum = scaledMagnitude.map((m, j) => [
          m * Math.cos(scaledPhase[j]),
          m * Math.sin(scaledPhase[j]),
        ]);

        const outputWindow = this.ifft(outputSpectrum);

        const stretchedIndex = Math.floor(i * this.hopSize * this.stretchFactor);
        for (let j = 0; j < outputWindow.length && stretchedIndex + j < outputData.length; j++) {
          outputData[stretchedIndex + j] += outputWindow[j];
        }
      }
    }

    console.log("[TimeDomainHarmonicScaling] Processing finished");
    return outputBuffer;
  }

  private nextPowerOfTwo(value: number): number {
    return Math.pow(2, Math.ceil(Math.log2(value)));
  }

  private computeFFT(data: Float32Array): Array<[number, number]> {
    const complexArray = this.fft.createComplexArray();
    this.fft.realTransform(complexArray, data);
    this.fft.completeSpectrum(complexArray);
    const result = [];
    for (let i = 0; i < complexArray.length; i += 2) {
      result.push([complexArray[i], complexArray[i + 1]]);
    }
    return result;
  }

  private ifft(data: Array<[number, number]>): Float32Array {
    const complexArray = this.fft.createComplexArray();
    for (let i = 0; i < data.length; i++) {
      complexArray[i * 2] = data[i][0];
      complexArray[i * 2 + 1] = data[i][1];
    }

    const signal = this.fft.createComplexArray();

    this.fft.inverseTransform(signal, complexArray);

    return new Float32Array(signal.filter((_, i) => i % 2 === 0));
  }
}
