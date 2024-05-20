<script>
  import { tweened } from "svelte/motion";
  import { cubicInOut } from "svelte/easing";
  import Fader from "../ui/Fader.svelte";
  import { masterPan, masterVolume } from "../../core/store.js";
  import { ChevronUp } from "lucide-svelte";
  import { onMount } from "svelte";
  import { audioManager } from "../../core/audio.js";
  import ADSR from "../ui/ADSR.svelte";

  const openHeight = 350;
  const closedHeight = 30;

  let isMixerOpen = true;
  const mixerHeight = tweened(isMixerOpen ? openHeight : closedHeight, {
    duration: 50,
    easing: cubicInOut,
  });

  function toggleMixer() {
    isMixerOpen = !isMixerOpen;
    mixerHeight.set(isMixerOpen ? openHeight : closedHeight);
  }

  let startY;
  let startHeight;

  function startResizing(event) {
    startY = event.clientY;
    mixerHeight.subscribe((value) => (startHeight = value))();
    window.addEventListener("mousemove", doResize);
    window.addEventListener("mouseup", stopResizing);
  }

  function doResize(event) {
    const newY = event.clientY;
    const newHeight = startHeight - (newY - startY);
    mixerHeight.set(newHeight > closedHeight ? newHeight : closedHeight);
  }

  function stopResizing() {
    window.removeEventListener("mousemove", doResize);
    window.removeEventListener("mouseup", stopResizing);
  }

  function handleKeyup(event) {
    if (event.key === "m") {
      toggleMixer();
    }
  }

  let peakMeter = 0;

  onMount(() => {
    let analyser = audioManager.audioContext.createAnalyser();
    audioManager.mixer.connect(analyser);

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

    updateSoundLevel();
  });
</script>

<svelte:window on:keyup={handleKeyup} />

<div class="mixer-panel" style:height="{$mixerHeight}px">
  <div>
    <button class="block h-8 w-auto rounded-t bg-dark-100 px-2 text-sm text-white" on:click={toggleMixer}>
      <ChevronUp class="inline-block h-4 w-4  {isMixerOpen ? 'rotate-180 transform' : ''}" />
      Mixer
    </button>
  </div>
  <div aria-hidden="true" class="h-2 w-full cursor-row-resize bg-dark-100" on:mousedown={startResizing}></div>
  <div class="flex h-full flex-row items-start justify-start gap-6 border-2 border-dark-100 bg-dark-600 p-4">
    <div class="flex flex-col overflow-hidden rounded border border-dark-100 bg-dark-300">
      <div class="flex w-full flex-col items-center justify-center border-b border-dark-100 bg-dark-200 p-1">
        <div class="text-sm font-normal text-white">Master</div>
      </div>
      <div class="flex h-full flex-1 flex-row">
        <div class="h-full w-20">
          <div class="flex flex-col gap-2">
            <div
              class="flex flex-col items-center justify-center border-b border-dark-200 bg-dark-600 px-1 py-2 text-center"
            >
              <input
                bind:value={$masterPan}
                type="range"
                min="-1"
                max="1"
                step="0.1"
                class="bg-dark-40 block w-full cursor-pointer rounded border border-red-400"
              />
              <span class="mt-1 text-center text-xs font-medium tabular-nums text-gray-400">{$masterPan}</span>
              <span class="text-xs text-gray-200">Pan</span>
            </div>

            <div class="flex flex-col items-center justify-center py-1 text-center">
              <Fader bind:volume={$masterVolume} />

              <div class="text-center text-xs font-medium tabular-nums text-gray-400">
                {Math.round($masterVolume * 100)}%
              </div>
              <span class="text-xs text-gray-200">Volume</span>
            </div>
          </div>
        </div>
        <div class="flex w-6 flex-1 flex-row items-stretch justify-stretch border-l border-dark-100">
          <div class="relative h-full w-full bg-gradient-to-t from-green-600 via-yellow-600 to-red-700 contrast-50">
            <span class="absolute inset-x-0 top-4 text-center text-xs">{peakMeter.toFixed(0)}</span>
            <div
              class="absolute inset-x-0 bottom-0 border-t-4 border-red-700 backdrop-contrast-200"
              style={`min-height: ${peakMeter}%`}
            ></div>
          </div>
        </div>
      </div>
    </div>

    <div>
      <ADSR />
    </div>
  </div>
</div>

<style>
  .mixer-panel {
    overflow: hidden;
    width: 100%;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
  }
</style>
