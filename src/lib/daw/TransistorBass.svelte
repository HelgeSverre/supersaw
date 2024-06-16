<script>
  import { onMount } from "svelte";
  import { audioManager } from "../../core/audio.js";
  import Encoder from "../ui/Encoder.svelte";
  import LED from "../ui/LED.svelte";
  import { frequencyToMidiNote, midiNoteToFrequency, noteLabel } from "../../core/midi.js";
  import { Metronome, Sliders, SmileySticker, WaveSawtooth, WaveSquare, WaveTriangle } from "phosphor-svelte";
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

  let oscillator, filter, envelope, gainNode;

  let selectedPattern;
  let elapsedPlayTime = 0;
  const patterns = [
    {
      name: "Glide test",
      tempo: 80,
      steps: [
        { frequency: midiNoteToFrequency(60), accent: false, glide: false },
        { frequency: midiNoteToFrequency(60), accent: false, glide: false },
        { frequency: midiNoteToFrequency(60), accent: false, glide: false },
        { frequency: midiNoteToFrequency(65), accent: false, glide: true },
      ],
    },
    {
      name: "Scale test",
      tempo: 100,
      steps: [
        { frequency: midiNoteToFrequency(60 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(61 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(62 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(63 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(64 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(65 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(66 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(67 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(68 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(69 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(70 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(71 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(72 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(73 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(74 - 12), accent: false, glide: false },
        { frequency: midiNoteToFrequency(75 - 12), accent: false, glide: false },
      ],
    },
    {
      name: "Phuture - Acid Tracks",
      tempo: 114,
      steps: [
        { frequency: midiNoteToFrequency(47), accent: true, glide: true }, // B up, Accent + Slide
        { frequency: midiNoteToFrequency(47), accent: false, glide: false }, // B up
        { frequency: midiNoteToFrequency(36), accent: true, glide: false }, // C lo, Accent
        { frequency: midiNoteToFrequency(48), accent: true, glide: false }, // C hi, Accent
        { frequency: midiNoteToFrequency(36), accent: false, glide: false }, // C lo
        { frequency: midiNoteToFrequency(51), accent: true, glide: true }, // D# up, Accent + Slide
        { frequency: midiNoteToFrequency(51), accent: false, glide: false }, // D#
        { frequency: midiNoteToFrequency(48), accent: true, glide: false }, // C hi, Accent
      ],
    },
    {
      name: "Josh Wink - Higher State of Consciousness",
      steps: [
        { frequency: midiNoteToFrequency(60), accent: true, glide: false },
        { frequency: midiNoteToFrequency(60), accent: false, glide: false },
        { frequency: midiNoteToFrequency(62), accent: true, glide: false },
        { frequency: midiNoteToFrequency(64), accent: false, glide: false },
        { frequency: midiNoteToFrequency(65), accent: true, glide: true },
        { frequency: midiNoteToFrequency(67), accent: false, glide: false },
        { frequency: midiNoteToFrequency(69), accent: true, glide: true },
        { frequency: midiNoteToFrequency(71), accent: false, glide: false },
      ],
    },
    {
      name: "Hardfloor - Acperience 1",
      steps: [
        { frequency: midiNoteToFrequency(50), accent: true, glide: false },
        { frequency: midiNoteToFrequency(52), accent: false, glide: false },
        { frequency: midiNoteToFrequency(50), accent: false, glide: true },
        { frequency: midiNoteToFrequency(48), accent: true, glide: false },
        { frequency: midiNoteToFrequency(50), accent: false, glide: true },
        { frequency: midiNoteToFrequency(52), accent: false, glide: false },
        { frequency: midiNoteToFrequency(53), accent: true, glide: false },
        { frequency: midiNoteToFrequency(55), accent: false, glide: true },
      ],
    },
  ];

  function selectPresetPattern(index) {
    pattern = patterns[index]?.steps ?? [];
    tempo = patterns[index]?.tempo ?? tempo;
  }

  onMount(() => {
    audioContext = audioManager.audioContext;
    initAudioNodes();

    selectPresetPattern(1);
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

    // Connect the audio nodes
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(gainNode);
    gainNode.connect(audioManager.mixer);
  }

  let prevFrequency;

  function playNote() {
    elapsedPlayTime += 60 / tempo / 4;

    let index = currentStep % pattern.length;
    const step = pattern[index];
    const nextFrequency = step.frequency * Math.pow(2, tuning / 1200);

    // Duration of a quarter note in seconds
    let noteDuration = 60 / tempo / 4;

    if (step.glide && currentStep > 0) {
      // Use a fraction of the note duration for the glide effect.
      let glideDuration = noteDuration * 0.75; // Glide over half the duration of a note
      let glideEndTime = audioContext.currentTime + glideDuration;
      oscillator.frequency.linearRampToValueAtTime(nextFrequency, glideEndTime);
      console.log("Glide from", prevFrequency, "to", nextFrequency, "over", glideDuration, "seconds");
    } else {
      oscillator.frequency.setValueAtTime(nextFrequency, audioContext.currentTime);
    }

    envelope.gain.cancelScheduledValues(audioContext.currentTime);
    envelope.gain.setValueAtTime(1, audioContext.currentTime);
    envelope.gain.exponentialRampToValueAtTime(0.1, audioContext.currentTime + decay);
    envelope.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + decay + 0.01);

    // Modulate the filter's cutoff based on the envelope modulator
    let baseCutoff = cutoff;
    let modulatedCutoff = baseCutoff + envMod * 2000; // `2000` is an arbitrary scale factor for demonstration
    filter.frequency.setValueAtTime(baseCutoff, audioContext.currentTime);
    filter.frequency.linearRampToValueAtTime(modulatedCutoff, audioContext.currentTime + decay);

    // Adjust resonance based on whether an accent is applied
    if (step.accent) {
      filter.Q.setValueAtTime(resonance * (1 + accentIntensity), audioContext.currentTime);
    } else {
      filter.Q.setValueAtTime(resonance, audioContext.currentTime);
    }

    prevFrequency = nextFrequency;
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
        frequency: 65.41,
        accent: false,
        glide: false,
        on: true,
      }));
  }

  function updateNoteFrequency(index, frequency) {
    pattern[index].frequency = parseFloat(frequency);
  }

  $: if (oscillator) {
    const step = pattern[currentStep % pattern.length];
    oscillator.type = waveform;
    // oscillator.frequency.setValueAtTime(step.frequency * Math.pow(2, tuning / 1200), audioContext.currentTime);
  }

  $: if (filter) {
    filter.frequency.setValueAtTime(cutoff, audioContext.currentTime);
    filter.Q.setValueAtTime(resonance, audioContext.currentTime);
  }

  $: if (gainNode) {
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  }

  $: patternIndex = currentStep % pattern.length;
</script>

<main class="my-6 flex max-w-4xl flex-col gap-3">
  <div class="tb303 relative w-full max-w-4xl rounded-lg border-2 border-gray-300 p-1 text-black shadow-xl">
    <div class="flex flex-row items-center justify-between gap-3 px-3 py-2">
      <div class="flex flex-row items-center justify-center gap-1">
        <SmileySticker size="24" weight="duotone" color="gray" />
        <span class="font-mono text-xs leading-tight tracking-tighter text-gray-500">Roland TR-303 Emulation</span>
      </div>

      <div class="flex flex-row items-center justify-center gap-1">
        <Metronome size="24" weight="duotone" color="gray" />
        <span class="font-mono text-xs leading-tight tracking-tighter text-gray-500">
          {currentStep} -- {patternIndex + 1} / {pattern.length}
          --
          {tempo} BPM --
          {60 / tempo / 4} s /{elapsedPlayTime} s
        </span>
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
              <Encoder size="42" bind:value={tuning} min="-100" max="100" step="1" />
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
              <Encoder size="42" bind:value={decay} min="0.1" max="2" step="0.01" />
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
          <div class="grid grid-cols-7 gap-3 rounded-lg bg-gray-200 p-4">
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
              <Encoder size="60" bind:value={tempo} min="30" max="300" step="1" />
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

        <div class="grid grid-cols-8 gap-x-2 gap-y-3 pl-4">
          {#each pattern as note, index (note + index)}
            <div class="flex flex-col items-center justify-between gap-2 rounded-lg bg-black/5 px-1.5 py-2">
              <div>
                <LED size="14" on={patternIndex === index} />
              </div>
              <span class="text-xs">{noteLabel(frequencyToMidiNote(note.frequency))}</span>

              <button
                on:click={() => (note.on = !note.on)}
                class={classNames("block w-full rounded p-1 text-center text-xs text-gray-700", {
                  "bg-accent-neon": note.on,
                  "bg-gray-300": !note.on,
                })}
              >
                <span>{index + 1}</span>
              </button>

              <input
                type="number"
                class="block w-full appearance-none rounded border border-gray-300 bg-gray-100 p-1 text-center font-mono text-sm text-light-soft"
                value={note.frequency.toFixed(2)}
                step="0.01"
                on:change={(e) => updateNoteFrequency(index, e.target.value)}
              />

              <div class="flex w-full flex-col items-center gap-1">
                <div class="flex w-full gap-1">
                  <button
                    class="metal w-full py-1 text-sm leading-tight text-dark-100"
                    class:active={note.accent}
                    on:click={() => (note.accent = !note.accent)}
                  >
                    A
                  </button>
                  <button
                    class="metal w-full py-1 text-sm leading-tight text-dark-100"
                    class:active={note.glide}
                    on:click={() => (note.glide = !note.glide)}
                  >
                    G
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <img
    src="https://mediadl.musictribe.com/media/PLM/data/images/products/P0DTD/2000Wx2000H/TD-3-SR_P0DTD_Top_XL.png"
    alt=""
    class="w-full"
  />
  <img src="/assets/tb303.jpg" alt="" class="w-full" />
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
