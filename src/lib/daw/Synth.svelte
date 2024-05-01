<!-- SynthModal.svelte -->
<script>
  import Modal from "../ui/Modal.svelte";
  import { audioManager } from "../../core/audio.js";

  export let modal;

  const waveformTypes = ["sine", "square", "sawtooth", "triangle"];

  let volume = 0.8;
  let attack = 0.01; // Quick attack
  let decay = 0.3; // Short decay
  let sustain = 0.1; // Low sustain
  let release = 0.5; // Long release
  let selectedWaveform = "sine"; // Sine wave often gives a more bell-like tone

  let oscillator;
  let gainNode;

  const frequencies = {
    "C#2": 65.41,
    "D2": 73.42,
    "D#2": 77.78,
    "E2": 82.41,
    "F2": 87.31,
    "F#2": 92.5,
    "G2": 98.04,
    "G#2": 103.83,
    "A2": 110.0,
    "A#2": 115.14,
    "B2": 123.47,
    "C3": 130.81,
    "C#3": 138.59,
    "D3": 146.83,
    "D#3": 155.56,
    "E3": 164.81,
    "F3": 174.61,
    "F#3": 185.0,
    "G3": 196.0,
    "G#3": 207.65,
    "A3": 220.0,
    "A#3": 233.08,
    "B3": 246.94,
    "C4": 261.63,
    "C#4": 277.18,
    "D4": 293.66,
    "D#4": 311.13,
    "E4": 329.63,
    "F4": 349.23,
    "F#4": 369.99,
    "G4": 392.0,
    "G#4": 415.3,
    "A4": 440.0,
    "A#4": 466.16,
    "B4": 493.88,
    "C5": 523.25,
    "C5#": 554.37,
    "D5": 587.33,
    "D#5": 622.25,
    "E5": 659.26,
    "F5": 698.46,
    "F#5": 739.99,
    "G5": 783.99,
    "G#5": 831.83,
    "A5": 880.0,
    "A#5": 932.33,
    "B5": 987.77,
    "C6": 1046.5,
    "C#6": 1108.73,
    "D6": 1174.66,
    "D#6": 1244.51,
  };

  function startNote(hz) {
    audioManager.audioContext.resume();

    gainNode = audioManager.audioContext.createGain();
    oscillator = audioManager.audioContext.createOscillator();

    oscillator.type = selectedWaveform;
    oscillator.frequency.value = hz; // Frequency in Hz
    oscillator.connect(gainNode);
    gainNode.connect(audioManager.audioContext.destination);

    const now = audioManager.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.00001, now);
    gainNode.gain.exponentialRampToValueAtTime(volume, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(sustain, now + attack + decay);

    oscillator.start();
  }

  function stopNote() {
    audioManager.audioContext.resume();
    const now = audioManager.audioContext.currentTime;
    gainNode.gain.exponentialRampToValueAtTime(0.00001, now + release);

    setTimeout(() => {
      oscillator.stop();
      gainNode.disconnect();
      oscillator.disconnect();
      oscillator = null;
      gainNode = null;
    }, release * 1000); // Stop after the release phase has completed
  }
</script>

<Modal bind:dialog={modal}>
  <h2 slot="header" class="font-sans font-semibold">Silenth2</h2>

  <div>
    <div class="grid grid-cols-3 gap-6">
      <div class="flex flex-col gap-3">
        <div class=" rounded-xl border-dark-100 bg-dark-400 p-2">
          <label for="waveform">Waveform:</label>
          <select bind:value={selectedWaveform} class="bg-dark-200">
            {#each waveformTypes as type}
              <option value={type}>{type}</option>
            {/each}
          </select>
        </div>
        <div class="rounded-xl border-dark-100 bg-dark-400 p-2">
          <label for="volume">Volume:</label>
          <input type="range" min="0" max="1" step="0.01" bind:value={volume} />
        </div>
      </div>
      <div class="col-span-2">
        <div class="rounded-xl border border-accent-yellow/50 bg-accent-yellow/10 p-2">
          <label>ADSR Envelope</label>
          <div>
            <div class="flex flex-row justify-between">
              <span>Attack</span>
              <span>{attack}s</span>
            </div>
            <input type="range" min="0" max="1" step="0.01" bind:value={attack} title="Attack" />
          </div>
          <div>
            <div class="flex flex-row justify-between">
              <span>Decay</span>
              <span>{decay}s</span>
            </div>
            <input type="range" min="0" max="1" step="0.01" bind:value={decay} title="Decay" />
          </div>
          <div>
            <div class="flex flex-row justify-between">
              <span>Sustain</span>
              <span>{sustain}s</span>
            </div>
            <input type="range" min="0" max="1" step="0.01" bind:value={sustain} title="Sustain" />
          </div>
          <div>
            <div class="flex flex-row justify-between">
              <span>Release</span>
              <span>{release}s</span>
            </div>
            <input type="range" min="0" max="1" step="0.01" bind:value={release} title="Release" />
          </div>
        </div>
      </div>
      <div class="col-span-full bg-blue-900 p-4">
        <div class="piano">
          {#each Object.entries(frequencies) as [note, hz]}
            <button
              class={note.includes("#") ? "black-key" : "white-key"}
              on:mouseup={stopNote}
              on:mousedown={() => startNote(hz)}
            >
              <span class="note">{note}</span>
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

  .white-key {
    display: flex;
    align-items: end;
    justify-content: center;
    height: 100%;
    width: 25px;
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
    width: 15px;
    background-color: #000;
    position: relative;
    left: 5px;
    margin-left: -15px;

    z-index: 2;
    color: white;
  }

  .note {
  }

  label {
    display: block;
    color: var(--accent-yellow);
    background: linear-gradient(0, var(--dark-900), var(--dark-600));
    border: 1px solid var(--dark-100);
    padding: 5px 10px;
    border-radius: 8px;
    margin-bottom: 10px;
  }

  select {
    padding: 5px 10px;
    border-radius: 8px;
    border: 1px solid var(--dark-100);
    background: linear-gradient(0, var(--dark-900), var(--dark-600));
    color: var(--accent-yellow);
  }

  select,
  input[type="range"] {
    width: 100%;
  }
</style>
