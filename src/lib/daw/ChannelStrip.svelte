<script>
  import { masterPan, masterVolume } from "../../core/store.js";
  import Fader from "../ui/Fader.svelte";
  import { onMount } from "svelte";
  import { audioManager } from "../../core/audio.js";
  import Knob from "../ui/Knob.svelte";
  import LevelMeter from "../ui/LevelMeter.svelte";

  export let channel;
  let peakMeter = 0;
  let analyser;

  onMount(() => {
    setupPeakMeter();
  });

  function setupPeakMeter() {
    analyser = audioManager.audioContext.createAnalyser();
    audioManager.mixer.connect(analyser);

    updateSoundLevel();
  }

  function updateSoundLevel() {
    // Create an array to hold the time domain data
    let data = new Uint8Array(analyser.fftSize);

    analyser.getByteTimeDomainData(data);

    // Calculate the RMS of the data
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const value = (data[i] - 128) / 128;
      sum += value * value;
    }
    const rms = Math.sqrt(sum / data.length);

    // Convert the RMS to dB
    let db = 20 * Math.log10(rms);

    const minDb = -60;
    const maxDb = 0;
    peakMeter = (100 * (db - minDb)) / (maxDb - minDb);

    if (peakMeter < 0) {
      peakMeter = 0;
    }

    requestAnimationFrame(updateSoundLevel);
  }
</script>

<div class="flex flex-col overflow-hidden bg-[#2D2D30]">
  <div class="flex flex-1 flex-col items-center justify-start">
    <!-- Name -->
    <div class=" flex w-full flex-col items-center justify-center p-1">
      <div class="text-center text-sm font-normal text-white">{channel}</div>
    </div>

    <div class="flex flex-col gap-2">
      <!-- PAN -->
      <div class="flex flex-col items-center justify-center px-1 py-2 text-center">
        <Knob bind:value={$masterPan} minValue={-1} maxValue={1} size="42" />
      </div>

      <div class="flex flex-row gap-px p-2">
        <!-- Vol -->
        <div class="flex flex-col items-center justify-center py-1 text-center">
          <Fader bind:volume={$masterVolume} />
        </div>
        <div class="flex flex-row gap-1">
          <LevelMeter level={peakMeter} />
          <LevelMeter level={peakMeter} />
          <div>
            {#each new Array(10) as _, i}
              <span></span>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
