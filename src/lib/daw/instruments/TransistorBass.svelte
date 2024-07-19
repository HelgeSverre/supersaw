<script>
  import { onMount } from "svelte";
  import { audioManager } from "../../../core/audio.js";
  import Encoder from "../../ui/Encoder.svelte";
  import LED from "../../ui/LED.svelte";
  import { Sliders, SmileySticker, WaveSawtooth, WaveSquare, WaveTriangle } from "phosphor-svelte";
  import classNames from "classnames";

  let audioContext;
  let currentStep = 0;
  let isPlaying = false;
  let intervalId;
  let waveform = "sawtooth";
  let pattern = Array(16)
    .fill()
    .map((_, i) => ({
      frequency: 65.41,
      accent: false,
      transposeUp: false,
      transposeDown: false,
      glide: false,
      on: true,
    }));

  let cutoff = 1000; // Initial filter cutoff frequency
  let resonance = 10; // Initial filter resonance
  let volume = 0.9; // Initial volume
  let tempo = 90; // BPM
  let tuning = 0; // Detune amount
  let envMod = 0.5; // Envelope modulation depth
  let decay = 0.2; // Decay time
  let accentIntensity = 0.5; // Intensity of the accent
  let distortionAmount = 0;

  let oscillator, filter, envelope, distortion, gainNode;

  let selectedPattern;
  let elapsedPlayTime = 0;
  const patterns = [
    {
      name: "Pattern 1",
      tempo: 135,
      pattern: "F#-F#vag-F#vag-F#v-F#-F#a-F#a-F#-F#-F#^-x-x-F#^-F#^-F#a-F#",
    },
    {
      name: "Pattern 2",
      tempo: 135,
      pattern: "G-Gag-Gag-Gva-x-Gva-G-Gva-x-Ga-Ga-x-x-x-x-x",
    },
    {
      name: "Pattern 3",
      tempo: 135,
      pattern: "D#^ag-D#^ag-Bv-D#-D#^-D#^-x-x-F-F-Ca-A-F#a-F#a-Aa-Aa",
    },
  ];

  function parsePattern(patternString) {
    return patternString.split("-").map((step) => {
      let note = "C";
      let transposeUp = false;
      let transposeDown = false;
      let accent = false;
      let glide = false;
      let on = true;

      if (step === "x") {
        return { note, transposeUp, transposeDown, accent, glide, on: false };
      }

      note = step.match(/[A-G]#?/)[0];
      transposeUp = step.includes("^");
      transposeDown = step.includes("v");
      accent = step.includes("a");
      glide = step.includes("g");

      return { note, transposeUp, transposeDown, accent, glide, on };
    });
  }

  function noteToFrequency(note, transposeUp, transposeDown) {
    const noteToMidi = {
      "C": 60,
      "C#": 61,
      "D": 62,
      "D#": 63,
      "E": 64,
      "F": 65,
      "F#": 66,
      "G": 67,
      "G#": 68,
      "A": 69,
      "A#": 70,
      "B": 71,
    };

    let midiNote = noteToMidi[note] - 12; // Subtract 12 to get to octave 2

    if (transposeUp) midiNote += 12;
    if (transposeDown) midiNote -= 12;

    return 440 * Math.pow(2, (midiNote - 69) / 12);
  }

  function selectPresetPattern(index) {
    const selectedPattern = patterns[index];
    if (selectedPattern) {
      pattern = parsePattern(selectedPattern.pattern);
      tempo = selectedPattern.tempo;
    }
  }

  onMount(() => {
    audioContext = audioManager.audioContext;
    initAudioNodes();

    selectPresetPattern(2);
  });

  function initAudioNodes() {
    oscillator = audioContext.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(65.41, audioContext.currentTime); // Default frequency
    oscillator.start();

    filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, audioContext.currentTime);
    filter.Q.setValueAtTime(resonance, audioContext.currentTime);

    envelope = audioContext.createGain();
    envelope.gain.setValueAtTime(0, audioContext.currentTime); // Start muted

    gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);

    distortion = audioContext.createWaveShaper();
    distortion.curve = makeDistortionCurve(0); // 400 is a sample value for amount of distortion
    distortion.oversample = "4x"; // Higher quality of the distortion

    // Connect the audio nodes
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(distortion);
    distortion.connect(gainNode);
    gainNode.connect(audioManager.mixer);
  }

  function makeDistortionCurve(amount) {
    let n_samples = 44100 * 16,
      curve = new Float32Array(n_samples),
      deg = Math.PI / 180,
      i = 0,
      x;
    for (; i < n_samples; ++i) {
      x = (i * 2) / n_samples - 1;
      curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
    }
    return curve;
  }

  function playNote() {
    elapsedPlayTime += 60 / tempo / 4;

    let index = currentStep % pattern.length;
    const step = pattern[index];

    if (step.on) {
      let nextFrequency = noteToFrequency(step.note, step.transposeUp, step.transposeDown);

      if (step.glide && currentStep > 0) {
        oscillator.frequency.exponentialRampToValueAtTime(nextFrequency, audioContext.currentTime + 60 / tempo / 8);
      } else {
        oscillator.frequency.setValueAtTime(nextFrequency, audioContext.currentTime);
      }

      // Handle the decay envelope for both amplitude and filter cutoff
      let initialGain = step.accent ? 1.2 : 1;
      envelope.gain.cancelScheduledValues(audioContext.currentTime);
      envelope.gain.setValueAtTime(initialGain, audioContext.currentTime);
      envelope.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + decay);

      let modulatedCutoff = step.accent ? cutoff + envMod * 1000 : cutoff;
      filter.Q.setValueAtTime(resonance * (1 + accentIntensity), audioContext.currentTime);
      filter.frequency.setValueAtTime(modulatedCutoff, audioContext.currentTime);
      filter.frequency.exponentialRampToValueAtTime(cutoff, audioContext.currentTime + decay);
    } else {
      // If the note is off, create a rest by silencing the envelope
      envelope.gain.cancelScheduledValues(audioContext.currentTime);
      envelope.gain.setValueAtTime(0, audioContext.currentTime);
    }

    currentStep++;
  }

  function togglePlay() {
    isPlaying ? stopPattern() : playPattern();
  }

  function playPattern() {
    if (!isPlaying) {
      elapsedPlayTime = 0;
      isPlaying = true;
      intervalId = setInterval(playNote, 60000 / tempo / 4);
    }
  }

  function stopPattern() {
    if (isPlaying) {
      clearInterval(intervalId);
      isPlaying = false;
      envelope.gain.cancelScheduledValues(audioContext.currentTime);
      envelope.gain.setValueAtTime(envelope.gain.value, audioContext.currentTime);
      envelope.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.01);
    }
  }

  function clearPattern() {
    stopPattern();
    currentStep = 0;
    pattern = Array(16)
      .fill()
      .map((_, i) => ({
        note: "C",
        accent: false,
        transposeUp: false,
        transposeDown: false,
        glide: false,
        on: true,
      }));
  }

  function updateNote(index, newNote) {
    pattern[index].note = newNote;
    pattern[index].transposeUp = false;
    pattern[index].transposeDown = false;
  }

  function toggleTranspose(index, direction) {
    if (direction === "up") {
      pattern[index].transposeUp = true;
      pattern[index].transposeDown = false; // Ensure only one direction is active
    } else if (direction === "down") {
      pattern[index].transposeDown = true;
      pattern[index].transposeUp = false; // Ensure only one direction is active
    }
  }

  function toggleNote(index) {
    pattern[index].on = !pattern[index].on ?? true;
  }

  $: if (oscillator) {
    const step = pattern[currentStep % pattern.length];
    oscillator.type = waveform;
    const frequency = noteToFrequency(step.note, step.transposeUp, step.transposeDown);
    oscillator.frequency.setValueAtTime(frequency * Math.pow(2, tuning / 1200), audioContext.currentTime);
  }

  $: if (filter) {
    filter.frequency.setValueAtTime(cutoff, audioContext.currentTime);
    filter.Q.setValueAtTime(resonance, audioContext.currentTime);
  }

  $: if (gainNode) {
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  }

  $: if (distortionAmount) {
    distortion.curve = makeDistortionCurve(distortionAmount);
  }

  $: patternIndex = currentStep % pattern.length;
