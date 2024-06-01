export interface Effect {
  connect(node: AudioNode): void;

  disconnect(): void;

  getNode(): AudioNode;
}

export class EffectChain {
  private audioContext: AudioContext;
  private inputNode: GainNode;
  private outputNode: AudioNode;
  private effects: Effect[];

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.inputNode = this.audioContext.createGain();
    this.outputNode = this.inputNode; // Initially, output is the same as input
    this.effects = [];
  }

  addEffects(effects: Effect[]): void {
    effects.forEach((effect) => this.addEffect(effect));
  }

  addEffect(effect: Effect): void {
    if (this.effects.length > 0) {
      this.effects[this.effects.length - 1].connect(effect.getNode());
    } else {
      this.inputNode.connect(effect.getNode());
    }
    this.outputNode = effect.getNode();
    this.effects.push(effect);
  }

  removeEffect(effect: Effect): void {
    const index = this.effects.indexOf(effect);
    if (index > -1) {
      this.effects.splice(index, 1);
      this.reconnectEffects();
    }
  }

  connect(destination: AudioNode): void {
    this.outputNode.connect(destination);
  }

  disconnect(): void {
    this.outputNode.disconnect();
  }

  private reconnectEffects(): void {
    this.inputNode.disconnect();
    if (this.effects.length > 0) {
      this.effects.reduce((prev, curr) => {
        prev.connect(curr.getNode());
        return curr.getNode();
      }, this.inputNode);

      this.outputNode = this.effects[this.effects.length - 1].getNode();
    } else {
      this.outputNode = this.inputNode;
    }
  }

  getInputNode(): AudioNode {
    return this.inputNode;
  }

  getOutputNode(): AudioNode {
    return this.outputNode;
  }
}
