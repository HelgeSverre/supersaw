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
    analyser.fftSize = 2048; // Larger fftSize for more detailed analysis
    analyser.smoothingTimeConstant = 0.3; // Smoothing can be adjusted as needed
    audioManager.mixer.connect(analyser);

    updateSoundLevel();
  }

  function updateSoundLevel() {
    const data = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(data);

    // Calculate the peak volume in dB
    let maxDb = -Infinity;
    for (let i = 0; i < data.length; i++) {
      if (data[i] > maxDb) {
        maxDb = data[i];
      }
    }

    // Convert the max dB value to a scaled value between 0 and 100
    const minDb = -100; // Minimum dB value for scaling, might need adjustment
    const maxDbScale = 0; // Maximum dB value for scaling
    let value = ((maxDb - minDb) / (maxDbScale - minDb)) * 100;

    peakMeter = Math.max(0, Math.min(value, 100)); // Ensure it's between 0 and 100

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
        <Knob bind:value={$masterPan} min={-1} max={1} size="42" />
      </div>

      <div class="flex flex-row gap-px p-2">
        <!-- Vol -->
        <div class="flex flex-col items-center justify-center py-1 text-center">
          <Fader bind:volume={$masterVolume} />
        </div>

        <div class="flex flex-row gap-1">
          <LevelMeter bind:level={peakMeter} />
          <LevelMeter bind:level={peakMeter} />
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
