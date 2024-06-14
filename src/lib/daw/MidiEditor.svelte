<script>
  import { createEventDispatcher, onMount } from "svelte";
  import { audioManager } from "../../core/audio.js";
  import {
    pixelsPerBeat,
    pixelsToTime,
    playbackState,
    selectedClip,
    timeToPixels,
    zoomByDelta,
    zoomLevel,
  } from "../../core/store.js";
  import { extractNoteEvents, isBlackKey, midiNoteToFrequency, noteLabel } from "../../core/midi.js";
  import { CassetteTape, Eraser, Keyboard, PaintBucket, Pencil } from "phosphor-svelte";

  const dispatch = createEventDispatcher();

  let noteHeight = 20;
  let notesForDisplay = [];

  let pianoRoll;
  let noteArea;

  onMount(() => {
    audioManager.audioContext.resume();

    if ($selectedClip?.midiData) {
      notesForDisplay = extractNoteEvents($selectedClip.midiData);
      scrollToFirstNote();
    }
  });

  function handleZoom(event) {
    if (event.shiftKey) {
      event.preventDefault();

      const oldZoomLevel = $zoomLevel;
      zoomByDelta(event.deltaY);

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
      noteArea.scrollTop = e.target.scrollTop;
    } else {
      pianoRoll.scrollTop = e.target.scrollTop;
    }
  }

  function handleNoteClick(event, noteId) {
    if (isResizing) return;
    if (isDragging) return;

    // Select multiple notes with shift key
    if (event.shiftKey) {
      if (selectedNotes.includes(noteId)) {
        selectedNotes = selectedNotes.map((selected) => {
          if (selected.uuid !== noteId) {
            return selected.uuid;
          }
        });
      } else {
        selectedNotes = [...selectedNotes, noteId];
      }
      return;
    }

    // Select single note
    selectedNotes.includes(noteId) ? (selectedNotes = []) : (selectedNotes = [noteId]);
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
        uuid: crypto.randomUUID(),
        start: $pixelsToTime(x) * 1000,
        label: noteLabel(note),
        duration: 100,
        note: note,
        velocity: 100,
      },
    ];
  }

  function scrollToFirstNote() {
    if (notesForDisplay.length > 0) {
      const offset = 200; // Padding from the top, eyeballed value.
      const firstNoteTop = calculateNoteTopPosition(notesForDisplay[0]);
      noteArea.scrollTop = Math.max(0, firstNoteTop - offset);
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

  let snapToGrid = true;
  let snapThreshold = 5;
  let snapResolution = 1 / 16;
  let snaps = [
    { label: "1/4 beat", value: 1 / 16 }, // Quarter of a beat, 1/16 of a bar
    { label: "1/8 beat", value: 1 / 32 }, // Eighth of a beat, 1/32 of a bar
    { label: "1/16 beat", value: 1 / 64 }, // Sixteenth of a beat, 1/64 of a bar
    { label: "1/32 beat", value: 1 / 128 }, // Thirty-second of a beat, 1/128 of a bar
  ];

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
      notesForDisplay = notesForDisplay.filter((note) => !selectedNotes.includes(note.uuid));
    }

    if (event.key === "d") {
      debug = !debug;
    }
  }

  let isResizing = false;
  let isDragging = false;
  let draggedNote;
  let resizedNote;

  // How much we must offset the note position for it to align with the
  // mouse cursor position within the note, when dragging
  let noteGrabPositionOffset;

  // Threshold in pixels to move before dragging starts
  let dragThreshold = 5;

  let initialX, initialY;

  function updateNoteById(id, update) {
    notesForDisplay = notesForDisplay.map((note) => {
      if (note.uuid === id) {
        return update(note);
      }

      return note;
    });
  }

  function handleMouseMove(event) {
    const noteAreaRect = noteArea.getBoundingClientRect();
    const localX = event.clientX - noteAreaRect.left + noteArea.scrollLeft - noteGrabPositionOffset;
    const totalX = Math.abs(event.clientX - initialX);

    if (!isDragging && totalX > dragThreshold) {
      isDragging = true; // Only set isDragging to true if moved beyond threshold
    }

    if (isDragging) {
      updateNoteById(draggedNote, (note) => {
        let newStartTime = Math.max(0, $pixelsToTime(localX) * 1000);

        if (snapToGrid && event.shiftKey === false) {
          const timePerSnapMs = $pixelsToTime(beatWidth * snapResolution) * 1000; // Convert pixels per snap to milliseconds
          newStartTime = Math.round(newStartTime / timePerSnapMs) * timePerSnapMs;
        }

        return {
          ...note,
          start: newStartTime,
        };
      });
    }
  }

  function handleMouseUp(event) {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);

    requestAnimationFrame(() => {
      isDragging = false;
      draggedNote = null;
      initialX = null;
      initialY = null;
    });
  }

  function handleMouseDown(event, noteId) {
    initialX = event.clientX;
    initialY = event.clientY;
    draggedNote = noteId;

    const noteRect = event.currentTarget.getBoundingClientRect();
    noteGrabPositionOffset = initialX - noteRect.left;

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }

  let resizeStartX, resizeStartWidth;

  function handleResizeMouseDown(event, noteId) {
    event.stopPropagation();

    isDragging = false;
    isResizing = true;

    resizedNote = noteId;

    resizeStartX = event.clientX;
    resizeStartWidth = event.currentTarget.parentElement.offsetWidth;

    document.addEventListener("mousemove", (e) => handleResizeMouseMove(e));
    document.addEventListener("mouseup", (e) => handleResizeMouseUp(e));
  }

  function handleResizeMouseMove(event) {
    const deltaX = event.clientX - resizeStartX;
    const newWidth = resizeStartWidth + deltaX;
    const noteAreaRect = noteArea.getBoundingClientRect();

    if (isResizing) {
      updateNoteById(resizedNote, (note) => {
        // Convert the width in pixels to time (milliseconds)
        let newDurationMs = $pixelsToTime(newWidth) * 1000;

        // Snap the new duration to the nearest grid point if snapping is enabled
        if (snapToGrid && event.shiftKey === false) {
          const pixelsPerSnap = beatWidth * snapResolution; // Calculate the number of pixels per snap point
          const timePerSnapMs = $pixelsToTime(pixelsPerSnap) * 1000; // Convert pixels per snap to milliseconds

          // Calculate new snapped duration
          newDurationMs = Math.round(newDurationMs / timePerSnapMs) * timePerSnapMs;
        }

        return {
          ...note,
          duration: newDurationMs,
        };
      });
    }
  }

  function handleResizeMouseUp(event) {
    document.removeEventListener("mousemove", handleResizeMouseMove);
    document.removeEventListener("mouseup", handleResizeMouseUp);

    requestAnimationFrame(() => {
      isResizing = false;
    });
  }

  $: beatWidth = $pixelsPerBeat;
  $: playHeadPosition = $timeToPixels($playbackState.currentTime);
