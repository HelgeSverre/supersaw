<script>
  import { audioManager } from "../../../core/audio.js";
  import ADSR from "../../ui/ADSR.svelte";
  import { Ear } from "phosphor-svelte";
  import SegmentGroup from "../../ui/SegmentGroup.svelte";
  import IconButton from "../../ui/IconButton.svelte";
  import TextButton from "../../ui/TextButton.svelte";
  import Value from "../../ui/Input/Value.svelte";
  import { addTrack } from "../../../core/store.js";

  export let ampAttack = 0.001;
  export let ampDecay = 0.25;
  export let ampSustain = 0;
  export let ampRelease = 0.15;

  export let pitchAttack = 0.001;
  export let pitchDecay = 0.2;
  export let pitchSustain = 0;
  export let pitchRelease = 0.1;

  export let peak = 1.0;
  export let startFrequency = 200;
  export let endFrequency = 50;
  export let subFrequency = 40;
  export let distortionAmount = 0.5;

  let progress = 0;
  let animationFrameId = null;
  let startTime = null;
  let totalDuration = ampAttack + ampDecay + ampRelease;
  let loopPreview = false;

  function updateProgress() {
    const currentTime = audioManager.audioContext.currentTime;
    progress = ((currentTime - startTime) / totalDuration) * 100;

    if (progress >= 100) {
      progress = 100;
      cancelAnimationFrame(animationFrameId);
    } else {
      animationFrameId = requestAnimationFrame(updateProgress);
    }
  }

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
    generateKick(audioManager.audioContext);
  }

  function bounceToAudio() {
    const sampleRate = audioManager.audioContext.sampleRate;
    const offlineContext = new OfflineAudioContext(1, sampleRate * totalDuration, sampleRate);
    generateKick(offlineContext, true).then((renderedBuffer) => {
      addTrack({
        id: crypto.randomUUID(),
        type: "audio",
        name: `Kick`,
        isMuted: false,
        isSolo: false,
        clips: [
          {
            id: crypto.randomUUID(),
            name: "Bounced audio clip",
            type: "audio",
            startTime: 0,
            duration: renderedBuffer.duration,
            audioBuffer: renderedBuffer,
          },
        ],
      });
    });
  }

  async function generateKick(context, renderOffline = false) {
    const osc = context.createOscillator();
    osc.type = "sine";

    const subOsc = context.createOscillator();
    subOsc.type = "sine";

    const gainNode = context.createGain();
    const subGainNode = context.createGain();

    const distortion = context.createWaveShaper();
    distortion.curve = createDistortionCurve(distortionAmount);
    distortion.oversample = "4x";

    osc.connect(gainNode);
    gainNode.connect(distortion);
    distortion.connect(context.destination);

    subOsc.connect(subGainNode);
    subGainNode.connect(context.destination);

    const now = context.currentTime;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(peak, now + ampAttack);
    gainNode.gain.linearRampToValueAtTime(ampSustain, now + ampAttack + ampDecay);
    gainNode.gain.linearRampToValueAtTime(0, now + ampAttack + ampDecay + ampRelease);

    subGainNode.gain.setValueAtTime(0, now);
    subGainNode.gain.linearRampToValueAtTime(peak, now + ampAttack);
    subGainNode.gain.linearRampToValueAtTime(ampSustain, now + ampAttack + ampDecay);
    subGainNode.gain.linearRampToValueAtTime(0, now + ampAttack + ampDecay + ampRelease);

    osc.frequency.setValueAtTime(startFrequency, now);
    osc.frequency.exponentialRampToValueAtTime(endFrequency, now + pitchAttack);
    osc.frequency.exponentialRampToValueAtTime(endFrequency, now + pitchAttack + pitchDecay);

    subOsc.frequency.setValueAtTime(subFrequency, now);

    osc.start(now);
    subOsc.start(now);
    osc.stop(now + totalDuration);
    subOsc.stop(now + totalDuration);

    if (renderOffline) {
      return new Promise((resolve) => {
        context.startRendering().then((renderedBuffer) => {
          resolve(renderedBuffer);
        });
      });
    } else {
      startTime = context.currentTime;
      animationFrameId = requestAnimationFrame(updateProgress);

      osc.onended = () => {
        osc.disconnect();
        gainNode.disconnect();
        subOsc.disconnect();
        subGainNode.disconnect();
        distortion.disconnect();

        progress = 0;
        cancelAnimationFrame(animationFrameId);

        if (loopPreview) setTimeout(play, 500);
      };
    }
  }
</script>

<div>
  <div class="flex flex-row gap-2 rounded border border-dark-100 bg-dark-700 p-4">
    <div class="w-64">
      <span class="mb-2 block text-sm leading-none">AMP</span>
      <ADSR
        bind:progress={progress}
        bind:attack={ampAttack}
        bind:decay={ampDecay}
        bind:sustain={ampSustain}
        bind:release={ampRelease}
      />
    </div>
    <div class="w-64">
      <span class="mb-2 block text-sm leading-none">Pitch</span>
      <ADSR
        bind:progress={progress}
        bind:attack={pitchAttack}
        bind:decay={pitchDecay}
        bind:sustain={pitchSustain}
        bind:release={pitchRelease}
      />
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
        <TextButton onClick={bounceToAudio} text="Bounce" />
      </SegmentGroup>
    </div>
  </div>
</div>
