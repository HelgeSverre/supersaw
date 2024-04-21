class AudioManager {
  audioContext;
  mixer;
  sources = {};

  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.mixer = this.audioContext.createGain();
    this.mixer.connect(this.audioContext.destination);
  }

  loadAudioBuffer = async (url) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return this.audioContext.decodeAudioData(arrayBuffer);
  };

  setupAudioSource = (buffer) => {
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.mixer);

    return { source, gainNode };
  };

  playClip = (clipId, buffer, startTime, duration) => {
    const { source, gainNode } = this.setupAudioSource(buffer);
    source.start(this.audioContext.currentTime + startTime, 0, duration);
    this.sources[clipId] = { source, gainNode };
  };

  stopClip = (clipId) => {
    if (this.sources[clipId]) {
      this.sources[clipId].source.stop();
      delete this.sources[clipId];
    }
  };
  setVolume = (volume) => {
    this.mixer.gain.value = volume;
  };

  setGain = (clipId, volume) => {
    if (this.sources[clipId]) {
      this.sources[clipId].gainNode.gain.value = volume;
    }
  };

  cleanup = () => {
    Object.keys(this.sources).forEach((id) => this.stopClip(id));
  };

  playPreview = async (url) => {
    const buffer = await this.loadAudioBuffer(url);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    const gainNode = this.audioContext.createGain();

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start(0); // Start immediately
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };
  };
}

// Export an instance of AudioManager
export const audioManager = new AudioManager();

export function setupTrack(buffer) {
  // TODO: remove this
  audioManager.setupAudioSource(buffer);
}
