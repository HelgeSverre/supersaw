<script lang="ts">
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
    setInstrumentForTrack,
    setMidiOutputForTrack,
    toggleMute,
    toggleSolo,
  } from "../../core/store.js";
  import { X } from "lucide-svelte";
  import MidiClip from "./MidiClip.svelte";
  import { createMidiClipFromFile } from "../../core/midi.js";
  import { audioManager } from "../../core/audio.js";
  import classNames from "classnames";
  import { onMount } from "svelte";
  import type { Track } from "../../core/types";

  export let track: Track;

  function handleDrop(event: DragEvent) {
    if (event.dataTransfer?.items) {
      for (let i = 0; i < event.dataTransfer.items.length; i++) {
        // If the dropped item is a file and the file is a MIDI file
        if (event.dataTransfer.items[i].kind === "file" && event.dataTransfer.items[i].type === "audio/midi") {
          const file = event.dataTransfer.items[i].getAsFile();

          if (track.type !== "instrument") {
            alert("You can only drop MIDI files on instrument tracks.");
            return;
          }

          // Create a new clip from the MIDI file and add it to the track
          const timelineRect = event.currentTarget.getBoundingClientRect();
          const relativeX = event.clientX - timelineRect.left;
          const newStartTime = $pixelsToTime(relativeX);
          createMidiClipFromFile(file).then((clip) => {
            addClip(track.id, { ...clip, startTime: newStartTime });
          });

          return;
        }

        if (event.dataTransfer.items[i].kind === "file") {
          const file = event.dataTransfer.items[i].getAsFile();

          if (track.type !== "audio") {
            alert("You can only drop audio files on audio tracks.");
            return;
          }

          // Create a new clip from the MIDI file and add it to the track
          const timelineRect = event.currentTarget.getBoundingClientRect();
          const relativeX = event.clientX - timelineRect.left;
          const newStartTime = $pixelsToTime(relativeX);
          createClipFromUrl(URL.createObjectURL(file), file.name).then((clip) => {
            addClip(track.id, { ...clip, startTime: newStartTime });
          });

          return;
        }
      }
    }

    const dataTransfer = event.dataTransfer.getData("text/plain");
    if (dataTransfer === "") {
      return;
    }

    const data = JSON.parse(dataTransfer);

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

  let midiOutputs: MIDIOutput[] = [];

  onMount(() => {
    // TODO: Move into a provider component (context api)
    navigator.requestMIDIAccess().then((access) => {
      midiOutputs = Array.from(access.outputs.values());

      access.onstatechange = (event) => {
        console.log("MIDI state change", event);
        midiOutputs = Array.from(access.outputs.values());
      };
    });
  });

  $: midiOutputFound = midiOutputs.find((output) => output.name === track.midiOutput) !== null;

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
<section>
  <div
    class={classNames("track flex flex-row gap-1 overflow-hidden", {
      "opacity-50": track.isMuted,
    })}
    style="height: 200px; position: relative;"
  >
    <!-- Track header -->
    <div class="track-header flex w-60 shrink-0 flex-col border-r-2 border-r-dark-900 bg-dark-300">
      <div class="flex flex-row items-center justify-between gap-2 bg-dark-200 p-0.5">
        <button
          class="block w-full truncate rounded p-1 text-left text-xs font-medium text-light focus:outline-none focus:ring-1 focus:ring-dark-100"
          on:click={() => {
            changeTrackName(track.id, prompt("Enter new track name", track.name) ?? track.name);
          }}
        >
          {track.name}
        </button>

        <span>
          {track.type === "audio" ? "🔈" : "🎹"}
        </span>

        <button
          class="rounded p-2 hover:bg-dark-100 focus:outline-none focus:ring-1 focus:ring-dark-100"
          on:click={() => removeTrack(track.id)}
        >
          <X size="14" />
        </button>
      </div>

      <div class="flex flex-row flex-wrap gap-1 p-2">
        <button
          on:click={() => toggleMute(track.id)}
          class={classNames(
            "inline-flex items-center justify-center rounded border border-dark-600 px-2 py-1 text-sm ",
            "focus:outline-none focus:ring-1 focus:ring-dark-100",
            {
              "bg-accent-yellow text-black hover:bg-accent-yellow/80": track.isMuted,
              "bg-dark-600 text-light hover:bg-dark-500": !track.isMuted,
            },
          )}
        >
          Mute
        </button>

        <button
          on:click={() => toggleSolo(track.id)}
          class={classNames(
            "inline-flex items-center justify-center rounded border border-dark-600 px-2 py-1 text-sm ",
            "focus:outline-none focus:ring-1 focus:ring-dark-100",
            {
              "bg-accent-yellow text-black hover:bg-accent-yellow/80": track.isSolo,
              "bg-dark-600 text-light hover:bg-dark-500": !track.isSolo,
            },
          )}
        >
          Solo
        </button>

        {#if track.type === "audio"}
          <button
            class={classNames(
              "inline-flex items-center justify-center rounded border border-dark-600 bg-dark-600 px-2 py-1 text-sm text-light hover:bg-dark-500 ",
              "focus:outline-none focus:ring-1 focus:ring-dark-100",
            )}
            on:click={() => {
              const fileInput = document.createElement("input");
              fileInput.type = "file";
              fileInput.accept = "audio/*";
              fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                createClipFromUrl(URL.createObjectURL(file), file.name).then((clip) => {
                  addClip(track.id, clip);
                });
              };
              fileInput.click();
            }}
          >
            Add clip
          </button>
        {:else if track.type === "instrument"}
          <select
            class="w-full appearance-none rounded border border-dark-200 bg-dark-700 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-dark-100"
            bind:value={track.instrument}
            on:change={(e) => setInstrumentForTrack(track.id, e.target.value)}
          >
            {#each audioManager.instruments.keys() as instrument}
              <option value={instrument}>{instrument}</option>
            {/each}
          </select>

          {#if track.instrument === "midi_out"}
            {#if midiOutputs.length}
              <select
                bind:value={track.midiOutput}
                on:change={(e) => setMidiOutputForTrack(track.id, e.target.value)}
                class="w-full appearance-none rounded border border-dark-200 bg-dark-700 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-dark-100"
              >
                <option>Select MIDI output</option>
                {#each midiOutputs as output}
                  <option value={output.name}> {output.manufacturer} - {output.name}</option>
                {/each}
              </select>
            {:else}
              <div
                class="w-full appearance-none rounded border border-dark-200 bg-dark-700 px-2 py-1 font-mono text-xs text-light-soft focus:outline-none focus:ring-1 focus:ring-dark-100"
              >
                No MIDI outputs found
              </div>
            {/if}
          {/if}
        {/if}
      </div>
    </div>

    <!-- Clips -->
    <div
      aria-hidden="true"
      class="relative flex flex-1 flex-col overflow-x-auto overflow-y-hidden bg-dark-800"
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
</section>

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
