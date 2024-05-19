<script>
  import { selectClip, timeToPixels, toggleView } from "../../core/store";
  import { onMount } from "svelte";
  import { renderMidiToSvg } from "../../core/midi.js";

  export let clip;

  let loadingState = "loading";

  let svgPathData = "";

  onMount(() => {
    try {
      svgPathData = renderMidiToSvg(clip.midiData, 1000);

      loadingState = "loaded";
    } catch (e) {
      loadingState = "error";
    }
  });

  function handleDragStart(clip) {
    return function (event) {
      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          action: "clip:move",
          clipId: clip.id,
          originalStartTime: clip.startTime,
        }),
      );
    };
  }

  $: leftPosition = $timeToPixels(clip.startTime);
  $: width = $timeToPixels(clip.duration);

  function getClassByState(state) {
    switch (state) {
      case "loading":
        return "audio-clip absolute inset-y-2 overflow-hidden rounded ring-1 ring-accent-purple ring-inset bg-accent-purple/20";
      case "error":
        return "audio-clip absolute inset-y-2 overflow-hidden rounded ring-1 ring-accent-red ring-inset bg-accent-red/20";
      case "loaded":
        return "audio-clip absolute inset-y-2 overflow-hidden rounded ring-1 ring-accent-yellow ring-inset bg-accent-yellow/20";
      default:
        return "audio-clip absolute inset-y-2 overflow-hidden rounded border border-gray-200";
    }
  }

  function onClip() {
    selectClip(clip.id);
    toggleView("clip", clip.id);
  }

  $: classes = getClassByState(loadingState);
</script>

<button
  class="audio-clip absolute inset-y-2 overflow-hidden rounded border border-blue-400 bg-accent-blue/20"
  draggable="true"
  on:dragstart|stopPropagation={handleDragStart(clip)}
  on:click={onClip}
  style="left: {leftPosition}px; width: {width}px;"
  title={clip.name ?? "Unnamed"}
>
  {#if loadingState === "loading" && svgPathData === ""}
    <div class="absolute inset-0 flex items-center justify-center">
      <span class="text-xs font-normal text-white/80">Loading waveform...</span>
    </div>
  {:else if loadingState === "error"}
    <div class="absolute inset-0 flex items-center justify-center">
      <span class="text-xs font-normal text-white/80">Error</span>
    </div>
  {:else}
    <div class="absolute left-1 top-1 inline-block rounded bg-white/10 p-0.5 text-left text-[10px] leading-none">
      {clip.name ?? "Unnamed"}
    </div>
    <div class="absolute right-1 top-1 inline-block rounded bg-white/10 p-0.5 text-right text-[10px] leading-none">
      {clip.duration.toFixed(2)}s
    </div>
    <div class="h-full w-full overflow-hidden">
      {@html svgPathData}
    </div>
  {/if}
</button>
