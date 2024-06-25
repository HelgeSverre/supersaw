import { WindowFunctions } from "../audio-processor";

export class SpectralTimeStretcher {
  private context: AudioContext;
  private stretchFactor: number;
  private windowSize: number;
  private hopSize: number;
  private windowType: "hann" | "hamming" | "blackman";

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
  }

  public async process(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
    console.log("[SpectralTimeStretcher] Processing started");

    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const inputLength = audioBuffer.length;
    const outputLength = Math.floor(inputLength * this.stretchFactor);
    const outputBuffer = this.context.createBuffer(channels, outputLength, sampleRate);

    const fftSize = this.nextPowerOfTwo(this.windowSize);
    const window = WindowFunctions.run(this.windowType, fftSize);
    const epsilon = 1e-10;

    const processChannel = async (channel: number) => {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      let prevPhase = new Float32Array(fftSize / 2 + 1);
      let prevMagnitude = new Float32Array(fftSize / 2 + 1);

      const numOutputFrames = Math.floor((outputLength - fftSize) / (this.hopSize * this.stretchFactor)) + 1;

      for (let i = 0; i < numOutputFrames; i++) {
        const inputIndex = Math.floor(i / this.stretchFactor) * this.hopSize;
        const outputIndex = Math.floor(i * this.hopSize * this.stretchFactor);

        if (inputIndex + fftSize > inputLength) break;

        const windowedInput = new Float32Array(fftSize);
        for (let j = 0; j < fftSize; j++) {
          windowedInput[j] = inputData[inputIndex + j] * window[j];
        }

        const { magnitude, phase } = this.computeSpectrum(windowedInput);

        const { newPhase, outputSpectrum } = this.phaseVocoder(
          magnitude,
          phase,
          prevPhase,
          prevMagnitude,
          fftSize,
          this.hopSize,
          this.stretchFactor,
          epsilon,
        );

        const outputWindow = this.ifft(outputSpectrum);

        // Overlap-add
        for (let j = 0; j < fftSize && outputIndex + j < outputLength; j++) {
          outputData[outputIndex + j] += outputWindow[j] * window[j];
        }

        prevPhase = newPhase;
        prevMagnitude = magnitude;
      }

      // Normalize output using a sliding window approach
      const windowSize = 1024;
      const step = windowSize / 2;
      for (let i = 0; i < outputLength; i += step) {
        const end = Math.min(i + windowSize, outputLength);
        const maxAmplitude = Math.max(...outputData.slice(i, end).map(Math.abs));
        if (maxAmplitude > epsilon) {
          for (let j = i; j < end; j++) {
            outputData[j] /= maxAmplitude;
          }
        }
      }
    };

    // Process all channels concurrently
    await Promise.all(Array.from({ length: channels }, (_, i) => processChannel(i)));

    console.log("[SpectralTimeStretcher] Processing finished");
    return outputBuffer;
  }

  private nextPowerOfTwo(n: number): number {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }

  private computeSpectrum(input: Float32Array): { magnitude: Float32Array; phase: Float32Array } {
    const fftSize = input.length;
    const spectrum = this.fft(input);
    const magnitude = new Float32Array(fftSize / 2 + 1);
    const phase = new Float32Array(fftSize / 2 + 1);

    for (let j = 0; j <= fftSize / 2; j++) {
      const real = spectrum[j][0];
      const imag = spectrum[j][1];
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
    fftSize: number,
    hopSize: number,
    stretchFactor: number,
    epsilon: number,
  ): { newPhase: Float32Array; outputSpectrum: Array<[number, number]> } {
    const newPhase = new Float32Array(fftSize / 2 + 1);
    const outputSpectrum = new Array(fftSize);

    for (let j = 0; j <= fftSize / 2; j++) {
      const expectedPhase = prevPhase[j] + (2 * Math.PI * hopSize * j) / fftSize;
      const deltaPhase = this.principalArgument(phase[j] - expectedPhase);
      newPhase[j] = prevPhase[j] + deltaPhase * stretchFactor;

      const mag = magnitude[j] * (1 - stretchFactor) + prevMagnitude[j] * stretchFactor;
      outputSpectrum[j] = [mag * Math.cos(newPhase[j]), mag * Math.sin(newPhase[j])];
    }

    // Mirror the spectrum for the IFFT
    for (let j = fftSize / 2 + 1; j < fftSize; j++) {
      outputSpectrum[j] = [outputSpectrum[fftSize - j][0], -outputSpectrum[fftSize - j][1]];
    }

    return { newPhase, outputSpectrum };
  }

  private principalArgument(phase: number): number {
    return ((phase + Math.PI) % (2 * Math.PI)) - Math.PI;
  }

  private fft(input: Float32Array): Array<[number, number]> {
    const n = input.length;
    if (n <= 1) return input.map((x) => [x, 0]);

    const even = this.fft(input.filter((_, i) => i % 2 === 0));
    const odd = this.fft(input.filter((_, i) => i % 2 === 1));

    const output: Array<[number, number]> = new Array(n);
    for (let k = 0; k < n / 2; k++) {
      const t = odd[k];
      const a = (-2 * Math.PI * k) / n;
      const c = Math.cos(a);
      const s = Math.sin(a);
      output[k] = [even[k][0] + c * t[0] - s * t[1], even[k][1] + s * t[0] + c * t[1]];
      output[k + n / 2] = [even[k][0] - c * t[0] + s * t[1], even[k][1] - s * t[0] - c * t[1]];
    }
    return output;
  }

  private ifft(input: Array<[number, number]>): Float32Array {
    const n = input.length;
    const conjugate = input.map(([re, im]) => [re, -im]);
    const output = this.fft(conjugate);
    return new Float32Array(output.map(([re, im]) => re / n));
  }
}
