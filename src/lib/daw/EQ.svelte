<script>
  import { onMount } from "svelte";
  import Knob from "../ui/Knob.svelte";
  import { audioManager } from "../../core/audio.js";

  let audioElement;

  let lowGain = 0;
  let lowFreq = 320;
  let lowQ = 1;

  let midGain = 0;
  let midFreq = 1000;
  let midQ = 1;

  let highGain = 0;
  let highFreq = 3200;
  let highQ = 1;

  let audioContext;
  let audioSource;
  let lowFilter, midFilter, highFilter;

  let linePath = "";
  let circles = [];

  onMount(() => {
    audioContext = audioManager.audioContext;
    audioSource = audioContext.createMediaElementSource(audioElement);

    // Create BiquadFilterNodes for low, mid, and high frequencies
    lowFilter = audioContext.createBiquadFilter();
    lowFilter.type = "lowshelf";
    lowFilter.frequency.setValueAtTime(320, audioContext.currentTime);

    midFilter = audioContext.createBiquadFilter();
    midFilter.type = "peaking";
    midFilter.frequency.setValueAtTime(1000, audioContext.currentTime);
    midFilter.Q.setValueAtTime(1, audioContext.currentTime);

    highFilter = audioContext.createBiquadFilter();
    highFilter.type = "highshelf";
    highFilter.frequency.setValueAtTime(3200, audioContext.currentTime);

    // Connect the filters in series
    audioSource.connect(lowFilter);
    lowFilter.connect(midFilter);
    midFilter.connect(highFilter);
    highFilter.connect(audioManager.mixer);

    updateFilters();
  });

  function updateFilters() {
    lowFilter.gain.setValueAtTime(lowGain, audioContext.currentTime);
    lowFilter.frequency.setValueAtTime(lowFreq, audioContext.currentTime);
    lowFilter.Q.setValueAtTime(lowQ, audioContext.currentTime);

    midFilter.gain.setValueAtTime(midGain, audioContext.currentTime);
    midFilter.frequency.setValueAtTime(midFreq, audioContext.currentTime);
    midFilter.Q.setValueAtTime(midQ, audioContext.currentTime);

    highFilter.gain.setValueAtTime(highGain, audioContext.currentTime);
    highFilter.frequency.setValueAtTime(highFreq, audioContext.currentTime);
    highFilter.Q.setValueAtTime(highQ, audioContext.currentTime);

    drawEQLine();
  }

  function drawEQLine() {
    const width = 360;
    const height = 100;

    const points = [
      { x: 0, y: height / 2 - lowGain },
      { x: width / 2, y: height / 2 - midGain },
      { x: width, y: height / 2 - highGain },
    ];

    // Calculate control points for Bezier curves based on Q value
    const controlPoints = [
      { x: width / 4, y: height / 2 - lowGain * lowQ },
      { x: (width * 3) / 4, y: height / 2 - highGain * highQ },
    ];

    linePath = `
            M${points[0].x},${points[0].y}
            C${controlPoints[0].x},${controlPoints[0].y},${controlPoints[0].x},${controlPoints[0].y},${points[1].x},${points[1].y}
            C${controlPoints[1].x},${controlPoints[1].y},${controlPoints[1].x},${controlPoints[1].y},${points[2].x},${points[2].y}
        `;

    // Circles for visualizing peaks
    circles = points.map((point) => {
      return {
        cx: point.x,
        cy: point.y,
        r: 5,
      };
    });
  }
</script>

<div class="flex flex-col rounded border border-dark-100 bg-dark-700 p-2">
  <h1>3-Pole Equalizer</h1>
  <audio bind:this={audioElement} controls>
    <source src="/SoundHelix-Song-1.mp3" type="audio/mp3" />
  </audio>

  <div class="my-3 flex items-center justify-center">
    <svg id="frequencyResponse" width="200" height="100" class="border border-white">
      <path d={linePath} stroke="black" stroke-width="2" fill="none" />
      {#each circles as { cx, cy, r }}
        <circle cx={cx} cy={cy} r={r} fill="red" />
      {/each}
    </svg>
  </div>

  <div class="my-3">
    <div class="flex flex-row gap-1">
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label for="lowGain">Low Gain</label>
        <Knob size="42" min="-30" max="30" bind:value={lowGain} on:input={updateFilters} />
      </div>
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label for="lowFreq">Low Frequency</label>
        <Knob size="42" min="20" max="500" bind:value={lowFreq} on:input={updateFilters} />
      </div>
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label for="lowQ">Low Q</label>
        <Knob size="42" min="0.1" max="10" step="0.1" bind:value={lowQ} on:input={updateFilters} />
      </div>
    </div>

    <div class="flex flex-row gap-1">
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label for="midGain">Mid Gain</label>
        <Knob size="42" min="-30" max="30" bind:value={midGain} on:input={updateFilters} />
      </div>
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label for="midFreq">Mid Frequency</label>
        <Knob size="42" min="500" max="5000" bind:value={midFreq} on:input={updateFilters} />
      </div>
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label for="midQ">Mid Q</label>
        <Knob size="42" min="0.1" max="10" step="0.1" bind:value={midQ} on:input={updateFilters} />
      </div>
    </div>

    <div class="flex flex-row gap-1">
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label for="highGain">High Gain</label>
        <Knob size="42" min="-30" max="30" bind:value={highGain} on:input={updateFilters} />
      </div>
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label for="highFreq">High Frequency</label>
        <Knob size="42" min="2000" max="12000" bind:value={highFreq} on:input={updateFilters} />
      </div>
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label for="highQ">High Q</label>
        <Knob size="42" min="0.1" max="10" step="0.1" bind:value={highQ} on:input={updateFilters} />
      </div>
    </div>
  </div>
</div>

<style>
  svg {
    width: 100%;
  }
</style>
