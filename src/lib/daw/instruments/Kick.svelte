<script>
  import { audioManager } from "../../../core/audio.js";
  import ADSR from "../../ui/ADSR.svelte";
  import { Ear } from "phosphor-svelte";
  import SegmentGroup from "../../ui/SegmentGroup.svelte";
  import IconButton from "../../ui/IconButton.svelte";
  import TextButton from "../../ui/TextButton.svelte";
  import Value from "../../ui/Input/Value.svelte";

  export let ampAttack = 0.01; // Attack time
  export let ampDecay = 0.1; // Decay time
  export let ampSustain = 0.1; // Sustain level (no sustain for a kick drum)
  export let ampRelease = 0.3; // Release time

  export let pitchAttack = 0.01; // Attack time
  export let pitchDecay = 0.1; // Decay time
  export let pitchSustain = 0.1; // Sustain level (no sustain for a kick drum)
  export let pitchRelease = 0.3; // Release time

  export let peak = 1.0;
  export let startFrequency = 4975; // Start frequency in Hz
  export let endFrequency = 80; // End frequency in Hz
  export let subFrequency = 50; // Sub-bass frequency in Hz
  export let distortionAmount = 0.2; // Distortion amount

  let loopPreview = false;

  function createDistortionCurve(amount) {
    const k = amount * 100;
    const curve = new Float32Array(44100);
    const deg = Math.PI / 180;
    for (let i = 0; i < 44100; ++i) {
      const x = (i * 2) / 44100 - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  function play() {
    // Create main oscillator for kick drum
    const osc = audioManager.audioContext.createOscillator();
    osc.type = "sine"; // Can also try 'triangle'

    // Create sub-bass oscillator
    const subOsc = audioManager.audioContext.createOscillator();
    subOsc.type = "sine";

    // Create gain nodes for amplitude envelopes
    const gainNode = audioManager.audioContext.createGain();
    const subGainNode = audioManager.audioContext.createGain();

    // Create distortion node
    const distortion = audioManager.audioContext.createWaveShaper();
    distortion.curve = createDistortionCurve(distortionAmount);
    distortion.oversample = "2x";

    // Connect main oscillator to gain node, then to distortion, then to audio context
    osc.connect(gainNode);
    gainNode.connect(distortion);
    distortion.connect(audioManager.mixer);

    // Connect sub-bass oscillator to sub gain node, then to audio context
    subOsc.connect(subGainNode);
    subGainNode.connect(audioManager.mixer);

    // Initial settings
    const now = audioManager.audioContext.currentTime;

    // Set gain envelope for main oscillator
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(peak, now + ampAttack); // Attack phase
    gainNode.gain.linearRampToValueAtTime(ampSustain, now + ampAttack + ampDecay); // Decay phase
    gainNode.gain.linearRampToValueAtTime(0, now + ampAttack + ampDecay + ampRelease); // Release phase

    // Set gain envelope for sub-bass oscillator
    subGainNode.gain.setValueAtTime(0, now);
    subGainNode.gain.linearRampToValueAtTime(peak, now + ampAttack); // Attack phase
    subGainNode.gain.linearRampToValueAtTime(ampSustain, now + ampAttack + ampDecay); // Decay phase
    subGainNode.gain.linearRampToValueAtTime(0, now + ampAttack + ampDecay + ampRelease); // Release phase

    // Set pitch envelope for main oscillator
    osc.frequency.setValueAtTime(startFrequency, now);
    osc.frequency.exponentialRampToValueAtTime(startFrequency, now + pitchAttack); // Pitch attack
    osc.frequency.exponentialRampToValueAtTime(endFrequency, now + pitchAttack + pitchDecay); // Pitch decay
    osc.frequency.setValueAtTime(endFrequency, now + pitchAttack + pitchDecay + pitchSustain); // Pitch sustain
    osc.frequency.linearRampToValueAtTime(0, now + pitchAttack + pitchDecay + pitchRelease); // Pitch release

    // Set frequency for sub-bass oscillator
    subOsc.frequency.setValueAtTime(subFrequency, now);

    // Start oscillators
    osc.start(now);
    subOsc.start(now);
    osc.stop(now + ampAttack + ampDecay + ampRelease);
    subOsc.stop(now + ampAttack + ampDecay + ampRelease);

    osc.onended = () => {
      osc.disconnect();
      gainNode.disconnect();
      subOsc.disconnect();
      subGainNode.disconnect();
      distortion.disconnect();
      if (loopPreview) setTimeout(play, 500);
    };
  }
</script>

<div>
  <div class="flex flex-row gap-2 rounded border border-dark-100 bg-dark-700 p-4">
    <div class="w-64">
      <span class="mb-2 block text-sm leading-none">AMP</span>
      <ADSR bind:attack={ampAttack} bind:decay={ampDecay} bind:sustain={ampSustain} bind:release={ampRelease} />
    </div>
    <div class="w-64">
      <span class="mb-2 block text-sm leading-none">Pitch</span>
      <ADSR bind:attack={pitchAttack} bind:decay={pitchDecay} bind:sustain={pitchSustain} bind:release={pitchRelease} />
    </div>

    <div class="flex flex-col gap-2">
      <span class="block text-sm leading-none">Params</span>
      <div class=" grid grid-cols-3 gap-2 rounded border border-dark-100 p-2">
        <Value bind:value={peak} label="Peak" />
        <Value bind:value={startFrequency} label="Start Freq" />
        <Value bind:value={endFrequency} label="End Freq" />
        <Value bind:value={subFrequency} label="Sub Freq" />
        <Value bind:value={distortionAmount} label="Distortion" />
      </div>
      <SegmentGroup>
        <IconButton icon={Ear} onClick={play} />
        <TextButton onClick={() => (loopPreview = !loopPreview)} text={loopPreview ? "Stop" : "Loop"} />
      </SegmentGroup>
    </div>
  </div>
</div>
