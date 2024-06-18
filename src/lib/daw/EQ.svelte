<script>
  import { onMount } from "svelte";
  import Knob from "../ui/Knob.svelte";
  import { audioManager } from "../../core/audio.js";

  let audioElement;
  let svgElement;

  let lowGain = 0;
  let midGain = 0;
  let highGain = 0;

  let lowFreq = 0;
  let midFreq = 0;
  let highFreq = 0;

  let lowQ = 0;
  let midQ = 0;
  let highQ = 0;

  let audioContext;
  let audioSource;
  let lowFilter, highFilter;
  let centerY = 200;

  let pathData = "";

  onMount(() => {
    audioContext = audioManager.audioContext;
    audioSource = audioContext.createMediaElementSource(audioElement);

    // Create BiquadFilterNodes for low and high frequencies
    lowFilter = audioContext.createBiquadFilter();
    lowFilter.type = "lowshelf";

    highFilter = audioContext.createBiquadFilter();
    highFilter.type = "highshelf";

    // Connect the filters in series
    audioSource.connect(lowFilter);
    lowFilter.connect(highFilter);
    highFilter.connect(audioManager.mixer);

    updateFilters();
  });

  function updateFilters() {
    const now = audioContext.currentTime;

    lowFilter.gain.setValueAtTime(lowGain, now);
    highFilter.gain.setValueAtTime(highGain, now);

    updatePaths();
  }

  let lowStartY;
  let highEndY;
  let midY;
  let control1Y;
  let control2Y;

  function updatePaths() {
    // Map gain values to the SVG canvas height, from 0 to 400
    lowStartY = mapGainToY(lowGain, -30, 30, 400, 0);
    highEndY = mapGainToY(highGain, -30, 30, 400, 0);
    midY = mapGainToY(midGain, -30, 30, 400, 0);

    control1Y = (lowStartY + midY) / 2;
    control2Y = (highEndY + midY) / 2;

    pathData = `M 0,${lowStartY}
                C 250,${control1Y} 750,${control2Y} 1000,${highEndY}`;
  }

  function mapGainToY(gain, gainMin, gainMax, yMin, yMax) {
    return ((gain - gainMin) / (gainMax - gainMin)) * (yMax - yMin) + yMin;
  }
</script>

<div class="flex flex-col gap-3 rounded border border-dark-400 bg-dark-700 p-2">
  <audio bind:this={audioElement} controls class="w-full">
    <source src="/SoundHelix-Song-1.mp3" type="audio/mp3" />
  </audio>

  <div class="h-24 rounded-md border border-dark-400 bg-dark-900">
    <svg bind:this={svgElement} viewBox="0 0 1000 400" class="h-full w-full" preserveAspectRatio="none">
      {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as i}
        <line x1={i * 100} y1="0" x2={i * 100} y2="400" stroke="#222" stroke-width="1" />
      {/each}

      {#each [1, 2, 3, 4, 5, 6, 7, 8] as i}
        <line x1="0" y1={i * 50} x2="1000" y2={i * 50} stroke="#444" stroke-width="1" />
      {/each}

      <!-- Endpoints -->
      <circle cx="0" cy={lowStartY} r="5" fill="#FF6347" />
      <circle cx="500" cy={midY} r="5" fill="#FF6347" />
      <circle cx="1000" cy={highEndY} r="5" fill="#FF6347" />

      <!-- Control points -->
      <circle cx="250" cy={control1Y} r="5" fill="yellow" />
      <circle cx="750" cy={control2Y} r="5" fill="yellow" />

      <path d={pathData} fill="none" stroke="#FF6347" stroke-width="2" />
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
