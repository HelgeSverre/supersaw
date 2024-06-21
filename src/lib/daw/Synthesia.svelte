<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { audioManager } from "../../core/audio.js";
  import {
    pixelsPerBeat,
    playbackState,
    selectedClip,
    timeToPixels,
    zoomByDelta,
    zoomLevel,
  } from "../../core/store.js";
  import { extractNoteEvents, isBlackKey, midiNoteToFrequency, noteLabel } from "../../core/midi.js";
  import { CassetteTape, Keyboard } from "phosphor-svelte";
  import classNames from "classnames";

  const dispatch = createEventDispatcher();

  let noteWidth = 20;
  let notesForDisplay = [];

  let pianoRoll;
  let noteArea;

  onMount(() => {
    audioManager.audioContext.resume();

    if ($selectedClip?.midiData) {
      notesForDisplay = extractNoteEvents($selectedClip.midiData);
      scrollToFirstNote(window.innerWidth / 2);
    }
  });

  function handleZoom(event) {
    if (event.shiftKey) {
      event.preventDefault();

      const oldZoomLevel = $zoomLevel;
      zoomByDelta(event.wheelDelta);

      const noteAreaRect = noteArea.getBoundingClientRect();
      const currentScroll = noteArea.scrollLeft;

      // Get the current position of the mouse relative to the note area
      const mouseX = event.clientX - noteAreaRect.left;

      // Calculate the zoom factor based on the old and new zoom levels
      const newZoomFactor = $zoomLevel / 100;
      const oldZoomFactor = oldZoomLevel / 100;
      const scaleFactor = newZoomFactor / oldZoomFactor;

      // Calculate the new scroll position to center the zoom on the mouse pointer
      // The formula accounts for the scaling transformation around the mouse cursor
      const newScroll = (currentScroll + mouseX) * scaleFactor - mouseX;

      // Update the note area's scroll position to the newly calculated position
      noteArea.scrollLeft = newScroll;
    }
  }

  function syncVerticalScroll(e) {
    if (e.target === pianoRoll) {
      noteArea.style.left = `-${e.target.scrollLeft}px`;
    } else {
      pianoRoll.scrollLeft = e.target.scrollLeft;
    }
  }

  function scrollToFirstNote(offset = 200) {
    if (notesForDisplay.length > 0) {
      const firstNoteTop = notePos(notesForDisplay[0]);
      const left = Math.max(0, firstNoteTop - offset);
      noteArea.style.left = `-${left}px`;
      pianoRoll.scrollLeft = left;
    }
  }

  function notePos(note) {
    return (127 - note.note) * noteWidth;
  }

  // Array to generate MIDI note numbers in reverse
  let notesArray = Array.from({ length: 128 }, (_, index) => 127 - index).reverse();

  let highlightedNote = "";
  let selectedNotes = [];
  let activeNotes = [];
  let previewInstrument = "supersaw";

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

  function findNoteBy(noteId) {
    return notesForDisplay.find((note) => note.uuid === noteId);
  }

  function handleKeyDown(event) {
    // Open debug menu with D
    if (event.key === "d") {
      debug = !debug;
    }
  }

  function isNoteInScale(noteNumber, scaleName) {
    let rootNote = 60; // Middle C as the root note
    let scaleNotes = scales[scaleName].map((interval) => (rootNote + interval) % 12);
    return scaleNotes.includes(noteNumber % 12);
  }

  let snapResolution = 1 / 16;
  $: beatWidth = $pixelsPerBeat;
  $: playHeadPosition = $timeToPixels($playbackState.currentTime);
</script>

<svelte:window on:keydown={handleKeyDown} />

<div
  style="--note-width: {noteWidth}px; --beat-width: {beatWidth}px; --snap-resolution: {snapResolution};"
  class="relative flex h-full min-h-0 flex-col p-2"
