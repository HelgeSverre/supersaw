<script lang="ts">
  import classNames from "classnames";
  import { Stop } from "phosphor-svelte";
  import { Play } from "lucide-svelte";
  import { audioManager } from "../../../core/audio";
  import { onDestroy, onMount } from "svelte";
  import { createUUID } from "../../../core/lib/utils";

  type Note = string | null; // e.g., 'C-4', 'F#5', null for no note
  type Instrument = number | null; // 0-99, null if not set
  type Volume = number | null; // 0-64, null if not set
  type Effect = string | null; // e.g., '0' for arpeggio, 'A' for volume slide, null if no effect
  type EffectParam = number | null; // 0-255, null if not set

  interface TrackerCell {
    note: Note;
    instrument: Instrument;
    volume: Volume;
    effect: Effect;
    effectParam: EffectParam;
  }

  interface TrackerRow {
    rowNumber: number;
    channels: TrackerCell[];
  }

  interface TrackerPattern {
    patternNumber: number;
    channels: number;
    rows: TrackerRow[];
  }

  // Helper function to create an empty cell
  function createEmptyCell(): TrackerCell {
    return {
      note: null,
      instrument: null,
      volume: null,
      effect: null,
      effectParam: null,
    };
  }

  interface Sample {
    id: number;
    name: string;
    waveform: any;
    buffer: AudioBuffer;
  }

  // "/samples/roland-tr-909/BT0A0D0.WAV", // Bass drum
  // "/samples/roland-tr-909/ST0T0S0.WAV", // Snare drum
  // "/samples/roland-tr-909/LT0D0.WAV", // Low tom
  // "/samples/roland-tr-909/MT0D0.WAV", // Mid tom
  // "/samples/roland-tr-909/HT0D0.WAV", // High tom
  // "/samples/roland-tr-909/CLOP1.WAV", // Cowbell
  // "/samples/roland-tr-909/HANDCLP1.WAV", // Handclap
  // "/samples/roland-tr-909/HHCD0.WAV", // Closed hi-hat
  // "/samples/roland-tr-909/HHOD0.WAV", // Open hi-hat
  // "/samples/roland-tr-909/CSHD0.WAV", // Crash cymbal
  // "/samples/roland-tr-909/RIDED0.WAV", // Ride cymbal
  // "/samples/roland-tr-909/RIM63.WAV", // Rim shot

  let samples: Sample[] = [];

  async function loadSample(url: string) {
    const audioBuffer = await audioManager.loadAudioBuffer(url);

    let wip = {
      id: createUUID("sample"),
      name: url.split("/").pop(),
      waveform: audioManager.generateWaveformFromBuffer(audioBuffer, 1000),
      buffer: audioBuffer,
    };

    console.log(wip);
    return wip;
  }

  function loadDefaultSamples() {
    const sampleUrls = [
      "/samples/roland-tr-909/BT0A0D0.WAV", // Bass drum
      "/samples/roland-tr-909/ST0T0S0.WAV", // Snare drum
      // "/samples/roland-tr-909/LT0D0.WAV", // Low tom
      // "/samples/roland-tr-909/MT0D0.WAV", // Mid tom
      // "/samples/roland-tr-909/HT0D0.WAV", // High tom
      // "/samples/roland-tr-909/CLOP1.WAV", // Cowbell
      // "/samples/roland-tr-909/HANDCLP1.WAV", // Handclap
      "/samples/roland-tr-909/HHCD0.WAV", // Closed hi-hat
      "/samples/roland-tr-909/HHOD0.WAV", // Open hi-hat
      "/samples/roland-tr-909/CSHD0.WAV", // Crash cymbal
      // "/samples/roland-tr-909/RIDED0.WAV", // Ride cymbal
      // "/samples/roland-tr-909/RIM63.WAV", // Rim shot
    ];

    Promise.all(sampleUrls.map((url) => loadSample(url))).then((buffers) => {
      samples = buffers;
    });
  }

  onMount(() => {
    loadDefaultSamples();
  });

  // Helper function to create an empty row
  function createEmptyRow(rowNumber: number): TrackerRow {
    return {
      rowNumber,
      channels: Array(4)
        .fill(null)
        .map(() => createEmptyCell()),
    };
  }

  function formatHex(num: number | null): string {
    return num !== null ? num.toString(16).toUpperCase().padStart(2, "0") : "--";
  }

  // Helper function to create an empty pattern
  function createEmptyPattern(patternNumber: number, rowCount: number = 64): TrackerPattern {
    return {
      patternNumber,
      channels: 4,
      rows: Array(rowCount)
        .fill(null)
        .map((_, i) => createEmptyRow(i)),
    };
  }

  // Helper function to convert a cell to a string representation
  function cellToString(cell: TrackerCell): string {
    const noteStr = cell.note?.padEnd(3, "-") || "---";
    const instStr = cell.instrument !== null ? cell.instrument.toString().padStart(2, "0") : "--";
    const volStr = cell.volume !== null ? cell.volume.toString(16).toUpperCase().padStart(2, "0") : "--";
    const effectStr = cell.effect || "-";
    const effectParamStr =
      cell.effectParam !== null ? cell.effectParam.toString(16).toUpperCase().padStart(2, "0") : "--";

    return `${noteStr} ${instStr} ${volStr} ${effectStr}${effectParamStr}`;
  }

  let isPlaying = false;
  let currentPatternIndex = 0;
  let bpm = 120;
  let currentPlayingRow = -1;
  let playbackInterval: number | null = null;

  let patterns: TrackerPattern[] = Array(16)
    .fill(null)
    .map((_, i) => createEmptyPattern(i));

  // Example: Set some notes in the first pattern
  patterns[0].rows[0].channels[0] = { note: "C-4", instrument: 1, volume: 64, effect: "0", effectParam: 253 };
  patterns[0].rows[4].channels[1] = { note: "E-4", instrument: 2, volume: 48, effect: null, effectParam: null };
  patterns[0].rows[8].channels[2] = { note: "G-4", instrument: 3, volume: 32, effect: "A", effectParam: 15 };
  patterns[0].rows[12].channels[3] = { note: "C-3", instrument: 4, volume: 64, effect: null, effectParam: null };

  function togglePlay() {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }

  function startPlayback() {
    isPlaying = true;
    currentPlayingRow = 0;
    const msPerRow = (60 * 1000) / (bpm * 4); // Assuming 4 rows per beat
    playbackInterval = setInterval(() => {
      currentPlayingRow++;
      if (currentPlayingRow >= patterns[currentPatternIndex].rows.length) {
        stopPlayback();
      }
    }, msPerRow);
  }

  function stopPlayback() {
    isPlaying = false;
    currentPlayingRow = -1;
    if (playbackInterval) {
      clearInterval(playbackInterval);
      playbackInterval = null;
    }
  }

  function switchPattern(index: number) {
    currentPatternIndex = index;
  }

  function changePattern(delta: number) {
    stopPlayback();
    currentPatternIndex = Math.max(0, Math.min(15, currentPatternIndex + delta));
  }

  function previewSample(sample: Sample) {
    audioManager.playPreviewFromBuffer(sample.buffer);
  }

  onDestroy(() => {
    if (playbackInterval) {
      clearInterval(playbackInterval);
    }
  });
