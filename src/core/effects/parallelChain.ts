import type { EffectChain } from "./effectChain";

export class ParallelChain {
  private audioContext: AudioContext;
  private inputNode: GainNode;
  private outputNode: GainNode;
  private effectChains: EffectChain[];

  constructor(audioContext: AudioContext, chains: EffectChain[] = []) {
    this.audioContext = audioContext;
    this.inputNode = this.audioContext.createGain();
    this.outputNode = this.audioContext.createGain();
    this.effectChains = [];

    this.addChains(chains);
  }

  addChains(effectChains: EffectChain[]): void {
    effectChains.forEach((chain) => {
      this.effectChains.push(chain);
      this.inputNode.connect(chain.getInputNode());
      chain.connect(this.outputNode);
    });
  }

  connect(destination: AudioNode): void {
    this.outputNode.connect(destination);
  }

  disconnect(): void {
    this.outputNode.disconnect();
  }

  getInputNode(): AudioNode {
    return this.inputNode;
  }

  getOutputNode(): AudioNode {
    return this.outputNode;
  }
}
