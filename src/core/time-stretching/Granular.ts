import { WindowFunctions } from "../audio-processor";

export class GranularTimeStretcher {
  private context: AudioContext;
  private grainSize: number;
  private overlap: number;
  private stretchFactor: number;
  private windowType: string;

  constructor(
    context: AudioContext,
    config: {
      grainSize?: number;
      overlap?: number;
      stretchFactor?: number;
      windowType?: string;
    } = {},
  ) {
    this.context = context;
    this.grainSize = config.grainSize || 256;
    this.overlap = config.overlap || 0.5;
    this.stretchFactor = config.stretchFactor || 1.0;
    this.windowType = config.windowType || "hann";
  }

  public process(audioBuffer: AudioBuffer): AudioBuffer {
    const sampleRate = audioBuffer.sampleRate;
    const channels = audioBuffer.numberOfChannels;
    const outputLength = Math.floor(audioBuffer.length * this.stretchFactor);
    const outputBuffer = this.context.createBuffer(channels, outputLength, sampleRate);

    for (let channel = 0; channel < channels; channel++) {
      const inputData = audioBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      const window = WindowFunctions.run(this.windowType, this.grainSize);

      let grainIndex = 0;
      let outputIndex = 0;

      while (
        outputIndex + this.grainSize < outputLength &&
        grainIndex * this.grainSize * (1 - this.overlap) < inputData.length
      ) {
        const start = Math.floor(grainIndex * this.grainSize * (1 - this.overlap));
        const end = Math.min(start + this.grainSize, inputData.length);
        const grain = inputData.subarray(start, end);
        const grainLength = grain.length;

        for (let i = 0; i < grainLength; i++) {
          outputData[outputIndex + i] += grain[i] * window[i];
        }

        grainIndex++;
        outputIndex = Math.floor(grainIndex * this.grainSize * (1 - this.overlap) * this.stretchFactor);
      }
    }

    return outputBuffer;
  }
}
