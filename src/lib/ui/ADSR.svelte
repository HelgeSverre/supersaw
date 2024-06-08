<script>
  import { onMount } from "svelte";

  export let progress = null;

  export let attack = 0.1;
  export let decay = 0.1;
  export let sustain = 0.5;
  export let release = 0.5;

  export let width = 350;
  export let height = 150;

  $: attackX = attack * width;
  $: decayX = attackX + decay * width;
  $: sustainY = height - sustain * height;
  $: sustainX = width - release * width;

  let svg;
  let draggingPoint = null;

  function startDrag(point) {
    draggingPoint = point;
  }

  function stopDrag() {
    draggingPoint = null;
  }

  function drag(event) {
    if (draggingPoint) {
      const rect = svg.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * width;
      const y = ((event.clientY - rect.top) / rect.height) * height;

      switch (draggingPoint) {
        case "attack":
          attack = Math.max(0, Math.min(1, x / width));
          break;
        case "decay":
          decay = Math.max(0, Math.min(1, (x - attackX) / width));

          if (event.shiftKey === false) {
            sustain = Math.max(0, Math.min(1, 1 - y / height));
          }
          break;
        case "release":
          release = Math.max(0, Math.min(1, (width - x) / width));
          break;
      }
    }
  }

  onMount(() => {
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("mousemove", drag);
  });
</script>

<div class="adsr flex flex-col rounded p-2">
  <div class="mb-2 flex w-full flex-row flex-wrap gap-2">
    <div class="flex flex-col gap-1">
      <span class="text-xs text-white/50">Attack</span>
      <input
        class="w-full rounded-sm border border-dark-200 bg-dark-700 p-0 text-center text-xs text-white"
        type="number"
        min="0.0"
        max="1"
        step="0.01"
        name="attack"
        bind:value={attack}
      />
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-xs text-white/50">Decay</span>
      <input
        class="w-full rounded-sm border border-dark-200 bg-dark-700 p-0 text-center text-xs text-white"
        type="number"
        min="0.0"
        max="1"
        step="0.01"
        name="decay"
        bind:value={decay}
      />
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-xs text-white/50">Sustain</span>
      <input
        class="w-full rounded-sm border border-dark-200 bg-dark-700 p-0 text-center text-xs text-white"
        type="number"
        min="0.0"
        max="1"
        step="0.01"
        name="sustain"
        bind:value={sustain}
      />
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-xs text-white/50">Release</span>
      <input
        class="w-full rounded-sm border border-dark-200 bg-dark-700 p-0 text-center text-xs text-white"
        type="number"
        min="0.0"
        max="1"
        step="0.01"
        name="release"
        bind:value={release}
      />
    </div>
  </div>
  <div class="relative select-none">
    {#if progress !== null}
      <div style="left: {progress}%;" class="absolute inset-y-0 z-50 w-[1px] bg-red-500"></div>
    {/if}

    <svg bind:this={svg} overflow="visible" viewBox="0 0 {width} {height}" xmlns="http://www.w3.org/2000/svg">
      <!-- Border -->
      <path
        d="M 0 {height} L 0 0 L {width} 0 L {width} {height} Z"
        fill="rgba(0,0,0,0.5)"
        stroke="rgba(255,255,255,0.25)"
        stroke-width="1"
      />

      <!-- Grid lines marking each stage -->
      <line
        x1={attackX}
        y1="0"
        x2={attackX}
        y2={height}
        stroke="rgba(255,255,255,0.2)"
        stroke-width="2"
        stroke-dasharray="4"
      />

      <line
        x1={decayX}
        y1="0"
        x2={decayX}
        y2={height}
        stroke="rgba(255,255,255,0.2)"
        stroke-width="2"
        stroke-dasharray="4"
      />
      <line
        x1={sustainX}
        y1="0"
        x2={sustainX}
        y2={height}
        stroke="rgba(255,255,255,0.2)"
        stroke-width="2"
        stroke-dasharray="4"
      />

      <!-- Envelope Curve -->
      <path
        d={`M 0 ${height} L ${attackX} 0 L ${decayX} ${sustainY} H ${sustainX} L ${width} ${height} Z`}
        fill="rgba(255, 255, 255, 0.25)"
        stroke="silver"
        stroke-width="2"
      />

      <!-- Attack Control Point -->
      <circle
        aria-hidden="true"
        cx={attackX}
        cy="0"
        r="5"
        stroke-width="1"
        stroke="silver"
        class=" handle cursor-pointer"
        on:mousedown={() => startDrag("attack")}
      />

      <!-- Decay Control Point -->
      <circle
        aria-hidden="true"
        cx={decayX}
        cy={sustainY}
        r="5"
        stroke-width="1"
        stroke="silver"
        class=" handle cursor-pointer"
        on:mousedown={() => startDrag("decay")}
      />

      <!-- Sustain Control Point -->
      <circle
        aria-hidden="true"
        cx={sustainX}
        cy={sustainY}
        r="5"
        stroke-width="1"
        stroke="silver"
        class=" handle cursor-pointer"
        on:mousedown={() => startDrag("release")}
      />
    </svg>
  </div>
</div>

<style>
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  input[type="number"]:focus {
    outline: none;
    border-color: var(--control-contrast-frame);
    transition: border-color 100ms ease-out;
  }

  .adsr {
    background-color: var(--surface-background);
    border: 1px solid var(--control-contrast-frame);
  }

  .adsr label {
    color: var(--control-foreground);
  }

  .adsr input {
    background-color: var(--control-text-back);
    border-color: var(--control-contrast-frame);
    color: var(--control-foreground);
  }

  .handle {
    fill: var(--chosen-default);
    stroke: var(--chosen-default);
  }
</style>
