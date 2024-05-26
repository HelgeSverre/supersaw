<script>
  import { audioManager } from "../../../core/audio.js";

  const frequencies = {
    "C2": 65.41,
    "C#2": 69.3,
    "D2": 73.42,
    "D#2": 77.78,
    "E2": 82.41,
    "F2": 87.31,
    "F#2": 92.5,
    "G2": 98.0,
    "G#2": 103.83,
    "A2": 110.0,
    "A#2": 116.54,
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
    "C#5": 554.37,
    "D5": 587.33,
    "D#5": 622.25,
    "E5": 659.25,
    "F5": 698.46,
    "F#5": 739.99,
    "G5": 783.99,
    "G#5": 830.61,
    "A5": 880.0,
    "A#5": 932.33,
    "B5": 987.77,
    "C6": 1046.5,
    "C#6": 1108.73,
    "D6": 1174.66,
    "D#6": 1244.51,
    "E6": 1318.51,
  };

  const waveformTypes = ["sine", "square", "sawtooth", "triangle"];

  let volume = 0.8;
  let attack = 0.01;
  let decay = 0.5;
  let sustain = 0.2;
  let release = 0.8;
  let highPassFrequency = 0;
  let selectedWaveform = "sawtooth";
  let activeNotes = {};

  let detune = 10;

  function startNote(hz, note) {
    audioManager.audioContext.resume();

    let gainNode = audioManager.audioContext.createGain();
    gainNode.connect(audioManager.mixer); // Ensure gainNode is connected before the oscillators start.

    // Create the high-pass filter
    let highPassFilter = audioManager.audioContext.createBiquadFilter();
    highPassFilter.type = "highpass";
    highPassFilter.frequency.value = highPassFrequency; // Set the cutoff frequency
    highPassFilter.connect(gainNode); // Connect filter to gain node

    let oscillators = Array.from({ length: 4 }, () => {
      let oscillator = audioManager.audioContext.createOscillator();
      oscillator.type = selectedWaveform;
      oscillator.frequency.value = hz;
      oscillator.connect(highPassFilter);
      return oscillator;
    });

    oscillators.forEach((oscillator, index) => {
      oscillator.detune.value = (index - 3) * detune;
    });

    const now = audioManager.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.00001, now);
    gainNode.gain.exponentialRampToValueAtTime(volume, now + attack);
    gainNode.gain.exponentialRampToValueAtTime(sustain * volume, now + attack + decay);

    oscillators.forEach((oscillator) => oscillator.start());

    activeNotes[note] = { oscillators, gainNode };
  }

  function stopNote(note) {
    audioManager.audioContext.resume();

    if (activeNotes[note]) {
      const { oscillators, gainNode } = activeNotes[note];
      const now = audioManager.audioContext.currentTime;
      gainNode.gain.exponentialRampToValueAtTime(0.00001, now + release);

      setTimeout(() => {
        oscillators.forEach((oscillator) => {
          oscillator.stop();
          oscillator.disconnect();
        });
        gainNode.disconnect();
      }, release * 1000); // Stop after the release phase has completed

      delete activeNotes[note];
    }
  }

  export { startNote, stopNote };
</script>

<div class="rounded-xl bg-dark-300 p-2">
  <h2>DX77</h2>

  <div class="rounded-lg border border-dark-900 bg-[#181C1D] p-6 pt-4 shadow-xl shadow-accent-green/20">
    <div class="mb-2 flex w-full flex-row items-center justify-between">
      <p
        class="mb-2 inline-block rounded-md border-2 border-accent-green/20 p-1 font-mono text-lg font-black leading-none tracking-tight text-white/70"
      >
        DX77
      </p>
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div class="grid grid-cols-2 gap-3">
        <div class="rounded-lg border border-accent-green/20 bg-accent-green/5 p-2 shadow-lg shadow-accent-green/10">
          <div class="flex flex-row items-center justify-between text-xs">
            <span>Wave</span>
          </div>
          <select
            bind:value={selectedWaveform}
            class="mt-1 w-full appearance-none rounded bg-black-200 p-1 px-2 text-xs"
          >
            {#each waveformTypes as type}
              <option value={type}>{type}</option>
            {/each}
          </select>
        </div>
        <div class="rounded-lg border border-accent-green/20 bg-accent-green/5 p-2 shadow-lg shadow-accent-green/10">
          <div class="flex flex-row items-center justify-between text-xs">
            <span>Vol</span>
            <span>{volume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={volume}
            class="mt-1 w-full appearance-none rounded-full bg-black-200 text-sm accent-accent-green"
          />
        </div>

        <div>
          <div class="flex flex-row items-center justify-between text-xs">
            <span>Detune</span>
            <span>{detune}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            bind:value={detune}
            title="Detune"
            class="mt-1 w-full appearance-none rounded-full bg-black-200 text-sm accent-accent-green"
          />
        </div>
      </div>

      <div
        class="col-span-2 grid grid-cols-4 gap-6 rounded-lg border border-accent-green/20 bg-accent-green/5 p-2 shadow-lg shadow-accent-green/10"
      >
        <div>
          <div class="flex flex-row items-center justify-between text-xs">
            <span>Attack</span>
            <span>{attack}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={attack}
            title="Attack"
            class="mt-1 w-full appearance-none rounded-full bg-black-200 text-sm accent-accent-green"
          />
        </div>
        <div>
          <div class="flex flex-row items-center justify-between text-xs">
            <span>Decay</span>
            <span>{decay}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={decay}
            title="Decay"
            class="mt-1 w-full appearance-none rounded-full bg-black-200 text-sm accent-accent-green"
          />
        </div>
        <div>
          <div class="flex flex-row items-center justify-between text-xs">
            <span>Sustain</span>
            <span>{sustain * 100}</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            bind:value={sustain}
            title="Sustain"
            class="mt-1 w-full appearance-none rounded-full bg-black-200 text-sm accent-accent-green"
          />
        </div>
        <div>
          <div class="flex flex-row items-center justify-between text-xs">
            <span>Release</span>
            <span>{release}s</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.01"
            bind:value={release}
            title="Release"
            class="mt-1 w-full appearance-none rounded-full bg-black-200 text-sm accent-accent-green"
          />
        </div>
        <div>
          <div class="flex flex-row items-center justify-between text-xs">
            <span>HP</span>
            <span>{highPassFrequency}hz</span>
          </div>
          <input
            type="range"
            min="0"
            max="2200"
            step="1"
            bind:value={highPassFrequency}
            title="High Pass Filter Frequency"
            class="mt-1 w-full appearance-none rounded-full bg-black-200 text-sm accent-accent-green"
          />
        </div>
      </div>

      <div class="col-span-full rounded-lg border border-black-200 bg-black-300 p-2">
        <div class="piano">
          {#each Object.entries(frequencies) as [note, hz]}
            <button
              class="note {note.includes('#') ? 'black-key' : 'white-key'}"
              on:mouseup={() => stopNote(note)}
              on:mouseleave={() => stopNote(note)}
              on:mousedown={() => startNote(hz, note)}
            >
              <span class="note-name">{note}</span>
            </button>
          {/each}
        </div>
      </div>
    </div>
  </div>
</div>

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
