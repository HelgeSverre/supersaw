<script>
  import { tweened } from "svelte/motion";
  import { cubicInOut, elasticInOut } from "svelte/easing";
  import Fader from "../ui/Fader.svelte";
  import { masterPan, masterVolume } from "../../core/store.js";
  import { ChevronUp } from "lucide-svelte";

  const openHeight = 350;
  const closedHeight = 30;

  let isMixerOpen = false;
  const mixerHeight = tweened(isMixerOpen ? openHeight : closedHeight, {
    duration: 100,
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
    mixerHeight.set(newHeight > closedHeight ? newHeight : closedHeight); // Set a minimum height
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
</script>

<svelte:window on:keyup={handleKeyup} />

<div class="mixer-panel" style:height="{$mixerHeight}px">
  <div>
    <button class="block h-8 w-auto rounded-t bg-dark-100 px-2 text-sm text-white" on:click={toggleMixer}>
      <ChevronUp class="inline-block h-4 w-4  {isMixerOpen ? 'rotate-180 transform' : ''}" />
      Mixer
    </button>
  </div>
  <div aria-hidden="true" class="handle" on:mousedown={startResizing}></div>
  <div class="flex h-full flex-row items-start justify-between bg-dark-500 p-4">
    <section class=" w-20 overflow-hidden rounded border border-dark-100 bg-dark-300">
      <div class="flex w-full flex-col items-center justify-center border-b border-dark-100 bg-dark-200 p-1">
        <div class="text-sm font-normal text-white">Master</div>
      </div>
      <div class="flex flex-col gap-2">
        <div
          class="flex flex-col items-center justify-center border-b border-dark-200 bg-dark-600 px-1 py-1 py-2 text-center"
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
    </section>
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

  .handle {
    width: 100%;
    height: 6px;
    background-color: var(--dark-100);
    cursor: row-resize;
  }
</style>
