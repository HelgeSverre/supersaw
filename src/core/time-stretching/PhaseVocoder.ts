import FFT from "fft.js";
import { WindowFunctions } from "../window-functions";

export class PhaseVocoder {
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
    this.fft = new FFT(this.windowSize);
  }

  public process(audioBuffer: AudioBuffer): AudioBuffer {
    console.log("[PhaseVocoder] Processing started");

    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const numFrames = Math.ceil(audioBuffer.length / this.hopSize);
    const outputLength = Math.floor(audioBuffer.length * this.stretchFactor);
    const outputBuffer = this.context.createBuffer(channels, outputLength, sampleRate);

    for (let channel = 0; channel < channels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);

      let phaseCumulative = new Float32Array(this.windowSize);
      let phasePrevious = new Float32Array(this.windowSize);

      for (let i = 0; i < numFrames; i++) {
        const start = i * this.hopSize;
        const end = Math.min(start + this.windowSize, inputData.length);
        const windowedInput = new Float32Array(this.windowSize);
        const window = WindowFunctions.run(this.windowType, this.windowSize);

        for (let j = 0; j < this.windowSize; j++) {
          windowedInput[j] = (start + j < end ? inputData[start + j] : 0) * window[j];
        }

        const spectrum = this.computeFFT(windowedInput);
        const magnitude = spectrum.map((c) => Math.sqrt(c[0] ** 2 + c[1] ** 2));
        const phase = spectrum.map((c) => Math.atan2(c[1], c[0]));
        const unwrappedPhase = this.unwrapPhase(phase);

        const deltaPhase = unwrappedPhase.map((p, j) => {
          let expectedPhase = phasePrevious[j] + this.hopSize * ((2 * Math.PI * j) / this.windowSize);
          return p - expectedPhase;
        });

        phasePrevious = unwrappedPhase;
        phaseCumulative = phaseCumulative.map((pc, j) => {
          const newPhase = pc + deltaPhase[j] * this.stretchFactor;
          return newPhase - Math.floor(newPhase / (2 * Math.PI)) * 2 * Math.PI;
        });

        const stretchedIndex = Math.floor(i * this.hopSize * this.stretchFactor);

        const outputSpectrum = magnitude.map((m, j) => {
          const real = m * Math.cos(phaseCumulative[j]);
          const imag = m * Math.sin(phaseCumulative[j]);
          return [real, imag];
        });

        const outputWindow = this.computeIFFT(outputSpectrum);

        for (let j = 0; j < outputWindow.length && stretchedIndex + j < outputData.length; j++) {
          outputData[stretchedIndex + j] += outputWindow[j];
        }
      }
    }

    console.log("[PhaseVocoder] Processing finished");
    return outputBuffer;
  }

  private computeFFT(data: Float32Array): Array<[number, number]> {
    const complexArray = this.fft.createComplexArray();
    this.fft.realTransform(complexArray, data);
    const result = [];
    for (let i = 0; i < complexArray.length; i += 2) {
      result.push([complexArray[i], complexArray[i + 1]]);
    }
    return result;
  }

  private computeIFFT(data: Array<[number, number]>): Float32Array {
    const complexArray = this.fft.createComplexArray();
    for (let i = 0; i < data.length; i++) {
      complexArray[i * 2] = data[i][0];
      complexArray[i * 2 + 1] = data[i][1];
    }

    const signal = this.fft.createComplexArray();
    this.fft.inverseTransform(signal, complexArray);

    return new Float32Array(signal.filter((_, i) => i % 2 === 0));
  }

  private unwrapPhase(phase: number[]): number[] {
    const unwrapped = phase.slice();
    for (let i = 1; i < unwrapped.length; i++) {
      let d = unwrapped[i] - unwrapped[i - 1];
      d = d > Math.PI ? d - 2 * Math.PI : d < -Math.PI ? d + 2 * Math.PI : d;
      unwrapped[i] = unwrapped[i - 1] + d;
    }
    return unwrapped;
  }
}
