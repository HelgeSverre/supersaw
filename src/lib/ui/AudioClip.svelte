<script>
  import { onMount } from "svelte";
  import { timeToPixels } from "../../core/store";
  import {
    generateSVGWaveform,
    generateWaveform,
    generateWaveformSVG,
  } from "../../core/waveform.js";

  export let clip;

  let waveformPathData = "";

  onMount(async () => {
    if (!clip.audioUrl) {
      return;
    }

    waveformPathData = await generateWaveformSVG(clip.audioUrl, 1000, 100);
  });

  const playClip = () => {
    console.log("Playing clip", clip);

    const audio = new Audio(clip.audioUrl);
    audio.play();
  };

  $: leftPosition = $timeToPixels(clip.startTime);
  $: width = $timeToPixels(clip.duration);
</script>

<div
  on:click={playClip}
  class="audio-clip absolute inset-y-2 overflow-hidden rounded border border-accent-yellow bg-accent-yellow/20"
  style="left: {leftPosition}px; width: {width}px;"
>
  {#if waveformPathData === ""}
    <div class="absolute inset-0 flex items-center justify-center">
      <span class="text-xs font-normal text-white/80">Loading waveform...</span>
    </div>
  {:else}
    <div class="h-full w-full overflow-hidden">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-full w-full"
        viewBox="0 0 1000 100"
        preserveAspectRatio="none"
      >
        <path d={waveformPathData} stroke="white" fill="none" />
      </svg>
    </div>
  {/if}
</div>
