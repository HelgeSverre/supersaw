<script>
  import { onMount } from "svelte";
  import { audioManager } from "../../core/audio.js";
  import Encoder from "../ui/Encoder.svelte";
  import LED from "../ui/LED.svelte";
  import { frequencyToMidiNote, noteLabel } from "../../core/midi.js";
  import { WaveSawtooth, WaveSquare, WaveTriangle } from "phosphor-svelte";

  let audioContext;
  let oscillator, filter, envelope, gainNode;
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

  let cutoff = 1200;
  let resonance = 10;
  let volume = 0.9;

  let tempo = 120;
  let tuning = 0;
  let envMod = 0.5;
  let decay = 0.1;
  let accent = 0.5;

  onMount(() => {
    audioContext = audioManager.audioContext;
  });

  function createOscillator(frequency) {
    oscillator = audioContext.createOscillator();
    oscillator.type = waveform;
    // oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(frequency * Math.pow(2, tuning / 1200), audioContext.currentTime);

    oscillator.start();
    return oscillator;
  }

  function createFilter() {
    filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, audioContext.currentTime);
    // filter.frequency.setValueAtTime(cutoff + envMod * 1000, audioContext.currentTime); // Envelope modulation influences cutoff

    filter.Q.setValueAtTime(resonance, audioContext.currentTime);
    return filter;
  }

  function createEnvelope() {
    envelope = audioContext.createGain();
    envelope.gain.setValueAtTime(accent, audioContext.currentTime); // Accent affects initial gain
    envelope.gain.exponentialRampToValueAtTime(1, audioContext.currentTime + 0.01);
    envelope.gain.exponentialRampToValueAtTime(0.3, audioContext.currentTime + decay); // Decay modifies the envelope
    envelope.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + decay + 0.1);

    return envelope;
  }

  function createGainNode() {
    gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    return gainNode;
  }

  function playNote() {
    const freq = pattern[currentStep % pattern.length];
    const osc = createOscillator(freq);
    const filt = createFilter();
    const env = createEnvelope();
    const gain = createGainNode();

    osc.connect(filt);
    filt.connect(env);
    env.connect(gain);
    gain.connect(audioManager.mixer);

    setTimeout(
      () => {
        osc.stop();
        currentStep++;
      },
      60000 / tempo / 4,
    );
  }

  function togglePlay() {
    isPlaying ? stopPattern() : playPattern();
  }

  function playPattern() {
    if (!isPlaying) {
      isPlaying = true;
      intervalId = setInterval(playNote, 60000 / tempo / 4);
    }
  }

  function stopPattern() {
    if (isPlaying) {
      clearInterval(intervalId);
      isPlaying = false;
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

  $: patternIndex = currentStep % pattern.length;
</script>

<main class="my-6 flex max-w-4xl flex-col gap-3">
  <div class="tb303 relative w-full max-w-4xl rounded-lg border-2 border-gray-300 p-1 text-black shadow-xl">
    <div class="flex flex-col gap-6 rounded-lg border border-gray-200 p-3">
      <div class=" flex flex-row items-center justify-between gap-3 border-b-2 border-gray-300 pb-4">
        <div>
          <img src="/assets/roland.svg" alt="TB-303" class="h-6 text-black opacity-70" />
        </div>

        <div class="flex flex-row items-end gap-8 border-x-2 border-gray-300 px-8">
          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="whitespace-nowrap text-xs uppercase tracking-tight text-light-soft" for="tuning">
              Tuning
            </label>
            <div class="flex flex-col items-center justify-center">
              <Encoder size="48" bind:value={tuning} min="100" max="5000" step="10" />
            </div>
          </div>
          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="whitespace-nowrap text-xs uppercase tracking-tight text-light-soft" for="cutoff">
              Cutoff
            </label>
            <div class="flex flex-col items-center justify-center">
              <Encoder size="48" bind:value={cutoff} min="10" max="5000" step="10" />
            </div>
          </div>
          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="whitespace-nowrap text-xs uppercase tracking-tight text-light-soft" for="resonance">
              Resonance
            </label>
            <div class="flex flex-col items-center justify-center">
              <Encoder size="48" bind:value={resonance} min="1" max="20" step="1" />
            </div>
          </div>
          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="whitespace-nowrap text-xs uppercase tracking-tight text-light-soft" for="env-mod">
              Env Mod
            </label>
            <div class="flex flex-col items-center justify-center">
              <Encoder size="48" bind:value={envMod} min="0" max="10" step="0.01" />
            </div>
          </div>
          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="whitespace-nowrap text-xs uppercase tracking-tight text-light-soft" for="decay">Decay</label>
            <div class="flex flex-col items-center justify-center">
              <Encoder size="48" bind:value={decay} min="0" max="2" step="0.01" />
            </div>
          </div>
          <div class="flex flex-col items-center justify-center gap-1 text-center">
            <label class="whitespace-nowrap text-xs uppercase tracking-tight text-light-soft" for="accent"
              >Accent
            </label>
            <div class="flex flex-col items-center justify-center">
              <Encoder size="48" bind:value={accent} min="0" max="1" step="0.01" />
            </div>
          </div>
        </div>
        <div class="flex flex-col items-start justify-between gap-3">
          <div class="whitespace-nowrap text-2xl font-semibold leading-none tracking-tight text-black opacity-70">
            Bass Line
          </div>
          <div class="flex w-full flex-row justify-between">
            <button
              class="rounded p-1 {waveform == 'square' ? 'bg-black text-white' : 'text-light-soft'}"
              on:click={() => {
                waveform = "square";
              }}
            >
              <WaveSquare size="18" />
            </button>
            <button
              class="rounded p-1 {waveform == 'sawtooth' ? 'bg-black text-white' : 'text-light-soft'}"
              on:click={() => {
                waveform = "sawtooth";
              }}
            >
              <WaveSawtooth size="18" />
            </button>
            <button
              class="rounded p-1 {waveform == 'triangle' ? 'bg-black text-white' : 'text-light-soft'}"
              on:click={() => {
                waveform = "triangle";
              }}
            >
              <WaveTriangle size="18" />
            </button>
          </div>
        </div>
      </div>

      <div class="mx-auto flex w-full max-w-3xl flex-row items-center justify-center gap-12">
        <div class="flex flex-col items-center justify-center gap-3 text-center">
          <label class="text-xs uppercase text-light-soft" for="tempo">Tempo </label>
          <div class="flex flex-col items-center justify-center">
            <Encoder size="72" bind:value={tempo} min="30" max="300" step="1" />
          </div>
        </div>

        <div class="flex-1">
          <div class="grid grid-cols-3 gap-3 rounded-lg bg-gray-200 p-4">
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
              <span class="font-mono font-bold text-dark-700">{accent?.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div class="flex flex-col justify-end text-right">
          <span class="tracking block text-2xl font-light tabular-nums leading-none text-gray-700">TB-303</span>
          <div class="my-0.5 block w-full border-b border-gray-500" />
          <span class="block text-lg font-medium leading-none tracking-tight text-gray-700">Computer Controlled</span>
        </div>

        <div class="flex flex-col items-center justify-center gap-3 text-center">
          <label class="text-xs uppercase text-light-soft" for="volume">Volume </label>
          <div class="flex flex-col items-center justify-center">
            <Encoder size="72" bind:value={volume} min="0" max="1" step="0.01" />
          </div>
        </div>
      </div>

      <div class="flex flex-row items-end gap-6 rounded-lg border border-gray-200 p-4">
        <div class="flex flex-col gap-3">
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
        <div class="grid grid-cols-8 gap-4 p-4">
          {#each pattern as note, index (note + index)}
            <div class="flex flex-col items-center justify-between gap-2">
              <div>
                <LED size="14" on={patternIndex === index} />
              </div>
              <span class="text-xs">{noteLabel(frequencyToMidiNote(note.frequency))}</span>
              <div
                class="block w-full rounded text-center font-mono text-lg {patternIndex === index
                  ? 'bg-accent-neon text-black'
                  : 'bg-dark-900 text-white'}"
              >
                <span>{index + 1}</span>
              </div>
              <input
                type="number"
                class=" block w-full rounded bg-dark-900 p-1 text-center font-mono text-sm text-white"
                value={note.frequency.toFixed(2)}
                step="0.01"
                on:change={(e) => updateNoteFrequency(index, e.target.value)}
              />

              <div class="flex w-full flex-col items-center gap-1">
                <div class="flex w-full gap-1">
                  <button
                    class="w-full rounded px-1 text-white {note.accent ? 'bg-accent-neon' : 'bg-dark-900'}"
                    on:click={() => (note.accent = !note.accent)}
                  >
                    A
                  </button>
                  <button
                    class="w-full rounded px-1 text-white {note.glide ? 'bg-accent-neon' : 'bg-dark-900'}"
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

  <img src="/assets/tb303.jpg" alt="" class="w-full" />
</main>

<style>
  .tb303 {
    background-color: #f9fcff;
    background-image: linear-gradient(147deg, #f9fcff 0%, #dee4ea 74%);
  }

  .metal {
    @apply block rounded border border-gray-400 bg-gradient-to-br from-gray-300 to-gray-400  font-semibold text-white;
  }
</style>
