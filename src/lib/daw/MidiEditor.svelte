<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { audioManager } from "../../core/audio.js";
  import { resize } from "../actions/resize";
  import { drag } from "../actions/drag";
  import {
    getSelectedClip,
    pixelsPerBeat,
    pixelsToTime,
    playbackState,
    timeToPixels,
    zoomByDelta,
  } from "../../core/store.js";
  import { extractNoteEvents, isBlackKey, midiNoteToFrequency, noteLabel } from "../../core/midi.js";
  import { CassetteTape, Eraser, Keyboard, PaintBucket, Pencil } from "phosphor-svelte";

  const dispatch = createEventDispatcher();

  let noteHeight = 20;
  let snapThreshold = 5;
  let notesForDisplay = [];

  let pianoRoll;
  let noteArea;

  onMount(() => {
    audioManager.audioContext.resume();

    if ($getSelectedClip?.midiData) {
      notesForDisplay = extractNoteEvents($getSelectedClip.midiData);
      scrollToFirstNote();
    }
  });

  function handleZoom(event) {
    if (event.shiftKey) {
      event.preventDefault();
      zoomByDelta(event.deltaY);
    }
  }

  function syncVerticalScroll(e) {
    if (e.target === pianoRoll) {
      noteArea.scrollTop = e.target.scrollTop;
    } else {
      pianoRoll.scrollTop = e.target.scrollTop;
    }
  }

  function handleNoteClick(event, note) {
    if (isResizing) return;

    // Select multiple notes with shift key
    if (event.shiftKey) {
      if (selectedNotes.includes(note)) {
        selectedNotes = selectedNotes.map((selected) => {
          if (selected !== note) {
            return selected;
          }
        });
      } else {
        selectedNotes = [...selectedNotes, note];
      }
      return;
    }

    // Select single note
    selectedNotes.includes(note) ? (selectedNotes = []) : (selectedNotes = [note]);
  }

  function handleClick(event) {
    if (isResizing || isDragging) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const note = 127 - Math.floor((y + noteArea.scrollTop) / noteHeight);

    notesForDisplay = [
      ...notesForDisplay,
      {
        start: $pixelsToTime(x) * 1000,
        label: noteLabel(note),
        duration: 1000,
        note: note,
        velocity: 100,
      },
    ];
  }

  function scrollToFirstNote() {
    if (notesForDisplay.length > 0) {
      const firstNote = notesForDisplay[0];
      const firstNoteTop = calculateNoteTopPosition(firstNote);
      noteArea.scrollTop = Math.max(0, firstNoteTop); // Scroll to first note with 100px padding
    }
  }

  function calculateNoteTopPosition(note) {
    return (127 - note.note) * noteHeight;
  }

  // Array to generate MIDI note numbers in reverse
  let notesArray = Array.from({ length: 128 }, (_, index) => 127 - index);

  let highlightedNote = "";
  let selectedNotes = [];
  let activeNotes = [];
  let previewInstrument = "pad";

  let debug = false;

  function startNote(hz, note) {
    dispatch("noteOn", { hz, note });
    audioManager.audioContext.resume();
    audioManager.getInstrument(previewInstrument).startNote(hz);
  }

  function stopNote(hz, note) {
    dispatch("noteOff", { hz, note });
    audioManager.audioContext.resume();
    audioManager.getInstrument(previewInstrument).stopNote(hz);
  }

  function handleKeyDown(event) {
    if (event.key === "Backspace" || event.key === "Delete") {
      notesForDisplay = notesForDisplay.filter((n) => !selectedNotes.includes(n));
    }

    if (event.key === "d") {
      debug = !debug;
    }
  }

  let isResizing = false;
  let isDragging = false;

  $: beatWidth = $pixelsPerBeat;
  $: playHeadPosition = $timeToPixels($playbackState.currentTime);
</script>

<svelte:window on:keydown={handleKeyDown} />

<div
  style="--note-height: {noteHeight}px; --beat-width: {beatWidth}px"
  class="relative flex h-full min-h-0 flex-col p-2"