</script>

<main class="my-6 flex max-w-4xl flex-col gap-3">
  <div class="tb303 relative w-full max-w-4xl rounded-lg border-2 border-gray-300 p-1 text-black shadow-xl">
    <div class="flex flex-row items-center justify-between gap-3 px-3 py-2">
      <div class="flex flex-row items-center justify-center gap-1">
        <SmileySticker size="24" weight="duotone" color="gray" />
        <span class="font-mono text-xs leading-tight tracking-tighter text-gray-500">Roland TB-303 Emulation</span>
      </div>

      <div class="flex flex-row items-center gap-3">
        <Sliders size="20" weight="duotone" color="gray" />
        <select
          bind:value={selectedPattern}
          on:change={() => selectPresetPattern(selectedPattern)}
          class="inline-block max-w-44 rounded border border-gray-300 bg-gray-200 p-1 text-xs"
        >
          <option value="">Select a pattern</option>
          {#each patterns as { name }, index}
            <option value={index}>{name}</option>
          {/each}
        </select>
      </div>
    </div>

    <div class="flex flex-col gap-6 rounded-lg border border-gray-200 p-3">
      <div class=" flex flex-row items-center justify-between gap-3 border-b border-gray-300 pb-4">
        <div>
          <img src="/assets/roland.svg" alt="TB-303" class="brand-logo h-6 text-black opacity-70" />
        </div>

        <div class="flex flex-row items-end gap-8 border-x-2 border-gray-300 px-8">
          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="whitespace-nowrap text-xs uppercase tracking-tight text-light-soft" for="tuning">
              Tuning
            </label>
            <div class="flex flex-col items-center justify-center">
              <Encoder size="42" bind:value={tuning} min="-500" max="500" step="1" />
            </div>
          </div>
          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="whitespace-nowrap text-xs uppercase tracking-tight text-light-soft" for="cutoff">
              Cutoff
            </label>
            <div class="flex flex-col items-center justify-center">
              <Encoder size="42" bind:value={cutoff} min="20" max="6000" step="10" />
            </div>
          </div>
          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="whitespace-nowrap text-xs uppercase tracking-tight text-light-soft" for="resonance">
              Resonance
            </label>
            <div class="flex flex-col items-center justify-center">
              <Encoder size="42" bind:value={resonance} min="0" max="30" step="0.1" />
            </div>
          </div>
          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="whitespace-nowrap text-xs uppercase tracking-tight text-light-soft" for="env-mod">
              Envelope
            </label>
            <div class="flex flex-col items-center justify-center">
              <Encoder size="42" bind:value={envMod} min="0" max="1" step="0.01" />
            </div>
          </div>
          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="whitespace-nowrap text-xs uppercase tracking-tight text-light-soft" for="decay">Decay</label>
            <div class="flex flex-col items-center justify-center">
              <Encoder size="42" bind:value={decay} min="0.01" max="2" step="0.01" />
            </div>
          </div>
          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="whitespace-nowrap text-xs uppercase tracking-tight text-light-soft" for="accent"
              >Accent
            </label>
            <div class="flex flex-col items-center justify-center">
              <Encoder size="42" bind:value={accentIntensity} min="0" max="1" step="0.01" />
            </div>
          </div>
          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="whitespace-nowrap text-xs uppercase tracking-tight text-light-soft" for="distortion"
              >Distortion</label
            >
            <div class="flex flex-col items-center justify-center">
              <Encoder size="42" bind:value={distortionAmount} min="0" max="200" step="1" />
            </div>
          </div>
        </div>

        <div class="flex flex-col items-start justify-between gap-3">
          <div class="whitespace-nowrap text-2xl font-light leading-none tracking-tight text-black opacity-70">
            Bass Line
          </div>
          <div class="flex w-full flex-row justify-between">
            <button
              class="rounded p-1 {waveform === 'square' ? 'bg-black text-white' : 'text-light-soft'}"
              on:click={() => {
                waveform = "square";
              }}
            >
              <WaveSquare size="18" />
            </button>
            <button
              class="rounded p-1 {waveform === 'sawtooth' ? 'bg-black text-white' : 'text-light-soft'}"
              on:click={() => {
                waveform = "sawtooth";
              }}
            >
              <WaveSawtooth size="18" />
            </button>
            <button
              class="rounded p-1 {waveform === 'triangle' ? 'bg-black text-white' : 'text-light-soft'}"
              on:click={() => {
                waveform = "triangle";
              }}
            >
              <WaveTriangle size="18" />
            </button>
          </div>
        </div>
      </div>

      <div class="mx-auto flex w-full flex-row items-center justify-center gap-12">
        <div class="flex-1">
          <div class="grid grid-cols-8 gap-3 rounded-lg bg-gray-200 p-4">
            <div class="flex flex-col gap-1 text-xs leading-none">
              <span class="text-light-soft">Tempo</span>
              <span class="font-mono font-bold text-dark-700">{tempo?.toFixed(2)}</span>
            </div>
            <div class="flex flex-col gap-1 text-xs leading-none">
              <span class="text-light-soft">Tuning</span>
              <span class="font-mono font-bold text-dark-700">{tuning?.toFixed(2)}</span>
            </div>
            <div class="flex flex-col gap-1 text-xs leading-none">
              <span class="text-light-soft">Cutoff</span>
              <span class="font-mono font-bold text-dark-700">{cutoff?.toFixed(2)}</span>
            </div>
            <div class="flex flex-col gap-1 text-xs leading-none">
              <span class="text-light-soft">Resonance</span>
              <span class="font-mono font-bold text-dark-700">{resonance?.toFixed(2)}</span>
            </div>
            <div class="flex flex-col gap-1 text-xs leading-none">
              <span class="text-light-soft">Env Mod</span>
              <span class="font-mono font-bold text-dark-700">{envMod?.toFixed(2)}</span>
            </div>
            <div class="flex flex-col gap-1 text-xs leading-none">
              <span class="text-light-soft">Decay</span>
              <span class="font-mono font-bold text-dark-700">{decay?.toFixed(2)}</span>
            </div>
            <div class="flex flex-col gap-1 text-xs leading-none">
              <span class="text-light-soft">Accent</span>
              <span class="font-mono font-bold text-dark-700">{accentIntensity?.toFixed(2)}</span>
            </div>
            <div class="flex flex-col gap-1 text-xs leading-none">
              <span class="text-light-soft">Distortion</span>
              <span class="font-mono font-bold text-dark-700">{distortionAmount?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col justify-end text-right">
          <span class="block text-2xl font-light tabular-nums leading-none text-gray-700">TB-303</span>
          <div class="my-0.5 block w-full border-b border-gray-500" />
          <span class="block text-lg leading-none tracking-tighter text-gray-500">Computer Controlled</span>
        </div>
      </div>

      <div class="flex w-full flex-row items-end gap-6 rounded-lg border border-gray-300 p-4">
        <div class="flex flex-col gap-3">
          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="text-xs uppercase text-light-soft" for="tempo">Tempo </label>
            <div class="flex flex-col items-center justify-center">
              <Encoder size="60" bind:value={tempo} min="40" max="300" step="1" />
            </div>
          </div>

          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="text-xs uppercase text-light-soft" for="volume">Volume </label>
            <div class="flex flex-col items-center justify-center">
              <Encoder size="60" bind:value={volume} min="0" max="1" step="0.01" />
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <button class="metal h-10 w-20 px-4 py-2" on:click={clearPattern}></button>
            <div class="mx-auto block text-xs font-medium uppercase tracking-tighter text-gray-500">Clear</div>
          </div>

          <div class="flex flex-col gap-1">
            <button class="metal h-10 w-20 px-4 py-2" on:click={togglePlay}></button>
            <div class="flex items-center justify-center gap-1">
              <LED on={isPlaying} />
              <span class="block text-xs font-medium uppercase tracking-tighter text-gray-500">Play</span>
            </div>
          </div>
        </div>

        <div class="grid w-full grid-cols-8 gap-x-2 gap-y-3 pl-4">
          {#each pattern as step, index (step + index)}
            <div
              class="flex flex-col items-center justify-between gap-2 rounded-lg bg-black/5 px-1.5 py-2 {patternIndex ===
              index
                ? 'border border-black'
                : 'border border-transparent'}"
            >
              <LED size="14" on={patternIndex === index} />
              <div class="flex w-full items-center justify-center">
                <span class="text-sm text-light-soft">{index + 1}</span>
              </div>

              <select
                class="block w-full appearance-none rounded border border-gray-300 bg-gray-100 p-1 text-center font-mono text-sm text-light-soft"
                value={step.note}
                on:change={(e) => updateNote(index, e.target.value)}
              >
                {#each ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] as note}
                  <option value={note}>{note}</option>
                {/each}
              </select>

              <div class="flex w-full flex-col gap-1">
                <button
                  class={classNames("w-full rounded p-1 text-center text-xs leading-3 text-dark-900", {
                    "bg-accent-neon": step.on,
                    "bg-black/5": !step.on,
                  })}
                  on:click={() => toggleNote(index)}
                >
                  {step.on ? "On" : "Off"}
                </button>
                <button
                  class={classNames("w-full rounded p-1 text-center text-xs leading-3 text-dark-900", {
                    "bg-accent-neon": step.accent,
                    "bg-black/5": !step.accent,
                  })}
                  on:click={() => (step.accent = !step.accent)}
                >
                  Accent
                </button>
                <button
                  class={classNames("w-full rounded p-1 text-center text-xs leading-3 text-dark-900", {
                    "bg-accent-neon": step.glide,
                    "bg-black/5": !step.glide,
                  })}
                  on:click={() => (step.glide = !step.glide)}
                >
                  Glide
                </button>
                <button
                  class={classNames("w-full rounded p-1 text-center text-xs leading-3 text-dark-900", {
                    "bg-accent-neon": step.transposeUp,
                    "bg-black/5": !step.transposeUp,
                  })}
                  on:click={() => toggleTranspose(index, "up")}
                >
                  Up
                </button>
                <button
                  class={classNames("w-full rounded p-1 text-center text-xs leading-3 text-dark-900", {
                    "bg-accent-neon": step.transposeDown,
                    "bg-black/5": !step.transposeDown,
                  })}
                  on:click={() => toggleTranspose(index, "down")}
                >
                  Down
                </button>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>
</main>

<style>
  .tb303 {
    background-color: #f9fcff;
    background-image: linear-gradient(147deg, #f9fcff 0%, #dee4ea 74%);
  }

  .behringer .metal {
    background-color: black !important;
    background: black !important;
    color: white !important;
  }

  .behringer {
    background-color: #fcb529;
    border-color: transparent !important;
    background-image: linear-gradient(147deg, #fcb529 0%, #fbb328 74%);
  }

  .behringer * {
    border-color: black !important;
    color: black;
    /*background: transparent;*/
  }

  .metal {
    @apply block rounded border border-gray-400 bg-gradient-to-br from-gray-300 to-gray-400 transition duration-75 ease-in-out;
  }

  .metal:hover {
    @apply brightness-105 transition duration-75 ease-in-out;
  }

  .metal.active {
    @apply text-white brightness-75;
  }

  .metal:active {
    @apply brightness-90 transition duration-75 ease-in-out;
  }

  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
</style>
