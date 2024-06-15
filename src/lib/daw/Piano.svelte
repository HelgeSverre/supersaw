<script>
  import classNames from "classnames";
  import { isBlackKey, noteLabel, noteOctave } from "../../core/midi.js";
  import { createEventDispatcher, onMount } from "svelte";
  import { Kanban } from "lucide-svelte";
  import { Hash, NoteBlank } from "phosphor-svelte";

  export let activeNotes = [];
  export let markedNotes = [];
  export let midPoint = 60;
  export let octaves = 3;

  let showMarkedNotes = true;
  let showNumbers = false;
  let showLabels = true;

  const dispatch = createEventDispatcher();

  let notes = [];

  onMount(() => {
    const leftHalf = (12 * octaves) / 2;
    const rightHalf = leftHalf - 1;

    notes = [
      ...Array.from({ length: leftHalf }, (_, index) => midPoint - index).reverse(),
      ...Array.from({ length: rightHalf }, (_, index) => midPoint + index + 1),
    ].filter((note) => 0 < note && note < 128);

    console.log(notes);
  });

  let notesArray = Array.from({ length: 128 }, (_, index) => index).filter(
    (note) => noteOctave(note) < octaves + 1 && noteOctave(note) > -1,
  );

  function startNote(note) {
    dispatch("noteOn", { note });
    activeNotes = [...activeNotes, note];
  }

  function stopNote(note) {
    dispatch("noteOff", { note });
    activeNotes = activeNotes.filter((n) => n !== note);
  }
</script>

<div class=" rounded-lg border border-dark-900 bg-dark-400 p-6 pt-4">
  <div class="flex flex-col gap-3">
    <div class="flex h-6 flex-row items-center justify-between gap-3">
      <div
        class="flex select-none items-center justify-center gap-1 whitespace-nowrap text-sm font-medium uppercase leading-none tracking-widest text-white"
      >
        <Kanban size="16" class="text-accent-yellow" />
        <span class="text-light">Piano</span>
      </div>
      <div class="flex h-full w-full flex-row items-center gap-1 rounded-md bg-dark-200 p-1 px-1.5 font-mono text-xs">
        {#each activeNotes as note}
          <div class="inline-block rounded bg-white/80 px-1 py-0.5 text-center text-[10px] leading-none text-[black]">
            {noteLabel(note)}
          </div>
        {/each}
      </div>
      <div
        class="-ml-1 flex select-none items-center justify-center gap-1 whitespace-nowrap text-sm font-medium uppercase leading-none tracking-widest text-white"
      >
        <button
          title="Show MIDI Note Numbers"
          class="rounded-md p-1 {showNumbers ? 'bg-dark-200' : ''}"
          on:click={() => (showNumbers = !showNumbers)}
        >
          <Hash size="16" class="text-accent-yellow" />
        </button>

        {#if markedNotes.length}
          <button
            title="Show Marked Notes"
            class="rounded-md p-1 {showMarkedNotes ? 'bg-dark-200' : ''}"
            on:click={() => (showMarkedNotes = !showMarkedNotes)}
          >
            <NoteBlank size="16" class="text-accent-yellow" />
          </button>
        {/if}
      </div>
    </div>

    <div class=" rounded-lg border border-accent-yellow bg-black p-2">
      <div class="piano select-none">
        {#each notes as noteNumber}
          <button
            class={classNames("note", {
              "black-key": isBlackKey(noteNumber),
              "white-key": !isBlackKey(noteNumber),
              "midpoint": noteNumber === midPoint,
              "active !bg-accent-yellow": activeNotes.includes(noteNumber),
            })}
            on:mouseup={() => stopNote(noteNumber)}
            on:mouseleave={() => stopNote(noteNumber)}
            on:mousedown={() => startNote(noteNumber)}
          >
            {#if showMarkedNotes && markedNotes.includes(noteNumber)}
              <div class="note-mark"></div>
            {/if}

            {#if showNumbers}
              <span class="note-number font-mono leading-none">
                {noteNumber}
              </span>
            {/if}

            {#if showLabels}
              <span class="note-name font-mono leading-none">
                {noteLabel(noteNumber)}
              </span>
            {/if}
          </button>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  :root {
    --white-note-width: 35px;
    --black-note-width: 20px;
    --note-spacing: 1px;
  }

  .piano {
    display: flex;
    justify-content: center;
    align-items: start;
    height: 100px;
    font-size: 10px;
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

  .note-mark {
    background: greenyellow;
    border-radius: 100%;
    display: block;
    width: calc(var(--black-note-width) * 0.6);
    height: calc(var(--black-note-width) * 0.6);
    margin-bottom: 8px;
  }

  .note-number {
    background: rgb(173, 255, 47);
    color: black;
    font-weight: bold;
    padding: 3px;
    border-radius: 4px;
    opacity: 80%;
    margin-bottom: 4px;
  }

  .note-name {
    color: black;
    margin-bottom: 4px;
  }

  .note.black-key .note-name {
    color: white;
  }
</style>
