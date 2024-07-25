import VirusOscillator from "./osc.js";
import VirusFilter from "./filter.js";
import ADSREnvelope from "./adsr.js";

class Voice {
  constructor(audioContext, params) {
    this.audioContext = audioContext;
    this.output = audioContext.createGain();

    // Oscillators
    this.oscillators = [
      new VirusOscillator(audioContext),
      new VirusOscillator(audioContext),
      new VirusOscillator(audioContext),
    ];

    // Filters
    this.filter1 = new VirusFilter(audioContext);
    this.filter2 = new VirusFilter(audioContext);

    // Envelopes
    this.ampEnvelope = new ADSREnvelope(audioContext);
    this.filterEnvelope = new ADSREnvelope(audioContext);

    // Panner for unison spread
    this.panner = audioContext.createStereoPanner();

    // Mixer for parallel and split routing
    this.filterMixer = audioContext.createGain();
    this.filterRouting = "serial";

    // Apply initial parameters
    this.setParams(params);

    // Set up initial routing
    this.updateFilterRouting();
  }

  setParams(params) {
    // Set oscillator parameters
    this.oscillators.forEach((osc, i) => {
      const oscParams = params.oscillators[i];
      osc.setWaveform(oscParams.waveform);
      osc.setPulseWidth(oscParams.pulseWidth);
      osc.enableSync(oscParams.syncEnabled);
      osc.setSyncRatio(oscParams.syncRatio);
    });

    // Set filter parameters
    this.filter1.setType(params.filter1.type);
    this.filter1.setCutoff(params.filter1.cutoff);
    this.filter1.setResonance(params.filter1.resonance);
    this.filter1.setEnvelopeAmount(params.filter1.envelopeAmount);
    this.filter1.setSaturation(params.filter1.saturation);
    this.filter1.setKeyTracking(params.filter1.keyTracking);
    this.filter1.setEnvelopeParams(
      params.filter1.envelope.attack,
      params.filter1.envelope.decay,
      params.filter1.envelope.sustain,
      params.filter1.envelope.release,
    );

    this.filter2.setType(params.filter2.type);
    this.filter2.setCutoff(params.filter2.cutoff);
    this.filter2.setResonance(params.filter2.resonance);
    this.filter2.setEnvelopeAmount(params.filter2.envelopeAmount);
    this.filter2.setSaturation(params.filter2.saturation);
    this.filter2.setKeyTracking(params.filter2.keyTracking);
    this.filter2.setEnvelopeParams(
      params.filter2.envelope.attack,
      params.filter2.envelope.decay,
      params.filter2.envelope.sustain,
      params.filter2.envelope.release,
    );

    // Set amp envelope parameters
    this.ampEnvelope.setParams(params.ampEnvelope);

    // Set filter routing
    this.setFilterRouting(params.filterRouting || "serial");
  }

  setFilterRouting(routing) {
    if (this.filterRouting !== routing) {
      this.filterRouting = routing;
      this.updateFilterRouting();
    }
  }

  updateFilterRouting() {
    // Disconnect all oscillators and filters
    this.oscillators.forEach((osc) => osc.disconnect());
    this.filter1.disconnect();
    this.filter2.disconnect();
    this.filterMixer.disconnect();

    switch (this.filterRouting) {
      case "serial":
        // Oscillators -> Filter1 -> Filter2 -> Panner
        this.oscillators.forEach((osc) => osc.connect(this.filter1.input));
        this.filter1.connect(this.filter2.input);
        this.filter2.connect(this.panner);
        break;

      case "parallel":
        // Oscillators -> Filter1 -> Mixer
        //             -> Filter2 -> Mixer
        // Mixer -> Panner
        this.oscillators.forEach((osc) => {
          osc.connect(this.filter1.input);
          osc.connect(this.filter2.input);
        });
        this.filter1.connect(this.filterMixer);
        this.filter2.connect(this.filterMixer);
        this.filterMixer.connect(this.panner);
        break;

      case "split":
        // Oscillator1 -> Filter1 -> Mixer
        // Oscillator2 -> Filter1 -> Mixer
        // Oscillator3 -> Filter2 -> Mixer
        // Mixer -> Panner
        this.oscillators[0].connect(this.filter1.input);
        this.oscillators[1].connect(this.filter1.input);
        this.oscillators[2].connect(this.filter2.input);
        this.filter1.connect(this.filterMixer);
        this.filter2.connect(this.filterMixer);
        this.filterMixer.connect(this.panner);
        break;

      default:
        console.error("Invalid filter routing:", this.filterRouting);
    }

    // Always connect the panner to the output
    this.panner.connect(this.output);
  }

  noteOn(frequency, velocity, detune, pan) {
    const now = this.audioContext.currentTime;
    const midiNote = this.frequencyToMidiNote(frequency);

    // Set oscillator frequencies and detune
    this.oscillators.forEach((osc, i) => {
      osc.setFrequency(frequency);
      osc.setDetune(detune);
      osc.start(now);
    });

    // Trigger filter envelopes
    this.filter1.triggerEnvelope();
    this.filter2.triggerEnvelope();

    // Update filter cutoffs based on key tracking
    this.filter1.updateCutoff(midiNote);
    this.filter2.updateCutoff(midiNote);

    // Set amplitude envelope
    this.ampEnvelope.trigger();
    this.output.gain.setValueAtTime(0, now);
    this.output.gain.linearRampToValueAtTime(velocity, now + this.ampEnvelope.attack);

    // Set panning for unison spread
    this.panner.pan.setValueAtTime(pan, now);
  }

  noteOff() {
    const now = this.audioContext.currentTime;

    // Release amplitude envelope
    this.ampEnvelope.release(this.output.gain, 0);

    // Release filter envelopes
    this.filter1.releaseEnvelope();
    this.filter2.releaseEnvelope();

    // Stop oscillators
    this.oscillators.forEach((osc) => osc.stop(now + this.ampEnvelope.release));
  }

  connect(destination) {
    this.output.connect(destination);
  }

  disconnect() {
    this.output.disconnect();
  }
}

export default Voice;
