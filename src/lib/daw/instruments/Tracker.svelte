<script lang="ts">
  import classNames from "classnames";
  import { Stop } from "phosphor-svelte";
  import { Play } from "lucide-svelte";
  import { audioManager } from "../../../core/audio";
  import { onDestroy, onMount } from "svelte";
  import { createUUID } from "../../../core/lib/utils";
  import { bpm } from "../../../core/store";
  import { XM } from "../../../formats/xm";

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
    name: string | null;
    patternNumber: number;
    channels: number;
    rows: TrackerRow[];
  }

  interface Sample {
    id: string;
    name: string;
    waveform: any;
    buffer: AudioBuffer;
  }

  interface DrumPatternDefinition {
    [key: string]: { sample: string; note: string; volume: number };
  }

  const drumSamples: DrumPatternDefinition = {
    K: { sample: "/samples/linndrum/kick.wav", note: "C-4", volume: 64 },
    S: { sample: "/samples/linndrum/sd.wav", note: "C-4", volume: 64 },
    C: { sample: "/samples/linndrum/clap.wav", note: "C-4", volume: 60 },
    H: { sample: "/samples/linndrum/chh.wav", note: "C-5", volume: 48 },
    T: { sample: "/samples/linndrum/tom.wav", note: "C-4", volume: 56 },
    Km: { sample: "/samples/linndrum/kickme.wav", note: "C-4", volume: 64 },
    Sh: { sample: "/samples/linndrum/sdh.wav", note: "C-4", volume: 62 },
    Hs: { sample: "/samples/linndrum/chhs.wav", note: "C-5", volume: 46 },
    R: { sample: "/samples/linndrum/ride.wav", note: "C-5", volume: 50 },
    Cb: { sample: "/samples/linndrum/cowb.wav", note: "C-5", volume: 54 },
    Cs: { sample: "/samples/linndrum/crash.wav", note: "C-5", volume: 58 },
    Cg: { sample: "/samples/linndrum/conga.wav", note: "C-4", volume: 52 },
    Sl: { sample: "/samples/linndrum/sdl.wav", note: "C-4", volume: 62 },
    L: { sample: "/samples/linndrum/sst.wav", note: "C-4", volume: 58 },
    Hl: { sample: "/samples/linndrum/chhl.wav", note: "C-5", volume: 46 },
    Tm: { sample: "/samples/linndrum/tomh.wav", note: "C-4", volume: 56 },
    Tl: { sample: "/samples/linndrum/toml.wav", note: "C-4", volume: 56 },
    Ca: { sample: "/samples/linndrum/cabasa.wav", note: "C-5", volume: 44 },
  };

  function createPatternFromDefinition(name: string, definition: string[], patternLength: number = 64): TrackerPattern {
    const pattern = createEmptyPattern(name, 0, patternLength);
    const stepsPerBar = definition[0].length;
    const channels = definition.length;
    const mapping = instrumentMappings[name] || {};

    for (let step = 0; step < patternLength; step++) {
      for (let channel = 0; channel < channels; channel++) {
        const barStep = step % stepsPerBar;
        const hit = definition[channel][barStep];
        if (hit !== "-") {
          const sample = drumSamples[hit];
          if (sample) {
            pattern.rows[step].channels[channel] = {
              note: sample.note,
              instrument: mapping[hit] !== undefined ? mapping[hit] : Object.keys(drumSamples).indexOf(hit),
              volume: sample.volume,
              effect: null,
              effectParam: null,
            };
          }
        }
      }
    }

    return pattern;
  }

  const pattern80sPop = ["K--C--S--C--K--C--S--C--", "--H---H---H---H---H---H-", "---------------T---"];
  const patternSynthPop = ["K--HS--HK-CbS--H", "RRRRRRRRRRRRRRRR", "----Cs----Cg----"];
  const patternRnBHipHop = ["K--L--S-L-K--L--S-L-", "HHHHHHHHHHHHHHHH", "----Tm------Tl-Ca--"];

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

  const instrumentMappings: { [key: string]: InstrumentMapping } = {
    "80s Pop": {
      K: 0, // kick.wav
      S: 1, // sd.wav
      C: 2, // clap.wav
      H: 3, // chh.wav
      T: 4, // tom.wav
    },
    "Synth Pop": {
      K: 5, // kickme.wav
      S: 6, // sdh.wav
      H: 7, // chhs.wav
      R: 8, // ride.wav
      Cb: 9, // cowb.wav
      Cs: 10, // crash.wav
      Cg: 11, // conga.wav
    },
    "RnB HipHop": {
      K: 0, // kick.wav
      S: 12, // sdl.wav
      L: 13, // sst.wav
      H: 14, // chhl.wav
      Tm: 15, // tomh.wav
      Tl: 16, // toml.wav
      Ca: 17, // cabasa.wav
    },
  };

  let instruments: Sample[] = [];
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
      "/samples/roland-tr-909/HHCD0.WAV", // Closed hi-hat
      "/samples/roland-tr-909/HHOD0.WAV", // Open hi-hat
      "/samples/roland-tr-909/CSHD0.WAV", // Crash cymbal

      "/samples/linndrum/cabasa.wav",
      "/samples/linndrum/chh.wav",
      "/samples/linndrum/chhl.wav",
      "/samples/linndrum/chhs.wav",
      "/samples/linndrum/clap.wav",
      "/samples/linndrum/conga.wav",
      "/samples/linndrum/congah.wav",
      "/samples/linndrum/congahh.wav",
      "/samples/linndrum/congal.wav",
      "/samples/linndrum/congall.wav",
      "/samples/linndrum/congalll.wav",
      "/samples/linndrum/cowb.wav",
      "/samples/linndrum/crash.wav",
      "/samples/linndrum/kick.wav",
      "/samples/linndrum/kickme.wav",
      "/samples/linndrum/ride.wav",
      "/samples/linndrum/sd.wav",
      "/samples/linndrum/sdh.wav",
      "/samples/linndrum/sdl.wav",
      "/samples/linndrum/sst.wav",
      "/samples/linndrum/ssth.wav",
      "/samples/linndrum/sstl.wav",
      "/samples/linndrum/tamb.wav",
      "/samples/linndrum/tom.wav",
      "/samples/linndrum/tomh.wav",
      "/samples/linndrum/tomhh.wav",
      "/samples/linndrum/toml.wav",
      "/samples/linndrum/tomll.wav",
    ];

    Promise.all(sampleUrls.map((url) => loadSample(url))).then((buffers) => {
      samples = buffers;
    });
  }

  onMount(() => {
    loadDefaultSamples();
    // loadXmFile("/mods/unreeeal_superhero_3.xm");
  });

  function loadXmFile(url: string) {
    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => {
        const xm = new XM(data);
        xm.debug();
      });
  }

  function formatHex(num: number | null): string {
    return num !== null ? num.toString(16).toUpperCase().padStart(2, "0") : "--";
  }

  function createEmptyPattern(name: string, patternNumber: number, rowCount: number = 64): TrackerPattern {
    return {
      name: name,
      patternNumber,
      channels: 4,
      rows: Array(rowCount)
        .fill(null)
        .map((_, i) => ({
          rowNumber: i,
          channels: Array(4)
            .fill(null)
            .map(() => createEmptyCell()),
        })),
    };
  }

  let isPlaying = false;
  let currentPatternIndex = 0;
  let currentPlayingRow = -1;
  let playbackInterval: number | null = null;

  function createBasicDrumLoop(patternLength: number = 64): TrackerPattern {
    const pattern = createEmptyPattern("Drum loop", 0, patternLength);
    const kickDrum = 0; // First sample (index 0)
    const snareDrum = 1; // Second sample (index 1)
    const closedHiHat = 2; // Third sample (index 2)
    const openHiHat = 3; // Fourth sample (index 3)

    for (let i = 0; i < patternLength; i++) {
      // Kick drum on every 4th step (0, 4, 8, 12, ...)
      if (i % 16 === 0 || i % 16 === 8) {
        pattern.rows[i].channels[0] = {
          note: "C-4",
          instrument: kickDrum,
          volume: 64,
          effect: null,
          effectParam: null,
        };
      }

      // Snare on every 8th step (4, 12, 20, 28, ...)
      if (i % 16 === 4 || i % 16 === 12) {
        pattern.rows[i].channels[1] = {
          note: "C-4",
          instrument: snareDrum,
          volume: 64,
          effect: null,
          effectParam: null,
        };
      }

      // Closed hi-hat on every even step
      if (i % 2 === 0 && i % 4 !== 0) {
        pattern.rows[i].channels[2] = {
          note: "C-5",
          instrument: closedHiHat,
          volume: 48,
          effect: null,
          effectParam: null,
        };
      }

      // Open hi-hat on every 4th step (except where the kick or snare plays)
      if (i % 4 === 0 && i % 8 !== 0) {
        pattern.rows[i].channels[2] = {
          note: "C-5",
          instrument: openHiHat,
          volume: 48,
          effect: null,
          effectParam: null,
        };
      }
    }

    return pattern;
  }

  let patterns: TrackerPattern[] = [
    createBasicDrumLoop(),
    createPatternFromDefinition("80s Pop", pattern80sPop),
    createPatternFromDefinition("Synth Pop", patternSynthPop),
    createPatternFromDefinition("RnB HipHop", patternRnBHipHop),
    ...Array(2)
      .fill(null)
      .map((_, i) => createEmptyPattern(`Empty Pattern ${i + 5}`, i + 5)),
  ];

  let currentFocus = { row: 0, channel: 0, field: 0 };
  let isEditing = false;
  let editValue = "";

  function getFieldColor(field: number, value: any) {
    const colors = [
      "text-yellow-400", // Note
      "text-teal-500", // Instrument
      "text-sky-400", // Volume
      "text-red-500", // Effect
      "text-red-500", // Effect Parameter
    ];
    return value != null ? colors[field] : `${colors[field]}/20`;
  }

  function handleKeydown(event: KeyboardEvent) {
    if (isEditing) {
      handleEditingKeydown(event);
    } else {
      handleNavigationKeydown(event);
    }
  }

  function handleNavigationKeydown(event: KeyboardEvent) {
    const { key } = event;
    const { row, channel, field } = currentFocus;
    const pattern = patterns[currentPatternIndex];

    switch (key) {
      case "ArrowUp":
        currentFocus.row = Math.max(0, row - 1);
        break;
      case "ArrowDown":
        currentFocus.row = Math.min(pattern.rows.length - 1, row + 1);
        break;
      case "ArrowLeft":
        if (field > 0) {
          currentFocus.field--;
        } else if (channel > 0) {
          currentFocus.channel--;
          currentFocus.field = 4; // Move to the last field of the previous channel
        }
        break;
      case "ArrowRight":
        if (field < 4) {
          currentFocus.field++;
        } else if (channel < pattern.channels - 1) {
          currentFocus.channel++;
          currentFocus.field = 0; // Move to the first field of the next channel
        }
        break;
      case "Enter":
        startEditing();
        break;

      // TODO: Delete row
      case "d":
      case "D":
        duplicateValueFromAbove(event.shiftKey);
        currentFocus.row = Math.min(pattern.rows.length - 1, row + 1);
        break;
    }
    event.preventDefault();
  }

  function duplicateValueFromAbove(wholeRow = false) {
    const { row, channel, field } = currentFocus;
    if (row > 0) {
      const currentPattern = patterns[currentPatternIndex];
      const currentCell = currentPattern.rows[row].channels[channel];
      const cellAbove = currentPattern.rows[row - 1].channels[channel];

      if (wholeRow) {
        currentCell.note = cellAbove.note;
        currentCell.instrument = cellAbove.instrument;
        currentCell.volume = cellAbove.volume;
        currentCell.effect = cellAbove.effect;
        currentCell.effectParam = cellAbove.effectParam;
      } else {
        /* @formatter:off */
        /* prettier-ignore */
        switch (field) {
          case 0: currentCell.note = cellAbove.note; break;
          case 1: currentCell.instrument = cellAbove.instrument; break;
          case 2: currentCell.volume = cellAbove.volume; break;
          case 3: currentCell.effect = cellAbove.effect; break;
          case 4: currentCell.effectParam = cellAbove.effectParam; break;
        }
        /* @formatter:on */
      }

      // Force a re-render
      patterns = [...patterns];
    }
  }

  function handleEditingKeydown(event: KeyboardEvent) {
    const { key } = event;

    if (key === "Enter") {
      commitEdit();
    } else if (key === "Escape") {
      cancelEdit();
    } else if (key === "Backspace") {
      editValue = editValue.slice(0, -1);
    } else if (key.length === 1) {
      editValue += key.toUpperCase();
    }

    event.preventDefault();
  }

  function startEditing() {
    isEditing = true;
    const { row, channel, field } = currentFocus;
    const cell = patterns[currentPatternIndex].rows[row].channels[channel];

    /* @formatter:off */
    /* prettier-ignore */
    switch (field) {
      case 0: editValue = cell.note || ""; break;
      case 1: editValue = cell.instrument !== null ? cell.instrument.toString() : ""; break;
      case 2: editValue = cell.volume !== null ? cell.volume.toString() : ""; break;
      case 3: editValue = cell.effect || ""; break;
      case 4: editValue = cell.effectParam !== null ? cell.effectParam.toString(16).toUpperCase() : ""; break;
    }
    /* @formatter:on */
  }

  function commitEdit() {
    const { row, channel, field } = currentFocus;
    const cell = patterns[currentPatternIndex].rows[row].channels[channel];

    /* @formatter:off */
    /* prettier-ignore */
    switch (field) {
      case 0: cell.note = editValue || null; break;
      case 1: cell.instrument = editValue ? parseInt(editValue) : null; break;
      case 2: cell.volume = editValue ? parseInt(editValue) : null; break;
      case 3: cell.effect = editValue || null; break;
      case 4: cell.effectParam = editValue ? parseInt(editValue, 16) : null; break;
    }
    /* @formatter:on */

    isEditing = false;
    editValue = "";
  }

  function cancelEdit() {
    isEditing = false;
    editValue = "";
  }

  function togglePlay() {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }

  function noteToFrequency(note: string): number {
    const notes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const [noteName, octave] = note.split("-");
    const semitones = notes.indexOf(noteName);
    const A4 = 440;
    return A4 * Math.pow(2, (semitones - 9) / 12 + (parseInt(octave) - 4));
  }

  function playCurrentRow() {
    const currentRow = patterns[currentPatternIndex].rows[currentPlayingRow];
    currentRow.channels.forEach((cell, channelIndex) => {
      if (cell.note && cell.instrument !== null) {
        const sample = samples[cell.instrument];
        if (sample) {
          const frequency = noteToFrequency(cell.note);
          const volume = cell.volume ? cell.volume / 64 : 1; // Normalize volume to 0-1 range
          // audioManager.playSampleAtFrequency(sample.buffer, frequency, volume);
          audioManager.playPreviewFromBuffer(sample.buffer, volume);
        }
      }
    });
  }

  function startPlayback() {
    isPlaying = true;
    currentPlayingRow = 0;
    const msPerRow = (60 * 1000) / ($bpm * 4); // Assuming 4 rows per beat
    playbackInterval = setInterval(() => {
      playCurrentRow();
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

  function formatValue(value: any, field: number): string {
    switch (field) {
      case 0: // Note
        return formatNote(value);
      case 1: // Instrument
        return formatInstrument(value);
      case 2: // Volume
        return formatVolume(value);
      case 3: // Effect
        return formatEffect(value);
      case 4: // Effect Parameter
        return formatEffectParam(value);
      default:
        return "---";
    }
  }

  function formatNote(note: string | null): string {
    if (note === null) return "---";
    // Assuming notes are in the format "C-4", "F#5", etc.
    return note.padEnd(3, "-");
  }

  function formatInstrument(instrument: number | null): string {
    if (instrument === null) return "--";
    return instrument.toString().padStart(2, "0");
  }

  function formatVolume(volume: number | null): string {
    if (volume === null) return "--";
    return volume.toString(16).toUpperCase().padStart(2, "0");
  }

  function formatEffect(effect: string | null): string {
    if (effect === null) return "-";
    return effect;
  }

  function formatEffectParam(param: number | null): string {
    if (param === null) return "--";
    return param.toString(16).toUpperCase().padStart(2, "0");
  }

  function selectCell(row, channel, field) {
    currentFocus.row = row;
    currentFocus.channel = channel;
    currentFocus.field = field;
  }
</script>

<div class="absolute inset-0 size-full p-2 text-light">
  <div class="flex size-full flex-1 flex-row">
    <div class="flex w-full flex-row gap-2">
      <div class="w-44 border border-dark-600 bg-dark-800 p-1">
        <h2 class="mb-2 font-bold text-gray-100">Patterns</h2>

        <div class="space-y-2 overflow-y-scroll">
          {#each patterns as pattern, i}
            <button
              class="block w-full px-2 py-0.5 text-left {i === currentPatternIndex
                ? 'bg-dark-600'
                : 'bg-dark-900 hover:bg-gray-600'}"
              on:click={() => switchPattern(i)}
            >
              {pattern.name}
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
            <div class=" flex space-x-2">
              <button on:click={() => switchPattern(0)} class="bg-dark-600 px-2 py-1 text-xs">80s Pop</button>
              <button on:click={() => switchPattern(1)} class="bg-dark-600 px-2 py-1 text-xs">Synth-Pop</button>
              <button on:click={() => switchPattern(2)} class="bg-dark-600 px-2 py-1 text-xs">R&B/Hip-Hop</button>
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

            <div class="flex flex-col overflow-y-scroll focus:outline-none" tabindex="0" on:keydown={handleKeydown}>
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

                  {#each row.channels as cell, j}
                    <div class="flex h-full w-60 flex-row gap-4 whitespace-nowrap px-2 py-1 text-left">
                      {#each [cell.note, cell.instrument, cell.volume, cell.effect, cell.effectParam] as value, k}
                        <div
                          on:click={() => selectCell(i, j, k)}
                          class={classNames(getFieldColor(k, value), "cursor-pointer", {
                            "outline outline-blue-500":
                              currentFocus.row === i &&
                              currentFocus.channel === j &&
                              currentFocus.field === k &&
                              !isEditing,
                            "outline outline-green-500":
                              currentFocus.row === i &&
                              currentFocus.channel === j &&
                              currentFocus.field === k &&
                              isEditing,
                          })}
                        >
                          {#if isEditing && currentFocus.row === i && currentFocus.channel === j && currentFocus.field === k}
                            <input
                              type="text"
                              bind:value={editValue}
                              class="m-0 mr-auto inline w-10 border-none bg-transparent p-0 leading-none outline-none"
                              on:blur={commitEdit}
                            />
                          {:else}
                            {formatValue(value, k)}
                          {/if}
                        </div>
                      {/each}
                    </div>
                  {/each}
                </div>
              {/each}
            </div>
          </div>
        </div>

        <div class="w-60 overflow-y-scroll border border-dark-600 bg-dark-800 p-1">
          <div class="flex flex-col gap-2">
            {#each samples as sample}
              <div class="relative overflow-hidden rounded border border-dark-600">
                <svg
                  on:click={() => previewSample(sample)}
                  class="h-10 w-full cursor-pointer select-none bg-black text-accent-yellow"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  viewBox="0 0 1000 100"
                  preserveAspectRatio="none"
                >
                  <path d={sample.waveform} stroke="currentColor" fill="none" />
                </svg>
                <span class="absolute right-0 top-0 block bg-black/50 p-1 text-[10px] text-light">
                  {sample.name}
                </span>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
