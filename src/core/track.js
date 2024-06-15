import { audioManager } from "./audio.js";

export class Track {
  constructor(id, name, type) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.isMuted = false;
    this.isSolo = false;
    this.instrument = null;
    this.midiOutput = null;
    this.clips = [];
    this.channel = audioManager.createChannel(id);
  }

  addClip(clip) {
    this.clips.push(clip);
  }

  removeClip(clipId) {
    this.clips = this.clips.filter((clip) => clip.id !== clipId);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
  }

  setInstrument(instrument) {
    this.instrument = instrument;
  }

  setMidiOutput(output) {
    this.midiOutput = output;
  }

  toggleSolo() {
    this.isSolo = !this.isSolo;
  }
}
