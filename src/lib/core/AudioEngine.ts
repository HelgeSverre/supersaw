class AudioEngine {
  audioContext: AudioContext;
  masterGain: GainNode;
  tracks: Map<number, TrackAudioNode>;

  constructor() {
    // @ts-ignore
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.tracks = new Map();
  }

  createTrack(trackId: number): TrackAudioNode {
    const trackNode = new TrackAudioNode(this.audioContext);
    trackNode.connect(this.masterGain);
    this.tracks.set(trackId, trackNode);
    return trackNode;
  }

  getTrack(trackId: number): TrackAudioNode {
    return this.tracks.get(trackId);
  }

  removeTrack(trackId: number) {
    const trackNode = this.tracks.get(trackId);
    if (trackNode) {
      trackNode.disconnect();
      this.tracks.delete(trackId);
    }
  }

  // Additional methods for playback, managing effects, etc.
}

class TrackAudioNode {
  audioContext: AudioContext;
  gainNode: GainNode;
  effects: AudioNode[];

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.gainNode = this.audioContext.createGain();
    this.effects = [];
  }

  connect(destination: AudioNode) {
    this.gainNode.connect(destination);
  }

  disconnect() {
    this.gainNode.disconnect();
  }

  addEffect(effectNode: AudioNode) {
    if (this.effects.length > 0) {
      this.effects[this.effects.length - 1].connect(effectNode);
    } else {
      this.gainNode.connect(effectNode);
    }
    effectNode.connect(this.gainNode);
    this.effects.push(effectNode);
  }

  removeEffect(effectNode: AudioNode) {
    const index = this.effects.indexOf(effectNode);
    if (index > -1) {
      this.effects.splice(index, 1);
      this.reconnectEffects();
    }
  }

  reconnectEffects() {
    this.gainNode.disconnect();
    this.effects.reduce((prev, curr) => {
      if (prev) prev.disconnect();
      prev.connect(curr);
      return curr;
    }, this.gainNode);
  }

  // Additional methods for managing clips, volume, etc.
}

export const audioEngine = new AudioEngine();
