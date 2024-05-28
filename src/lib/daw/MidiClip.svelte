<script>
  import { bpm, removeClip, selectClip, selectedClip, timeToPixels, toggleView } from "../../core/store";
  import { onMount } from "svelte";
  import classNames from "classnames";

  export let clip;

  let notes = [];
  let loadingState = "loaded";

  onMount(() => {
    if (clip.midiData) {
      processMidiData(clip.midiData);
    }
  });

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

  function processMidiData(midiData) {
    notes = [];

    midiData.tracks.forEach((track) => {
      let wallTime = 0;
      let wallTimeInMilliseconds = 0;

      track.forEach((event) => {
        wallTime += event.deltaTime;
        wallTimeInMilliseconds = (wallTime / midiData.header.ticksPerBeat) * (60000 / $bpm);

        if (event.type === "noteOn") {
          notes.push({
            note: event.noteNumber,
            velocity: event.velocity,
            start: wallTimeInMilliseconds,
            duration: 0, // will be changed later
          });
        }

        if (event.type === "noteOff") {
          let note = notes.find(
            (note) => note.start < wallTimeInMilliseconds && note.duration === 0 && note.note === event.noteNumber,
          );

          if (note) {
            note.duration = wallTimeInMilliseconds - note.start;
          }
        }
      });
    });
  }

  function onClip() {
    selectClip(clip.id);
  }

  function onClipDblClick() {
    toggleView("clip", clip.id);
  }

  function handleKeyDown(event) {
    if (event.key === "Backspace" || event.key === "Delete") {
      removeClip(clip.id);
    }
  }

  $: leftPosition = $timeToPixels(clip.startTime);
  $: width = $timeToPixels(clip.duration);

  $: clipClasses = classNames("audio-clip absolute inset-y-2 overflow-hidden rounded border ", {
    "border-blue-300 bg-accent-blue/20": clip.id === $selectedClip,
    "border-blue-400 bg-accent-blue/10": clip.id !== $selectedClip,
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
  {#if loadingState === "loading"}
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
    <div class="relative h-full w-full">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="h-full w-full"
        viewBox={`0 0 ${$timeToPixels(clip.duration)} 127`}
        preserveAspectRatio="none"
        fill="currentColor"
      >
        {#each notes as note}
          <rect
            class="note"
            x={$timeToPixels(note.start / 1000)}
            y={127 - note.note}
            width={$timeToPixels(note.duration / 1000)}
            height="3"
          />
        {/each}
      </svg>
    </div>
  {/if}
</button>
