<script>
  import AudioClip from "./AudioClip.svelte";
  import {
    addClip,
    changeTrackName,
    createClipFromUrl,
    moveClipToTime,
    pixelsPerBeat,
    pixelsToTime,
    removeTrack,
    seekToTime,
    toggleMute,
    toggleSolo,
  } from "../../core/store.js";
  import { X } from "lucide-svelte";
  import MidiClip from "./MidiClip.svelte";
  import { createMidiClipFromFile } from "../../core/midi.js";
  import { audioManager } from "../../core/audio.js";

  export let track;

  function handleDrop(event) {
    if (event.dataTransfer.items) {
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        // If the dropped item is a file and the file is a MIDI file
        if (event.dataTransfer.items[i].kind === "file" && event.dataTransfer.items[i].type === "audio/midi") {
          const file = event.dataTransfer.items[i].getAsFile();

          // If the current track type is "instrument"
          if (track.type !== "instrument") {
            alert("You can only drop MIDI files on instrument tracks.");
            return;
          }

          // Create a new clip from the MIDI file and add it to the track
          const timelineElement = event.currentTarget;
          const timelineRect = timelineElement.getBoundingClientRect();
          const relativeX = event.clientX - timelineRect.left;
          const newStartTime = $pixelsToTime(relativeX);
          createMidiClipFromFile(file).then((clip) => {
            addClip(track.id, { ...clip, startTime: newStartTime });
          });
        }
      }
    }

    const data = JSON.parse(event.dataTransfer.getData("text/plain"));

    if (data.action === "clip:move") {
      const timelineElement = event.currentTarget;
      const timelineRect = timelineElement.getBoundingClientRect();
      const relativeX = event.clientX - timelineRect.left;
      let newOffset = relativeX - data.dragStartX;
      if (newOffset < 0) newOffset = 0;

      const newStartTime = $pixelsToTime(newOffset);

      console.log(newStartTime, relativeX, timelineRect.left, event.clientX);

      moveClipToTime(track.id, data.clipId, newStartTime);
    }

    if (data.action === "clip:add") {
      const timelineElement = event.currentTarget;
      const timelineRect = timelineElement.getBoundingClientRect();
      const relativeX = event.clientX - timelineRect.left;
      let newOffset = relativeX - data.dragStartX;
      if (newOffset < 0) newOffset = 0;

      const newStartTime = $pixelsToTime(newOffset);

      createClipFromUrl(data.path, data.name).then((clip) => {
        addClip(track.id, { ...clip, startTime: newStartTime });
      });
    }
  }

  function onTrackClick(event) {
    const timelineElement = event.currentTarget;
    const timelineRect = timelineElement.getBoundingClientRect();
    const relativeX = event.clientX - timelineRect.left;

    const newStartTime = $pixelsToTime(relativeX);

    seekToTime(newStartTime);
  }

  $: gradientStyle = `
  background:
     repeating-linear-gradient(
      to right,
      rgba(255, 255, 255, 0.2),
      rgba(255, 255, 255, 0.2) 1px,
      transparent 1px,
      transparent ${$pixelsPerBeat}px
    ),
    repeating-linear-gradient(
      to right,
      rgba(255, 255, 255, 0.03),
      rgba(255, 255, 255, 0.03) 2px,
      transparent 1px,
      transparent ${$pixelsPerBeat / 4}px
    );`;
</script>

<!-- Track -->
<div
  class="track flex flex-row gap-2 overflow-hidden rounded-sm border border-dark-100 bg-white/5 {track.isMuted
    ? 'opacity-50'
    : ''}"
  style="height: 150px; position: relative;"
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

      <span>
        {track.type === "audio" ? "🔈" : "🎹"}
      </span>

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

      <select
        class="w-full rounded border border-dark-200 bg-dark-700 px-2 py-1"
        bind:value={track.instrument}
        on:change={(e) => (track.instrument = e.target.value)}
      >
        {#each audioManager.instruments.keys() as instrument}
          <option value={instrument}>{instrument}</option>
        {/each}
      </select>
    </div>
  </div>

  <!-- Clips -->
  <div
    aria-hidden="true"
    class="relative w-full bg-dark-800"
    on:dragover|preventDefault
    on:drop|preventDefault={handleDrop}
    on:click={onTrackClick}
  >
    <div class="track-grid" style={gradientStyle}></div>

    {#each track.clips.filter((c) => c.type === "audio") as clip (clip.id)}
      <AudioClip clip={clip} />
    {/each}
    {#each track.clips.filter((c) => c.type === "midi") as clip (clip.id)}
      <MidiClip clip={clip} />
    {/each}
  </div>
</div>

<style>
  .track-grid {
    position: absolute;
    left: 0;
    height: 100%;
    width: 100%;
    background-attachment: local;
    background-repeat: no-repeat;
  }
</style>
