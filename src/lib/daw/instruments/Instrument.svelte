<script>
  import { audioManager } from "../../../core/audio.js";
  import Modal from "../../ui/Modal.svelte";
  import { onMount } from "svelte";
  import { frequencies } from "../../../core/midi.js";
  import { Fan } from "phosphor-svelte";
  import classNames from "classnames";

  export let modal;

  let activeInstrument;
  let selectedInstrument;

  // Key mapping
  //  W E   T Y U   O = Black keys starting from C#3
  // A S D F G H J K L = White keys starting from c3
  // -------------------
  // z - lower octave -1
  // x - higher octave +1

  let activeNotes = [];

  let currentKeyboardOctave = 3; // C3 - C4
  let keyMapsForOctave = [
    "KeyA",
    "KeyW",
    "KeyS",
    "KeyE",
    "KeyD",
    "KeyF",
    "KeyT",
    "KeyG",
    "KeyY",
    "KeyH",
    "KeyU",
    "KeyJ",
  ];

  const keysMappedToNotes = {
    KeyA: "C3",
    KeyW: "C#3",
    KeyS: "D3",
    KeyE: "D#3",
    KeyD: "E3",
    KeyF: "F3",
    KeyT: "F#3",
    KeyG: "G3",
    KeyY: "G#3",
    KeyH: "A3",
    KeyU: "A#3",
    KeyJ: "B3",
    KeyK: "C4",
  };

  const getKeyboardKeyForNote = (note) => {
    return keyMapsForOctave[Object.keys(frequencies).indexOf(note)];
  };

  const reverseMapping = {
    "C3": "A",
    "C#3": "W",
    "D3": "S",
    "D#3": "E",
    "E3": "D",
    "F3": "F",
    "F#3": "T",
    "G3": "G",
    "G#3": "Y",
    "A3": "H",
    "A#3": "U",
    "B3": "J",
    "C4": "K",
  };

  onMount(() => {
    audioManager.audioContext.resume();

    changeInstrument("supersaw");

    modal.addEventListener("keydown", handleKeyboardDown);
    modal.addEventListener("keyup", handleKeyboardUp);

    return () => {
      modal.removeEventListener("keydown", handleKeyboardDown);
      modal.removeEventListener("keyup", handleKeyboardUp);
    };
  });

  function changeInstrument(instrument) {
    activeInstrument = audioManager.getInstrument(instrument);
    selectedInstrument = instrument;
  }

  function startNote(hz, note) {
    audioManager.audioContext.resume();
    activeInstrument.startNote(hz);
    activeNotes = [...activeNotes, note];
  }

  function stopNote(hz, note) {
    audioManager.audioContext.resume();
    activeInstrument.stopNote(hz);
    activeNotes = activeNotes.filter((n) => n !== note);
  }

  function handleKeyboardDown(event) {
    if (event.code === "KeyZ") {
      currentKeyboardOctave = Math.max(0, currentKeyboardOctave - 1);
      return;
    }

    if (event.code === "KeyX") {
      currentKeyboardOctave = Math.min(8, currentKeyboardOctave + 1);
      return;
    }

    let correspondingNote = keysMappedToNotes[event.code];
    let hz = frequencies[correspondingNote] ?? null;

    // Dont re-trigger note when repeat is true
    if (hz && event.repeat === false) {
      startNote(hz, correspondingNote);
    }
  }

  function handleKeyboardUp(event) {
    let correspondingNote = keysMappedToNotes[event.code];
    let hz = frequencies[correspondingNote] ?? null;

    // Dont re-trigger note when repeat is true
    if (hz && event.repeat === false) {
      stopNote(hz, correspondingNote);
    }
  }
</script>

<Modal bind:dialog={modal}>
  <h2 slot="header">Instrument</h2>

  <div class="instrument rounded-lg border border-dark-900 bg-dark-400 p-6 pt-4">
    <div class="flex flex-col gap-3">
      <div class="flex h-6 flex-row items-center justify-between gap-3">
        <div class="mr-auto">
          <select
            bind:value={selectedInstrument}
            on:change={(e) => changeInstrument(e.target.value)}
            class="w-20 appearance-none rounded bg-dark-600 p-1 px-2 font-mono text-xs text-white"
          >
            {#each audioManager.instruments.keys() as instrument}
              <option value={instrument}>{instrument}</option>
            {/each}
          </select>
        </div>

        <div class="flex h-full w-full flex-row items-center gap-1 rounded-md bg-dark-200 p-1 px-1.5 font-mono text-xs">
          {#each activeNotes as note}
            <div class="inline-block rounded bg-white/80 px-1 py-0.5 text-center text-[10px] leading-none text-[black]">
              {note}
            </div>
          {/each}
        </div>

        <div
          class="flex select-none items-center justify-center gap-1 whitespace-nowrap text-sm font-medium uppercase leading-none tracking-widest text-white"
        >
          <Fan size="16" class="text-accent-yellow" />
          <span class="tabular-nums">AirWAVE-0{currentKeyboardOctave}</span>
        </div>
      </div>

      <div class=" rounded-lg border border-accent-yellow bg-black p-2">
        <div class="piano select-none">
          {#each Object.entries(frequencies) as [note, hz]}
            <button
              class={classNames("note", {
                "black-key": note.includes("#"),
                "white-key": !note.includes("#"),
                "active !bg-accent-yellow": activeNotes.includes(note),
              })}
              on:mouseup={() => stopNote(hz, note)}
              on:mouseleave={() => stopNote(hz, note)}
              on:mousedown={() => startNote(hz, note)}
            >
              {#if reverseMapping[note]}
                <div class="key-name">
                  <span>{reverseMapping[note] ?? ""}</span>
                </div>
              {/if}
              <span class="note-name">
                {note}
              </span>
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
</Modal>

<style>
  /*
          todo  fix this comment indenting weirdly when formatting.

                Z-INDEX ORDER:

                - 10 - White hovered/active keys (z-index: 10)
                - 20 - White keys (z-index: 20)
                - 30 - Black hovered/active keys (z-index: 30)
                - 40 - Black keys (z-index: 40)
              */

  .instrument {
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

  .key-name {
    color: black;
    background: greenyellow;
    border-radius: 12px;
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    width: calc(var(--black-note-width) * 0.8);
    height: calc(var(--black-note-width) * 0.8);
  }

  .piano .note {
    transition:
      opacity 150ms ease-in-out,
      transform 150ms ease-in-out;
  }

  .piano .note.white-key:hover {
    z-index: 10;
  }

  .piano .note.black-key:hover {
    z-index: 30;
  }

  .piano .note.active {
    transform: scale(0.99);
  }

  .piano .note:hover {
    opacity: 90%;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15);
  }

  .white-key {
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

  .white-key:last-child {
    border-right: 1px solid rgba(0, 0, 0, 0.2);
  }

  .black-key {
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
</style>