</script>

<svelte:window on:keydown={handleKeyDown} />

<div
  style="--note-height: {noteHeight}px; --beat-width: {beatWidth}px; --snap-resolution: {snapResolution};"
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
          {#if $selectedClip}
            <CassetteTape class="text-accent-yellow/80" />
            <span class="text-sm text-light">{$selectedClip?.name}</span>
            <span class="text-sm text-light-soft">{$selectedClip?.duration.toFixed(2)}s</span>
          {:else}
            <span>No clip selected</span>
          {/if}
        </div>
        <div class="ml-auto flex flex-row items-center gap-2">
          <div class="flex flex-row items-center gap-1 rounded-sm bg-dark-400 px-2">
            <button
              on:click={() => (snapToGrid = !snapToGrid)}
              class="py-0.5 text-xs {snapToGrid ? 'text-accent-yellow' : 'text-light-soft'}"
            >
              Snap
            </button>
            <select bind:value={snapResolution} class="bg-dark-400 py-0.5 font-mono text-sm tracking-tight text-light">
              {#each snaps as snap}
                <option value={snap.value}>{snap.label}</option>
              {/each}
            </select>
          </div>

          <div class="flex flex-row items-center gap-1 rounded-sm bg-dark-400 px-2 py-0.5">
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
          {#each notesForDisplay as note (note.uuid)}
            <div
              aria-hidden="true"
              on:click|stopPropagation={(event) => handleNoteClick(event, note.uuid)}
              on:mouseenter={() => (highlightedNote = note.label)}
              on:mousedown={(event) => handleMouseDown(event, note.uuid)}
              class:selected={selectedNotes.includes(note.uuid)}
              class:dragged={isDragging && draggedNote === note.uuid}
              class="note flex cursor-pointer select-none flex-row items-center justify-between"
              style="left: {$timeToPixels(note.start / 1000)}px; top: {calculateNoteTopPosition(
                note,
              )}px; width: {$timeToPixels(note.duration / 1000)}px;"
            >
              <div class="flex-1 truncate text-center">{note.label}</div>
              <div
                aria-hidden="true"
                on:mousedown={(event) => handleResizeMouseDown(event, note.uuid)}
                class="resize-handle"
              ></div>
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
        to right,
        hsl(0, 0%, 100%, 10%),
        hsl(0, 0%, 100%, 10%) 1px,
        transparent 1px,
        transparent calc(var(--beat-width) / 4) /* BEAT  ( 1/4 bar) */
      ),
      repeating-linear-gradient(
        to right,
        hsl(60, 100%, 50%, 20%),
        hsl(60, 100%, 50%, 20%) 1px,
        transparent 1px,
        transparent calc(var(--beat-width)) /* BAR */
      ),
      repeating-linear-gradient(
        to right,
        hsl(0, 0%, 100%, 5%),
        hsl(0, 0%, 100%, 5%) 1px,
        transparent 1px,
        transparent calc(var(--beat-width) * var(--snap-resolution)) /* SNAP */
      );
    background-attachment: local;
    background-repeat: no-repeat;
    background-size: 100% 200%;
    background-position: left calc(-1 * var(--note-height) * 4);
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
    border: 0.5px solid hsl(0, 0%, 0%, 50%);
    border-radius: 2px;
    padding-left: 4px;
    font-weight: 500;
  }

  .note .resize-handle {
    width: 4px;
    height: 100%;
    display: inline-block;
    cursor: col-resize;
    background-color: transparent;
  }

  .note.selected {
    background: rgb(153, 194, 255);
  }

  .note.dragged {
    /*background: hsl(60, 100%, 90%);*/
    filter: grayscale(1) opacity(0.5);
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
