import { WindowFunctions } from "../audio-processor";
import FFT from "fft.js";

export class SpectralTimeStretcher {
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
    this.hopSize = config.hopSize || this.windowSize / 4;
    this.windowType = config.windowType || "hann";
    this.fft = new FFT(this.windowSize);
  }

  public process(audioBuffer: AudioBuffer): AudioBuffer {
    console.log("[SpectralTimeStretcher] Processing started");

    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const inputLength = audioBuffer.length;
    const outputLength = Math.floor(inputLength * this.stretchFactor);
    const outputBuffer = this.context.createBuffer(channels, outputLength, sampleRate);

    const window = WindowFunctions.run(this.windowType, this.windowSize);
    const epsilon = 1e-10;

    for (let channel = 0; channel < channels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      let prevPhase = new Float32Array(this.windowSize / 2 + 1);
      let prevMagnitude = new Float32Array(this.windowSize / 2 + 1);

      const numOutputFrames = Math.floor((outputLength - this.windowSize) / (this.hopSize * this.stretchFactor)) + 1;

      for (let i = 0; i < numOutputFrames; i++) {
        const inputIndex = Math.floor(i / this.stretchFactor) * this.hopSize;
        const outputIndex = Math.floor(i * this.hopSize * this.stretchFactor);

        if (inputIndex + this.windowSize > inputLength) break;

        const windowedInput = new Float32Array(this.windowSize);
        for (let j = 0; j < this.windowSize; j++) {
          windowedInput[j] = inputData[inputIndex + j] * window[j];
        }

        const { magnitude, phase } = this.computeSpectrum(windowedInput);

        const { newPhase, outputSpectrum } = this.phaseVocoder(magnitude, phase, prevPhase, prevMagnitude, epsilon);

        const outputWindow = this.inverseFFT(outputSpectrum);

        // Overlap-add
        for (let j = 0; j < this.windowSize && outputIndex + j < outputLength; j++) {
          outputData[outputIndex + j] += outputWindow[j] * window[j];
        }

        prevPhase = newPhase;
        prevMagnitude = magnitude;
      }

      // Simple normalization
      const maxAmplitude = Math.max(...outputData.map(Math.abs));
      if (maxAmplitude > epsilon) {
        for (let i = 0; i < outputLength; i++) {
          outputData[i] /= maxAmplitude;
        }
      }
    }

    console.log("[SpectralTimeStretcher] Processing finished");
    return outputBuffer;
  }

  private computeSpectrum(input: Float32Array): { magnitude: Float32Array; phase: Float32Array } {
    const complexSpectrum = this.fft.createComplexArray();
    this.fft.realTransform(complexSpectrum, input);

    const magnitude = new Float32Array(this.windowSize / 2 + 1);
    const phase = new Float32Array(this.windowSize / 2 + 1);

    for (let j = 0; j <= this.windowSize / 2; j++) {
      const real = complexSpectrum[2 * j];
      const imag = complexSpectrum[2 * j + 1];
      magnitude[j] = Math.sqrt(real * real + imag * imag);
      phase[j] = Math.atan2(imag, real);
    }

    return { magnitude, phase };
  }

  private phaseVocoder(
    magnitude: Float32Array,
    phase: Float32Array,
    prevPhase: Float32Array,
    prevMagnitude: Float32Array,
    epsilon: number,
  ): { newPhase: Float32Array; outputSpectrum: Float32Array } {
    const newPhase = new Float32Array(this.windowSize / 2 + 1);
    const outputSpectrum = this.fft.createComplexArray();

    for (let j = 0; j <= this.windowSize / 2; j++) {
      const expectedPhase = prevPhase[j] + (2 * Math.PI * this.hopSize * j) / this.windowSize;
      const deltaPhase = this.principalArgument(phase[j] - expectedPhase);
      newPhase[j] = prevPhase[j] + deltaPhase * this.stretchFactor;

      const mag = magnitude[j] * (1 - this.stretchFactor) + prevMagnitude[j] * this.stretchFactor;
      outputSpectrum[2 * j] = mag * Math.cos(newPhase[j]);
      outputSpectrum[2 * j + 1] = mag * Math.sin(newPhase[j]);
    }

    // Mirror the spectrum for the IFFT
    for (let j = this.windowSize / 2 + 1; j < this.windowSize; j++) {
      outputSpectrum[2 * j] = outputSpectrum[2 * (this.windowSize - j)];
      outputSpectrum[2 * j + 1] = -outputSpectrum[2 * (this.windowSize - j) + 1];
    }

    return { newPhase, outputSpectrum };
  }

  private principalArgument(phase: number): number {
    return ((phase + Math.PI) % (2 * Math.PI)) - Math.PI;
  }

  private inverseFFT(complexSpectrum: Float32Array): Float32Array {
    const output = this.fft.createComplexArray();
    this.fft.inverseTransform(output, complexSpectrum);
    return output.filter((_, i) => i % 2 === 0); // Return only real part
  }
}