>
  <div class="flex h-full min-h-0 flex-row gap-2 overflow-hidden">
    <div class="relative flex w-[100px] flex-shrink-0 flex-col">
      <div class="mb-2 flex h-8 flex-shrink-0 items-center justify-center bg-dark-600 text-center">
        <span class="whitespace-nowrap font-mono text-xs font-medium">{highlightedNote}</span>
      </div>

      <div class="relative flex-1">
        <div
          on:scroll={syncVerticalScroll}
          bind:this={pianoRoll}
          class="piano-roll absolute inset-0 h-full min-h-0 min-w-0 flex-1 overflow-y-scroll bg-gray-700"
        >
          {#each notesArray as noteNumber}
            <button
              on:mouseenter={() => (highlightedNote = noteLabel(noteNumber))}
              on:mouseup={() => stopNote(midiNoteToFrequency(noteNumber))}
              on:mouseleave={() => stopNote(midiNoteToFrequency(noteNumber))}
              on:mousedown={() => startNote(midiNoteToFrequency(noteNumber))}
              class="piano-key hover:opacity-90 active:opacity-70 {isBlackKey(noteNumber) ? 'black-key' : 'white-key'}"
            >
              <span class="inline-block pr-2 font-medium">{noteLabel(noteNumber)}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>
    <div class="flex flex-1 flex-col">
      <div class="mb-2 flex h-8 flex-row items-center justify-between gap-6 bg-dark-600 px-2">
        <div class="flex flex-row items-center gap-2">
          {#if $getSelectedClip}
            <CassetteTape class="text-accent-yellow/80" />
            <span class="text-sm text-light">{$getSelectedClip?.name}</span>
            <span class="text-sm text-light-soft">{$getSelectedClip?.duration.toFixed(2)}s</span>
          {:else}
            <span>No clip selected</span>
          {/if}
        </div>
        <div class="ml-auto flex flex-row items-center gap-2">
          <div class="flex flex-row items-center gap-1 bg-dark-400 px-2 py-0.5">
            <Keyboard class="text-accent-yellow/80" />
            <span class="text-sm text-light">{previewInstrument}</span>
          </div>
        </div>
        <div class="flex flex-row items-center gap-2">
          <Pencil />
          <PaintBucket />
          <Eraser />
        </div>
      </div>

      <div class="relative flex-1 bg-dark-900">
        <div
          on:scroll={syncVerticalScroll}
          on:wheel={handleZoom}
          on:click={handleClick}
          bind:this={noteArea}
          aria-hidden="true"
          class="note-area absolute inset-0 overflow-scroll bg-dark-700/50"
        >
          <!-- Play needle -->
          <div class="playhead" style="left: {playHeadPosition}px;"></div>

          <div class="absolute inset-0">
            {#each notesArray as noteNumber}
              <div class=" note-lane {isBlackKey(noteNumber) ? 'black-key' : 'white-key'}"></div>
            {/each}
          </div>

          <!-- Notes -->
          {#each notesForDisplay as note}
            <div
              aria-hidden="true"
              on:click|stopPropagation={(event) => handleNoteClick(event, note)}
              on:mouseenter={() => (highlightedNote = note.label)}
              use:resize={{
                handleSelector: ".resize-handle",
                onResizeStart: () => {
                  isResizing = true;
                },
                onResizeEnd: () => {
                  setTimeout(() => (isResizing = false), 50);
                },
                onResize: (newWidth) => {
                  if (isDragging) return;
                  if (newWidth <= 1) return;

                  note.duration = $pixelsToTime(newWidth) * 1000;
                },
              }}
              use:drag={{
                onDragStart: (startX, startY) => {
                  isDragging = true;
                },
                onDrag: ({ deltaX, deltaY, initialY }) => {
                  if (isResizing) return;
                  note.start = Math.max(0, note.start + $pixelsToTime(deltaX) * 1000);
                },
                onDragEnd: () => {
                  setTimeout(() => (isDragging = false), 50);
                },
              }}
              class:selected={selectedNotes.includes(note)}
              class="note flex cursor-pointer select-none flex-row items-center justify-between"
              style="left: {$timeToPixels(note.start / 1000)}px; top: {calculateNoteTopPosition(
                note,
              )}px; width: {$timeToPixels(note.duration / 1000)}px;"
            >
              <div class="flex-1 truncate text-center">{note.label}</div>
              <div class="resize-handle"></div>
            </div>
          {/each}
        </div>

        <!-- Debug -->
        {#if debug}
          <div class="absolute inset-y-0 left-0 w-[900px] overflow-y-scroll border-dark-800 bg-dark-600">
            <div class="flex-1">
              <div class="flex h-full flex-col overflow-y-scroll">
                <table class="text-left">
                  <thead>
                    <tr>
                      <th class="whitespace-nowrap px-1 font-mono text-xs">Start</th>
                      <th class="whitespace-nowrap px-1 font-mono text-xs">Duration</th>
                      <th class="whitespace-nowrap px-1 font-mono text-xs">Velocity</th>
                      <th class="whitespace-nowrap px-1 font-mono text-xs">Note Num</th>
                      <th class="whitespace-nowrap px-1 font-mono text-xs">Label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each notesForDisplay as event}
                      <tr>
                        <td class="whitespace-nowrap px-1 font-mono text-xs">
                          {(event.start / 1000).toFixed(3)}s
                        </td>
                        <td class="whitespace-nowrap px-1 font-mono text-xs">
                          {(event.duration / 1000).toFixed(3)}s
                        </td>
                        <td class="whitespace-nowrap px-1 font-mono text-xs">{event.velocity}</td>
                        <td class="whitespace-nowrap px-1 font-mono text-xs">{event.note}</td>
                        <td class="whitespace-nowrap px-1 font-mono text-xs">{event.label}</td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .piano-roll {
    display: flex;
    flex-direction: column;
    height: 100%;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .piano-roll::-webkit-scrollbar {
    display: none;
  }

  .piano-key {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    color: black;
    font-size: 10px;
    min-height: var(--note-height);
    max-height: var(--note-height);
  }

  .piano-key.black-key {
    background-color: black;
    color: white;
  }

  .piano-key.white-key {
    background-color: white;
  }

  /*noinspection ALL*/
  .note-area {
    background: repeating-linear-gradient(
        to bottom,
        hsl(60, 100%, 50%, 30%),
        hsl(60, 100%, 50%, 30%) 1px,
        transparent 1px,
        transparent calc(var(--note-height) * 12) /* 1 octave */
      ),
      repeating-linear-gradient(
        to right,
        hsl(0, 0%, 100%, 10%),
        hsl(0, 0%, 100%, 10%) 1px,
        transparent 1px,
        transparent var(--beat-width) /* 1 beat */
      ),
      repeating-linear-gradient(
        to right,
        hsl(60, 100%, 50%, 15%),
        hsl(60, 100%, 50%, 15%) 1px,
        transparent 1px,
        transparent calc(var(--beat-width) * 4) /* 1 bar */
      );
    background-attachment: local;
    background-repeat: no-repeat;
    background-size: 200% 200%;
    background-position: calc(-1 * var(--note-height) * 4);
  }

  .note-lane {
    height: calc(var(--note-height));
  }

  .note-lane.white-key {
    background-color: white;
    opacity: 1%;
    border-top: 2px solid black;
  }

  .note-lane.black-key {
    visibility: hidden;
  }

  .note {
    position: absolute;
    background: hsl(60, 100%, 80%);
    color: hsl(0, 0%, 0%, 80%);
    font-size: 8px;
    height: var(--note-height);
  }

  .note .resize-handle {
    @apply inline-block h-full w-[2px] cursor-col-resize bg-black/20;
  }

  .note.selected {
    background: rgb(153, 194, 255);
  }

  .note.active {
    background: rgb(182, 255, 153);
  }

  .note.inactive {
    background: hsl(0, 0%, 90%);
  }

  .playhead {
    position: absolute;
    width: 1px;
    top: 0;
    height: calc((var(--note-height) * 12 * 10));
    background: hsl(0, 90%, 55%);
  }
</style>
