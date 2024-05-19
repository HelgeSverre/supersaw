class AudioManager {
  audioContext;
  mixer;
  sources = {};

  cache = {};

  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Mixer -> Pan -> Destination (Speakers)
    this.mixer = this.audioContext.createGain();
    this.panNode = this.audioContext.createStereoPanner();

    this.mixer.connect(this.panNode);
    this.panNode.connect(this.audioContext.destination);
  }

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
    gainNode.connect(this.mixer);

    source.start(0); // Start immediately
    source.onended = () => {
      source.disconnect();
      gainNode.disconnect();
    };
  };
}

export const audioManager = new AudioManager();