>
  <div class="absolute inset-0 flex min-h-0 flex-col">
    <div class="mb-2 flex h-8 flex-row items-center justify-between gap-6 bg-dark-600 px-2">
      <div class="flex w-10 items-center justify-center bg-dark-400 p-1">
        <span class="whitespace-nowrap font-mono text-xs font-medium">
          {highlightedNote || "-"}
        </span>
      </div>
      <div class="flex flex-row items-center gap-2">
        {#if $selectedClip}
          <CassetteTape class="text-accent-yellow/80" />
          <span class="whitespace-nowrap text-sm text-light">{$selectedClip?.name}</span>
          <span class="whitespace-nowrap text-sm text-light-soft">{$selectedClip?.duration?.toFixed(2)}s</span>
        {:else}
          <span class="whitespace-nowrap text-sm text-light-soft">No clip selected</span>
        {/if}
      </div>
      <div class="ml-auto flex flex-row items-center gap-2">
        <div class="flex flex-row items-center gap-1 rounded-sm bg-dark-400 px-1.5">
          <Keyboard class="text-accent-yellow/80" />
          <select
            bind:value={previewInstrument}
            class="bg-dark-400 py-0.5 pr-1 font-mono text-sm tracking-tight text-light"
          >
            {#each audioManager.instruments.keys() as instrument}
              <option value={instrument}>{instrument}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <div class="relative h-full flex-1 bg-dark-900">
      <div
        on:scroll={syncVerticalScroll}
        on:wheel={handleZoom}
        bind:this={noteArea}
        aria-hidden="true"
        class="note-area absolute inset-0 overflow-y-hidden overflow-x-scroll bg-dark-700/50"
      >
          <div class="note-lanes">
            {#each notesArray as noteNumber}
              <div
                class={classNames("note-lane", {
                  "black-key": isBlackKey(noteNumber),
                  "white-key": !isBlackKey(noteNumber),
                })}
              ></div>
            {/each}
          </div>
        <div class="note-area-inner">

          <!-- Notes -->
          {#each notesForDisplay as note (note.uuid)}
            <div
              aria-hidden="true"
              on:mouseenter={() => (highlightedNote = note.label)}
              class="note flex cursor-pointer select-none flex-row items-center justify-between"
              style="top: {$timeToPixels(note.start / 1000)}px; left: {notePos(note)}px; height: {$timeToPixels(
                note.duration / 1000,
              )}px; {note.color ? `background-color: ${note.color}` : ''}"
            >
              <div class="flex-1 truncate text-center">{note.label}</div>
            </div>
          {/each}
        </div>
      </div>
    </div>

    <div on:scroll={syncVerticalScroll} bind:this={pianoRoll} class="piano-roll w-full overflow-x-scroll bg-dark-900">
      <div class="piano select-none pb-2">
        {#each notesArray as noteNumber}
          <button
            class={classNames("note", {
              "black-key": isBlackKey(noteNumber),
              "white-key": !isBlackKey(noteNumber),
            })}
            on:mouseenter={() => (highlightedNote = noteLabel(noteNumber))}
            on:mouseup={() => stopNote(midiNoteToFrequency(noteNumber))}
            on:mouseleave={() => stopNote(midiNoteToFrequency(noteNumber))}
            on:mousedown={() => startNote(midiNoteToFrequency(noteNumber))}
          >
            <span class="note-name font-mono leading-none">
              {noteLabel(noteNumber)}
            </span>
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .piano-roll {
    height: 100px;
    display: flex;
    flex-direction: row;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .piano-roll::-webkit-scrollbar {
    display: none;
  }

  .note-lanes {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: row;
  }

  .note-lane {
    width: calc(var(--note-width));
  }

  .note-lane.white-key {
    background-color: white;
    opacity: 2%;
    border-top: 2px solid black;
  }

  .note-lane.black-key {
    /*visibility: hidden;*/
  }

  .piano {
    display: flex;
    justify-content: center;
    align-items: start;
    height: 100px;
    font-size: 11px;
  }

  .note {
    transition:
      opacity 150ms ease-in-out,
      transform 150ms ease-in-out;
  }

  .note.white-key:hover {
    z-index: 10;
  }

  .note.black-key:hover {
    z-index: 30;
  }

  .note.active {
    transform: scale(0.99);
  }

  .note:hover {
    opacity: 90%;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
  }

  .note.white-key {
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: end;
    flex-direction: column;
    height: 100%;
    width: var(--white-note-width);
    border-bottom-left-radius: 3px;
    border-bottom-right-radius: 3px;
    background-color: #fff;
    position: relative;
    color: black;
    border-left: calc(var(--note-spacing) / 2) solid rgba(0, 0, 0, 0.2);
    border-right: calc(var(--note-spacing) / 2) solid rgba(0, 0, 0, 0.2);
  }

  .note.white-key:last-child {
    border-right: 1px solid rgba(0, 0, 0, 0.2);
  }

  .note.black-key {
    display: flex;
    align-items: center;
    justify-content: end;
    flex-direction: column;
    height: 60%;
    width: var(--black-note-width);
    background-color: #000;
    position: relative;
    padding-right: var(--note-spacing);
    padding-left: var(--note-spacing);
    left: calc((var(--black-note-width) / 2) - var(--note-spacing));
    margin-left: calc(var(--black-note-width) * -1);
    z-index: 40;
    color: white;
    border-bottom-left-radius: 2px;
    border-bottom-right-radius: 2px;
    font-size: 0.9em;
  }

  /*noinspection ALL*/
  .note-area-inner {
    position: relative;
  }

  .note-area {
    background: repeating-linear-gradient(
        to bottom,
        hsl(0, 0%, 100%, 10%),
        hsl(0, 0%, 100%, 10%) 1px,
        transparent 1px,
        transparent calc(var(--beat-width) / 4) /* BEAT  ( 1/4 bar) */
      ),
      repeating-linear-gradient(
        to bottom,
        hsl(60, 100%, 50%, 20%),
        hsl(60, 100%, 50%, 20%) 1px,
        transparent 1px,
        transparent calc(var(--beat-width)) /* BAR */
      ),
      repeating-linear-gradient(
        to bottom,
        hsl(0, 0%, 100%, 5%),
        hsl(0, 0%, 100%, 5%) 1px,
        transparent 1px,
        transparent calc(var(--beat-width) * var(--snap-resolution)) /* SNAP */
      );
    background-attachment: local;
    background-repeat: no-repeat;
    background-size: 100% 200%;
    background-position: left calc(-1 * var(--note-width) * 4);
  }

  .note {
    position: absolute;
    background: hsl(60, 100%, 80%);
    color: hsl(0, 0%, 0%, 80%);
    font-size: 8px;
    width: var(--note-width);
    border-radius: 2px;
    font-weight: 500;
    border: 0.5px solid hsl(0, 0%, 0%, 20%);
  }
</style>
