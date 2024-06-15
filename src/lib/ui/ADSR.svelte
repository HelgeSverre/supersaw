<script>
  import { onMount } from "svelte";
  import Knob from "./Knob.svelte";

  export let progress = null;

  export let attack = 0.1;
  export let decay = 0.1;
  export let sustain = 0.5;
  export let release = 0.5;

  export let width = 350;
  export let height = 150;

  $: maxAttackWidth = width * 0.25;
  $: maxDecayWidth = width * 0.25;
  $: maxReleaseWidth = width * 0.25;

  $: attackX = attack * maxAttackWidth;
  $: decayX = attackX + decay * (width - maxAttackWidth - maxDecayWidth - maxReleaseWidth);
  $: sustainY = height - sustain * height;
  $: sustainX = width - release * maxReleaseWidth;

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
          attack = Math.max(0, Math.min(1, x / maxAttackWidth));
          break;
        case "decay":
          decay = Math.max(0, Math.min(1, (x - attackX) / (width - maxAttackWidth - maxReleaseWidth)));
          break;
        case "sustain":
          sustain = Math.max(0, Math.min(1, 1 - y / height));
          break;
        case "release":
          release = Math.max(0, Math.min(1, (width - x) / maxReleaseWidth));
          break;
      }
    }
  }

  onMount(() => {
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("mousemove", drag);
  });
</script>

<div class="flex flex-col gap-2 rounded border border-dark-100 bg-dark-700 p-2">
  <div class="flex w-full flex-row flex-wrap gap-2">
    <div class="flex flex-col gap-1">
      <span class="text-xs text-light-soft">Attack</span>
      <Knob size="42" min="0" max="1" step="0.01" bind:value={attack} />
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-xs text-light-soft">Decay</span>
      <Knob size="42" min="0" max="1" step="0.01" bind:value={decay} />
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-xs text-light-soft">Sustain</span>
      <Knob size="42" min="0" max="1" step="0.01" bind:value={sustain} />
    </div>
    <div class="flex flex-col gap-1">
      <span class="text-xs text-light-soft">Release</span>
      <Knob size="42" min="0" max="1" step="0.01" bind:value={release} />
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
        d={`M 0,${height} L ${attackX} 0 L ${decayX} ${sustainY} H ${sustainX} L ${width} ${height} Z`}
        fill="rgba(255, 255, 255, 0.25)"
        stroke="silver"
        stroke-width="2"
      />

      <!-- Attack Control Point -->
      <circle
        aria-hidden="true"
        cx={attackX}
        cy="0"
        r="4"
        fill="white"
        class="cursor-pointer"
        on:mousedown={() => startDrag("attack")}
      />

      <!-- Decay Control Point -->
      <circle
        aria-hidden="true"
        cx={decayX}
        cy={sustainY}
        r="4"
        fill="white"
        class="cursor-pointer"
        on:mousedown={() => startDrag("decay")}
      />

      <!-- Sustain Control Point -->
      <circle
        aria-hidden="true"
        cx={sustainX}
        cy={sustainY}
        r="4"
        fill="white"
        class="cursor-pointer"
        on:mousedown={() => startDrag("sustain")}
      />

      <!-- Release Control Point -->
      <circle
        aria-hidden="true"
        cx={width}
        cy={height}
        r="4"
        fill="white"
        class="cursor-pointer"
        on:mousedown={() => startDrag("release")}
      />
    </svg>
  </div>
</div>
