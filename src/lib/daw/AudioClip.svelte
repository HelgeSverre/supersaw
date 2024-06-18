<script>
  import { onMount } from "svelte";
  import { removeClip, selectClip, selectedClip, timeToPixels } from "../../core/store";
  import { audioManager } from "../../core/audio.js";
  import classNames from "classnames";

  export let clip;

  let waveformPathData = "";

  let loadingState = "loading";

  onMount(async () => {
    if (!clip.audioUrl && !clip.audioBuffer) {
      loadingState = "error";
      return;
    }
    try {
      if (clip.audioBuffer) {
        waveformPathData = await audioManager.generateWaveformFromBuffer(clip.audioBuffer, 1000);
      } else {
        waveformPathData = await audioManager.generateWaveform(clip.audioUrl, 1000);
      }

      loadingState = "loaded";
    } catch (e) {
      loadingState = "error";
      console.error(e);
    }
  });

  function onClip() {
    selectClip(clip.id);
  }

  function onClipDblClick() {
    if (clip.audioBuffer) {
      audioManager.playPreviewFromBuffer(clip.audioBuffer);
    } else {
      audioManager.playPreview(clip.audioUrl);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Backspace" || event.key === "Delete") {
      removeClip(clip.id);
    }
  }

  function handleDragStart(clip) {
    return function (event) {
      const clipRect = event.currentTarget.getBoundingClientRect();
      const dragStartX = event.clientX - clipRect.left;

      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          action: "clip:move",
          clipId: clip.id,
          originalStartTime: clip.startTime,
          dragStartX: dragStartX,
        }),
      );
    };
  }

  $: leftPosition = $timeToPixels(clip.startTime);
  $: width = $timeToPixels(clip.duration);

  $: clipClasses = classNames("audio-clip absolute ring-inset inset-y-2 overflow-hidden rounded ring-1", {
    "bg-accent-purple/20": "loading" === loadingState && clip.id === $selectedClip.id,
    "ring-accent-purple bg-accent-purple/10": "loading" === loadingState,

    "bg-accent-red/20": "error" === loadingState && clip.id === $selectedClip.id,
    "ring-accent-red bg-accent-red/10": "error" === loadingState,

    "bg-accent-yellow/30": "loaded" === loadingState && clip.id === $selectedClip.id,
    "ring-accent-yellow bg-accent-yellow/20": "loaded" === loadingState,
    // "audio-clip absolute inset-y-2 overflow-hidden rounded border border-gray-200"
  });
</script>

<button
  class={clipClasses}
  draggable="true"
  on:dragstart|stopPropagation={handleDragStart(clip)}
  on:click|stopPropagation={onClip}
  on:dblclick|stopPropagation={onClipDblClick}
  on:keydown|preventDefault={handleKeyDown}
  style="left: {leftPosition}px; width: {width}px;"
  title={clip.name ?? "Unnamed"}
>
  {#if loadingState === "loading" && waveformPathData === ""}
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
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-full w-full text-accent-yellow"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
      >
        <path d={waveformPathData} stroke="currentColor" fill="none" />
      </svg>
    </div>
  {/if}
</button>
