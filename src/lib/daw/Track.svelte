<script>
  import AudioClip from "./AudioClip.svelte";
  import {
    changeTrackName,
    moveClipToTime,
    pixelsToTime,
    removeTrack,
    selectedTrack,
    selectTrack,
    toggleMute,
    toggleSolo,
  } from "../../core/store.js";
  import { X } from "lucide-svelte";

  export let track;

  function handleDrop(event) {
    const timelineElement = event.currentTarget;
    const timelineRect = timelineElement.getBoundingClientRect();
    const relativeX = event.clientX - timelineRect.left;

    const data = JSON.parse(event.dataTransfer.getData("text/plain"));
    const newStartTime = $pixelsToTime(relativeX);

    moveClipToTime(track.id, data.clipId, newStartTime);
  }
</script>

<!-- Track -->
<div
  class="track flex flex-row gap-2 overflow-hidden rounded-sm border border-dark-100 bg-white/5 {track.isMuted
    ? 'opacity-50'
    : ''}"
  style="height: 100px; position: relative;"
>
  <!-- Track header -->
  <div class="track-header flex w-60 shrink-0 flex-col border-r-2 border-r-dark-900 bg-dark-300">
    <div class="flex flex-row items-center justify-between gap-2 bg-dark-200">
      <button
        class="block w-full truncate p-1 text-left text-xs font-medium text-light"
        on:click={() => {
          changeTrackName(track.id, prompt("Enter new track name", track.name));
        }}
      >
        {track.name}
      </button>

      <button class="p-2 hover:bg-dark-100" on:click={() => removeTrack(track.id)}>
        <X size="14" />
      </button>
    </div>

    <div class="flex flex-row flex-wrap gap-1 p-2">
      <button
        on:click={() => toggleMute(track.id)}
        class={`inline-flex items-center  justify-center rounded border border-dark-600 px-2 py-1 text-sm ${
          track.isMuted
            ? "bg-accent-yellow text-black-300 hover:bg-accent-yellow/80"
            : "bg-dark-600 text-light hover:bg-dark-500"
        }`}
      >
        Mute
      </button>

      <button
        on:click={() => toggleSolo(track.id)}
        class={`inline-flex items-center  justify-center rounded border border-dark-600 px-2 py-1 text-sm ${
          track.isSolo
            ? "bg-accent-yellow text-black-300 hover:bg-accent-yellow/80"
            : "bg-dark-600 text-light hover:bg-dark-500"
        }`}
      >
        Solo
      </button>
    </div>
  </div>

  <!-- Clips -->
  <div class="track-timeline relative w-full" on:dragover|preventDefault on:drop|preventDefault={handleDrop}>
    {#each track.clips as clip}
      <AudioClip clip={clip} />
    {/each}
  </div>
</div>
