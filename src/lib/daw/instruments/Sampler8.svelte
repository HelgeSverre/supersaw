<script>
  import { ChevronRight, Play, Square } from "lucide-svelte";
  import { onMount } from "svelte";
  import { audioManager } from "../../../core/audio.js";
  import { bpm } from "../../../core/store.js";
  import Knob from "../../ui/Knob.svelte";
  import classNames from "classnames";

  let playing = false;
  let swingAmount = 0;
  let currentStep = 0;
  let nextNoteTime = 0;
  let timerID;

  const steps = 16;

  let pattern = [];

  let tracks = [];

  onMount(() => {
    loadSamples();
  });

  function loadSamples() {
    let samples = [
      {
        name: "Kick",
        sample: "/samples/roland-tr-808/BD/BD0000.WAV",
      },
      {
        name: "Snare",
        sample: "/samples/roland-tr-808/SD/SD1075.WAV",
      },
      {
        name: "Clap",
        sample: "/samples/roland-tr-808/CP/CP.WAV",
      },
      {
        name: "Closed HH",
        sample: "/samples/roland-tr-808/CH/CH.WAV",
      },
      {
        name: "Open HH",
        sample: "/samples/roland-tr-808/OH/OH00.WAV",
      },
    ];

    Promise.all(
      samples.map(async (track) => {
        let buffer = await audioManager.loadAudioBuffer(track.sample);
        return {
          ...track,
          buffer: buffer,
          volume: 1,
          pan: 0,
          pitch: 1,
        };
      }),
    ).then((loadedTracks) => {
      tracks = loadedTracks;

      pattern = tracks.map(() => Array(steps).fill(false));

      initializePattern();
    });
  }

  function initializePattern() {
    pattern = tracks.map((_, index) => {
      let trackPattern = Array(steps).fill(false);
      switch (index) {
        case 0: // Kick (four-on-the-floor)
          for (let i = 0; i < steps; i += 4) {
            trackPattern[i] = true;
          }
          break;
        case 1: // Snare (on 2 and 4)
          trackPattern[4] = true;
          trackPattern[12] = true;
          break;
        case 2: // Clap (on 2 and 4, same as snare)
          trackPattern[4] = true;
          trackPattern[12] = true;
          break;
        case 3: // Closed HH (every other 16th note)
          for (let i = 0; i < steps; i += 2) {
            trackPattern[i] = true;
          }
          break;
        case 4: // Open HH (off-beats)
          trackPattern[2] = true;
          trackPattern[6] = true;
          trackPattern[10] = true;
          trackPattern[14] = true;
          break;
      }
      return trackPattern;
    });
    pattern = pattern; // trigger reactivity
  }

  function triggerSample(index, time = 0) {
    const track = tracks[index];
    if (!track.buffer) return;

    const source = audioManager.audioContext.createBufferSource();
    const gainNode = audioManager.audioContext.createGain();
    const panNode = audioManager.audioContext.createStereoPanner();

    source.buffer = track.buffer;
    source.playbackRate.value = track.pitch;
    gainNode.gain.value = track.volume;
    panNode.pan.value = track.pan;

    source.connect(gainNode);
    gainNode.connect(panNode);
    panNode.connect(audioManager.mixer);

    source.start(time);
  }

  function togglePlay() {
    playing = !playing;
    if (playing) {
      currentStep = 0;
      nextNoteTime = audioManager.audioContext.currentTime;
      scheduler();
    } else {
      clearTimeout(timerID);
    }
  }

  function scheduler() {
    while (nextNoteTime < audioManager.audioContext.currentTime + 0.1) {
      scheduleNote(currentStep, nextNoteTime);
      nextStep();
    }
    timerID = setTimeout(scheduler, 25);
  }

  function scheduleNote(step, time) {
    pattern.forEach((track, index) => {
      if (track[step]) {
        triggerSample(index, time);
      }
    });
  }

  function nextStep() {
    const secondsPerBeat = 60.0 / $bpm / 4;

    // Apply swing to odd-numbered 16th notes
    if (currentStep % 2 !== 0) {
      const swingFactor = swingAmount / 100;
      nextNoteTime += secondsPerBeat * (2 + swingFactor);
    } else {
      nextNoteTime += secondsPerBeat;
    }

    currentStep = (currentStep + 1) % steps;
  }

  function toggleStep(instrumentIndex, step) {
    pattern[instrumentIndex][step] = !pattern[instrumentIndex][step];
  }

  function setVolume(index, event) {
    tracks[index].volume = parseFloat(event.target.value);
  }

  function setPan(index, event) {
    tracks[index].pan = parseFloat(event.target.value);
  }

  function setPitch(index, event) {
    tracks[index].pitch = parseFloat(event.target.value);
  }
</script>

<main>
  <div class="mx-auto bg-[#1e1e1e] p-4 text-[#c1c1c1]">
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-xl text-[#c1c1c1]">Drum Rack</h1>
      <div class="flex items-center gap-2.5">
        <span class="text-sm">{$bpm.toFixed(2)} BPM</span>
        <button
          on:click={togglePlay}
          class={classNames("cursor-pointer border-none px-2.5 py-1.5 text-sm text-[#c1c1c1]", {
            "bg-[#ff4c4c]": playing,
            "bg-[#4c4c4c]": !playing,
          })}
        >
          {#if playing}
            <Square size={14} />
          {:else}
            <Play size={14} />
          {/if}
        </button>
      </div>
    </div>

    <div class="overflow-x-auto bg-[#282828] p-2.5">
      <table class="border-separate border-spacing-px">
        <thead>
          <tr class="select-none">
            <th></th>
            <th class="w-24"></th>
            {#each Array(steps) as _, i}
              <th class="px-0.5 text-center text-xs text-[#888]">
                <div
                  class={classNames("block w-8 text-center text-xs text-[#888]", {
                    "bg-[#ffffff1a]": i === currentStep - 1,
                  })}
                >
                  {i + 1}
                </div>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each tracks as track, i}
            <tr>
              <td class="flex flex-row items-center p-0.5">
                <Knob
                  size="32"
                  label="Vol"
                  min={0}
                  max={1}
                  step={0.01}
                  bind:value={track.volume}
                  on:change={(event) => setVolume(i, event)}
                />
                <Knob
                  size="32"
                  label="Pan"
                  min={-1}
                  max={1}
                  step={0.01}
                  bind:value={track.pan}
                  on:change={(event) => setPan(i, event)}
                />
              </td>
              <td class="p-0.5">
                <button
                  class="flex h-8 w-full flex-row items-center justify-between bg-[#3e3e3e] px-2 text-xs"
                  on:click={() => triggerSample(i)}
                >
                  <span>{track.name}</span>
                  <ChevronRight size={12} />
                </button>
              </td>
              {#each pattern[i] as on, step}
                <td class="p-0.5">
                  <button
                    on:click={() => toggleStep(i, step)}
                    class="block size-8 {on ? 'bg-[#00ffff]' : 'bg-[#484848]'}"
                  />
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="mt-3 flex items-center justify-between text-xs text-[#888]">
      <div class="flex items-center gap-2">
        <span>Swing:</span>
        <input
          type="range"
          min="0"
          max="100"
          value={swingAmount}
          on:input={function (event) {
            swingAmount = event.target.value;
          }}
          class="w-24"
        />
        <span>{swingAmount}%</span>
      </div>
      <div>
        Steps: {steps}
      </div>
    </div>
  </div>
</main>
