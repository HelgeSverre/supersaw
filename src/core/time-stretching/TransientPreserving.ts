import { WindowFunctions } from "../window-functions";

export class TransientPreservingStretcher {
  private context: AudioContext;
  private tempo: number;
  private windowSize: number;
  private hopSize: number;
  private threshold: number;
  private window: Float32Array;
  private windowType: "hann" | "hamming" | "blackman";

  constructor(
    context: AudioContext,
    config: {
      tempo?: number;
      windowSize?: number;
      hopSize?: number;
      threshold?: number;
      windowType?: "hann" | "hamming" | "blackman";
    } = {},
  ) {
    this.context = context;
    this.tempo = config.tempo || 1.0;
    this.windowSize = config.windowSize || 1024;
    this.hopSize = config.hopSize || this.windowSize / 4;
    this.threshold = config.threshold || 0.1;
    this.windowType = config.windowType || "hann";
  }

  private detectTransients(buffer: Float32Array): boolean[] {
    const transients = new Array(buffer.length).fill(false);
    const energyWindow = 5; // Number of samples to calculate local energy

    for (let i = energyWindow; i < buffer.length - energyWindow; i++) {
      let prevEnergy = 0;
      let nextEnergy = 0;

      for (let j = 1; j <= energyWindow; j++) {
        prevEnergy += buffer[i - j] ** 2;
        nextEnergy += buffer[i + j] ** 2;
      }

      prevEnergy /= energyWindow;
      nextEnergy /= energyWindow;

      if (nextEnergy > prevEnergy * (1 + this.threshold)) {
        transients[i] = true;
      }
    }

    return transients;
  }

  private stretchNonTransients(input: Float32Array, transients: boolean[], stretchFactor: number): Float32Array {
    const outputLength = Math.floor(input.length * stretchFactor);
    const output = new Float32Array(outputLength);
    const window = WindowFunctions.run(this.windowType, this.windowSize);
    let inputIndex = 0;
    let outputIndex = 0;

    while (outputIndex < outputLength) {
      if (transients[inputIndex]) {
        // Copy transient directly
        output[outputIndex] = input[inputIndex];
        inputIndex++;
        outputIndex++;
      } else {
        // Stretch non-transient regions
        const frame = new Float32Array(this.windowSize);
        for (let i = 0; i < this.windowSize && inputIndex + i < input.length; i++) {
          frame[i] = input[inputIndex + i] * window[i];
        }

        const stretchedFrame = this.stretchFrame(frame, stretchFactor);

        for (let i = 0; i < this.hopSize * stretchFactor && outputIndex + i < outputLength; i++) {
          output[outputIndex + i] += stretchedFrame[i];
        }

        inputIndex += this.hopSize;
        outputIndex += Math.floor(this.hopSize * stretchFactor);
      }
    }

    return output;
  }

  private stretchFrame(frame: Float32Array, stretchFactor: number): Float32Array {
    const stretchedFrame = new Float32Array(Math.floor(frame.length * stretchFactor));

    // Simple linear interpolation for stretching
    for (let i = 0; i < stretchedFrame.length; i++) {
      const index = i / stretchFactor;
      const lowerIndex = Math.floor(index);
      const upperIndex = Math.min(lowerIndex + 1, frame.length - 1);
      const fraction = index - lowerIndex;

      stretchedFrame[i] = frame[lowerIndex] * (1 - fraction) + frame[upperIndex] * fraction;
    }

    return stretchedFrame;
  }

  public process(inputBuffer: AudioBuffer): AudioBuffer {
    const inputLength = inputBuffer.length;
    const outputLength = Math.floor(inputLength / this.tempo);
    const outputBuffer = this.context.createBuffer(inputBuffer.numberOfChannels, outputLength, inputBuffer.sampleRate);

    for (let channel = 0; channel < inputBuffer.numberOfChannels; channel++) {
      const inputData = inputBuffer.getChannelData(channel);
      const transients = this.detectTransients(inputData);
      const outputData = this.stretchNonTransients(inputData, transients, 1 / this.tempo);
      outputBuffer.copyToChannel(outputData, channel);
    }

    return outputBuffer;
  }
}
