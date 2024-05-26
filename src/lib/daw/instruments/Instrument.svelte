<script>
  import { audioManager } from "../../../core/audio.js";
  import Modal from "../../ui/Modal.svelte";
  import { onMount } from "svelte";
  import { frequencies } from "../../../core/midi.js";

  export let modal;

  let activeInstrument;
  let selectedInstrument = "synth";

  onMount(() => {
    audioManager.audioContext.resume();

    changeInstrument("synth");
  });

  function changeInstrument(instrument) {
    activeInstrument = audioManager.getInstrument(instrument);
  }

  function startNote(hz, note) {
    audioManager.audioContext.resume();

    activeInstrument.startNote(hz);
  }

  function stopNote(hz, note) {
    audioManager.audioContext.resume();

    activeInstrument.stopNote(hz);
  }
</script>

<Modal bind:dialog={modal}>
  <h2 slot="header">Instrument</h2>

  <div class="rounded-lg border border-dark-900 bg-[#181C1D] p-6 pt-4">
    <div class="grid grid-cols-3 gap-3">
      <div class="grid grid-cols-2 gap-3">
        <select
          bind:value={selectedInstrument}
          on:change={(e) => changeInstrument(e.target.value)}
          class="mt-1 w-full appearance-none rounded bg-black-200 p-1 px-2 text-xs"
        >
          {#each audioManager.instruments.keys() as instrument}
            <option value={instrument}>{instrument}</option>
          {/each}
        </select>
      </div>

      <div class="col-span-full rounded-lg border border-black-200 bg-black-300 p-2">
        <div class="piano">
          {#each Object.entries(frequencies) as [note, hz]}
            <button
              class="note {note.includes('#') ? 'black-key' : 'white-key'}"
              on:mouseup={() => stopNote(hz, note)}
              on:mouseleave={() => stopNote(hz, note)}
              on:mousedown={() => startNote(hz, note)}
            >
              <span class="note-name">{note}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
</Modal>

<style>
  .piano {
    display: flex;
    justify-content: center;
    align-items: start;
    height: 100px;
    font-size: 10px;
  }

  .piano .note:hover {
    opacity: 90%;
    transition: all 250ms ease-out;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
  }

  .white-key {
    display: flex;
    align-items: end;
    justify-content: center;
    height: 100%;
    width: 35px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-right: none;
    border-radius: 2px;
    background-color: #fff;
    position: relative;
    color: black;
  }

  .white-key:last-child {
    border-right: 1px solid rgba(0, 0, 0, 0.2);
  }

  .black-key {
    display: flex;
    align-items: end;
    justify-content: center;
    height: 60%;
    width: 20px;
    background-color: #000;
    position: relative;
    left: 10px;
    margin-left: -20px;

    z-index: 2;
    color: white;
  }
</style>
