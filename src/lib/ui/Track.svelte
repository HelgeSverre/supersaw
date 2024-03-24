<script>
  import AudioClip from "./AudioClip.svelte";
  import { bpm, zoomLevel } from "../../core/store";
  import { toggleMute, toggleSolo, removeTrack } from "../../core/store.js";
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
      <div class="truncate p-1 text-xs font-medium text-light">
        {track.name}
      </div>

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
  <div
    class="track-timeline relative w-full"
    style="
    background-image: linear-gradient(to right, rgba(0,0,0,0.1) 50%, transparent 50%);
     background-size: {(60 / $bpm) * $zoomLevel * 100} + '%';
} 100%;"
  >
    {#each track.clips as clip}
      <AudioClip {clip} />
    {/each}
  </div>
</div>
