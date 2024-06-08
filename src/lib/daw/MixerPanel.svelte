<script>
  import { tweened } from "svelte/motion";
  import { quartInOut } from "svelte/easing";
  import ChannelStrip from "./ChannelStrip.svelte";
  import { isMixerOpen, tracks } from "../../core/store.js";
  import Knob from "../ui/Knob.svelte";
  import { adsr, cutoff, detuneAmount, distortionAmount, reverbTime } from "../../core/instrument.js";
  import ADSR from "../ui/ADSR.svelte";

  const openHeight = 350;
  const closedHeight = 0;

  const mixerHeight = tweened($isMixerOpen ? openHeight : closedHeight, {
    duration: 100,
    easing: quartInOut,
  });

  function toggleMixer() {
    $isMixerOpen = !$isMixerOpen;
    mixerHeight.set($isMixerOpen ? openHeight : closedHeight);
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
</script>

<svelte:window on:keyup={handleKeyup} />

<div class="mixer-panel relative" style:height="{$mixerHeight}px">
  <div class="absolute -top-8">
    <button class="block h-8 w-auto rounded-tr bg-[#2D2D30] px-4 text-sm text-white" on:click={toggleMixer}>
      Mixer
    </button>
  </div>
  <div aria-hidden="true" class="h-1 w-full cursor-row-resize bg-[#2D2D30]" on:mousedown={startResizing}></div>
  <div class="flex h-full flex-row bg-[#2D2D30] p-1">
    <div class="flex flex-row gap-px bg-black p-px">
      <ChannelStrip channel="master" />

      {#each $tracks as track}
        <ChannelStrip channel="Track {track.name}" />
      {/each}
    </div>

    <div class="mx-6 grid grid-cols-4 gap-3">
      <div class="flex flex-col">
        <Knob bind:value={$cutoff} min={0} max={6000} />
        <span class="text-center text-xs">cutoff</span>
      </div>
      <div class="flex flex-col">
        <Knob bind:value={$reverbTime} />
        <span class="text-center text-xs">reverbTime</span>
      </div>
      <div class="flex flex-col">
        <Knob bind:value={$detuneAmount} min={1} max={50} />
        <span class="text-center text-xs">detuneAmount</span>
      </div>
      <div class="flex flex-col">
        <Knob bind:value={$distortionAmount} />
        <span class="text-center text-xs">distortionAmount</span>
      </div>
      <div class="col-span-full">
        <ADSR
          bind:attack={$adsr.attack}
          bind:decay={$adsr.decay}
          bind:sustain={$adsr.sustain}
          bind:release={$adsr.release}
        />
      </div>
    </div>
  </div>
</div>

<style>
  .mixer-panel {
    overflow: visible;
    width: 100%;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
  }
</style>
