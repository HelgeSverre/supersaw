<script>
  import { onMount } from "svelte";
  import { selectClip, timeToPixels } from "../../core/store";
  import { audioManager } from "../../core/audio.js";
  import { generateSVGWaveform, generateWaveform, generateWaveformSVG } from "../../core/waveform.js";

  export let clip;

  let waveformPathData = "";

  onMount(async () => {
    if (!clip.audioUrl) {
      return;
    }

    // waveformPathData = await generateWaveformSVG(clip.audioUrl, 1000, 100);
    waveformPathData = await generateWaveformSVG(clip.audioUrl, 1000, 100);
  });

  const playClip = () => {
    selectClip(clip.id);
    audioManager.playPreview(clip.audioUrl);
  };

  function handleDragStart(clip) {
    return function (event) {
      event.dataTransfer.setData(
        "text/plain",
        JSON.stringify({
          clipId: clip.id,
          originalStartTime: clip.startTime,
        }),
      );
    };
  }

  $: leftPosition = $timeToPixels(clip.startTime);
  $: width = $timeToPixels(clip.duration);
</script>

<button
  class="audio-clip absolute inset-y-2 overflow-hidden rounded border border-accent-yellow bg-accent-yellow/20"
  draggable="true"
  on:dragstart={handleDragStart(clip)}
  on:click={playClip}
  style="left: {leftPosition}px; width: {width}px;"
  title={clip.name ?? "Unnamed"}
>
  <div class="absolute bottom-1 right-1 inline-block rounded bg-white/10 p-0.5 text-xs leading-none">
    {clip.name ?? "Unnamed"}
  </div>

  {#if waveformPathData === ""}
    <div class="absolute inset-0 flex items-center justify-center">
      <span class="text-xs font-normal text-white/80">Loading waveform...</span>
    </div>
  {:else}
    <div class="h-full w-full overflow-hidden">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-full w-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
        <path d={waveformPathData} stroke="white" fill="none" />
      </svg>
    </div>
  {/if}
</button>
