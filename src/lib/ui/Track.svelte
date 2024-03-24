<script>
  import AudioClip from "./AudioClip.svelte";
  import {
    changeTrackName,
    removeTrack,
    toggleMute,
    toggleSolo,
  } from "../../core/store.js";
  import { X } from "lucide-svelte";

  export let track;
</script>

<!-- Track -->
<div
  class="track flex flex-row gap-2 overflow-hidden rounded-sm border border-dark-100 bg-white/5"
  style="height: 100px; position: relative;"
>
  <!-- Track header -->
  <div
    class="track-header flex w-60 shrink-0 flex-col border-r-2 border-r-dark-900 bg-dark-300"
  >
    <div class="flex flex-row items-center justify-between gap-2 bg-dark-200">
      <button
        class="block w-full truncate p-1 text-left text-xs font-medium text-light"
        on:click={() => {
          changeTrackName(track.id, prompt("Enter new track name", track.name));
        }}
      >
        {track.name}
      </button>

      <button
        class="p-2 hover:bg-dark-100"
        on:click={() => removeTrack(track.id)}
      >
        <X size="14" />
      </button>
    </div>

    <div class="flex flex-row flex-wrap gap-1 p-2">
      <button
        class="inline-flex items-center justify-center rounded border border-dark-600 bg-dark-600 px-2 py-1 text-sm text-light hover:bg-dark-500"
        on:click={() => toggleMute(track.id)}
        class:bg-dark-200={track.isMuted}
      >
        Mute
      </button>

      <button
        class="inline-flex items-center justify-center rounded border border-dark-600 bg-dark-600 px-2 py-1 text-sm text-light hover:bg-dark-500"
        on:click={() => toggleSolo(track.id)}
        class:bg-dark-200={track.isSolo}
      >
        Solo
      </button>
    </div>
  </div>

  <!-- Clips -->
  <div class="track-timeline relative w-full">
    {#each track.clips as clip}
      <AudioClip {clip} />
    {/each}
  </div>
</div>