</script>

<div class="absolute inset-0 size-full p-2 text-light">
  <div class="flex size-full flex-1 flex-row">
    <div class="flex w-full flex-row gap-2">
      <div class="w-44 border border-dark-600 bg-dark-800 p-1">
        <h2 class="mb-2 font-bold text-gray-100">Patterns</h2>

        <div class="space-y-2 overflow-y-scroll">
          {#each Array(16) as _, i}
            <button
              class="block w-full px-2 py-0.5 text-left {i === currentPatternIndex
                ? 'bg-dark-600'
                : 'bg-dark-900 hover:bg-gray-600'}"
              on:click={() => switchPattern(i)}
            >
              Pattern {i}
            </button>
          {/each}
        </div>
      </div>

      <div class="flex w-full flex-row gap-2">
        <div class="flex w-full flex-1 flex-col gap-2">
          <div class="flex flex-row items-center justify-between gap-4 border border-dark-600 bg-dark-800 p-1">
            <div class="flex flex-row gap-6 text-xs font-light tracking-tight">
              <div class="flex flex-row gap-2">
                <span class="font-medium">Pattern:</span>
                <span class="font-mono">{currentPatternIndex + 1}</span>
              </div>
              <div class="flex flex-row gap-2">
                <span class="font-medium">Length:</span>
                <span class="font-mono">{patterns[currentPatternIndex].rows.length}</span>
              </div>
              <div class="flex flex-row gap-2">
                <span class="font-medium">Step:</span>
                <span class="font-mono">
                  {#if currentPlayingRow > -1}
                    {currentPlayingRow}
                  {:else}
                    <span class="text-light-soft">---</span>
                  {/if}
                </span>
              </div>
              <div></div>
            </div>

            <button
              on:click={togglePlay}
              class="inline-flex h-full flex-row items-center gap-1 rounded-sm bg-dark-900 py-1 pl-1.5 pr-2 text-xs tracking-tight"
            >
              {#if isPlaying}
                <Stop class="text-accent-yellow/80" size="16" />
                <span class="font-medium text-accent-yellow">Stop</span>
              {:else}
                <Play class="text-accent-yellow/80" size="16" />
                <span class="font-medium text-accent-yellow">Play</span>
              {/if}
            </button>
          </div>

          <div class="flex w-full grow-0 flex-col overflow-hidden bg-black text-sm">
            <div
              class="flex justify-start gap-4 divide-x divide-dark-700 border-b border-dark-500 bg-dark-800 font-mono text-light"
            >
              <span class="w-12 px-2 py-1">#</span>
              {#each Array(patterns[currentPatternIndex].channels) as _, i}
                <span class="w-60 px-2 py-1 text-left">Ch{i + 1}</span>
              {/each}
            </div>
            <div class="flex flex-col gap-px overflow-y-scroll">
              {#each patterns[currentPatternIndex].rows as row, i}
                <div
                  class={classNames(
                    "flex h-full items-center justify-start gap-4 divide-x divide-dark-700 font-mono leading-none",
                    {
                      "bg-dark-800": (i + 1) % 4 === 0,
                      "bg-dark-900": (i + 1) % 4 !== 0,
                      "!bg-accent-yellow/25": i === currentPlayingRow,
                    },
                  )}
                >
                  <span class="w-12 px-2 text-light-soft">{i}</span>

                  {#each row.channels as cell}
                    <div class="flex h-full w-60 flex-row gap-4 px-2 py-1 text-left">
                      <div
                        class={classNames({
                          "text-yellow-400": cell.note != null,
                          "text-yellow-400/20": cell.note == null,
                        })}
                      >
                        {cell.note || "---"}
                      </div>
                      <div
                        class={classNames({
                          "text-teal-500": cell.instrument != null,
                          "text-teal-500/20": cell.instrument == null,
                        })}
                      >
                        {formatHex(cell.instrument)}
                      </div>
                      <div
                        class={classNames({
                          "text-red-500": cell.effect != null,
                          "text-red-500/20": cell.effect == null,
                        })}
                      >
                        {cell.effect || "----"}
                      </div>
                      <div
                        class={classNames({
                          "text-red-500": cell.effectParam != null,
                          "text-red-500/20": cell.effectParam == null,
                        })}
                      >
                        {formatHex(cell.effectParam)}
                      </div>
                    </div>
                  {/each}
                </div>
              {/each}
              <img
                src="https://polyend.com/wp-content/themes/polyend/assets/images/slide-pattern-image-8.png"
                alt=""
                class="w-full"
              />
            </div>
          </div>
        </div>

        <div class="w-60 overflow-y-scroll border border-dark-600 bg-dark-800 p-1">
          <div class="flex flex-col p-2">
            {#each samples as sample}
              <div class="mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-32 w-full bg-black text-accent-yellow"
                  viewBox="0 0 1000 100"
                  preserveAspectRatio="none"
                >
                  <path d={sample.waveform} stroke="currentColor" fill="none" />
                </svg>
                <button class="w-full bg-gray-700 p-1 text-center text-xs" on:click={() => previewSample(sample)}>
                  {sample.name}
                </button>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
