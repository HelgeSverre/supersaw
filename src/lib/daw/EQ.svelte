<script>
  import { onMount } from "svelte";
  import Knob from "../ui/Knob.svelte";
  import { audioManager } from "../../core/audio.js";

  let audioElement;
  let svgElement;

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
  let centerY;

  let control1X;
  let control2X;
  let control1Y;
  let control2Y;

  let pathData = "";

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
    const now = audioContext.currentTime;

    lowFilter.gain.setValueAtTime(lowGain, now);
    lowFilter.frequency.setValueAtTime(lowFreq, now);
    lowFilter.Q.setValueAtTime(lowQ, now);

    midFilter.gain.setValueAtTime(midGain, now);
    midFilter.frequency.setValueAtTime(midFreq, now);
    midFilter.Q.setValueAtTime(midQ, now);

    highFilter.gain.setValueAtTime(highGain, now);
    highFilter.frequency.setValueAtTime(highFreq, now);
    highFilter.Q.setValueAtTime(highQ, now);

    updatePaths();
  }

  let pathDataLow = "";
  let pathDataHigh = "";

  function updatePaths() {
    // Constants to define the SVG drawing space
    const centerY = 200; // Midline of the EQ

    // Updating the Low Shelf Curve
    let lowControlPointY = centerY - lowGain * 50; // Dynamic control point
    pathDataLow = `M 50,${centerY} L 200,${centerY - lowGain * 100} C 300,${lowControlPointY} 400,${centerY - lowGain * 100} 500,${centerY}`;

    // Updating the High Shelf Curve
    let highControlPointY = centerY - highGain * 50; // Dynamic control point
    pathDataHigh = `M 500,${centerY} C 600,${highControlPointY} 700,${centerY - highGain * 100} 850,${centerY - highGain * 100} L 1000,${centerY}`;
  }
</script>

<div class="flex flex-col gap-3 rounded border border-dark-400 bg-dark-700 p-2">
  <audio bind:this={audioElement} controls class="w-full">
    <source src="/SoundHelix-Song-1.mp3" type="audio/mp3" />
  </audio>

  <div class="h-24 rounded-md border border-dark-400 bg-dark-900">
    <svg bind:this={svgElement} viewBox="0 0 1000 400" class="h-full w-full">
      {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as i}
        <line x1={i * 100} y1="0" x2={i * 100} y2="400" stroke="#222" stroke-width="1" />
      {/each}

      {#each [1, 2, 3, 4, 5, 6, 7, 8] as i}
        <line x1="0" y1={i * 50} x2="1000" y2={i * 50} stroke="#444" stroke-width="1" />
      {/each}

      <path d={pathDataLow} fill="none" stroke="blue" stroke-width="2" />
      <path d={pathDataHigh} fill="none" stroke="red" stroke-width="2" />
    </svg>
  </div>

  <div class="flex flex-col gap-3">
    <div class="flex flex-row gap-1">
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label class="text-center text-xs" for="lowGain">Low Gain</label>
        <Knob size="38" min="-30" max="30" bind:value={lowGain} on:input={updateFilters} />
        <small class="text-xs">{lowGain}</small>
      </div>
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label class="text-center text-xs" for="lowFreq">Low Freq</label>
        <Knob size="38" min="20" max="500" bind:value={lowFreq} on:input={updateFilters} />
        <small class="text-xs">{lowFreq}</small>
      </div>
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label class="text-center text-xs" for="lowQ">Low Q</label>
        <Knob size="38" min="0.1" max="10" step="0.1" bind:value={lowQ} on:input={updateFilters} />
        <small class="text-xs">{lowQ}</small>
      </div>
    </div>

    <div class="flex flex-row gap-1">
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label class="text-center text-xs" for="midGain">Mid Gain</label>
        <Knob size="38" min="-30" max="30" bind:value={midGain} on:input={updateFilters} />
        <small class="text-xs">{midGain}</small>
      </div>
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label class="text-center text-xs" for="midFreq">Mid Freq</label>
        <Knob size="38" min="500" max="5000" bind:value={midFreq} on:input={updateFilters} />
        <small class="text-xs">{midFreq}</small>
      </div>
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label class="text-center text-xs" for="midQ">Mid Q</label>
        <Knob size="38" min="0.1" max="10" step="0.1" bind:value={midQ} on:input={updateFilters} />
        <small class="text-xs">{midQ}</small>
      </div>
    </div>

    <div class="flex flex-row gap-1">
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label class="text-center text-xs" for="highGain">High Gain</label>
        <Knob size="38" min="-30" max="30" bind:value={highGain} on:input={updateFilters} />
        <small class="text-xs">{highGain}</small>
      </div>
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label class="text-center text-xs" for="highFreq">High Freq</label>
        <Knob size="38" min="2000" max="12000" bind:value={highFreq} on:input={updateFilters} />
        <small class="text-xs">{highFreq}</small>
      </div>
      <div class="flex w-full flex-col items-center justify-center text-xs text-light-soft">
        <label class="text-center text-xs" for="highQ">High Q</label>
        <Knob size="38" min="0.1" max="10" step="0.1" bind:value={highQ} on:input={updateFilters} />
        <small class="text-xs">{highQ}</small>
      </div>
    </div>
  </div>
</div>
