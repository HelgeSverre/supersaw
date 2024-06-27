import { Synth } from "../instruments/synth.js";
import { Piano } from "../instruments/piano.js";
import { Pad } from "../instruments/pad.js";
import { Supersaw } from "../instruments/supersaw.ts";
import { AudioChannel } from "./channel.js";

class AudioManager {
  audioContext;
  mixer;
  sources = {};
  instruments = {};
  channels = {};

  cache = {};

  constructor() {
    this.audioContext = new window.AudioContext({
      latencyHint: "interactive",
      sampleRate: 44100,
    });

    this.channels = new Map();
    //  Mixer -> Pan -> Destination (Speakers)
    this.mixer = this.audioContext.createGain();
    this.panNode = this.audioContext.createStereoPanner();

    this.mixer.connect(this.panNode);
    this.panNode.connect(this.audioContext.destination);

    this.setupInstruments();
  }

  setupInstruments = () => {
    this.instruments = new Map();
    this.instruments.set("synth", new Synth(this.audioContext, this.mixer));
    this.instruments.set("piano", new Piano(this.audioContext, this.mixer));
    this.instruments.set("pad", new Pad(this.audioContext, this.mixer));
    this.instruments.set("supersaw", new Supersaw(this.audioContext, this.mixer));
  };

  getInstrument = (name) => {
    return this.instruments.get(name);
  };

  loadAudioBuffer = async (url) => {
    if (this.cache[url]) {
      return this.cache[url];
    }
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();

    const decodedAudio = await this.audioContext.decodeAudioData(arrayBuffer);
    this.cache[url] = decodedAudio;
    return decodedAudio;
  };

  extractAudioSegment(buffer, startTime, endTime) {
    const start = Math.max(0, Math.min(startTime, endTime));
    const end = Math.min(buffer.duration * 1000, Math.max(startTime, endTime));

    // Convert milliseconds to samples
    const startSample = Math.floor((start / 1000) * buffer.sampleRate);
    const endSample = Math.floor((end / 1000) * buffer.sampleRate);
    const sampleCount = endSample - startSample;

    // Create a new AudioBuffer for the segment
    const newBuffer = this.audioContext.createBuffer(buffer.numberOfChannels, sampleCount, buffer.sampleRate);

    // Copy the data from the original buffer to the segment buffer
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      newBuffer.copyToChannel(data.subarray(startSample, endSample), channel);
    }

