import { ChorusFlanger, Delay, Distortion, Phaser, Reverb, Ringmod } from "./fx.js";
import LFO from "./lfo.js";
import ModulationMatrix from "./modmatrix.js";

class VirusCSynth {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.output = audioContext.createGain();

    // Voices
    this.voices = [];
    this.activeVoices = new Map();
    this.maxVoices = 16; // Maximum polyphony

    this.lfos = [
      new LFO(audioContext),
      new LFO(audioContext),
      new LFO(audioContext),
      // ..
    ];

    // Modulation Matrix
    this.modulationMatrix = new ModulationMatrix();

    // Unison settings
    this.unisonVoices = 1;
    this.unisonDetune = 0;
    this.unisonPanSpread = 0;

    // Effects
    this.createEffectsChain(audioContext);

    // Connect everything
    this.connectEffectsChain();
    //
    // // Misc
    // this.keyTrackingAmount = 0;
    // this.baseNote = 60; // Middle C
    //
    // // Effects
    // this.createEffectsChain(audioContext);
    //
    // this.filterRouting = "serial"; // 'serial', 'parallel', or 'split'
    // this.updateFilterRouting();
    //
    // // Connect everything
    // this.updateFilterRouting();
    // this.connectEffectsChain();
  }

  createEffectsChain(audioContext) {
    this.distortion = new Distortion(audioContext);
    this.phaser = new Phaser(audioContext);
    this.chorusFlanger = new ChorusFlanger(audioContext);
    this.ringmod = new Ringmod(audioContext);
    this.reverb = new Reverb(audioContext);
    this.delay = new Delay(audioContext);
  }

  connectEffectsChain() {
    this.distortion.connect(this.phaser.input);
    this.phaser.connect(this.chorusFlanger.input);
    this.chorusFlanger.connect(this.ringmod.input);
    this.ringmod.connect(this.reverb.input);
    this.reverb.connect(this.delay.input);
    this.delay.connect(this.output);

    // TODO: replace with mixer in audioManager
    this.output.connect(this.audioContext.destination);
  }

  setUnison(voices, detune, panSpread) {
    this.unisonVoices = voices;
    this.unisonDetune = detune;
    this.unisonPanSpread = panSpread;
  }

  noteOn(midiNote, velocity) {
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12);
    const voiceGroup = [];

    for (let i = 0; i < this.unisonVoices; i++) {
      const detuneAmount = this.calculateDetune(i);
      const panAmount = this.calculatePanSpread(i);

      const voice = new Voice(this.audioContext, this.voiceParams);
      voice.noteOn(frequency, velocity, detuneAmount, panAmount);
      voice.connect(this.distortion.input);

      voiceGroup.push(voice);
    }

    this.voices.push(voiceGroup);
    this.activeVoices.set(midiNote, voiceGroup);

    this.applyModulation();
  }

  noteOff(midiNote) {
    const voiceGroup = this.activeVoices.get(midiNote);
    if (voiceGroup) {
      voiceGroup.forEach((voice) => voice.noteOff());
      this.activeVoices.delete(midiNote);
    }
  }

  calculateDetune(voiceIndex) {
    const spread = voiceIndex - (this.unisonVoices - 1) / 2;
    return spread * this.unisonDetune;
  }

  calculatePanSpread(voiceIndex) {
    const spread = voiceIndex - (this.unisonVoices - 1) / 2;
    return (spread / ((this.unisonVoices - 1) / 2)) * this.unisonPanSpread;
  }

  setLFO(lfoNum, waveform, frequency, amount) {
    const lfo = this.lfos[lfoNum - 1];
    lfo.setWaveform(waveform);
    lfo.setFrequency(frequency);
    lfo.setAmount(amount);
  }

  applyModulation() {
    this.voices.forEach((voiceGroup) => {
      voiceGroup.forEach((voice) => {
        voice.applyModulation(this.lfos, this.modulationMatrix);
      });
    });
  }

  setDistortion(amount, mix) {
    this.distortion.setAmount(amount);
    this.distortion.setMix(mix);
  }

  setPhaser(rate, depth, feedback, mix) {
    this.phaser.setRate(rate);
    this.phaser.setDepth(depth);
    this.phaser.setFeedback(feedback);
    this.phaser.setMix(mix);
  }

  setChorusFlanger(rate, depth, feedback, delay, mix) {
    this.chorusFlanger.setRate(rate);
    this.chorusFlanger.setDepth(depth);
    this.chorusFlanger.setFeedback(feedback);
    this.chorusFlanger.setDelay(delay);
    this.chorusFlanger.setMix(mix);
  }

  setRingmod(frequency, mix) {
    this.ringmod.setFrequency(frequency);
    this.ringmod.setMix(mix);
  }

  setReverb(mix) {
    this.reverb.setMix(mix);
  }

  setDelay(mix, time, feedback) {
    this.delay.setMix(mix);
    this.delay.setTime(time);
    this.delay.setFeedback(feedback);
  }

  setVolume(volume) {
    this.output.gain.setValueAtTime(volume, this.audioContext.currentTime);
  }

  setLFOtoModulate(lfoIndex, param, amount) {
    const lfo = this.lfos[lfoIndex];
    const modulationFunction = this.createModulationFunction(param, amount);

    // Connect LFO to all voices for the specified parameter
    this.voices.forEach((voice) => {
      this.modulationMatrix.connect(lfo, voice, modulationFunction);
    });
  }

  createModulationFunction(param, amount) {
    return (lfoValue, voice) => {
      let scaledValue = lfoValue * amount;
      if (param === "osc1freq") {
        voice.updateFrequency(scaledValue + voice.oscillator.baseFrequency);
      } else if (param === "filterCutoff") {
        voice.updateFilterCutoff(scaledValue + voice.filter.baseCutoff);
      }
      // Add more parameters and corresponding logic as needed
    };
  }

  //
  // connectLFOToOscillator(lfoIndex, oscIndex, parameter, amount) {
  //   const lfo = this.lfos[lfoIndex];
  //   const osc = this.oscillators[oscIndex];
  //
  //   switch (parameter) {
  //     case "frequency":
  //       this.modulationMatrix.connect(lfo.gainNode, osc.frequencyParam.gain, amount);
  //       break;
  //     case "wavetablePosition":
  //       this.modulationMatrix.connect(lfo.gainNode, osc.wavetablePositionParam.gain, amount);
  //       break;
  //     // Add more parameters as needed
  //   }
  // }
  //
  // setLFO(lfoNum, waveform, frequency, amount) {
  //   const lfo = this.lfos[lfoNum - 1];
  //   lfo.setWaveform(waveform);
  //   lfo.setFrequency(frequency);
  //   lfo.setAmount(amount);
  // }
  //

  // Modulation methods
  modulateParameter(parameterName, lfoIndex, amount, keyTrackingAmount = 0) {
    const lfo = this.lfos[lfoIndex];

    const modulationFunction = (param) => {
      const update = () => {
        const lfoValue = lfo.getValue();
        const keyTrackingValue = (this.lastNotePlayed - this.baseNote) * keyTrackingAmount;
        param.setValueAtTime(param.defaultValue + lfoValue * amount + keyTrackingValue, this.audioContext.currentTime);
        requestAnimationFrame(update);
      };
      update();
    };

    switch (parameterName) {
      case "frequency":
        modulationFunction(osc.frequencyParam.gain);
        break;
      case "wavetablePosition":
        modulationFunction(osc.wavetablePositionParam.gain);
        break;

      case "filter1Cutoff":
        modulationFunction(this.filter1.filter.frequency);
        break;
      case "filter2Cutoff":
        modulationFunction(this.filter2.filter.frequency);
        break;
      // Add more parameters as needed
    }
  }
}

export default VirusCSynth;
