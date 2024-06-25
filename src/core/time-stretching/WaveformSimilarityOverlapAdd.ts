export class WaveformSimilarityOverlapAdd {
  private context: AudioContext;
  private sampleRate: number;
  private channels: number;
  private tempo: number;
  private seekWindowMs: number;
  private seekLength: number;
  private overlapMs: number;
  private overlapLength: number;
  private outputBuffer: Float32Array[];
  private midBuffer: Float32Array[];
  private frameLength: number;

  constructor(context: AudioContext, tempo: number = 1.0) {
    this.context = context;
    this.sampleRate = context.sampleRate;
    this.channels = 2; // Assume stereo
    this.tempo = tempo;
    this.seekWindowMs = 2;
    this.overlapMs = 8;
    this.seekLength = Math.floor((this.seekWindowMs * this.sampleRate) / 1000);
    this.overlapLength = Math.floor((this.overlapMs * this.sampleRate) / 1000);
    this.outputBuffer = [new Float32Array(this.overlapLength), new Float32Array(this.overlapLength)];
    this.frameLength = this.seekLength + this.overlapLength;
    this.midBuffer = [new Float32Array(this.frameLength), new Float32Array(this.frameLength)];
  }

  private calculateCrossCorrStereo(mixingPos: number, compare: Float32Array[]): number {
    let corr: number = 0;
    for (let i = 0; i < this.overlapLength; i++) {
      let temp1 = this.midBuffer[0][i + mixingPos] * compare[0][i] + this.midBuffer[1][i + mixingPos] * compare[1][i];
      corr += temp1 * temp1;
    }
    return corr;
  }

  private seekBestOverlapPosition(refPos: number): number {
    let compare: Float32Array[] = [new Float32Array(this.overlapLength), new Float32Array(this.overlapLength)];

    // Copy sample data to compare buffer
    for (let i = 0; i < this.overlapLength; i++) {
      compare[0][i] = this.midBuffer[0][i + refPos];
      compare[1][i] = this.midBuffer[1][i + refPos];
    }

    let bestCorr = Number.MIN_VALUE;
    let bestOffset = 0;

    // Scans for the best correlation value by testing each possible position
    for (let i = 0; i < this.seekLength; i++) {
      let corr = this.calculateCrossCorrStereo(i, compare);
      if (corr > bestCorr) {
        bestCorr = corr;
        bestOffset = i;
      }
    }

    return bestOffset;
  }

  private overlapStereo(offset: number): void {
    const fScale = 1.0 / this.overlapLength;
    for (let i = 0; i < this.overlapLength; i++) {
      const fTemp = (this.overlapLength - i) * fScale;
      const fTemp2 = 1.0 - fTemp;
      for (let ch = 0; ch < this.channels; ch++) {
        this.outputBuffer[ch][i] = this.outputBuffer[ch][i] * fTemp + this.midBuffer[ch][i + offset] * fTemp2;
      }
    }
  }

  public process(inputBuffer: AudioBuffer): Promise<AudioBuffer> {
    const inputLength = inputBuffer.length;
    const outputLength = Math.floor(inputLength / this.tempo);
    const outputBuffer = this.context.createBuffer(this.channels, outputLength, this.sampleRate);

    let inputOffset = 0;
    let outputOffset = 0;

    // Initialize midBuffer with first frame
    for (let ch = 0; ch < this.channels; ch++) {
      const channelData = inputBuffer.getChannelData(ch);
      this.midBuffer[ch].set(channelData.subarray(0, this.frameLength));
    }

    while (outputOffset < outputLength) {
      // Process the frame
      const offset = this.seekBestOverlapPosition(0);

      // Overlap-add the frames
      this.overlapStereo(offset);

      // Copy processed frame to output buffer
      for (let ch = 0; ch < this.channels; ch++) {
        const outputData = outputBuffer.getChannelData(ch);
        for (let i = 0; i < this.seekLength && outputOffset + i < outputLength; i++) {
          outputData[outputOffset + i] = this.outputBuffer[ch][i];
        }
      }

      // Move overlap to the beginning of the output buffer
      for (let ch = 0; ch < this.channels; ch++) {
        this.outputBuffer[ch].set(this.outputBuffer[ch].subarray(this.seekLength));
      }

      // Fill the leftover part of output buffer with zeros
      for (let ch = 0; ch < this.channels; ch++) {
        this.outputBuffer[ch].fill(0, this.overlapLength - this.seekLength);
      }

      // Advance input
      inputOffset += Math.floor(this.seekLength * this.tempo);

      // Copy next frame from input to midBuffer
      for (let ch = 0; ch < this.channels; ch++) {
        const channelData = inputBuffer.getChannelData(ch);
        this.midBuffer[ch].copyWithin(0, this.seekLength);
        const remainingLength = Math.min(this.seekLength, inputLength - inputOffset);
        this.midBuffer[ch].set(channelData.subarray(inputOffset, inputOffset + remainingLength), this.overlapLength);
      }

      outputOffset += this.seekLength;
    }

    return outputBuffer;
  }
}
