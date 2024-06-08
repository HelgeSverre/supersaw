<script>
  import {
    enableLooping,
    loopRegion,
    pixelsToTime,
    playbackState,
    setLoopRegion,
    timeToPixels,
    tracks,
    zoomByDelta,
  } from "../../core/store.js";
  import Track from "./Track.svelte";
  import AutomationClip from "./AutomationClip.svelte";

  let timeline;

  let selectionArea;
  let dragging = false;
  let startPixels = 0;
  let endPixels = 0;

  function handleMouseDown(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    startPixels = event.clientX - rect.left;
    endPixels = startPixels;
    dragging = true;
  }

  function handleMouseMove(event) {
    if (dragging) {
      const rect = selectionArea.getBoundingClientRect();
      endPixels = event.clientX - rect.left;
      if (endPixels < 0) {
        endPixels = 0;
      }
    }
  }

  function handleMouseUp(event) {
    if (!dragging) {
      return;
    }

    dragging = false;
    const rect = selectionArea.getBoundingClientRect();
    endPixels = event.clientX - rect.left;

    // Ensure startPixels is always the leftmost pixel
    if (startPixels > endPixels) {
      [startPixels, endPixels] = [endPixels, startPixels];
    }

    // Prevent selection outside the timeline
    if (startPixels < 0) {
      startPixels = 0;
    }

    const delta = endPixels - startPixels;

    if (Math.abs(delta) < 10) {
      setLoopRegion(0, 0);
      return;
    }

    setLoopRegion($pixelsToTime(startPixels), $pixelsToTime(endPixels));
    enableLooping();
  }

  function handleZoom(event) {
    if (event.shiftKey) {
      event.preventDefault();
      zoomByDelta(event.deltaY);
    }
  }

  $: playPosition = $timeToPixels($playbackState.currentTime);
  $: looper = {
    active: $loopRegion.active,
    left: $timeToPixels($loopRegion.start),
    right: $timeToPixels($loopRegion.end - $loopRegion.start),
  };
</script>

<svelte:window on:mousemove={handleMouseMove} on:mouseup={handleMouseUp} />

<section
  class="timeline relative size-full overflow-hidden"
  class:select-none={dragging}
  bind:this={timeline}
  on:wheel={handleZoom}
>
  <div class="relative">
    <div
      bind:this={selectionArea}
      on:mousedown|self={handleMouseDown}
      aria-hidden="true"
      class="relative left-[250px] mt-2 h-6 bg-dark-600"
    >
      <!-- todo: allow moving the selection area  -->
      <!-- Loop selection indication on "minimap" -->
      <div
        class="pointer-events-none absolute inset-y-px z-20 border-x border-teal-300 bg-teal-300/50"
        style:left={dragging ? Math.min(startPixels, endPixels) + "px" : looper.left + "px"}
        style:width={dragging ? Math.abs(endPixels - startPixels) + "px" : looper.right + "px"}
      ></div>
      <div style="left: {playPosition}px;" class="absolute inset-y-0 z-50 w-[1px] bg-red-500"></div>

      <!--{#each $tracks as track}-->
      <!--  {#each track.clips as clip}-->
      <!--    <div-->
      <!--      class="absolute inset-y-0 z-10 bg-accent-yellow/10 border-x border-white "-->
      <!--      style="left: {$timeToPixels(clip.startTime)}px; width: {$timeToPixels(clip.duration)}px;"-->
      <!--    ></div>-->
      <!--  {/each}-->
      <!--{/each}-->
    </div>

    <!-- Play Position -->
    <div style="left: {playPosition}px;" class="absolute inset-y-0 z-50 ml-[250px] w-[1px] bg-red-500"></div>

    <!-- Selection -->
    <div
      class:hidden={!$loopRegion.active}
      class="pointer-events-none absolute inset-y-px z-20 ml-[250px] select-none border-x border-teal-300/70 bg-teal-300/10"
      style:left={dragging ? Math.min(startPixels, endPixels) + "px" : looper.left + "px"}
      style:width={dragging ? Math.abs(endPixels - startPixels) + "px" : looper.right + "px"}
    ></div>

    <!-- Tracks -->
    <div class="relative flex flex-col gap-2 overflow-x-scroll p-2">
      {#each $tracks as track}
        <Track track={track} />

        <!--        <div class="flex h-8 w-full items-center bg-white/10 p-1 leading-snug">-->
        <!--          <span class="block bg-white/20 px-1"> automation </span>-->
        <!--        </div>-->
      {/each}
    </div>
  </div>
</section>

<style>
  .timeline {
    background-color: var(--surface-area);
  }
</style>