    return newBuffer;
  }

  downloadBufferAsWave = (buffer, fileName) => {
    const blob = this.exportBufferToWav(buffer, fileName);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "audio.wav";
    a.click();

    URL.revokeObjectURL(url);
  };

  exportBufferToWav = (buffer, fileName) => {
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const bitDepth = 16; // We'll use 16-bit for this example
    const bytesPerSample = bitDepth / 8;
    const blockAlign = numberOfChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;

    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);

    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    // Write WAV header
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, "data");
    view.setUint32(40, dataSize, true);

    // Write audio data
    const offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        const sampleOffset = offset + (i * numberOfChannels + channel) * bytesPerSample;
        view.setInt16(sampleOffset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      }
    }

    const blob = new Blob([view], { type: "audio/wav" });

    return blob;
  };

  generateWaveformFromBuffer = async (audioBuffer, numberOfSamples = 1000) => {
    const isMono = audioBuffer.numberOfChannels === 1;

    const leftChannelData = audioBuffer.getChannelData(0);
    const rightChannelData = isMono ? leftChannelData : audioBuffer.getChannelData(1);

    const samplingStep = Math.ceil(leftChannelData.length / numberOfSamples);
    const verticalAmplitude = 50;
    let svgPath = "M0 " + verticalAmplitude;

    for (let sampleNum = 0; sampleNum < numberOfSamples; sampleNum++) {
      let peakMin = 0;
      let peakMax = 0;
      for (let stepIndex = 0; stepIndex < samplingStep; stepIndex++) {
        const currentSampleIndex = sampleNum * samplingStep + stepIndex;
        if (currentSampleIndex < leftChannelData.length) {
          const monoSampleValue = (leftChannelData[currentSampleIndex] + rightChannelData[currentSampleIndex]) / 2;
          peakMin = Math.min(peakMin, monoSampleValue);
          peakMax = Math.max(peakMax, monoSampleValue);
        }
      }
      svgPath += ` L${sampleNum + 1} ${verticalAmplitude - peakMax * verticalAmplitude} L${sampleNum + 1} ${verticalAmplitude - peakMin * verticalAmplitude}`;
    }

    return svgPath;
  };

  generateWaveform = async (audioUrl, numberOfSamples = 1000) => {
    const decodedAudio = await this.loadAudioBuffer(audioUrl);
    const isMono = decodedAudio.numberOfChannels === 1;

    const leftChannelData = decodedAudio.getChannelData(0);
    const rightChannelData = isMono ? leftChannelData : decodedAudio.getChannelData(1);

    const samplingStep = Math.ceil(leftChannelData.length / numberOfSamples);
    const verticalAmplitude = 50;
    let svgPath = "M0 " + verticalAmplitude;

    for (let sampleNum = 0; sampleNum < numberOfSamples; sampleNum++) {
      let peakMin = 0;
      let peakMax = 0;
      for (let stepIndex = 0; stepIndex < samplingStep; stepIndex++) {
        const currentSampleIndex = sampleNum * samplingStep + stepIndex;
        if (currentSampleIndex < leftChannelData.length) {
          const monoSampleValue = (leftChannelData[currentSampleIndex] + rightChannelData[currentSampleIndex]) / 2;
          peakMin = Math.min(peakMin, monoSampleValue);
          peakMax = Math.max(peakMax, monoSampleValue);
        }
      }
      svgPath += ` L${sampleNum + 1} ${verticalAmplitude - peakMax * verticalAmplitude} L${sampleNum + 1} ${verticalAmplitude - peakMin * verticalAmplitude}`;
    }

    return svgPath;
  };

  setupAudioSource = (buffer) => {
    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    source.connect(gainNode);
    gainNode.connect(this.mixer);

    return { source, gainNode };
  };

  setupTrackAudioSource = (buffer, channelId) => {
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;

    const channel = this.getChannel(channelId);
    source.connect(channel.gainNode);

    return { source, channel };
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

  playPreviewFromBuffer = async (audioBuffer) => {
    const source = this.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    const gainNode = this.audioContext.createGain();

    source.connect(gainNode);
    gainNode.connect(this.mixer);

    source.start(0); // Start immediately
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };
  };

  playPreview = async (url) => {
    const buffer = await this.loadAudioBuffer(url);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    const gainNode = this.audioContext.createGain();

    source.connect(gainNode);
    gainNode.connect(this.mixer);

    source.start(0); // Start immediately
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };
  };

  createChannel(channelId) {
    console.log("[AudioManager] Creating channel:", channelId);

    const gainNode = this.audioContext.createGain();
    const panNode = this.audioContext.createStereoPanner();
    gainNode.connect(panNode);
    panNode.connect(this.mixer);

    const channel = new AudioChannel(channelId, gainNode, panNode);
    this.channels.set(channelId, channel);

    return channel;
  }

  getChannel(channelId) {
    return this.channels.get(channelId);
  }

  setChannelVolume(channelId, volume) {
    if (channelId === "master") {
      this.mixer.gain.value = volume;
      return;
    }

    const channel = this.getChannel(channelId);
    if (channel) {
      channel.gainNode.gain.value = volume;
    }
  }

  setChannelPan(channelId, pan) {
    if (channelId === "master") {
      this.panNode.pan.value = pan;
      return;
    }

    const channel = this.getChannel(channelId);
    if (channel) {
      channel.panNode.pan.value = pan;
    }
  }

  allChannels() {
    return this.channels;
  }

  removeChannel(channelId) {
    const channel = this.channels.get(channelId);
    if (channel) {
      channel.panNode.disconnect();
      channel.gainNode.disconnect();
      this.channels.delete(channelId);
    }
  }

  getMasterChannel() {
    return {
      id: "master",
      gainNode: this.mixer,
      panNode: this.panNode,
    };
  }
}

export const audioManager = new AudioManager();
