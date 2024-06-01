<script>
  import { tweened } from "svelte/motion";
  import { cubicInOut } from "svelte/easing";
  import ChannelStrip from "./ChannelStrip.svelte";

  const openHeight = 350;
  const closedHeight = 0;

  let isMixerOpen = false;
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
    <div class="bg-black flex flex-row gap-px p-px">
      <ChannelStrip channel="master" />
      <ChannelStrip channel="1" />
      <ChannelStrip channel="2" />
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
