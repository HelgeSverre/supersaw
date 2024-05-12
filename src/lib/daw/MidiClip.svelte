<script>
  import { selectClip, timeToPixels, toggleView } from "../../core/store";

  export let clip;

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
</script>

<button
  class="audio-clip absolute inset-y-2 overflow-hidden rounded border border-blue-400 bg-accent-blue/20"
  draggable="true"
  on:dragstart|stopPropagation={handleDragStart(clip)}
  on:click={toggleView() && selectClip(clip.id)}
  style="left: {leftPosition}px; width: {width}px;"
  title={clip.name ?? "Unnamed"}
>
  <div class="absolute left-1 top-1 inline-block rounded bg-white/10 p-0.5 text-left text-[10px] leading-none">
    {clip.name ?? "Unnamed"}
  </div>
  <div class="absolute right-1 top-1 inline-block rounded bg-white/10 p-0.5 text-right text-[10px] leading-none">
    {clip.duration.toFixed(2)}s
  </div>
  <div class="h-full w-full overflow-hidden"></div>
</button>
