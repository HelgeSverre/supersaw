export class AudioChannel {
  constructor(id, gainNode, panNode) {
    this.id = id;
    this.gainNode = gainNode;
    this.panNode = panNode;
  }

  // Sets the volume for this channel; ensure the volume is within the valid range (0.0 to 1.0)
  setVolume(volume) {
    this.gainNode.gain.value = Math.max(0, Math.min(volume, 1));
  }

  // Sets the stereo panning for this channel; pan ranges from -1 (full left) to 1 (full right)
  setPan(pan) {
    this.panNode.pan.value = Math.max(-1, Math.min(pan, 1));
  }

  connect(destination) {
    // Connects this channel's output to a destination node
    this.panNode.connect(destination);
  }

  disconnect() {
    // Disconnects this channel from the currently connected destination
    this.panNode.disconnect();
  }

  cleanup() {
    // Clean up resources and disconnect nodes when this channel is no longer needed
    this.disconnect();
    this.gainNode.disconnect(); // It's good practice to disconnect nodes when they are not used to free up resources.
  }
}
